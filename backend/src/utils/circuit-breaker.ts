/**
 * Circuit breaker + bulkhead for a single external dependency.
 *
 * Wraps calls to one slow/flaky upstream (Gemini, YouTube, …) so that its
 * degradation can't cascade into the rest of the app:
 *
 *  - Timeout      — every call is raced against `timeoutMs`; a hung upstream
 *                   releases the caller (and aborts the request via signal)
 *                   instead of pinning the event loop / a DB connection.
 *  - Bulkhead     — at most `maxConcurrent` calls run at once. Excess calls are
 *                   *shed* immediately (fast fail) rather than queued without
 *                   bound, so a slow dependency can't pile up unbounded work.
 *  - Breaker      — after `failureThreshold` consecutive failures the circuit
 *                   OPENs: every call fast-fails for `resetTimeoutMs` without
 *                   touching the upstream. Then a single HALF-OPEN probe runs;
 *                   `successThreshold` successes CLOSE it, any failure re-OPENs.
 *
 * Load-shed and open-circuit rejections do NOT count as dependency failures —
 * the upstream didn't fail, we chose not to call it. Only real errors and
 * timeouts trip the breaker.
 *
 * Callers catch `CircuitOpenError` / `DependencyTimeoutError` /
 * `ConcurrencyLimitError` (all extend `BreakerRejection`) and serve a fallback.
 */

import { log } from "./logger.util";

export type CircuitState = "closed" | "open" | "half-open";

/** Base class for "we deliberately didn't complete the upstream call". */
export class BreakerRejection extends Error {}

/** Circuit is OPEN — failing fast without calling the upstream. */
export class CircuitOpenError extends BreakerRejection {
  constructor(name: string) {
    super(`Circuit "${name}" is open; failing fast`);
    this.name = "CircuitOpenError";
  }
}

/** The upstream call exceeded its timeout budget. */
export class DependencyTimeoutError extends BreakerRejection {
  constructor(name: string, timeoutMs: number) {
    super(`Dependency "${name}" timed out after ${timeoutMs}ms`);
    this.name = "DependencyTimeoutError";
  }
}

/** Too many in-flight calls to this dependency; shedding load. */
export class ConcurrencyLimitError extends BreakerRejection {
  constructor(name: string, max: number) {
    super(`Dependency "${name}" at concurrency limit (${max}); shedding load`);
    this.name = "ConcurrencyLimitError";
  }
}

export interface BreakerOptions {
  name: string;
  /** Per-call timeout budget. */
  timeoutMs: number;
  /** Max simultaneous in-flight calls; extra calls are shed (fast fail). */
  maxConcurrent: number;
  /** Consecutive failures (incl. timeouts) that trip the circuit OPEN. */
  failureThreshold: number;
  /** How long the circuit stays OPEN before allowing a HALF-OPEN probe. */
  resetTimeoutMs: number;
  /** Successful HALF-OPEN probes required to CLOSE again. Default 1. */
  successThreshold?: number;
  /** Injectable clock (ms). Defaults to Date.now — override in tests. */
  now?: () => number;
}

export interface BreakerStats {
  state: CircuitState;
  inFlight: number;
  consecutiveFailures: number;
  totalTrips: number;
  totalShed: number;
}

export class CircuitBreaker {
  private readonly name: string;
  private readonly timeoutMs: number;
  private readonly maxConcurrent: number;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;
  private readonly now: () => number;

  private state: CircuitState = "closed";
  private inFlight = 0;
  private consecutiveFailures = 0;
  private halfOpenSuccesses = 0;
  private openedAt = 0;
  private probing = false; // a HALF-OPEN probe is in flight
  private totalTrips = 0;
  private totalShed = 0;

  constructor(opts: BreakerOptions) {
    this.name = opts.name;
    this.timeoutMs = opts.timeoutMs;
    this.maxConcurrent = opts.maxConcurrent;
    this.failureThreshold = opts.failureThreshold;
    this.resetTimeoutMs = opts.resetTimeoutMs;
    this.successThreshold = opts.successThreshold ?? 1;
    this.now = opts.now ?? Date.now;
  }

  getStats(): BreakerStats {
    return {
      state: this.state,
      inFlight: this.inFlight,
      consecutiveFailures: this.consecutiveFailures,
      totalTrips: this.totalTrips,
      totalShed: this.totalShed,
    };
  }

  /**
   * Run `fn` through the breaker. `fn` receives an AbortSignal that fires when
   * the timeout elapses — pass it to fetch/SDKs so the work is actually
   * cancelled, not just abandoned.
   *
   * @throws CircuitOpenError | ConcurrencyLimitError | DependencyTimeoutError
   *         when the call is rejected/aborted, or whatever `fn` throws.
   */
  async execute<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    this.evaluateOpenState();

    if (this.state === "open") {
      this.totalShed++;
      throw new CircuitOpenError(this.name);
    }

    // HALF-OPEN: admit exactly one probe; shed everything else.
    if (this.state === "half-open") {
      if (this.probing) {
        this.totalShed++;
        throw new CircuitOpenError(this.name);
      }
      this.probing = true;
    } else if (this.inFlight >= this.maxConcurrent) {
      // CLOSED bulkhead: shed excess load rather than queue unbounded.
      this.totalShed++;
      throw new ConcurrencyLimitError(this.name, this.maxConcurrent);
    }

    this.inFlight++;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let timedOut = false;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new DependencyTimeoutError(this.name, this.timeoutMs));
      }, this.timeoutMs);
    });

    try {
      const result = await Promise.race([fn(controller.signal), timeout]);
      this.onSuccess();
      return result;
    } catch (err) {
      // Aborting the signal can make `fn` reject with its own AbortError and
      // win the race; if the timer fired, always classify as a timeout so the
      // caller gets a consistent error and the breaker counts it correctly.
      const finalErr = timedOut ? new DependencyTimeoutError(this.name, this.timeoutMs) : err;
      this.onFailure(finalErr);
      throw finalErr;
    } finally {
      if (timer) clearTimeout(timer);
      this.inFlight--;
      if (this.state === "half-open") this.probing = false;
    }
  }

  /** Move OPEN → HALF-OPEN once the cool-down has elapsed. */
  private evaluateOpenState(): void {
    if (this.state === "open" && this.now() - this.openedAt >= this.resetTimeoutMs) {
      this.state = "half-open";
      this.halfOpenSuccesses = 0;
      this.probing = false;
      log.info("circuit half-open (probing)", { breaker: this.name });
    }
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.successThreshold) {
        this.close();
      }
      return;
    }
    this.consecutiveFailures = 0;
  }

  private onFailure(err: unknown): void {
    // Our own shed/open rejections aren't upstream failures — ignore them.
    if (err instanceof BreakerRejection && !(err instanceof DependencyTimeoutError)) {
      return;
    }
    if (this.state === "half-open") {
      // Probe failed — straight back to OPEN.
      this.trip();
      return;
    }
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = "open";
    this.openedAt = this.now();
    this.totalTrips++;
    log.warn("circuit opened", {
      breaker: this.name,
      consecutiveFailures: this.consecutiveFailures,
      cooldownMs: this.resetTimeoutMs,
    });
  }

  private close(): void {
    this.state = "closed";
    this.consecutiveFailures = 0;
    this.halfOpenSuccesses = 0;
    this.probing = false;
    log.info("circuit closed (recovered)", { breaker: this.name });
  }
}
