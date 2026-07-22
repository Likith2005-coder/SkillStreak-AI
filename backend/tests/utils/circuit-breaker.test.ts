import {
  CircuitBreaker,
  CircuitOpenError,
  ConcurrencyLimitError,
  DependencyTimeoutError,
} from "../../src/utils/circuit-breaker";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Controllable clock so we can test cool-down without real waits. */
function fakeClock() {
  let t = 1_000_000;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

const boom = () => Promise.reject(new Error("upstream boom"));
const ok = <T>(v: T) => () => Promise.resolve(v);

describe("CircuitBreaker", () => {
  it("trips OPEN after N consecutive failures, then fast-fails WITHOUT calling the upstream", async () => {
    const clock = fakeClock();
    const cb = new CircuitBreaker({
      name: "t",
      timeoutMs: 1000,
      maxConcurrent: 10,
      failureThreshold: 3,
      resetTimeoutMs: 5000,
      now: clock.now,
    });

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(boom)).rejects.toThrow("upstream boom");
    }
    expect(cb.getStats().state).toBe("open");

    // Now the dependency is "isolated": execute must not invoke fn at all.
    const spy = jest.fn(ok("should-not-run"));
    const start = Date.now();
    await expect(cb.execute(spy)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(spy).not.toHaveBeenCalled();
    expect(Date.now() - start).toBeLessThan(50); // fast fail, no waiting
  });

  it("times out a hung call, aborts its signal, and counts it as a failure", async () => {
    const cb = new CircuitBreaker({
      name: "t",
      timeoutMs: 20,
      maxConcurrent: 10,
      failureThreshold: 1,
      resetTimeoutMs: 5000,
    });

    let abortedSeen = false;
    const hung = (signal: AbortSignal) =>
      new Promise<never>((_, reject) => {
        signal.addEventListener("abort", () => {
          abortedSeen = true;
          reject(new Error("aborted"));
        });
        // otherwise never settles
      });

    await expect(cb.execute(hung)).rejects.toBeInstanceOf(DependencyTimeoutError);
    expect(abortedSeen).toBe(true);
    // failureThreshold=1, so the timeout alone trips it.
    expect(cb.getStats().state).toBe("open");
  });

  it("sheds load past maxConcurrent immediately, and shedding does NOT trip the breaker", async () => {
    const cb = new CircuitBreaker({
      name: "t",
      timeoutMs: 1000,
      maxConcurrent: 2,
      failureThreshold: 2,
      resetTimeoutMs: 5000,
    });

    const gate = deferred();
    const slow = () => gate.promise;

    const a = cb.execute(slow); // slot 1
    const b = cb.execute(slow); // slot 2
    await sleep(0); // let both acquire

    // 3rd call is shed instantly.
    const start = Date.now();
    await expect(cb.execute(slow)).rejects.toBeInstanceOf(ConcurrencyLimitError);
    expect(Date.now() - start).toBeLessThan(50);

    // A second shed would trip a failure-threshold-of-2 breaker if shedding
    // counted as failure — assert it stays CLOSED.
    await expect(cb.execute(slow)).rejects.toBeInstanceOf(ConcurrencyLimitError);
    expect(cb.getStats().state).toBe("closed");

    gate.resolve();
    await Promise.all([a, b]);
  });

  it("a degraded dependency does not drag down an unrelated one (bulkhead isolation)", async () => {
    const clock = fakeClock();
    const opts = {
      timeoutMs: 1000,
      maxConcurrent: 4,
      failureThreshold: 2,
      resetTimeoutMs: 5000,
      now: clock.now,
    };
    const gemini = new CircuitBreaker({ name: "gemini", ...opts });
    const youtube = new CircuitBreaker({ name: "youtube", ...opts });

    // Gemini goes down and trips.
    await expect(gemini.execute(boom)).rejects.toThrow();
    await expect(gemini.execute(boom)).rejects.toThrow();
    expect(gemini.getStats().state).toBe("open");

    // YouTube is unaffected: still runs, still fast.
    const start = Date.now();
    await expect(youtube.execute(ok("video-123"))).resolves.toBe("video-123");
    expect(Date.now() - start).toBeLessThan(50);
    expect(youtube.getStats().state).toBe("closed");

    // And the broken one keeps fast-failing rather than blocking.
    await expect(gemini.execute(ok("x"))).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("recovers cleanly: OPEN → HALF-OPEN probe → CLOSED after successThreshold", async () => {
    const clock = fakeClock();
    const cb = new CircuitBreaker({
      name: "t",
      timeoutMs: 1000,
      maxConcurrent: 10,
      failureThreshold: 2,
      resetTimeoutMs: 1000,
      successThreshold: 2,
      now: clock.now,
    });

    await expect(cb.execute(boom)).rejects.toThrow();
    await expect(cb.execute(boom)).rejects.toThrow();
    expect(cb.getStats().state).toBe("open");

    // Still within cool-down → fast fail.
    await expect(cb.execute(ok("x"))).rejects.toBeInstanceOf(CircuitOpenError);

    clock.advance(1000); // cool-down elapsed → next call is a HALF-OPEN probe

    await expect(cb.execute(ok("probe1"))).resolves.toBe("probe1");
    expect(cb.getStats().state).toBe("half-open"); // needs 2 successes
    await expect(cb.execute(ok("probe2"))).resolves.toBe("probe2");
    expect(cb.getStats().state).toBe("closed"); // recovered
    expect(cb.getStats().consecutiveFailures).toBe(0);
  });

  it("re-OPENs immediately if the HALF-OPEN probe fails", async () => {
    const clock = fakeClock();
    const cb = new CircuitBreaker({
      name: "t",
      timeoutMs: 1000,
      maxConcurrent: 10,
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      now: clock.now,
    });

    await expect(cb.execute(boom)).rejects.toThrow();
    expect(cb.getStats().state).toBe("open");

    clock.advance(1000);
    // Probe fails → straight back to OPEN, cool-down restarts.
    await expect(cb.execute(boom)).rejects.toThrow("upstream boom");
    expect(cb.getStats().state).toBe("open");

    // Immediately after, still fast-failing (cool-down reset by the failed probe).
    await expect(cb.execute(ok("x"))).rejects.toBeInstanceOf(CircuitOpenError);
  });
});
