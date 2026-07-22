"use client";

/**
 * MeshText — a WebGL wordmark whose glyphs are a fine mesh that the cursor
 * drags through, springing back with a cyan/violet chromatic-split fringe.
 * Adapted from Originkit's "Mesh Text Hover" (Framer) into a plain React
 * component for our stack.
 *
 * Notes for our codebase:
 * - The font is read from the wrapper's *computed* font-family, so next/font's
 *   hashed Inter name is used (a literal "Inter" in canvas 2D silently falls
 *   back to system sans).
 * - The glyph size auto-fits the canvas width so the wordmark never overflows.
 * - Split fringe uses the Signal palette (cyan → violet), not the demo pink/green.
 * - prefers-reduced-motion → the mesh holds still (renders as crisp static text).
 * - A visually-hidden label carries the text for screen readers; the canvas is
 *   aria-hidden.
 */

import { useEffect, useRef } from "react";

const GRID_W = 96;
const GRID_H = 40;
const SPRING_K = 0.08;
const DAMPING = 0.9;
const DT = 0.1;
const CHROMA = 0.005;

// Signal palette split colours (0..1 rgb): cyan and violet.
const COLOR_A: [number, number, number] = [0x22 / 255, 0xd3 / 255, 0xee / 255];
const COLOR_B: [number, number, number] = [0xa8 / 255, 0x55 / 255, 0xf7 / 255];

