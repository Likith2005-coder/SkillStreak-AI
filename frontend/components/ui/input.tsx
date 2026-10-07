"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border-2 border-b-4 border-border bg-muted px-4 py-2 text-base font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground transition-colors",
        "focus-visible:border-secondary-bright focus-visible:bg-card focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive-bright",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
