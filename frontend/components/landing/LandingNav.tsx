"use client";

/**
 * Fixed landing navigation — transparent over the hero; once scrolled it
 * becomes a blurred near-black bar with a hairline bottom edge. Carries the wordmark (the hero no longer
 * duplicates it) plus section anchors and the two auth CTAs that were
 * previously only reachable from the footer.
 */

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIntroDone } from "./introBus";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Arsenal", href: "#arsenal" },
];

export function LandingNav() {
  const reduce = useReducedMotion();
  // Drop in only once the boot intro starts revealing the page.
  const introDone = useIntroDone();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      // The server can't know the motion preference, so the initial state must
      // not depend on it (that mismatch broke hydration). Reduced motion just
      // makes the reveal instant.
      initial={{ y: -24, opacity: 0 }}
      animate={introDone || reduce ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
      className={`vt-nav fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-white/[0.07] bg-background/70 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link
          href="/"
          className="focus-ring group inline-flex items-center gap-2 rounded-lg font-display text-xl text-foreground"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_18px_-2px_hsl(var(--primary)/0.7)]"
          >
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
          </span>
          <span>
            SkillStreak<span className="ml-1 text-muted-foreground">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing sections">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="focus-ring rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="focus-ring hidden rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground sm:block"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="h-10 px-4">
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
