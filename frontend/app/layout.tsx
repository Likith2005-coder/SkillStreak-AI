import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/shared/RouteProgress";
import "./globals.css";

// One family, two voices. Archivo's width axis (62-125%) lets the same face
// read as quiet body copy at 100% and as engineered, instrument-panel display
// type when stretched — see `.font-display` in globals.css. Pairing two
// different grotesques would blur together; one family on a contrast axis
// doesn't.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
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
    <html lang="en" className="dark">
      <body className={`${archivo.variable} ${martianMono.variable} font-sans`}>
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
  );
}
