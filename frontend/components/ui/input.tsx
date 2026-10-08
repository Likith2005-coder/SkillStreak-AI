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
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[15px] text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)] placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-200",
        "hover:border-white/20 focus-visible:border-primary/70 focus-visible:bg-white/[0.05] focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive-bright",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
