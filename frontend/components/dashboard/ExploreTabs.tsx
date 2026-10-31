"use client";

/**
 * The dashboard's explore area: one tab bar over the supporting content
 * (recommendations, domains, activity, trophies) so it no longer stacks into
 * a long scroll of equal-weight sections.
 *
 * - A volt pill slides between tabs (shared `layoutId`).
 * - Panels crossfade with a small slide (`AnimatePresence mode="wait"`).
 * - The panel area's height eases between tabs through a measured wrapper,
 *   so no heavy child is ever layout-animated.
 * - WAI-ARIA tabs: arrow keys / Home / End move and activate, roving
 *   tabindex, aria-selected / aria-controls.
 * - The last tab is remembered for the session.
 * Reduced motion: tabs switch instantly, nothing moves.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const STORE_KEY = "skillstreak.dashboard.tab";

export type ExploreTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Small count chip after the label. */
  badge?: { text: string; tone?: "neutral" | "alert" | "xp"; srLabel?: string };
  /** Contextual link shown at the right of the tab bar for this tab. */
  action?: ReactNode;
  content: ReactNode;
};

// useLayoutEffect warns on the server; it only matters on the client.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ExploreTabs({ tabs, label = "Explore" }: { tabs: ExploreTab[]; label?: string }) {
  const reduce = useReducedMotionSafe();
  const base = useId();
  const [active, setActive] = useState(tabs[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Restore after mount (not in the initializer) so server and client agree.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORE_KEY);
      if (saved && tabs.some((t) => t.id === saved)) setActive(saved);
    } catch {
      // storage blocked: start on the first tab
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: string, focus = false) => {
    setActive(id);
    try {
      window.sessionStorage.setItem(STORE_KEY, id);
    } catch {
      // storage blocked: the choice just won't persist
    }
    const el = tabRefs.current[id];
    if (el) {
      if (focus) el.focus();
      // On phones the bar scrolls sideways; keep the chosen tab in view.
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next].id, true);
  };

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = (id: string) => `${base}-panel-${id}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <LayoutGroup id={base}>
          <div
            role="tablist"
            aria-label={label}
            className="-mx-4 flex max-w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:max-w-full sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex shrink-0 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
              {tabs.map((t) => {
                const selected = t.id === current.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      tabRefs.current[t.id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(t.id)}
                    aria-selected={selected}
                    aria-controls={panelId(t.id)}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(t.id)}
                    onKeyDown={onKeyDown}
                    className={cn(
                      "focus-ring relative inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors duration-200 sm:px-4",
                      selected ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="explore-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-primary/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_hsl(var(--primary)/0.3),0_0_20px_-6px_hsl(var(--primary)/0.5)]"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <t.icon className="relative h-4 w-4" aria-hidden />
                    <span className="relative">{t.label}</span>
                    {t.badge && (
                      <span
                        className={cn(
                          "relative rounded-full border px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums",
                          t.badge.tone === "alert"
                            ? "border-destructive/30 bg-destructive/10 text-destructive-text"
                            : t.badge.tone === "xp"
                              ? "border-xp/25 bg-xp/10 text-xp"
                              : "border-white/10 bg-white/[0.05] text-muted-foreground",
                        )}
                      >
                        {t.badge.text}
                        {t.badge.srLabel && <span className="sr-only"> {t.badge.srLabel}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </LayoutGroup>
        {current.action && <div className="hidden sm:block">{current.action}</div>}
      </div>

      <AutoHeight reduce={reduce} className="mt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            role="tabpanel"
            id={panelId(current.id)}
            aria-labelledby={tabId(current.id)}
            tabIndex={0}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            className="rounded-[1.1rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {current.content}
            {current.action && <div className="mt-4 flex justify-end sm:hidden">{current.action}</div>}
          </motion.div>
        </AnimatePresence>
      </AutoHeight>
    </div>
  );
}

/**
 * Eases its own height to match its content. Only this one wrapper animates
 * a size (once per change); content inside is never layout-animated. It only
 * clips while it is resizing, so hover lifts and focus rings aren't cut off.
 */
function AutoHeight({ children, reduce, className }: { children: ReactNode; reduce: boolean; className?: string }) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const [clip, setClip] = useState(false);

  useIsoLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ height }}
      transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
      onAnimationStart={() => !reduce && setClip(true)}
      onAnimationComplete={() => setClip(false)}
      style={{ overflow: clip ? "hidden" : "visible" }}
    >
      <div ref={inner} className="flow-root">
        {children}
      </div>
    </motion.div>
  );
}