const VERT_SRC = `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec2 aDisp;
out vec2 vUv;
out float vMag;
void main() {
    gl_Position = vec4(aPos + aDisp, 0.0, 1.0);
    vUv = aUv;
    vMag = length(aDisp);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
in float vMag;
out vec4 outColor;
uniform sampler2D uTex;
uniform float uChroma;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
    vec4 base = texture(uTex, vUv);
    if (uChroma > 0.0) {
        float o = uChroma * ${CHROMA.toFixed(5)} * clamp(vMag * 8.0, 0.0, 1.0);
        float aOff = texture(uTex, vUv + vec2(o, 0.0)).a;
        float bOff = texture(uTex, vUv - vec2(o, 0.0)).a;
        vec3 col = base.rgb * base.a;
        col += uColorA * max(0.0, aOff - base.a);
        col += uColorB * max(0.0, bOff - base.a);
        float aMax = max(base.a, max(aOff, bOff));
        outColor = vec4(col, aMax);
    } else {
        outColor = base;
    }
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("MeshText shader error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("MeshText link error:", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

export function MeshText({
  text,
  className = "",
  color = "#ffffff",
  weight = 900,
  force = 2.0,
}: {
  text: string;
  className?: string;
  color?: string;
  weight?: number;
  force?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dragForce = prefersReduced ? 0 : force;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      // Keep the last drawn frame so the static wordmark stays visible even
      // when the rAF loop is throttled/paused (e.g. a backgrounded tab).
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      // No WebGL2 — leave the sr-only text; nothing visible but never a crash.
      return;
    }

    // ── Grid geometry ─────────────────────────────────────────────
    const vertCount = (GRID_W + 1) * (GRID_H + 1);
    const positions = new Float32Array(vertCount * 2);
    const uvs = new Float32Array(vertCount * 2);
    for (let y = 0; y <= GRID_H; y++) {
      for (let x = 0; x <= GRID_W; x++) {
        const i = y * (GRID_W + 1) + x;
        const u = x / GRID_W;
        const v = y / GRID_H;
        positions[i * 2] = u * 2 - 1;
        positions[i * 2 + 1] = 1 - v * 2;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
    }
    const indexCount = GRID_W * GRID_H * 6;
    const indices = new Uint32Array(indexCount);
    let idx = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const a = y * (GRID_W + 1) + x;
        const b = a + 1;
        const c = a + (GRID_W + 1);
        const d = c + 1;
        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;
        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }

    const disp = new Float32Array(vertCount * 2);
    const vel = new Float32Array(vertCount * 2);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const program = linkProgram(gl, vs, fs);
    if (!program) return;

    const aPos = gl.getAttribLocation(program, "aPos");
    const aUv = gl.getAttribLocation(program, "aUv");
    const aDisp = gl.getAttribLocation(program, "aDisp");
    const uTex = gl.getUniformLocation(program, "uTex");
    const uChroma = gl.getUniformLocation(program, "uChroma");
    const uColorA = gl.getUniformLocation(program, "uColorA");
    const uColorB = gl.getUniformLocation(program, "uColorB");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    const dispBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
    gl.bufferData(gl.ARRAY_BUFFER, disp, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aDisp);
    gl.vertexAttribPointer(aDisp, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let cancelled = false;

    // The GL draw — clear + composite the (possibly displaced) mesh. Split out
    // of the rAF loop so a static frame can be drawn immediately after the
    // texture is built, independent of requestAnimationFrame (which the browser
    // pauses while the tab is backgrounded — otherwise the wordmark is blank).
    const renderGL = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTex, 0);
      gl.uniform1f(uChroma, prefersReduced ? 0.0 : 1.0);
      gl.uniform3f(uColorA, COLOR_A[0], COLOR_A[1], COLOR_A[2]);
      gl.uniform3f(uColorB, COLOR_B[0], COLOR_B[1], COLOR_B[2]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
    };

    // Draw the wordmark to a 2D canvas, auto-fit to width, upload as texture.
    // Synchronous so the mesh is NEVER blank while a webfont is still loading.
    const drawNow = () => {
      const w = Math.max(2, canvas.width);
      const h = Math.max(2, canvas.height);
      // The real (hashed) Inter family, resolved from computed styles.
      const family =
        getComputedStyle(wrapper).fontFamily || "system-ui, sans-serif";

      const c2 = document.createElement("canvas");
      c2.width = w;
      c2.height = h;
      const ctx = c2.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      try {
        (ctx as any).letterSpacing = "-0.02em";
      } catch {
        /* older browsers */
      }
      // Fit by width first (the wordmark is wide), then clamp by height. Leave
      // margin so cursor-drag displacement doesn't clip against the edges.
      let size = h * 0.62;
      ctx.font = `${weight} ${size}px ${family}`;
      const measured = ctx.measureText(text).width;
      const maxW = w * 0.94;
      if (measured > 0) size = size * (maxW / measured);
      size = Math.min(size, h * 0.86);
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillText(text, w / 2, h / 2 + size * 0.02);

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
      // Paint a static frame right away — never wait for the rAF loop.
      renderGL();
    };

    const rebuildTex = () => {
      drawNow(); // immediate — draws with whatever font is available now
      // Then, once the real webfont has loaded, redraw crisply in Inter.
      (async () => {
        try {
          const family = getComputedStyle(wrapper).fontFamily || "sans-serif";
          await (document as any).fonts?.load?.(
            `${weight} 64px ${family}`
          );
          await (document as any).fonts?.ready;
        } catch {
          /* ignore */
        }
        if (!cancelled) drawNow();
      })();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(2, Math.round(rect.width * dpr));
      const h = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      rebuildTex();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    // ── Cursor tracking ───────────────────────────────────────────
    const cursor = { x: 99, y: 99, px: 99, py: 99, vx: 0, vy: 0, inside: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const x = nx * 2 - 1;
      const y = 1 - ny * 2;
      if (!cursor.inside) {
        cursor.px = x;
        cursor.py = y;
        cursor.inside = true;
      }
      cursor.x = x;
      cursor.y = y;
    };
    const onLeave = () => {
      cursor.inside = false;
      cursor.x = 99;
      cursor.y = 99;
      cursor.vx = 0;
      cursor.vy = 0;
    };
    wrapper.addEventListener("pointermove", onMove);
    wrapper.addEventListener("pointerleave", onLeave);

    let rafId = 0;
    const tick = () => {
      cursor.vx = cursor.x - cursor.px;
      cursor.vy = cursor.y - cursor.py;
      if (Math.hypot(cursor.vx, cursor.vy) > 0.3) {
        cursor.vx = 0;
        cursor.vy = 0;
      }
      cursor.px = cursor.x;
      cursor.py = cursor.y;

      for (let i = 0; i < vertCount; i++) {
        const i2 = i * 2;
        const px = positions[i2];
        const py = positions[i2 + 1];
        const dx = disp[i2];
        const dy = disp[i2 + 1];
        const cd = Math.hypot(cursor.x - (px + dx), cursor.y - (py + dy));
        const proximity = Math.max(0, 1 / (1 + cd / 0.05) - 0.1);

        let vx = vel[i2] + cursor.vx * dragForce * proximity;
        let vy = vel[i2 + 1] + cursor.vy * dragForce * proximity;
        vx -= dx * SPRING_K;
        vy -= dy * SPRING_K;
        vx *= DAMPING;
        vy *= DAMPING;
        vel[i2] = vx;
        vel[i2 + 1] = vy;

        let ndx = dx + vx * DT;
        let ndy = dy + vy * DT;
        ndx = ndx > 1 ? 1 : ndx < -1 ? -1 : ndx;
        ndy = ndy > 1 ? 1 : ndy < -1 ? -1 : ndy;
        disp[i2] = ndx;
        disp[i2 + 1] = ndy;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, disp);
      renderGL();

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(dispBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteTexture(tex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [text, color, weight, force]);

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full select-none overflow-hidden font-sans ${className}`}
      style={{ touchAction: "pan-y" }}
    >
      <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
