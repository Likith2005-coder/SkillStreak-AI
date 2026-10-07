"use client";

/**
 * The shared "Get started" + "I already have an account" pair, for the
 * coloured bands (BurstSection, FinalCTA).
 *
 * Chunky keys that work on any colour: a white face (or a white-outlined
 * clear one) sitting on a translucent dark edge, so the 3D depth reads the
 * same over green, grape or blue. Pressing sinks the key into its edge.
 */

import { Link } from "next-view-transitions";
import { ArrowRight } from "lucide-react";

const KEY =
  "focus-ring inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-8 text-base font-black uppercase tracking-wider transition-[transform,box-shadow] duration-100 [box-shadow:0_5px_0_rgb(0_0_0/0.22)] active:translate-y-[5px] active:[box-shadow:none] motion-reduce:transition-none";

export function HeroCTA() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link href="/register" className={`${KEY} group bg-white text-primary hover:brightness-95`}>
        Get started — it&apos;s free
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" strokeWidth={3} aria-hidden />
      </Link>
      <Link href="/login" className={`${KEY} border-2 border-white/80 bg-transparent text-white hover:bg-white/10`}>
        I have an account
      </Link>
    </div>
  );
}
