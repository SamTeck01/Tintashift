"use client";
import { useEffect, useRef } from "react";
import layers from "@/lib/hero-layers.json";

/* The hero picture is not 3D. It is studio photographs blended in one small shader, the way the reference
   site does it: a device layer and one hand layer per nail set, each with a map that says what keeps its own
   colour, where the shadows are and where the French tips are. The surface takes the picked colour, shadows
   multiply onto it, and the tips are repainted in the picked colour. See tools/build_hero.py. */

const IMG_W = layers.w, IMG_H = layers.h;
type SetId = keyof typeof layers.sets;

const VS = `attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;varying vec2 v;
uniform sampler2D dP,dM,aP,aM,bP,bM;
uniform vec2 res,img;uniform vec3 view,tint,tip;uniform vec4 ha,hb;   // view: x0,y0,scale   ha/hb: dx,dy,opacity,ready
vec4 at(sampler2D t,vec2 u){return texture2D(t,clamp(u,0.,1.));}
float inside(vec2 u){vec2 s=step(vec2(0.),u)*step(u,vec2(1.));return s.x*s.y;}
vec3 paint(vec3 p){                       // green key colour -> picked colour, keeping gloss and shading
  float hl=smoothstep(.6,1.,min(p.r,p.b));
  return mix(tip*(.26+.8*p.g),vec3(1.),hl*.6);
}
vec3 despill(vec3 p){return vec3(p.r,min(p.g,max(p.r,p.b)),p.b);}   // no green fringe left at the tip edges
// A hand layer over the surface. Edge pixels of the photo are part hand, part white backdrop: take the white
// back out so the edge blends with the coloured surface instead of leaving a pale rim.
vec3 hand(vec3 col,vec3 p,vec3 m){
  float k=mix(m.r,1.,.6);                 // the stored edge is pulled in, so correct gently or it goes dark
  vec3 fg=clamp((p-(1.-k)*.95)/k,0.,1.);
  return mix(col,mix(despill(fg),paint(fg),smoothstep(.06,.45,m.g)),m.r);
}
void main(){
  vec2 px=v*res;
  vec2 u=(px-view.xy)/(view.z*img);
  vec2 ua=u-ha.xy/img, ub=u-hb.xy/img;
  float ia=inside(ua)*ha.z*ha.w, ib=inside(ub)*hb.z*hb.w, id=inside(u);
  vec3 dm=mix(vec3(0.,0.,1.),at(dM,u).rgb,id);
  vec3 am=mix(vec3(0.,0.,1.),at(aM,ua).rgb,ia);
  vec3 bm=mix(vec3(0.,0.,1.),at(bM,ub).rgb,ib);
  // the surface: picked colour, a little light falling off, every shadow multiplied on
  float fall=1.-.2*smoothstep(.15,1.15,length((v-vec2(.62,.3))*vec2(1.15,1.)));
  vec3 col=tint*fall*dm.b*am.b*bm.b;
  // crystal device: half its own brightness, half the surface seen through it, plus its sparkle
  col=mix(col,at(dP,u).rgb,dm.r);
  col+=dm.g*.55*(1.-col);
  col=hand(col,at(aP,ua).rgb,am);
  col=hand(col,at(bP,ub).rgb,bm);
  gl_FragColor=vec4(col,1.);
}`;

const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

