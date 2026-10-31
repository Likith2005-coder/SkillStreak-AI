"use client";

/**
 * The shared "Get started" + "I have an account" pair for the closing
 * moment of the landing page (BurstSection): the lit volt primary
 * and a hairline outline, both from the Midnight Button.
 */

import { Link } from "next-view-transitions";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroCTA() {
  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      <Button asChild size="lg" className="group h-[52px] px-8 text-base">
        <Link href="/register">
          Get started — it&apos;s free
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-[52px] px-7 text-base">
        <Link href="/login">I have an account</Link>
      </Button>
    </div>
  );
}
