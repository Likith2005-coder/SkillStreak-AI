"use client";

/**
 * The Signal Field — the landing hero's living background.
 *
 * A field of signal lines flows left to right and converges into the
 * SignalBot, as if the mascot is receiving the transmission. Lines part
 * around the cursor, and lime pulses (streak energy) travel along a few of
 * them. Cyan → violet by depth, matching the Signal palette.
 *
 * Cost discipline (this sits under the busiest part of the page):
 * - One full-screen triangle, one fragment shader, raw WebGL1 — no three.js.
 * - Rendered at a fraction of CSS resolution and upscaled; the lines are soft
 *   glows, so the downscale is invisible and the fill cost drops ~3x.
 * - Paused whenever the hero is off-screen or the tab is hidden.
 * - Only runs on wide, fine-pointer viewports. Phones, coarse pointers and
 *   reduced-motion users get the same field drawn once as static SVG, which
 *   is also what the server renders, so there is never an empty hero.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const LINES = 26;
// Where the lines converge, in 0..1 hero space (y measured from the top).
const SINK = { x: 0.77, y: 0.5 };

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;   // 0..1, y up
uniform float uHover;  // 0..1, eased
uniform vec2 uSink;    // 0..1, y up

const int N = ${LINES};

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float px = uv.x * aspect;
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float sx = uSink.x * aspect;

  vec3 col = vec3(0.0);
  for (int i = 0; i < N; i++) {
    float fi = float(i) / float(N - 1);
    float y = mix(0.06, 0.94, fi)
      + sin(px * 2.1 + uTime * 0.32 + fi * 6.0) * 0.024
      + sin(px * 4.7 - uTime * 0.21 + fi * 11.0) * 0.011;

    // Converge into the sink: a lens that pinches every line toward the bot.
    float pinch = exp(-pow((px - sx) / 0.42, 2.0)) * 0.78;
    y = mix(y, uSink.y + (y - uSink.y) * 0.18, pinch);

    // Part around the cursor.
    vec2 d = vec2(px - m.x, y - m.y);
    float g = exp(-dot(d, d) * 20.0) * uHover;
    y += sign(y - m.y + 1e-4) * g * 0.055;

    float dist = abs(uv.y - y);
    float core = smoothstep(0.0028 + pinch * 0.0012, 0.0, dist);
    float glow = exp(-dist * 85.0);

    vec3 c = mix(vec3(0.07, 0.86, 0.95), vec3(0.62, 0.46, 1.0), fi);

    // Streak pulses: only some lines carry one, each on its own phase.
    float carrier = step(0.62, fract(fi * 7.31 + 0.13));
    float pulseX = fract(uTime * 0.075 + fi * 0.37) * (aspect + 0.8) - 0.4;
    float pulse = exp(-pow((px - pulseX) * 6.0, 2.0)) * carrier;
    c = mix(c, vec3(0.66, 0.92, 0.25), pulse);

    float energy = 0.28 + pinch * 0.55 + pulse * 0.9 + g * 1.1;
    col += c * (core * 0.6 + glow * 0.16) * energy;
  }

  // Quiet behind the headline (left), loudest where it meets the bot.
  col *= mix(0.32, 1.0, smoothstep(0.18, 0.62, uv.x));
  // Soft vignette so the field dissolves into the page.
  col *= smoothstep(1.2, 0.25, length((uv - vec2(0.6, 0.5)) * vec2(0.95, 1.35)));

  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

/** CPU twin of the shader at t=0 for the static/SSR version. */
function staticPaths(): { d: string; color: string; opacity: number }[] {
  const W = 1600, H = 900, aspect = W / H, steps = 64;
  const out: { d: string; color: string; opacity: number }[] = [];
  for (let i = 0; i < LINES; i++) {
    const fi = i / (LINES - 1);
    let d = "";
    for (let s = 0; s <= steps; s++) {
      const ux = s / steps;
      const px = ux * aspect;
      let y = 0.06 + fi * 0.88 + Math.sin(px * 2.1 + fi * 6) * 0.024 + Math.sin(px * 4.7 + fi * 11) * 0.011;
      const pinch = Math.exp(-(((px - SINK.x * aspect) / 0.42) ** 2)) * 0.78;
      const sy = 1 - SINK.y;
      y = y + (sy + (y - sy) * 0.18 - y) * pinch;
      d += `${s ? "L" : "M"}${(ux * W).toFixed(1)} ${((1 - y) * H).toFixed(1)}`;
    }
    const mix = (a: number, b: number) => Math.round(a + (b - a) * fi);
    out.push({ d, color: `rgb(${mix(18, 158)} ${mix(219, 117)} ${mix(242, 255)})`, opacity: 0.18 + 0.22 * fi });
  }
  return out;
}

export function SignalField({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const live = isDesktop && !reduce;
  const paths = useMemo(staticPaths, []);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!live) return;
    const el = canvas.current!, host = wrap.current!;
    const gl = el.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return; // static SVG stays

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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uMouse = U("uMouse"), uHover = U("uHover"), uSink = U("uSink");
    gl.uniform2f(uSink, SINK.x, 1 - SINK.y);

    // Render below CSS resolution: soft lines don't need full density.
    const SCALE = 0.6;
    const resize = () => {
      const r = host.getBoundingClientRect();
      el.width = Math.max(1, Math.round(r.width * SCALE));
      el.height = Math.max(1, Math.round(r.height * SCALE));
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform2f(uRes, el.width, el.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Pointer tracked on window so the field reacts even over the headline.
    const target = { x: 0.5, y: 0.5, on: 0 }, cur = { x: 0.5, y: 0.5, on: 0 };
    let rect = host.getBoundingClientRect();
    const onScrollResize = () => { rect = host.getBoundingClientRect(); };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
      target.on = target.y >= 0 && target.y <= 1 ? 1 : 0;
    };
    const onLeave = () => { target.on = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    let raf = 0, visible = true, start = performance.now();
    const frame = (now: number) => {
      raf = 0;
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      cur.on += (target.on - cur.on) * 0.06;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, cur.x, cur.y);
      gl.uniform1f(uHover, cur.on);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(host);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);

    raf = requestAnimationFrame((t) => { start = t; setReady(true); frame(t); });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [live]);

  return (
    <div ref={wrap} aria-hidden className={`pointer-events-none ${className ?? ""}`}>
      {/* Static field: the SSR / mobile / reduced-motion version, and the
          placeholder the live canvas cross-fades over. */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        // Phones stack the copy over the field, so it sits quieter there.
        className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-60 lg:opacity-100"}`}
        style={{
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 62% 50%, #000 35%, transparent 80%)",
          maskImage: "radial-gradient(ellipse 75% 70% at 62% 50%, #000 35%, transparent 80%)",
        }}
      >
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color} strokeOpacity={p.opacity} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {live && (
        <canvas
          ref={canvas}
          className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
