"use client";

/**
 * Animated cartoon-character side panel for the auth pages.
 *
 * Adapted from the "animated-characters-login-page" pattern (eyes track the
 * cursor, blink at random intervals, lean toward the mouse, look at each
 * other when the user starts typing, and one of them peeks at the password
 * when it's revealed).
 *
 * Midnight styling: each character is a glossy near-black shape with a
 * glowing rim in its role colour (grape / blue / ember / gold), light
 * catching its top edge, and luminous eyes, all standing in a pool of
 * aurora light. Behaviour is unchanged.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useAuthForm } from "@/app/(auth)/auth-form-context";

// Each character's role colour, as an HSL triplet reference.
const TONE_VIOLET = "var(--grape)"; // back-most tall block
const TONE_SLATE = "var(--secondary)"; // middle tall block
const TONE_FUCHSIA = "var(--energy)"; // front semi-circle
const TONE_CYAN = "var(--xp)"; // front-right rectangle
const COLOR_INK = "hsl(228 30% 5%)"; // pupils inside the light sclera
const COLOR_SCLERA = "hsl(220 30% 96%)";

/** Glossy dark body with a glowing role-colour rim. */
function bodyStyle(tone: string): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, hsl(${tone} / 0.26) 0%, hsl(${tone} / 0.08) 28%, hsl(228 22% 6%) 70%)`,
    border: `1px solid hsl(${tone} / 0.6)`,
    borderBottom: "none",
    boxShadow: [
      `inset 0 1px 0 hsl(${tone} / 0.9)`, // light catching the top lip
      `inset 0 0 36px hsl(${tone} / 0.14)`,
      `0 0 42px -8px hsl(${tone} / 0.55)`, // rim glow into the room
    ].join(", "),
  };
}

/** A diagonal specular sheen, clipped to the body's shape. */
function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background: "linear-gradient(115deg, rgb(255 255 255 / 0.10) 0%, rgb(255 255 255 / 0.03) 22%, transparent 40%)",
      }}
    />
  );
}

// ───────────────────────────────────────────────────────────
// Pupil + EyeBall primitives
// ───────────────────────────────────────────────────────────

type PupilProps = {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  glow?: string;
  forceLookX?: number;
  forceLookY?: number;
};

// One pointer for every eye: the parent owns a single rAF-throttled listener
// and shares the position here. null = don't track (reduced motion, or no
// pointer yet), so pupils rest centred.
const PointerContext = createContext<{ x: number; y: number } | null>(null);

function lookOffset(el: HTMLDivElement | null, pointer: { x: number; y: number } | null, maxDistance: number) {
  if (!el || !pointer) return { x: 0, y: 0 };
  const r = el.getBoundingClientRect();
  const dx = pointer.x - (r.left + r.width / 2);
  const dy = pointer.y - (r.top + r.height / 2);
  const d = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
  const a = Math.atan2(dy, dx);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d };
}

function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = COLOR_INK,
  glow,
  forceLookX,
  forceLookY,
}: PupilProps) {
  const pointer = useContext(PointerContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const { x, y } =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : lookOffset(ref.current, pointer, maxDistance);

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: pupilColor,
        boxShadow: glow,
        transform: `translate(${x}px, ${y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
}

type EyeBallProps = {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  glow?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
};

function EyeBall({
  size = 18,
  pupilSize = 7,
  maxDistance = 5,
  eyeColor = COLOR_SCLERA,
  pupilColor = COLOR_INK,
  glow,
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const pointer = useContext(PointerContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const { x, y } =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : lookOffset(ref.current, pointer, maxDistance);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center rounded-full transition-[height] duration-150 ease-out motion-reduce:transition-none"
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        boxShadow: glow,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            transform: `translate(${x}px, ${y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────

export function AnimatedCharacters() {
  const { isTyping, passwordLength, passwordVisible } = useAuthForm();

  const reduce = useReducedMotionSafe();
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const mouseX = pointer?.x ?? 0;
  const mouseY = pointer?.y ?? 0;
  const [isVioletBlinking, setVioletBlinking] = useState(false);
  const [isSlateBlinking, setSlateBlinking] = useState(false);
  const [lookingAtEachOther, setLookingAtEachOther] = useState(false);
  const [violetPeeking, setVioletPeeking] = useState(false);

  const violetRef = useRef<HTMLDivElement | null>(null);
  const slateRef = useRef<HTMLDivElement | null>(null);
  const fuchsiaRef = useRef<HTMLDivElement | null>(null);
  const cyanRef = useRef<HTMLDivElement | null>(null);

  // Pointer tracking: one listener, at most one state update per frame.
  // Reduced motion: no tracking at all, the crew looks straight ahead.
  useEffect(() => {
    if (reduce) {
      setPointer(null);
      return;
    }
    let raf = 0;
    let last = { x: 0, y: 0 };
    function onMove(e: MouseEvent) {
      last = { x: e.clientX, y: e.clientY };
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          setPointer(last);
        });
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // Random blinks for the two big characters (none under reduced motion)
  useEffect(() => {
    if (reduce) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setVioletBlinking(true);
          setTimeout(() => {
            setVioletBlinking(false);
            schedule();
          }, 150);
        },
        Math.random() * 4000 + 3000
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setSlateBlinking(true);
          setTimeout(() => {
            setSlateBlinking(false);
            schedule();
          }, 150);
        },
        Math.random() * 4000 + 3000
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [reduce]);

  // Look at each other when typing starts
  useEffect(() => {
    if (!isTyping) {
      setLookingAtEachOther(false);
      return;
    }
    setLookingAtEachOther(true);
    const t = setTimeout(() => setLookingAtEachOther(false), 800);
    return () => clearTimeout(t);
  }, [isTyping]);

  // Violet sneaky peek when password is visible
  useEffect(() => {
    if (reduce || !(passwordLength > 0 && passwordVisible)) {
      setVioletPeeking(false);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setVioletPeeking(true);
          setTimeout(() => setVioletPeeking(false), 800);
          schedule();
        },
        Math.random() * 3000 + 2000
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [passwordLength, passwordVisible, reduce]);

  function calcPosition(ref: React.RefObject<HTMLDivElement | null>) {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  }

  const violetPos = calcPosition(violetRef);
  const slatePos = calcPosition(slateRef);
  const fuchsiaPos = calcPosition(fuchsiaRef);
  const cyanPos = calcPosition(cyanRef);

  const passwordRevealed = passwordLength > 0 && passwordVisible;

  return (
    <PointerContext.Provider value={pointer}>
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* The pool of aurora light the crew stands in */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: -110,
          right: -110,
          bottom: -130,
          height: 330,
          zIndex: 0,
          background:
            "radial-gradient(closest-side, hsl(var(--aurora-3) / 0.30), hsl(var(--aurora-2) / 0.18) 45%, hsl(var(--aurora-1) / 0.10) 70%, transparent)",
          filter: "blur(10px)",
        }}
      />
      {/* Back: tall violet block */}
      <div
        ref={violetRef}
        className="absolute bottom-0 transition-[height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          left: 70,
          width: 180,
          height: isTyping || (passwordLength > 0 && !passwordVisible) ? 440 : 400,
          ...bodyStyle(TONE_VIOLET),
          borderRadius: "28px 28px 0 0",
          zIndex: 1,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : isTyping || (passwordLength > 0 && !passwordVisible)
              ? `skewX(${violetPos.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${violetPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <Sheen />
        <div
          className="absolute flex gap-8 transition-[left,top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            left: passwordRevealed
              ? 20
              : lookingAtEachOther
                ? 55
                : 45 + violetPos.faceX,
            top: passwordRevealed
              ? 35
              : lookingAtEachOther
                ? 65
                : 40 + violetPos.faceY,
          }}
        >
          <EyeBall
            glow={`0 0 14px hsl(${TONE_VIOLET} / 0.9)`}
            isBlinking={isVioletBlinking}
            forceLookX={
              passwordRevealed ? (violetPeeking ? 4 : -4) : lookingAtEachOther ? 3 : undefined
            }
            forceLookY={
              passwordRevealed ? (violetPeeking ? 5 : -4) : lookingAtEachOther ? 4 : undefined
            }
          />
          <EyeBall
            glow={`0 0 14px hsl(${TONE_VIOLET} / 0.9)`}
            isBlinking={isVioletBlinking}
            forceLookX={
              passwordRevealed ? (violetPeeking ? 4 : -4) : lookingAtEachOther ? 3 : undefined
            }
            forceLookY={
              passwordRevealed ? (violetPeeking ? 5 : -4) : lookingAtEachOther ? 4 : undefined
            }
          />
        </div>
      </div>

      {/* Middle: slate block */}
      <div
        ref={slateRef}
        className="absolute bottom-0 transition-[height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          left: 240,
          width: 120,
          height: 310,
          ...bodyStyle(TONE_SLATE),
          borderRadius: "22px 22px 0 0",
          zIndex: 2,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : lookingAtEachOther
              ? `skewX(${slatePos.bodySkew * 1.5 + 10}deg) translateX(20px)`
              : isTyping || (passwordLength > 0 && !passwordVisible)
                ? `skewX(${slatePos.bodySkew * 1.5}deg)`
                : `skewX(${slatePos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <Sheen />
        <div
          className="absolute flex gap-6 transition-[left,top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            left: passwordRevealed
              ? 10
              : lookingAtEachOther
                ? 32
                : 26 + slatePos.faceX,
            top: passwordRevealed
              ? 28
              : lookingAtEachOther
                ? 12
                : 32 + slatePos.faceY,
          }}
        >
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            glow={`0 0 14px hsl(${TONE_SLATE} / 0.9)`}
            isBlinking={isSlateBlinking}
            forceLookX={passwordRevealed ? -4 : lookingAtEachOther ? 0 : undefined}
            forceLookY={passwordRevealed ? -4 : lookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            glow={`0 0 14px hsl(${TONE_SLATE} / 0.9)`}
            isBlinking={isSlateBlinking}
            forceLookX={passwordRevealed ? -4 : lookingAtEachOther ? 0 : undefined}
            forceLookY={passwordRevealed ? -4 : lookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* Front-left: fuchsia semi-circle */}
      <div
        ref={fuchsiaRef}
        className="absolute bottom-0 transition-[height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          left: 0,
          width: 240,
          height: 200,
          ...bodyStyle(TONE_FUCHSIA),
          borderRadius: "120px 120px 0 0",
          zIndex: 3,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : `skewX(${fuchsiaPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <Sheen />
        <div
          className="absolute flex gap-8 transition-[left,top,width,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            left: passwordRevealed ? 50 : 82 + fuchsiaPos.faceX,
            top: passwordRevealed ? 85 : 90 + fuchsiaPos.faceY,
          }}
        >
          <Pupil
            pupilColor={`hsl(${TONE_FUCHSIA})`}
            glow={`0 0 10px 2px hsl(${TONE_FUCHSIA} / 0.85)`}
            forceLookX={passwordRevealed ? -5 : undefined}
            forceLookY={passwordRevealed ? -4 : undefined}
          />
          <Pupil
            pupilColor={`hsl(${TONE_FUCHSIA})`}
            glow={`0 0 10px 2px hsl(${TONE_FUCHSIA} / 0.85)`}
            forceLookX={passwordRevealed ? -5 : undefined}
            forceLookY={passwordRevealed ? -4 : undefined}
          />
        </div>
      </div>

      {/* Front-right: cyan rectangle with mouth */}
      <div
        ref={cyanRef}
        className="absolute bottom-0 transition-[height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          left: 310,
          width: 140,
          height: 230,
          ...bodyStyle(TONE_CYAN),
          borderRadius: "70px 70px 0 0",
          zIndex: 4,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : `skewX(${cyanPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <Sheen />
        <div
          className="absolute flex gap-6 transition-[left,top,width,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            left: passwordRevealed ? 20 : 52 + cyanPos.faceX,
            top: passwordRevealed ? 35 : 40 + cyanPos.faceY,
          }}
        >
          <Pupil
            pupilColor={`hsl(${TONE_CYAN})`}
            glow={`0 0 10px 2px hsl(${TONE_CYAN} / 0.85)`}
            forceLookX={passwordRevealed ? -5 : undefined}
            forceLookY={passwordRevealed ? -4 : undefined}
          />
          <Pupil
            pupilColor={`hsl(${TONE_CYAN})`}
            glow={`0 0 10px 2px hsl(${TONE_CYAN} / 0.85)`}
            forceLookX={passwordRevealed ? -5 : undefined}
            forceLookY={passwordRevealed ? -4 : undefined}
          />
        </div>
        <div
          className="absolute h-[4px] w-20 rounded-full transition-[left,top,width,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            backgroundColor: `hsl(${TONE_CYAN})`,
            boxShadow: `0 0 10px hsl(${TONE_CYAN} / 0.8)`,
            left: passwordRevealed ? 10 : 40 + cyanPos.faceX,
            top: passwordRevealed ? 88 : 88 + cyanPos.faceY,
          }}
        />
      </div>
    </div>
    </PointerContext.Provider>
  );
}