export default function HeroScene({ tint, tip, set }: { tint: string; tip: string; set: SetId }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ colour: (tint: string, tip: string) => void; set: (s: SetId) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const sh = (t: number, src: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(pr, n);
    ["dP", "dM", "aP", "aM", "bP", "bM"].forEach((n, i) => gl.uniform1i(U(n), i));
    gl.uniform2f(U("img"), IMG_W, IMG_H);

    let dead = false, queued = false;
    const tex: Record<string, WebGLTexture> = {}, pending: Record<string, Promise<void>> = {};
    const load = (name: string) => pending[name] ??= Promise.all([name, name + "-m"].map((f) => new Promise<void>((ok) => {
      const im = new Image(); im.decoding = "async"; im.src = `/hero/${f}.webp`;
      im.onload = () => {
        if (dead) return ok();
        const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
        tex[f] = t; ok();
      };
      im.onerror = () => ok();
    }))).then(() => {});

    // state
    const cur = { tint: rgb(tint), tip: rgb(tip) }, goal = { tint: rgb(tint), tip: rgb(tip) };
    let A: SetId = set, B: SetId | null = null, swap = 1, swapFrom = 0;   // swap 0..1: A leaves, B arrives
    let view = [0, 0, 1], W = 1, H = 1;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const measure = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
      if (W / H < 0.8 || W <= 760) {           // phones and upright tablets: the left 60% of the photo across the screen, under the nav
        const f = W / (IMG_W * 0.6); view = [-0.085 * IMG_W * f, 58, f];
      } else {
        // Wide screens: fill the width. Squarer screens: a little larger than that, with plain surface below
        // the picture (its lower edge fades out). The top edge always meets the top of the screen, because
        // the arm is cut there.
        const byW = W / IMG_W, f = Math.max(byW, Math.min(H / IMG_H, byW * 1.12));
        const panelLeft = W - 28 - Math.min(400, W * 0.34);
        let x0 = (W - IMG_W * f) * 0.3 - W * 0.035;
        x0 = Math.min(x0, panelLeft - 16 - 925 * f);      // the Shifter's clip (x≈925 in the photo) stays clear of the panel
        x0 = Math.max(x0, 8 - 205 * f);                   // but the Shifter's left end (x≈205) stays on screen
        view = [Math.min(0, x0), Math.min(0, (H - IMG_H * f) * 0.5), f];
      }
      ask();
    };
    const bind = (unit: number, name?: string) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, (name && tex[name]) || null); };
    const draw = (now: number) => {
      queued = false; if (dead) return;
      let moving = false;
      for (const k of ["tint", "tip"] as const) for (let i = 0; i < 3; i++) {
        const d = goal[k][i] - cur[k][i]; if (Math.abs(d) > 0.002) { cur[k][i] += d * 0.14; moving = true; } else cur[k][i] = goal[k][i];
      }
      if (B) { swap = Math.min(1, (now - swapFrom) / 820); moving = true; if (swap >= 1) { A = B; B = null; swap = 1; } }
      const out = B ? ease(Math.min(1, swap * 1.6)) : 0, inn = B ? ease(Math.max(0, swap * 1.6 - 0.6)) : 0;
      const ready = (s: SetId) => (tex[s] && tex[s + "-m"] ? 1 : 0);
      gl.uniform2f(U("res"), W, H); gl.uniform3f(U("view"), view[0], view[1], view[2]);
      gl.uniform3f(U("tint"), cur.tint[0], cur.tint[1], cur.tint[2]); gl.uniform3f(U("tip"), cur.tip[0], cur.tip[1], cur.tip[2]);
      // the hand leaves towards the top-left corner it came from, and the next one arrives from there
      gl.uniform4f(U("ha"), -150 * out, layers.sets[A].dy - 110 * out, 1 - out, ready(A));
      gl.uniform4f(U("hb"), B ? -150 * (1 - inn) : 0, B ? layers.sets[B].dy - 110 * (1 - inn) : 0, B ? inn : 0, B ? ready(B) : 0);
      bind(0, "device"); bind(1, "device-m"); bind(2, A); bind(3, A + "-m"); bind(4, B ?? undefined); bind(5, B ? B + "-m" : undefined);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (moving) ask();
    };
    function ask() { if (!queued && !dead) { queued = true; requestAnimationFrame(draw); } }

    api.current = {
      colour: (t, p) => { goal.tint = rgb(t); goal.tip = rgb(p); ask(); },
      set: (s) => { if (s === (B ?? A)) return; load(s).then(() => { if (dead) return; if (B) A = B; B = s; swapFrom = performance.now(); ask(); }); },
    };
    measure(); addEventListener("resize", measure);
    load("device").then(ask); load(A).then(ask);
    // the other sets load once the first picture is up, so switching is instant
    const idle = setTimeout(() => (Object.keys(layers.sets) as SetId[]).forEach((s) => load(s)), 1500);
    return () => { dead = true; clearTimeout(idle); removeEventListener("resize", measure); api.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { api.current?.colour(tint, tip); }, [tint, tip]);
  useEffect(() => { api.current?.set(set); }, [set]);

  return <canvas ref={canvas} className="scene-canvas" aria-hidden />;
}
