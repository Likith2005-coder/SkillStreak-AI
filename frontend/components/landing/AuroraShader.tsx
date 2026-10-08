"use client";

/**
 * The hero's living light: a full-bleed WebGL aurora. One fragment shader on
 * one quad, no three.js. Curtains of violet → blue → cyan → volt light drift
 * across the top of the page, rays shimmer through them, and the cursor
 * pulls a soft brightening toward it.
 *
 * Cost control, in order of impact:
 *   - never runs on a software renderer (SwiftShader, llvmpipe, Microsoft
 *     Basic Render): there the "GPU" is the main thread, so the static CSS
 *     light behind the canvas shows instead
 *   - starts only once the page is idle, so it never competes with first paint
 *   - renders at ~half resolution (an aurora is soft; nobody sees the pixels),
 *     and at 30fps on phones
 *   - stops entirely when scrolled off-screen or the tab is hidden
 *   - phones / touch: the CSS aurora (soft light pools drifting on the
 *     compositor) instead of the shader
 *   - reduced motion / no WebGL: one still frame, or the CSS aurora behind
 */

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;          // 0..1, y up
  vec2 p = uv; p.x *= u_res.x / u_res.y;
  float t = u_time * 0.055;

  // Two curtains at different heights and speeds, warped by noise.
  float n1 = fbm(vec2(p.x * 1.4 + t, p.y * 0.7 - t * 0.6));
  float n2 = fbm(vec2(p.x * 2.1 - t * 0.8, p.y * 0.9 + t * 0.4) + 7.3);
  float y1 = 0.70 + 0.12 * sin(p.x * 1.2 + t * 2.6) + (n1 - 0.5) * 0.45;
  float y2 = 0.56 + 0.10 * sin(p.x * 1.7 - t * 2.1 + 1.7) + (n2 - 0.5) * 0.40;
  float c1 = exp(-pow((uv.y - y1) * 4.2, 2.0));
  float c2 = exp(-pow((uv.y - y2) * 5.0, 2.0));

  // Vertical rays shimmering through the curtains.
  float rays = fbm(vec2(p.x * 7.0 + n1 * 2.5, t * 1.8));
  rays = 0.35 + 0.65 * smoothstep(0.25, 0.85, rays);

  // Spectrum by horizontal position + drift: violet, blue, cyan, volt.
  // Smooth and periodic (a sine, not fract) so the spectrum never jumps.
  float k = 0.5 + 0.5 * sin((p.x * 0.28 + n1 * 0.55 + t * 0.35) * 6.2831);
  vec3 violet = vec3(0.52, 0.30, 1.00);
  vec3 blue   = vec3(0.26, 0.44, 1.00);
  vec3 cyan   = vec3(0.16, 0.86, 0.96);
  vec3 volt   = vec3(0.68, 1.00, 0.26);
  vec3 colA = mix(violet, blue, smoothstep(0.0, 0.35, k));
  colA = mix(colA, cyan, smoothstep(0.35, 0.7, k));
  colA = mix(colA, volt, smoothstep(0.75, 1.0, k) * 0.7);
  vec3 colB = mix(blue, violet, smoothstep(0.2, 0.8, 1.0 - k));

  // The cursor gathers light toward itself.
  float md = distance(uv, u_mouse);
  float pull = 0.35 * exp(-md * md * 9.0);

  vec3 base = vec3(0.010, 0.012, 0.018);
  vec3 col = base
    + colA * c1 * rays * (0.5 + pull)
    + colB * c2 * rays * (0.3 + pull * 0.8);

  // Fade into the page below and darken the edges.
  col *= smoothstep(0.08, 0.55, uv.y);
  col *= 1.0 - 0.45 * pow(distance(uv, vec2(0.5, 0.62)), 1.6);
  gl_FragColor = vec4(col, 1.0);
}`;

export function AuroraShader({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    // Phones and touch devices get the CSS aurora: compiling and running a
    // full-screen shader under a phone's CPU budget measurably delays the
    // page becoming interactive, and the drifting light reads the same there.
    if (window.matchMedia("(max-width: 767px), (pointer: coarse)").matches) {
      el.style.display = "none";
      return;
    }
    const gl = el.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      el.style.display = "none"; // CSS fallback behind it shows instead
      return;
    }
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
      el.style.display = "none";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      el.style.display = "none";
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    // Half resolution: the light is soft by nature.
    const SCALE = 0.5;
    const resize = () => {
      const w = Math.max(1, Math.round(el.clientWidth * SCALE));
      const h = Math.max(1, Math.round(el.clientHeight * SCALE));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Cursor, eased so the light glides rather than jumps.
    let mx = 0.5, my = 0.7, tx = 0.5, ty = 0.7;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const start = performance.now() - 20000; // begin mid-flow, not at t=0
    const minFrameMs = window.matchMedia("(max-width: 767px)").matches ? 1000 / 30 : 0;
    let lastDraw = 0;
    let raf = 0;
    let visible = true;
    let started = false;
    const frame = (now: number) => {
      if (minFrameMs && now - lastDraw < minFrameMs) {
        raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
        return;
      }
      lastDraw = now;
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    };

    // Fade the canvas in once it has a frame, over the CSS light.
    el.style.opacity = "0";
    el.style.transition = "opacity 1.2s ease";
    const begin = () => {
      started = true;
      if (reduce) {
        frame(performance.now()); // one still frame
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
      el.style.opacity = "1";
    };
    const hasIdle = "requestIdleCallback" in window;
    const idleId = hasIdle ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 300);

    const resume = () => {
      if (started && !reduce && visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", resume);

    return () => {
      cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", resume);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      {/* CSS aurora: shown on phones and wherever the shader doesn't run.
          Pre-softened radial gradients drifting by transform only, so the
          compositor does all the work. */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="aurora-css absolute left-[-20%] top-[-10%] h-[70%] w-[80%] bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.45),transparent)]" />
        <div className="aurora-css aurora-css-b absolute right-[-25%] top-[0%] h-[65%] w-[85%] bg-[radial-gradient(closest-side,hsl(var(--aurora-3)/0.3),transparent)]" />
        <div className="aurora-css aurora-css-c absolute left-[15%] top-[20%] h-[45%] w-[70%] bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.35),transparent)]" />
      </div>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
