"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";

/**
 * Iridescent floating orbs that drift slowly and parallax with the mouse.
 * Used as a decorative background inside hero cards. Pointer-events disabled
 * so it doesn't interfere with the UI on top.
 */
type Props = {
  className?: string;
  /** When false, the canvas is mounted but the per-frame animation is paused. */
  active?: boolean;
};

export function FloatingOrbs({ className, active = true }: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Don't render the canvas during SSR — three has a non-trivial setup cost
  // and we don't need it for the initial paint.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={className}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#a78bfa" />
          <pointLight position={[-5, -3, 3]} intensity={1} color="#22d3ee" />
          <pointLight position={[0, 4, -4]} intensity={0.8} color="#f472b6" />

          <Scene paused={reduce || !active} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Scene({ paused }: { paused: boolean }) {
  // Drei augments the JSX <group> element's ref type, so we widen here to avoid
  // a conflict between three.js's stock Group and drei's enhanced Group.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupRef = useRef<any>(null);
  const target = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  // Track mouse for subtle parallax. We listen on window because the canvas
  // has pointer-events disabled.
  useEffect(() => {
    if (paused) return;
    function onMove(e: MouseEvent) {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [paused]);

  useFrame((_, delta) => {
    if (!groupRef.current || paused) return;
    // Smoothly chase the mouse target.
    groupRef.current.rotation.y +=
      (target.current.x * 0.4 - groupRef.current.rotation.y) * Math.min(1, delta * 2);
    groupRef.current.rotation.x +=
      (target.current.y * 0.25 - groupRef.current.rotation.x) * Math.min(1, delta * 2);
  });

  return (
    <group ref={groupRef} scale={Math.min(1, viewport.width / 8)}>
      {ORB_CONFIG.map((o, i) => (
        <Orb key={i} {...o} paused={paused} />
      ))}
    </group>
  );
}

type OrbProps = {
  position: [number, number, number];
  size: number;
  color: string;
  speed: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  paused: boolean;
};

const ORB_CONFIG: Omit<OrbProps, "paused">[] = [
  { position: [-2.4, 0.6, 0], size: 1.4, color: "#6366f1", speed: 1.2, rotationIntensity: 1.4, floatIntensity: 1.6 },
  { position: [2.2, -0.8, -1], size: 1.1, color: "#d946ef", speed: 0.9, rotationIntensity: 1.6, floatIntensity: 2 },
  { position: [0.4, 1.6, -2], size: 0.9, color: "#22d3ee", speed: 1.4, rotationIntensity: 1.2, floatIntensity: 1.8 },
  { position: [1.6, 1.4, 1], size: 0.55, color: "#f472b6", speed: 1.6, rotationIntensity: 2, floatIntensity: 2.2 },
  { position: [-1.5, -1.4, 0.5], size: 0.7, color: "#34d399", speed: 1.1, rotationIntensity: 1.5, floatIntensity: 1.6 },
];

function Orb({
  position,
  size,
  color,
  speed,
  rotationIntensity = 1,
  floatIntensity = 1.5,
  paused,
}: OrbProps) {
  return (
    <Float
      speed={paused ? 0 : speed}
      rotationIntensity={paused ? 0 : rotationIntensity}
      floatIntensity={paused ? 0 : floatIntensity}
      position={position}
    >
      <Sphere args={[size, 48, 48]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={paused ? 0 : 0.45}
          speed={paused ? 0 : 1.6}
          roughness={0.15}
          metalness={0.6}
          envMapIntensity={1.2}
          emissive={color}
          emissiveIntensity={0.35}
        />
      </Sphere>
    </Float>
  );
}
