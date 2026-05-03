"use client";

/**
 * Scroll-driven hero primitives.
 *
 * Adapted from the "hero-video" pattern. The source imports from
 * `motion/react`; we use `framer-motion` (already installed at v12) which
 * re-exports the same APIs.
 *
 * Components:
 *   - <ContainerScroll>      — root section that owns a scroll progress value
 *   - <ContainerStagger>     — staggers children's entrance via whileInView
 *   - <ContainerAnimated>    — entrance animation: top/bottom/left/right/blur/z
 *   - <ContainerInset>       — the signature clip-path scroll animation that
 *                              expands an element from a small pill into a
 *                              full-bleed shape as the user scrolls
 */

import * as React from "react";
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

type AnimateT = "left" | "right" | "top" | "bottom" | "z" | "blur" | undefined;

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
  duration: 0.3,
};

const useAnimationVariants = (animate: AnimateT) =>
  React.useMemo(
    () => ({
      hidden: {
        x: animate === "left" ? "-100%" : animate === "right" ? "100%" : 0,
        y: animate === "top" ? "-100%" : animate === "bottom" ? "100%" : 0,
        scale: animate === "z" ? 0 : 1,
        filter: animate === "blur" ? "blur(10px)" : "blur(0px)",
        opacity: 0,
      },
      visible: {
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        opacity: 1,
      },
    }),
    [animate]
  );

export const ContainerStagger = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ children, className, ...props }, ref) => {
  return (
    <motion.div
      className={cn("relative", className)}
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, ...props.viewport }}
      transition={{
        staggerChildren: props.transition?.staggerChildren || 0.2,
        ...props.transition,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});
ContainerStagger.displayName = "ContainerStagger";

interface ContainerAnimatedProps extends HTMLMotionProps<"div"> {
  animation?: AnimateT;
}

export const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  ContainerAnimatedProps
>(({ animation, children, className, ...props }, ref) => {
  const variants = useAnimationVariants(animation);

  return (
    <motion.div
      transition={SPRING_CONFIG}
      ref={ref}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});
ContainerAnimated.displayName = "ContainerAnimated";

interface ContainerScrollValue {
  scrollYProgress: MotionValue<number>;
}
const ContainerScrollContext = React.createContext<ContainerScrollValue | undefined>(
  undefined
);
function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within <ContainerScroll>"
    );
  }
  return context;
}

