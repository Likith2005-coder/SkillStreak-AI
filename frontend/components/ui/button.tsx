"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Midnight buttons. Filled variants are lit from within: a bright face, a
// thin inner highlight on the top lip, and a coloured halo that grows on
// hover, as if the button were a light source. Press = a tiny scale-down.
// Fills carry dark ink (`*-foreground`), the role colours are too bright for
// white text.
// Written out in full (not built from a template) so Tailwind can see them.
const LIT = {
  primary:
    "bg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_hsl(var(--primary)/0.6),0_8px_24px_-10px_hsl(var(--primary)/0.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_hsl(var(--primary)/0.8),0_10px_36px_-8px_hsl(var(--primary)/0.85)] hover:brightness-110",
  secondary:
    "bg-secondary shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_hsl(var(--secondary)/0.6),0_8px_24px_-10px_hsl(var(--secondary)/0.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_hsl(var(--secondary)/0.8),0_10px_36px_-8px_hsl(var(--secondary)/0.85)] hover:brightness-110",
  energy:
    "bg-energy shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_hsl(var(--energy)/0.6),0_8px_24px_-10px_hsl(var(--energy)/0.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_hsl(var(--energy)/0.8),0_10px_36px_-8px_hsl(var(--energy)/0.85)] hover:brightness-110",
  grape:
    "bg-grape shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_hsl(var(--grape)/0.6),0_8px_24px_-10px_hsl(var(--grape)/0.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_hsl(var(--grape)/0.8),0_10px_36px_-8px_hsl(var(--grape)/0.85)] hover:brightness-110",
  destructive:
    "bg-destructive shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_0_1px_hsl(var(--destructive)/0.6),0_8px_24px_-10px_hsl(var(--destructive)/0.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_hsl(var(--destructive)/0.8),0_10px_36px_-8px_hsl(var(--destructive)/0.85)] hover:brightness-110",
};

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-[-0.01em] ring-offset-background transition-[transform,box-shadow,filter,background-color,border-color] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-white/[0.06] disabled:bg-white/[0.06] disabled:text-muted-foreground disabled:shadow-none disabled:brightness-100 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default: `${LIT.primary} text-primary-foreground`,
        secondary: `${LIT.secondary} text-secondary-foreground`,
        energy: `${LIT.energy} text-primary-foreground`,
        grape: `${LIT.grape} text-primary-foreground`,
        outline:
          "border border-white/10 bg-white/[0.03] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] hover:border-white/20 hover:bg-white/[0.07]",
        ghost: "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        destructive: `${LIT.destructive} text-destructive-foreground`,
        link: "h-auto px-0 text-secondary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-10 w-10",
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
