"use client";

/**
 * Fixed landing navigation — transparent over the hero, gains a glass
 * backdrop once scrolled. Carries the wordmark (the hero no longer
 * duplicates it) plus section anchors and the two auth CTAs that were
 * previously only reachable from the footer.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles as SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Arsenal", href: "#arsenal" },
];

export function LandingNav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/75 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            <span className="gradient-text">SkillStreak</span>
            <span className="text-foreground"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing sections">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