interface ContainerScrollProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ContainerScroll = ({
  children,
  className,
  ...props
}: ContainerScrollProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <section
        className={cn("relative min-h-[120vh] w-full pb-[30%] pt-8", className)}
        {...props}
        ref={scrollRef}
      >
        {children}
      </section>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = "ContainerScroll";

interface ContainerInsetProps extends HTMLMotionProps<"div"> {
  translateYRange?: [string, string];
  insetYRange?: [number, number];
  insetXRange?: [number, number];
  roundednessRange?: [number, number];
}

/**
 * Circular clip-path reveal driven by scroll. The clipped element starts as a
 * tiny dot at (originXPercent, originYPercent) and expands radially outward
 * to fill the viewport as the user scrolls through the parent ContainerScroll.
 *
 * Use this to make a panel appear to "burst out" of a specific point — e.g.
 * a single letter in a giant wordmark.
 */
interface ContainerCircleRevealProps extends HTMLMotionProps<"div"> {
  /** 0-100, where on the X axis the circle originates. Default: 50 (center). */
  originXPercent?: number;
  /** 0-100, where on the Y axis the circle originates. Default: 50 (center). */
  originYPercent?: number;
  /** Radius in percentage of the larger viewport dim. Animates first → second. */
  radiusRange?: [number, number];
  /** Slice of scrollYProgress over which the radius animates. */
  scrollRange?: [number, number];
}
export const ContainerCircleReveal = React.forwardRef<
  HTMLDivElement,
  ContainerCircleRevealProps
>(
  (
    {
      originXPercent = 50,
      originYPercent = 50,
      radiusRange = [0, 150],
      scrollRange = [0.1, 0.9],
      children,
      className,
      style: styleProp,
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext();
    const radius = useTransform(scrollYProgress, scrollRange, radiusRange, {
      clamp: true,
    });
    const clipPath = useMotionTemplate`circle(${radius}% at ${originXPercent}% ${originYPercent}%)`;

    const style = React.useMemo(
      () => ({ clipPath, WebkitClipPath: clipPath, ...styleProp }),
      [clipPath, styleProp]
    );

    return (
      <motion.div
        ref={ref}
        className={cn("overflow-hidden", className)}
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ContainerCircleReveal.displayName = "ContainerCircleReveal";

/**
 * Composite scroll-driven entrance + exit for an element pinned inside a
 * ContainerScroll.
 *
 *   scroll 0 ───── slideRange ─────► element slides up from yRange[0] → yRange[1]
 *   scroll 0 ─────  fadeRange ─────► opacity goes  1   → 0
 *                                     scale    goes scaleRange[0] → scaleRange[1]
 *
 * All ranges are slices of `scrollYProgress` (0..1) so you can stage the
 * slide-in to finish before the fade-out begins. The y values are CSS
 * length strings ("60vh", "0px", "10rem", …).
 *
 * Linear (no spring) so motion stays glued to the scrubbing scroll wheel.
 */
interface ContainerScrollFadeProps extends HTMLMotionProps<"div"> {
  fadeRange?: [number, number];
  scaleRange?: [number, number];
  /** Optional slide-in. yRange = [start, end] CSS lengths, e.g. ["60vh", "0vh"]. */
  yRange?: [string, string];
  /** scrollYProgress slice over which the slide happens. */
  slideRange?: [number, number];
}
export const ContainerScrollFade = React.forwardRef<
  HTMLDivElement,
  ContainerScrollFadeProps
>(
  (
    {
      fadeRange = [0, 0.5],
      scaleRange = [1, 0.85],
      yRange,
      slideRange = [0, 0.3],
      children,
      className,
      style: styleProp,
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext();
    const opacity = useTransform(scrollYProgress, fadeRange, [1, 0], { clamp: true });
    const scale = useTransform(scrollYProgress, fadeRange, scaleRange, { clamp: true });
    // Always create the y motion value (hooks must run unconditionally); when
    // no yRange is supplied we map to "0vh" → "0vh" so the element doesn't move.
    const y = useTransform(
      scrollYProgress,
      slideRange,
      yRange ?? ["0vh", "0vh"],
      { clamp: true }
    );

    const style = React.useMemo(
      () => ({ opacity, scale, y, ...styleProp }),
      [opacity, scale, y, styleProp]
    );

    return (
      <motion.div ref={ref} className={className} style={style} {...props}>
        {children}
      </motion.div>
    );
  }
);
ContainerScrollFade.displayName = "ContainerScrollFade";

export const ContainerInset = React.forwardRef<HTMLDivElement, ContainerInsetProps>(
  (
    {
      translateYRange = ["-25%", "50%"],
      insetYRange = [35, 0],
      insetXRange = [42, 0],
      roundednessRange = [1000, 16],
      children,
      className,
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext();
    const y = useTransform(scrollYProgress, [0, 1], translateYRange);

    const insetY = useTransform(scrollYProgress, [0, 1], insetYRange);
    const insetX = useTransform(scrollYProgress, [0, 1], insetXRange);
    const roundedness = useTransform(scrollYProgress, [0, 1], roundednessRange);

    const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${roundedness}px)`;

    const style = React.useMemo(
      () => ({ y, clipPath, ...props.style }),
      [y, clipPath, props.style]
    );
    return (
      <motion.div
        transition={SPRING_CONFIG}
        ref={ref}
        className={cn("origin-top overflow-hidden", className)}
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ContainerInset.displayName = "ContainerInset";
