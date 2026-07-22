"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md";
    loading?: boolean;
  }
>(({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-400 to-teal-300 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-cyan-500/30",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-destructive/90 text-destructive-foreground hover:bg-destructive",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-1 focus:ring-primary/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-1 focus:ring-primary/40",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/60 p-5", className)}>{children}</div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "cyan" | "violet" | "amber" | "muted"; children: React.ReactNode }) {
  const tones = {
    cyan: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
    violet: "border-violet-500/40 text-violet-300 bg-violet-500/10",
    amber: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    muted: "border-border text-muted-foreground bg-muted/40",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}
