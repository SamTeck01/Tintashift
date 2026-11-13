"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox, useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   Shared colour state: the French-tip colour every TINTATip shows.
   One uniform object is shared by all nail materials, so the whole
   set shifts together.
   ============================================================ */
const tipUniform = { value: new THREE.Color("#2f56c9") };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

/* ---------- TINTATip geometry: almond shell, tip along +y, normal +z ---------- */
function makeNailGeometry() {
  const g = new THREE.SphereGeometry(1, 96, 64);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = (y + 1) / 2;
    x *= 0.36 * (1 - Math.pow(t, 2.6) * 0.62);
    y *= 0.5;
    z *= 0.06;
    z -= x * x * 0.9;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/* Nail material whose French tip takes the shared shift colour. */
function makeNailMaterial(base: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, ...opts });
  m.onBeforeCompile = (s) => {
    s.uniforms.uTip = tipUniform;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNail;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNail = position;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNail;\nuniform vec3 uTip;")
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `float smile = 0.1 + vNail.x * vNail.x * 2.2;
         float tipMask = smoothstep(smile - 0.012, smile + 0.012, vNail.y);
         vec4 diffuseColor = vec4( mix(diffuse, uTip, tipMask), opacity );`,
      );
  };
  return m;
}

/* ---------- Signature decorations (in nail-local space) ---------- */
const pearlMat = new THREE.MeshPhysicalMaterial({ color: "#fbf6f2", roughness: 0.15, clearcoat: 1, iridescence: 0.6, sheen: 1 });
const bowMat = new THREE.MeshPhysicalMaterial({ color: "#f1cfdd", roughness: 0.25, clearcoat: 1, sheen: 1, sheenColor: new THREE.Color("#fff") });
const chromeMat = new THREE.MeshPhysicalMaterial({ color: "#e8e8ee", metalness: 1, roughness: 0.12 });
const crystalGemMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: 1, thickness: 0.2, ior: 2.2, roughness: 0, iridescence: 1, flatShading: true });
const redGemMat = new THREE.MeshPhysicalMaterial({ color: "#b4231c", transmission: 0.6, thickness: 0.3, ior: 1.8, roughness: 0.05, flatShading: true });

const starGeo = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 0.035 : 0.11, a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const fn = i ? "lineTo" : "moveTo";
    s[fn](Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2 });
})();

function Bow() {
  return (
    <group position={[0, -0.22, 0.075]}>
      <mesh material={bowMat} position={[-0.11, 0, 0]} rotation={[0, 0, 0.35]} scale={[0.12, 0.08, 0.05]}><sphereGeometry args={[1, 24, 16]} /></mesh>
      <mesh material={bowMat} position={[0.11, 0, 0]} rotation={[0, 0, -0.35]} scale={[0.12, 0.08, 0.05]}><sphereGeometry args={[1, 24, 16]} /></mesh>
      <mesh material={crystalGemMat} position={[0, 0, 0.04]} scale={0.045}><octahedronGeometry /></mesh>
      <mesh material={pearlMat} position={[0.06, -0.2, 0.0]} scale={0.03}><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh material={pearlMat} position={[-0.08, -0.12, 0.0]} scale={0.022}><sphereGeometry args={[1, 16, 12]} /></mesh>
    </group>
  );
}

function Stars({ gem }: { gem: boolean }) {
  return (
    <group position={[0, -0.12, 0.07]}>
      <mesh geometry={starGeo} material={chromeMat} scale={gem ? 1.5 : 0.9} />
      <mesh geometry={starGeo} material={chromeMat} position={[0.1, -0.16, 0]} scale={0.5} />
      {gem && <mesh material={redGemMat} position={[0, 0, 0.04]} scale={[0.05, 0.08, 0.03]}><boxGeometry /></mesh>}
      {gem && <mesh material={crystalGemMat} position={[-0.11, -0.1, 0]} scale={0.03}><octahedronGeometry /></mesh>}
    </group>
  );
}

/* ---------- The ten floating Signature tips (SI001 + SI002) ---------- */
const nailGeo = makeNailGeometry();
const si001 = makeNailMaterial("#bfaee4");
const si002 = makeNailMaterial("#a3949e", { metalness: 0.45, roughness: 0.22, iridescence: 0.7, iridescenceIOR: 1.6 });

