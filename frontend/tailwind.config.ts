import type { Config } from "tailwindcss";

const config: Config = {
  // hover: utilities only apply on devices that can hover, so a tap on a
  // phone never leaves a card stuck in its lifted/scaled hover state.
  future: { hoverOnlyWhenSupported: true },
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          bright: "hsl(var(--primary-bright))",
          shade: "hsl(var(--primary-shade))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          bright: "hsl(var(--secondary-bright))",
          shade: "hsl(var(--secondary-shade))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          // Error COPY uses this; the DEFAULT is a fill.
          text: "hsl(var(--destructive-text))",
          bright: "hsl(var(--destructive-bright))",
          shade: "hsl(var(--destructive-shade))",
        },
        // Fixed meanings: energy = streak, xp = XP and rewards, grape = level/league.
        energy: {
          DEFAULT: "hsl(var(--energy))",
          bright: "hsl(var(--energy-bright))",
          shade: "hsl(var(--energy-shade))",
        },
        xp: {
          DEFAULT: "hsl(var(--xp))",
          bright: "hsl(var(--xp-bright))",
          shade: "hsl(var(--xp-shade))",
        },
        grape: {
          DEFAULT: "hsl(var(--grape))",
          bright: "hsl(var(--grape-bright))",
          shade: "hsl(var(--grape-shade))",
        },
        aurora: {
          1: "hsl(var(--aurora-1))",
          2: "hsl(var(--aurora-2))",
          3: "hsl(var(--aurora-3))",
          4: "hsl(var(--aurora-4))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Slow left-to-right flow across a 200%-wide gradient — used by
        // `.gradient-text` on the brand wordmark so the signal→depth mark
        // reads as alive, not a static rainbow.
        gradient: {
          to: { backgroundPosition: "-200% center" },
        },
        // Gentle downward nudge for the "scroll to begin" hint. Ease-in-out,
        // small travel, no bounce/elastic (which the detector flags).
        nudge: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        gradient: "gradient 6s linear infinite",
        nudge: "nudge 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        marquee: "marquee 35s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
