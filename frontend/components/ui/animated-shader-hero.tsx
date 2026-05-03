"use client";

/**
 * Animated WebGL fragment-shader background.
 *
 * Adapted from the "animated-shader-hero" pattern (shader by Matthias Hurrle,
 * @atzedent). We keep the cloud/star structure but recolor to SkillStreak's
 * indigo / violet / fuchsia palette so it blends with the rest of the app
 * instead of the source's amber/orange.
 *
 * Renders a full-bleed canvas; place it behind your content with absolute
 * positioning. Pointer-events stay on the canvas (the shader uses cursor
 * position as input), but you can disable that with `interactive={false}`.
 */

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  /** When false, mouse interaction with the canvas is disabled. */
  interactive?: boolean;
};

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

// Recolored shader: indigo/violet/fuchsia palette on a near-black bg.
// Modified lines vs. source:
//   - `col=mix(col,vec3(bg*.10,bg*.06,bg*.30),d);`  (was warm amber)
//   - `col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.)*vec3(.6,.5,1.3);` (violet bias)
const FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 touch;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p){
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p){
  float d=1., t=.0;
  for(float i=.0; i<3.; i++){
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}
void main(void){
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.; i<12.; i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.)*vec3(.6,.5,1.3);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.10,bg*.06,bg*.30),d);
  }
  O=vec4(col,1);
}`;

const VERTICES = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);

export function AnimatedShaderBackground({ className = "", interactive = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      // Browser doesn't support WebGL2 — leave the canvas blank so the page bg shows.
      // eslint-disable-next-line no-console
      console.warn("[AnimatedShaderBackground] WebGL2 unavailable; skipping shader render.");
      return;
    }

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    function compile(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.error("[shader] compile error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error("[shader] link error:", gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "resolution");
    const uTime = gl.getUniformLocation(program, "time");
    const uTouch = gl.getUniformLocation(program, "touch");

    const touch = [0, 0];

    function resize() {
      if (!canvas || !gl) return;
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function onMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      touch[0] = (e.clientX - rect.left) * dpr;
      touch[1] = (rect.bottom - e.clientY) * dpr;
    }

    if (interactive) {
      canvas.addEventListener("pointermove", onMove);
    }
    window.addEventListener("resize", resize);
    resize();

    let raf = 0;
    function loop(now: number) {
      if (!gl || !canvas) return;
      resize();
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.uniform2f(uTouch, touch[0], touch[1]);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (interactive) canvas.removeEventListener("pointermove", onMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full ${interactive ? "" : "pointer-events-none"} ${className}`}
      style={{ background: "transparent", touchAction: "none" }}
      aria-hidden
    />
  );
}
