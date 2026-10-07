"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The chunky "pressable" button. A solid face sits on a darker edge (the
// box-shadow); pressing sinks the face into the edge (translate-y + shadow
// collapse) so it feels like a physical key, not a hover effect. The edge
// height is a CSS variable so each size can carry a proportional depth.
const PRESS =
  "[--edge:4px] shadow-[0_var(--edge)_0_var(--edge-color)] hover:brightness-[1.06] active:translate-y-[var(--edge)] active:shadow-[0_0_0_var(--edge-color)]";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-2xl font-extrabold tracking-wide ring-offset-background transition-[transform,box-shadow,filter,background-color] duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: `${PRESS} bg-primary text-primary-foreground [--edge-color:hsl(var(--primary-shade))]`,
        secondary: `${PRESS} bg-secondary text-secondary-foreground [--edge-color:hsl(var(--secondary-shade))]`,
        energy: `${PRESS} bg-energy text-white [--edge-color:hsl(var(--energy-shade))]`,
        grape: `${PRESS} bg-grape text-white [--edge-color:hsl(var(--grape-shade))]`,
        outline: `${PRESS} border-2 border-border bg-card text-foreground [--edge-color:hsl(var(--border))] hover:bg-muted`,
        ghost: "text-foreground hover:bg-muted",
        destructive: `${PRESS} bg-destructive text-destructive-foreground [--edge-color:hsl(var(--destructive-shade))]`,
        link: "h-auto px-0 text-secondary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs [--edge:3px]",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
