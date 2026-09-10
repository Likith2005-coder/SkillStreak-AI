"use client";

/**
 * Viewport-gated entry for the SignalBot.
 *
 * three.js is ~667 kB raw and cost ~4.2s of main-thread time on a throttled
 * phone — to render a mascot whose whole point is following a cursor that
 * doesn't exist on touch. So the WebGL scene is only imported on wide,
 * fine-pointer viewports; everywhere else we draw the same character as a
 * static SVG. Mobile never downloads three.js at all.
 */

import dynamic from "next/dynamic";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { SignalBotStatic } from "./SignalBotStatic";

const SignalBot = dynamic(() => import("./SignalBot"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="loader" />
    </div>
  ),
});

export function SignalBotLazy({ className }: { className?: string }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return <SignalBotStatic className={className} />;
  return <SignalBot className={className} />;
}
