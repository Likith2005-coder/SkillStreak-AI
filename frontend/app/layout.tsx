import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/shared/RouteProgress";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display face for hero + section headings (landing, page heroes). Inter
// stays the workhorse for body and UI; Space Grotesk carries the big type.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
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