const FLOAT = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return {
    series: i % 2 ? 2 : 1,
    deco: i % 3 === 0,
    p: [Math.cos(a) * 2.55, Math.sin(a) * 1.15 + 0.15, Math.sin(a * 2) * 0.6 - 0.4] as const,
    r: [0.3 + Math.sin(i) * 0.3, Math.cos(i * 1.7) * 0.5, a + Math.PI / 2 + Math.sin(i) * 0.4] as const,
    s: 0.85 + (i % 4) * 0.08,
  };
});

function FloatingTips({ progress }: { progress: React.RefObject<number> }) {
  const g = useRef<THREE.Group>(null!);
  const items = useRef<THREE.Group[]>([]);
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const out = smooth(seg(p, 0.18, 0.42));      // tips scatter away as the hand arrives
    const back = smooth(seg(p, 0.78, 1));        // and return for the final line-up
    const t = clock.elapsedTime;
    g.current.rotation.z = t * 0.04;
    items.current.forEach((m, i) => {
      if (!m) return;
      const f = FLOAT[i];
      const k = out * (1 - back);
      const spread = 1 + k * 1.6;
      m.position.set(f.p[0] * spread, f.p[1] * spread + Math.sin(t * 0.9 + i) * 0.06, f.p[2] + k * 2.5);
      m.rotation.set(f.r[0] + Math.sin(t * 0.5 + i) * 0.12, f.r[1] + t * 0.2, f.r[2]);
      m.scale.setScalar(f.s * (1 - k * 0.6));
      m.visible = k < 0.98;
    });
  });
  return (
    <group ref={g}>
      {FLOAT.map((f, i) => (
        <group key={i} ref={(el) => { if (el) items.current[i] = el; }}>
          <mesh geometry={nailGeo} material={f.series === 1 ? si001 : si002} castShadow />
          {f.deco && (f.series === 1 ? <Bow /> : <Stars gem />)}
          {!f.deco && f.series === 2 && <Stars gem={false} />}
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   TINTAShifter — clear faceted crystal block, label + stone inside,
   chrome connector, clear cable, crystal fingertip clip.
   Local frame: body along x (−1.5 … 1.5), connector at +x.
   ============================================================ */
const crystal = new THREE.MeshPhysicalMaterial({
  color: "#ffffff", transmission: 1, thickness: 0.9, ior: 1.52, roughness: 0.02,
  clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1, attenuationColor: new THREE.Color("#eef3ff"), attenuationDistance: 3, flatShading: true,
});

function crystalBodyGeometry(len: number, h: number, d: number, ch: number, endBevel: number) {
  // octagonal cross-section (chamfered long edges), extruded along x with faceted ends
  const s = new THREE.Shape();
  const y = h / 2, z = d / 2;
  s.moveTo(-z + ch, -y); s.lineTo(z - ch, -y); s.lineTo(z, -y + ch); s.lineTo(z, y - ch);
  s.lineTo(z - ch, y); s.lineTo(-z + ch, y); s.lineTo(-z, y - ch); s.lineTo(-z, -y + ch); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len - endBevel * 2, bevelEnabled: true, bevelThickness: endBevel, bevelSize: ch * 0.6, bevelSegments: 1 });
  g.center();
  g.rotateY(Math.PI / 2);
  return g;
}

function labelTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = "#f7f7f5"; x.fillRect(0, 0, 1024, 256);
  x.fillStyle = "#111";
  x.font = "600 120px Helvetica, Arial, sans-serif";
  x.textBaseline = "middle";
  const a = "TINTA"; x.fillText(a, 150, 132);
  const w = x.measureText(a).width;
  x.font = "300 120px Helvetica, Arial, sans-serif";
  x.fillText("Shift", 150 + w + 6, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const CLIP = new THREE.Vector3(2.75, 0.95, 0.35);   // clip centre, Shifter-local

function Shifter({ glowRef }: { glowRef: React.RefObject<number> }) {
  const body = useMemo(() => crystalBodyGeometry(3.0, 0.62, 0.62, 0.11, 0.12), []);
  const label = useMemo(() => labelTexture(), []);
  const cableMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null!);
  const cable = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.78, 0, 0), new THREE.Vector3(2.35, 0.05, 0.15), new THREE.Vector3(2.7, 0.35, 0.35),
      new THREE.Vector3(2.75, 0.62, 0.38), new THREE.Vector3(CLIP.x + 0.02, CLIP.y - 0.26, CLIP.z),
    ]);
    return new THREE.TubeGeometry(c, 80, 0.032, 16, false);
  }, []);
  const clipBody = useMemo(() => crystalBodyGeometry(0.5, 0.36, 0.36, 0.07, 0.05), []);
  const clipEnd = useMemo(() => crystalBodyGeometry(0.12, 0.5, 0.5, 0.1, 0.03), []);

  useFrame(() => {
    const g = glowRef.current ?? 0;
    cableMat.current.emissive.copy(tipUniform.value);
    cableMat.current.emissiveIntensity = 0.15 + g * 2.2;
    ringMat.current.emissive.copy(tipUniform.value);
    ringMat.current.emissiveIntensity = g * 3;
  });

  return (
    <group>
      {/* crystal body */}
      <mesh geometry={body} material={crystal} castShadow />
      {/* label panel inside */}
      <mesh position={[0.05, 0.02, 0.08]}>
        <planeGeometry args={[1.85, 0.4]} />
        <meshStandardMaterial map={label} roughness={0.6} />
      </mesh>
      {/* round brilliant stone */}
      <mesh position={[1.12, 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={crystalGemMat}>
        <cylinderGeometry args={[0.085, 0.0, 0.08, 12]} />
      </mesh>
      <mesh position={[1.12, 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.088, 0.012, 8, 32]} />
        <primitive object={chromeMat} attach="material" />
      </mesh>
      {/* chrome connector */}
      <mesh position={[1.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={chromeMat} castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.24, 32]} />
      </mesh>
      <mesh position={[1.76, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
        <cylinderGeometry args={[0.045, 0.06, 0.08, 24]} />
      </mesh>
      {/* cable */}
      <mesh geometry={cable} castShadow>
        <meshPhysicalMaterial ref={cableMat} color="#f4f6f8" transmission={0.55} thickness={0.1} roughness={0.25} clearcoat={1} toneMapped={false} />
      </mesh>
      {/* crystal fingertip clip */}
      <group position={CLIP.toArray()} rotation={[0, 0, 0]}>
        <mesh geometry={clipBody} material={crystal} castShadow />
        <mesh geometry={clipEnd} material={crystal} position={[-0.28, 0, 0]} />
        <mesh geometry={clipEnd} material={crystal} position={[0.28, 0, 0]} />
        <mesh position={[0, -0.24, 0]} material={chromeMat}><cylinderGeometry args={[0.05, 0.05, 0.08, 20]} /></mesh>
        <mesh position={[0, 0.0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.15, 0.012, 8, 40]} />
          <meshStandardMaterial ref={ringMat} color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   Rigged hand (WebXR generic hand, MIT). Index finger extended.
   Output frame: index fingertip at origin, finger pointing −x, nail side +y.
   ============================================================ */
useGLTF.preload("/models/hand-right.glb");
const handNailMat = makeNailMaterial("#c3b2e6");

function Hand() {
  const { scene } = useGLTF("/models/hand-right.glb");
  const h = useMemo(() => {
    const root = cloneSkinned(scene);
    const skin = new THREE.MeshPhysicalMaterial({ color: "#e2b199", roughness: 0.5, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffd8c4"), clearcoat: 0.1 });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = skin; m.castShadow = true; m.frustumCulled = false;
      m.geometry.deleteAttribute("normal");
      const g = mergeVertices(m.geometry, 1e-4); g.computeVertexNormals(); m.geometry = g;
    });
    const b = (n: string) => root.getObjectByName(n)!;
    const curl = (f: string, a: number) => ["proximal", "intermediate", "distal"].forEach((s, i) => { b(`${f}-finger-phalanx-${s}`).rotation.x -= a * [1, 1.15, 0.8][i]; });
    curl("middle", 1.35); curl("ring", 1.45); curl("pinky", 1.5); curl("index", 0.06);
    b("thumb-phalanx-proximal").rotation.x -= 0.5;
    b("thumb-phalanx-distal").rotation.x -= 0.6;
    root.updateMatrixWorld(true);
    const P = (n: string) => b(n).getWorldPosition(new THREE.Vector3());
    const tip = P("index-finger-tip"), dist = P("index-finger-phalanx-distal");
    const dir = tip.clone().sub(dist).normalize();
    const w = P("wrist"), im = P("index-finger-phalanx-proximal"), pm = P("pinky-finger-phalanx-proximal");
    const palm = new THREE.Vector3().subVectors(im, w).cross(new THREE.Vector3().subVectors(pm, w)).normalize();
    const up = palm.sub(dir.clone().multiplyScalar(palm.dot(dir))).normalize();
    const fwd = dir.clone().negate();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, up, new THREE.Vector3().crossVectors(fwd, up))).invert();
    const len = tip.distanceTo(dist);
    const centre = dist.clone().lerp(tip, 0.82).add(up.clone().multiplyScalar(len * 0.62));
    const nq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(dir, up), dir, up));
    return { root, q, tip, centre, nq, len, scale: 0.3 / (len * 1.5) };
  }, [scene]);
  return (
    <group rotation={[1.15, 0, 0.1]}>
      <group scale={h.scale} quaternion={h.q}>
        <group position={h.tip.clone().negate()}>
          <primitive object={h.root} />
          <mesh geometry={nailGeo} material={handNailMat} position={h.centre} quaternion={h.nq} scale={[h.len * 1.25, h.len * 1.4, h.len * 1.2]} castShadow />
        </group>
      </group>
    </group>
  );
}

/* ============================================================
   Scroll-driven stage
   p 0.00–0.25  Signature tips float around the Shifter
   p 0.25–0.70  camera pushes in; hand slides its fingertip into the clip; colour shifts
   p 0.70–1.00  pull back to the full product
   ============================================================ */
const CAM = [
  { pos: new THREE.Vector3(0, 0.4, 8.2), look: new THREE.Vector3(0.4, 0.1, 0) },
  { pos: new THREE.Vector3(2.4, 1.15, 3.6), look: new THREE.Vector3(2.05, 0.55, 0) },
  { pos: new THREE.Vector3(-0.6, 1.6, 8.6), look: new THREE.Vector3(0.6, 0.2, 0) },
];

function Stage({ hex, progress }: { hex: string; progress: React.RefObject<number> }) {
  const { camera, size } = useThree();
  const mobile = size.width / size.height < 0.9;
  const rig = useRef<THREE.Group>(null!);
  const hand = useRef<THREE.Group>(null!);
  const glow = useRef(0);
  const shiftAt = useRef(-10);
  const last = useRef(hex);
  const target = useMemo(() => new THREE.Color(hex), [hex]);
  const look = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => { tipUniform.value.set(hex); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    const p = progress.current ?? 0;
    if (last.current !== hex) { last.current = hex; shiftAt.current = t; }

    // colour shift: glow travels, then the French tips take the new colour
    const k = t - shiftAt.current;
    glow.current = k < 1.4 ? Math.sin((k / 1.4) * Math.PI) : 0;
    if (k > 0.35) tipUniform.value.lerp(target, 1 - Math.exp(-dt * 6));

    // camera path
    const a = smooth(seg(p, 0.12, 0.42)), b = smooth(seg(p, 0.7, 0.95));
    camPos.copy(CAM[0].pos).lerp(CAM[1].pos, a).lerp(CAM[2].pos, b);
    look.copy(CAM[0].look).lerp(CAM[1].look, a).lerp(CAM[2].look, b);
    if (mobile) { camPos.z += 3.5 * (1 - a * 0.7); camPos.y += 0.6; }
    camPos.x += pointer.x * 0.25; camPos.y += pointer.y * 0.12;
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 5));
    camera.lookAt(look);

    // hand: slides in from the right into the clip
    const hIn = smooth(seg(p, 0.28, 0.5)) * (1 - smooth(seg(p, 0.8, 0.98)));
    hand.current.position.set(CLIP.x + 0.12 + (1 - hIn) * 4, CLIP.y, CLIP.z);
    hand.current.visible = hIn > 0.01;

    rig.current.position.y = Math.sin(t * 0.6) * 0.03 - 0.3;
  });

  return (
    <group ref={rig} rotation={[0.12, -0.28, 0]}>
      <group position={[-0.6, 0, 0]}>
        <Shifter glowRef={glow} />
        <group ref={hand}><Hand /></group>
      </group>
      <FloatingTips progress={progress} />
    </group>
  );
}

export default function Scene({ hex, bg, progress }: { hex: string; bg: string; progress: React.RefObject<number> }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.4, 8.2], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 2, 3]} intensity={6} color="#ffffff" />
      <Suspense fallback={null}><Stage hex={hex} progress={progress} /></Suspense>
      <ContactShadows position={[0, -0.95, 0]} opacity={0.45} scale={14} blur={2.6} far={3} color="#000" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} position={[0, 5, 1]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 0.5, 6]} scale={[6, 1, 1]} />
        <Lightformer form="ring" color={bg} intensity={2} position={[0, 0, -6]} scale={8} />
      </Environment>
    </Canvas>
  );
}
