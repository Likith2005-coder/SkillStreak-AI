"use client";

/**
 * Animated cartoon-character side panel for the auth pages.
 *
 * Adapted from the "animated-characters-login-page" pattern (eyes track the
 * cursor, blink at random intervals, lean toward the mouse, look at each
 * other when the user starts typing, and one of them peeks at the password
 * when it's revealed).
 *
 * Recoloured from the source's purple/orange/yellow palette to SkillStreak's
 * indigo / violet / fuchsia / cyan brand colours.
 */

import { useEffect, useRef, useState } from "react";
import { useAuthForm } from "@/app/(auth)/auth-form-context";

// Brand-aligned palette for the four characters
const COLOR_VIOLET = "#8b5cf6"; // back-most tall block
const COLOR_SLATE = "#1e293b";  // middle tall block
const COLOR_FUCHSIA = "#d946ef"; // front semi-circle
const COLOR_CYAN = "#22d3ee";   // front-right rectangle
const COLOR_PUPIL = "#0f172a";  // dark pupils + mouth

// ───────────────────────────────────────────────────────────
// Pupil + EyeBall primitives
// ───────────────────────────────────────────────────────────

type PupilProps = {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
};

function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = COLOR_PUPIL,
  forceLookX,
  forceLookY,
}: PupilProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  let x = 0;
  let y = 0;
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX;
    y = forceLookY;
  } else if (ref.current) {
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const d = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const a = Math.atan2(dy, dx);
    x = Math.cos(a) * d;
    y = Math.sin(a) * d;
  }

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: pupilColor,
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
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
};

function EyeBall({
  size = 18,
  pupilSize = 7,
  maxDistance = 5,
  eyeColor = "white",
  pupilColor = COLOR_PUPIL,
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  let x = 0;
  let y = 0;
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX;
    y = forceLookY;
  } else if (ref.current) {
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const d = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const a = Math.atan2(dy, dx);
    x = Math.cos(a) * d;
    y = Math.sin(a) * d;
  }

  return (
    <div
      ref={ref}
      className="flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
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

  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isVioletBlinking, setVioletBlinking] = useState(false);
  const [isSlateBlinking, setSlateBlinking] = useState(false);
  const [lookingAtEachOther, setLookingAtEachOther] = useState(false);
  const [violetPeeking, setVioletPeeking] = useState(false);

  const violetRef = useRef<HTMLDivElement | null>(null);
  const slateRef = useRef<HTMLDivElement | null>(null);
  const fuchsiaRef = useRef<HTMLDivElement | null>(null);
  const cyanRef = useRef<HTMLDivElement | null>(null);

  // Mouse tracking
  useEffect(() => {
    function onMove(e: MouseEvent) {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Random blinks for the two big characters
  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

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
    if (!(passwordLength > 0 && passwordVisible)) {
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
  }, [passwordLength, passwordVisible]);

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
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* Back: tall violet block */}
      <div
        ref={violetRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 70,
          width: 180,
          height: isTyping || (passwordLength > 0 && !passwordVisible) ? 440 : 400,
          backgroundColor: COLOR_VIOLET,
          borderRadius: "10px 10px 0 0",
          zIndex: 1,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : isTyping || (passwordLength > 0 && !passwordVisible)
              ? `skewX(${violetPos.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${violetPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
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
            isBlinking={isVioletBlinking}
            forceLookX={
              passwordRevealed ? (violetPeeking ? 4 : -4) : lookingAtEachOther ? 3 : undefined
            }
            forceLookY={
              passwordRevealed ? (violetPeeking ? 5 : -4) : lookingAtEachOther ? 4 : undefined
            }
          />
          <EyeBall
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
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 240,
          width: 120,
          height: 310,
          backgroundColor: COLOR_SLATE,
          borderRadius: "8px 8px 0 0",
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
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
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
            isBlinking={isSlateBlinking}
            forceLookX={passwordRevealed ? -4 : lookingAtEachOther ? 0 : undefined}
            forceLookY={passwordRevealed ? -4 : lookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isSlateBlinking}
            forceLookX={passwordRevealed ? -4 : lookingAtEachOther ? 0 : undefined}
            forceLookY={passwordRevealed ? -4 : lookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* Front-left: fuchsia semi-circle */}
      <div
        ref={fuchsiaRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 0,
          width: 240,
          height: 200,
          backgroundColor: COLOR_FUCHSIA,
          borderRadius: "120px 120px 0 0",
          zIndex: 3,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : `skewX(${fuchsiaPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: passwordRevealed ? 50 : 82 + fuchsiaPos.faceX,
            top: passwordRevealed ? 85 : 90 + fuchsiaPos.faceY,
          }}
        >
          <Pupil forceLookX={passwordRevealed ? -5 : undefined} forceLookY={passwordRevealed ? -4 : undefined} />
          <Pupil forceLookX={passwordRevealed ? -5 : undefined} forceLookY={passwordRevealed ? -4 : undefined} />
        </div>
      </div>

      {/* Front-right: cyan rectangle with mouth */}
      <div
        ref={cyanRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 310,
          width: 140,
          height: 230,
          backgroundColor: COLOR_CYAN,
          borderRadius: "70px 70px 0 0",
          zIndex: 4,
          transform: passwordRevealed
            ? "skewX(0deg)"
            : `skewX(${cyanPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: passwordRevealed ? 20 : 52 + cyanPos.faceX,
            top: passwordRevealed ? 35 : 40 + cyanPos.faceY,
          }}
        >
          <Pupil forceLookX={passwordRevealed ? -5 : undefined} forceLookY={passwordRevealed ? -4 : undefined} />
          <Pupil forceLookX={passwordRevealed ? -5 : undefined} forceLookY={passwordRevealed ? -4 : undefined} />
        </div>
        <div
          className="absolute h-[4px] w-20 rounded-full transition-all duration-200 ease-out"
          style={{
            backgroundColor: COLOR_PUPIL,
            left: passwordRevealed ? 10 : 40 + cyanPos.faceX,
            top: passwordRevealed ? 88 : 88 + cyanPos.faceY,
          }}
        />
      </div>
    </div>
  );
}
