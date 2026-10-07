import type { Metadata } from "next";
import { Nunito, Martian_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";
import { RouteProgress } from "@/components/shared/RouteProgress";
import "./globals.css";

// Nunito: rounded, friendly, and heavy enough (up to 1000) for chunky,
// game-like headings. One family at many weights keeps the voice coherent.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
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
    <html lang="en">
      <body className={`${nunito.variable} ${martianMono.variable} font-sans`}>
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
