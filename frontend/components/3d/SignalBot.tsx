"use client";

/**
 * SignalBot — SkillStreak's own 3D mascot, built in-house with
 * react-three-fiber (no external Spline asset, no legs, no pedestal).
 *
 * A floating holographic AI companion: a rounded visor head with glowing
 * cyan eyes that track the cursor anywhere on the page, a lime antenna
 * pulse (streak energy), violet ear pods, and two counter-rotating halo
 * rings underneath. Click it for a full spin.
 *
 * Perf: renders on demand when off-screen or reduced-motion; DPR capped.
 */

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";

type PointerRef = React.MutableRefObject<{ x: number; y: number }>;

// The monorepo carries two conflicting `three` type versions (the Spline
// runtime hoists @types/three@0.184 next to three@0.160), so typed
// Group/Mesh refs fail to unify. These refs are only mutated imperatively
// in useFrame — structural typing adds nothing here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj3DRef = any;

/* Eye blink: closed for a beat every ~3.8s. Returns Y scale 1 → ~0.08. */
function blinkScale(t: number): number {
  const phase = t % 3.8;
  if (phase < 3.56) return 1;
  const p = (phase - 3.56) / 0.24;
  return 1 - 0.92 * Math.sin(p * Math.PI);
}

function BotRig({ pointer, animated }: { pointer: PointerRef; animated: boolean }) {
  const head = useRef<Obj3DRef>(null);
  const eyes = useRef<Obj3DRef>(null);
  const tip = useRef<Obj3DRef>(null);
  const ringA = useRef<Obj3DRef>(null);
  const ringB = useRef<Obj3DRef>(null);
  // Click → one full yaw spin, eased out in useFrame.
  const spin = useRef({ value: 0, target: 0 });

  useFrame((state, delta) => {
    if (!animated) return;
    const t = state.clock.elapsedTime;
    const h = head.current;
    if (h) {
      spin.current.value +=
        (spin.current.target - spin.current.value) * Math.min(1, delta * 3.2);
      h.position.y = 0.28 + Math.sin(t * 1.1) * 0.12;
      h.rotation.y = pointer.current.x * 0.5 + spin.current.value;
      h.rotation.x = -pointer.current.y * 0.26 + Math.sin(t * 0.9) * 0.02;
      h.rotation.z = Math.sin(t * 0.7) * 0.015;
    }
    if (eyes.current) {
      // Eyes lead the head slightly — reads as attention, not rigidity.
      eyes.current.position.x = pointer.current.x * 0.14;
      eyes.current.position.y = pointer.current.y * 0.1;
      const s = blinkScale(t);
      eyes.current.scale.set(1, s, 1);
    }
    if (tip.current) {
      const p = 1 + Math.sin(t * 2.4) * 0.16;
      tip.current.scale.setScalar(p);
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.35;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.5;
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* ── Head ─────────────────────────────────────────────── */}
      <group
        ref={head}
        position={[0, 0.28, 0]}
        onClick={() => (spin.current.target += Math.PI * 2)}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {/* Shell */}
        <RoundedBox args={[3, 2.05, 1.5]} radius={0.34} smoothness={8}>
          <meshStandardMaterial color="#0c1526" metalness={0.7} roughness={0.32} />
        </RoundedBox>

        {/* Screen face — near-black glass with a faint violet under-glow */}
        <RoundedBox args={[2.5, 1.55, 0.14]} radius={0.2} position={[0, 0, 0.74]}>
          <meshStandardMaterial
            color="#04060d"
            metalness={0.5}
            roughness={0.18}
            emissive="#150b2e"
            emissiveIntensity={0.7}
          />
        </RoundedBox>

        {/* Eyes + smile — bright, unaffected by tone mapping so they glow */}
        <group ref={eyes}>
          <mesh position={[-0.5, 0.14, 0.86]} scale={[0.17, 0.24, 0.06]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color="#7ff3ff" toneMapped={false} />
          </mesh>
          <mesh position={[0.5, 0.14, 0.86]} scale={[0.17, 0.24, 0.06]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color="#7ff3ff" toneMapped={false} />
          </mesh>
          {/* smile: torus arc centered on the bottom */}
          <mesh
            position={[0, -0.32, 0.84]}
            rotation={[0, 0, -Math.PI / 2 - (Math.PI * 0.7) / 2]}
            scale={[1, 1, 0.4]}
          >
            <torusGeometry args={[0.22, 0.04, 10, 32, Math.PI * 0.7]} />
            <meshBasicMaterial color="#7ff3ff" toneMapped={false} />
          </mesh>
        </group>

        {/* Antenna + lime tip (streak energy) */}
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.55, 12]} />
          <meshStandardMaterial color="#1a2740" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh ref={tip} position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshBasicMaterial color="#d9f99d" toneMapped={false} />
        </mesh>

        {/* Ear pods with violet caps */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.57, 0.08, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.16, 24]} />
              <meshStandardMaterial color="#0c1526" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[side * 0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.17, 0.17, 0.02, 24]} />
              <meshBasicMaterial color="#a78bfa" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Halo rings — the "hover engine" replacing legs ────── */}
      <mesh ref={ringA} position={[0, -1.32, 0]} rotation={[Math.PI / 2.12, 0, 0]}>
        <torusGeometry args={[1.38, 0.02, 8, 72]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh ref={ringB} position={[0, -1.16, 0]} rotation={[Math.PI / 2.12, 0, 0]}>
        <torusGeometry args={[1.05, 0.016, 8, 64]} />
        <meshBasicMaterial color="#8b5cf6" toneMapped={false} transparent opacity={0.55} />
      </mesh>
      {/* soft light pool under the rings */}
      <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 40]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.07} />
      </mesh>

      {animated && (
        <Sparkles
          count={34}
          scale={[6.5, 4.5, 2]}
          size={2.2}
          speed={0.35}
          opacity={0.55}
          color="#7dd3fc"
          position={[0, 0.2, -0.4]}
        />
      )}
    </group>
  );
}

export default function SignalBot({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(true);
  const animated = !reduced;

  // Track the cursor across the whole window (not just the canvas) so the
  // bot watches you while you read the hero copy.
  useEffect(() => {
    if (!animated) return;
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [animated]);

  // Stop the render loop entirely when scrolled away.
  useEffect(() => {
    if (!wrapper.current) return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin: "100px 0px" }
    );
    obs.observe(wrapper.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapper} className={className}>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={animated && inView ? "always" : "demand"}
        camera={{ position: [0, 0.35, 7], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 7, 6]} intensity={1.15} />
        <pointLight position={[-5, -2, 4]} color="#22d3ee" intensity={50} />
        <pointLight position={[5, 3, -3]} color="#8b5cf6" intensity={60} />
        <BotRig pointer={pointer} animated={animated} />
      </Canvas>
    </div>
  );
}
