"use client";

/**
 * Fixed landing navigation — transparent over the hero, gains a solid
 * white bar with a chunky bottom border once scrolled. Carries the wordmark (the hero no longer
 * duplicates it) plus section anchors and the two auth CTAs that were
 * previously only reachable from the footer.
 */

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
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
      className={`vt-nav fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b-2 border-border bg-background"
          : "border-b-2 border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="focus-ring rounded-xl font-display text-2xl text-primary">
          SkillStreak<span className="ml-1.5 text-foreground">AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing sections">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="focus-ring rounded-2xl px-4 py-2.5 text-[15px] font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="focus-ring hidden rounded-2xl px-4 py-2.5 text-[15px] font-extrabold text-secondary transition-colors hover:bg-muted sm:block"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="h-10 uppercase tracking-wider">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
