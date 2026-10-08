import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Martian_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";
import { RouteProgress } from "@/components/shared/RouteProgress";
import { SpotlightTracker } from "@/components/shared/SpotlightTracker";
import "./globals.css";

// Bricolage Grotesque: a characterful grotesque with an optical-size axis,
// so it is crisp as body copy and dramatic at display sizes from one family.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

// Instrument Serif italic: the accent voice, one or two words per headline.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Readouts: XP, streak counts, terminal output, step numbers. A mono with its
// own personality rather than the system stack, so numbers feel like live
// instrument values instead of code samples.
const martianMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "SkillStreak AI",
  description:
    "AI-powered learning platform that helps you master modern technology domains through structured roadmaps, an AI tutor, gamified streaks, and curated resources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Enables the View Transitions API for client navigations: pages flow
    // into each other instead of hard-cutting. Browsers without support just
    // navigate normally.
    <ViewTransitions>
    <html lang="en" className="bg-background">
      <body className={`${bricolage.variable} ${instrumentSerif.variable} ${martianMono.variable} font-sans`}>
        <SpotlightTracker />
        <RouteProgress />
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
          }}
        />
      </body>
    </html>
    </ViewTransitions>
  );
}
