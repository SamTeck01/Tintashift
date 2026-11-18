"use client";
import { useEffect, useRef, useState } from "react";
import { presets, surface } from "@/lib/shades";

/* Preview of the Blender hero (tools/blender/scene.py). Each clip holds the render on top and its ID map below
   (R keeps its own colour, G nail), so one video recolours live: the table takes the picked surface colour with
   the rendered shadows multiplied on, the green key nails take the picked colour. ida = opening -> close-up,
   vuelta = back. Phones get their own 9:16 clips. */
const VS = `attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;varying vec2 v;uniform sampler2D t;uniform vec3 tint,nail;uniform vec2 res,img;
void main(){
  float s=max(res.x/img.x,res.y/img.y);vec2 u=(v*res-(res-img*s)*.5)/(img*s);
  u=clamp(u,0.,1.);
  vec3 b=texture2D(t,vec2(u.x,u.y*.5)).rgb, m=texture2D(t,vec2(u.x,.5+u.y*.5)).rgb;
  float lum=dot(b,vec3(.3,.59,.11));
  vec3 table=tint*min(1.1,lum/.9);
  float hl=smoothstep(.6,1.,min(b.r,b.b));
  vec3 painted=mix(nail*(.26+.8*b.g),vec3(1.),hl*.6);
  vec3 keep=vec3(b.r,min(b.g,max(b.r,b.b)),b.b);
  vec3 c=mix(table,mix(keep,painted,smoothstep(.2,.6,m.g)),smoothstep(.2,.6,max(m.r,m.g)));
  gl_FragColor=vec4(c,1.);}`;

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export default function Scene3D() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [hex, setHex] = useState(presets[5].hex);
  const [close, setClose] = useState(false);
  const [phone, setPhone] = useState(false);
  const vids = useRef<{ ida?: HTMLVideoElement; vuelta?: HTMLVideoElement; cur?: HTMLVideoElement }>({});
  const col = useRef({ hex });
  col.current.hex = hex;

  useEffect(() => {
    const p = window.innerWidth / window.innerHeight < 0.8 || window.innerWidth <= 760;
    setPhone(p);
    const mk = (n: string) => {
      const v = document.createElement("video");
      v.src = `/hero3d/${p ? "m-" : ""}${n}.mp4`; v.muted = true; v.playsInline = true; v.preload = "auto"; v.crossOrigin = "anonymous";
      return v;
    };
    const ida = mk("ida"), vuelta = mk("vuelta");
    vids.current = { ida, vuelta, cur: ida };
    const c = cv.current!; const gl = c.getContext("webgl")!;
    const sh = (ty: number, s: string) => { const o = gl.createShader(ty)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram()!; gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const U = (n: string) => gl.getUniformLocation(pr, n);
    let raf = 0, ready = false;
    ida.addEventListener("loadeddata", () => { ready = true; });
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const v = vids.current.cur!;
      if (!ready || v.readyState < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth * dpr, h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
      gl.uniform2f(U("res"), w, h); gl.uniform2f(U("img"), v.videoWidth, v.videoHeight / 2);
      gl.uniform3fv(U("tint"), rgb(surface(col.current.hex))); gl.uniform3fv(U("nail"), rgb(col.current.hex));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = (toClose: boolean) => {
    const { ida, vuelta } = vids.current; if (!ida || !vuelta) return;
    const v = toClose ? ida : vuelta;
    v.currentTime = 0;
    v.play().then(() => { vids.current.cur = v; }).catch(() => { vids.current.cur = v; });
    setClose(toClose);
  };

  return (
    <section className="s3d">
      <canvas ref={cv} className="s3d-cv" onClick={() => !close && go(true)} />
      <div className="s3d-ui">
        {close && <button className="pill" onClick={() => go(false)}>← Back</button>}
        <div className="s3d-drops">
          {presets.map((p) => (
            <button key={p.hex} aria-label={p.name} title={p.name} onClick={() => setHex(p.hex)}
              style={{ background: p.hex, outline: p.hex === hex ? "2px solid #111" : "none" }} />
          ))}
        </div>
        {!close && <button className="pill dark" onClick={() => go(true)}>Try it on</button>}
        <small>Blender preview{phone ? " · phone" : ""} — not the live hero</small>
      </div>
    </section>
  );
}
