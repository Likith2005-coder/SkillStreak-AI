"use client";

/**
 * Client-only, code-split entry for the SignalBot 3D scene. three.js is a
 * heavy chunk — keep it out of the landing page's initial bundle exactly
 * like the old Spline scene was.
 */

import dynamic from "next/dynamic";

const SignalBot = dynamic(() => import("./SignalBot"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="loader" />
    </div>
  ),
});

export function SignalBotLazy({ className }: { className?: string }) {
  return <SignalBot className={className} />;
}
