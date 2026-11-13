"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
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

/* ---------- Signature TINTATips (AI-reconstructed from product photos) ----------
   Mesh frame: length along y (−0.5 tip … +0.5 cuticle), front +z.
   Vertex colour r marks raised decorations (bow / stars / stones). */
function makeTipMaterial(base: string, deco: string, decoMetal: number, opts: THREE.MeshPhysicalMaterialParameters = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, ...opts });
  const decoCol = { value: new THREE.Color(deco) }, metal = { value: decoMetal };
  m.onBeforeCompile = (s) => {
    s.uniforms.uTip = tipUniform; s.uniforms.uDeco = decoCol; s.uniforms.uDecoMetal = metal;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 color;\nvarying vec3 vNail;\nvarying float vDeco;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNail = position; vDeco = color.r;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNail;\nvarying float vDeco;\nuniform vec3 uTip;\nuniform vec3 uDeco;\nuniform float uDecoMetal;")
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );",
        `float smile = -0.16 - vNail.x * vNail.x * 1.6;
         float tipMask = 1.0 - smoothstep(smile - 0.012, smile + 0.012, vNail.y);
         float deco = smoothstep(0.35, 0.65, vDeco);
         vec4 diffuseColor = vec4( mix(mix(diffuse, uTip, tipMask), uDeco, deco), opacity );`)
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, uDecoMetal, deco);")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.16, deco);");
  };
  return m;
}
const si001 = makeTipMaterial("#b9a6e2", "#f3d3e0", 0.0);
const si002 = makeTipMaterial("#a8959f", "#eceaf0", 1.0, { metalness: 0.35, roughness: 0.25, iridescence: 0.8, iridescenceIOR: 1.7 });
const chromeMat = new THREE.MeshPhysicalMaterial({ color: "#e8e8ee", metalness: 1, roughness: 0.12 });
const crystalGemMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.2, roughness: 0.02, iridescence: 1, flatShading: true });
useGLTF.preload("/models/si001.glb", false, true);
useGLTF.preload("/models/si002.glb", false, true);
useGLTF.preload("/models/hand.glb", false, true);

const FLOAT = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.3;
  return {
    series: i % 2 ? 2 : 1,
    p: [Math.cos(a) * 3.0, Math.sin(a) * 1.35 + 0.25, Math.sin(a * 2) * 0.5 - 0.6] as const,
    r: [Math.sin(i) * 0.25, Math.cos(i * 1.7) * 0.45, a + Math.PI / 2 + Math.sin(i) * 0.4] as const,
    s: 0.9 + (i % 4) * 0.08,
  };
});

function geoOf(scene: THREE.Object3D) {
  let g: THREE.BufferGeometry | null = null;
  scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !g) g = m.geometry; });
  const out = (g as unknown as THREE.BufferGeometry).clone();
  out.computeVertexNormals();
  return out;
}

function FloatingTips({ progress }: { progress: React.RefObject<number> }) {
  const g1 = useGLTF("/models/si001.glb", false, true), g2 = useGLTF("/models/si002.glb", false, true);
  const geo1 = useMemo(() => geoOf(g1.scene), [g1]), geo2 = useMemo(() => geoOf(g2.scene), [g2]);
  const items = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const k = smooth(seg(p, 0.14, 0.4)) * (1 - smooth(seg(p, 0.76, 0.98)));
    const t = clock.elapsedTime;
    items.current.forEach((m, i) => {
      if (!m) return;
      const f = FLOAT[i], spread = 1 + k * 1.5;
      m.position.set(f.p[0] * spread, f.p[1] * spread + Math.sin(t * 0.9 + i) * 0.07, f.p[2] + k * 2);
      m.rotation.set(f.r[0] + Math.sin(t * 0.5 + i) * 0.15, f.r[1] + Math.sin(t * 0.35 + i * 2) * 0.5, f.r[2]);
      m.scale.setScalar(f.s * (1 - k * 0.7));
      m.visible = k < 0.97;
    });
  });
  return (
    <group>
      {FLOAT.map((f, i) => (
        <mesh key={i} ref={(el) => { if (el) items.current[i] = el; }} geometry={f.series === 1 ? geo1 : geo2} material={f.series === 1 ? si001 : si002} castShadow />
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
  color: "#ffffff", transmission: 1, thickness: 0.35, ior: 1.32, roughness: 0.0,
  clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1, attenuationColor: new THREE.Color("#ffffff"), attenuationDistance: 50, flatShading: true,
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
const CLIP_TILT = 0.87;                             // jaws face the same way as the nail

function Shifter({ glowRef }: { glowRef: React.RefObject<number> }) {
  const body = useMemo(() => crystalBodyGeometry(3.0, 0.62, 0.62, 0.11, 0.12), []);
  const label = useMemo(() => labelTexture(), []);
  const cableMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null!);
  const cable = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.78, 0, 0), new THREE.Vector3(2.35, 0.05, 0.15), new THREE.Vector3(2.7, 0.35, 0.35),
      new THREE.Vector3(2.75, 0.62, 0.38), new THREE.Vector3(CLIP.x - 0.3, CLIP.y - 0.3, CLIP.z - 0.22),
    ]);
    return new THREE.TubeGeometry(c, 80, 0.032, 16, false);
  }, []);
  const jaw = useMemo(() => crystalBodyGeometry(0.62, 0.09, 0.44, 0.03, 0.04), []);
  const clipEnd = useMemo(() => crystalBodyGeometry(0.14, 0.56, 0.5, 0.1, 0.03), []);

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
      {/* crystal fingertip clip: back block + two jaws the fingertip slides between */}
      <group position={CLIP.toArray()} rotation={[CLIP_TILT, 0, 0]}>
        <mesh geometry={clipEnd} material={crystal} position={[-0.3, 0, 0]} castShadow />
        <mesh geometry={jaw} material={crystal} position={[0.02, 0.2, 0]} castShadow />
        <mesh geometry={jaw} material={crystal} position={[0.02, -0.2, 0]} />
        <mesh position={[-0.3, -0.3, 0]} material={chromeMat}><cylinderGeometry args={[0.05, 0.05, 0.1, 20]} /></mesh>
        <mesh position={[0.0, 0.158, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.13, 40]} />
          <meshStandardMaterial ref={ringMat} color="#ffffff" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   Hand: mesh reconstructed from a photo, textured by projecting that photo.
   hand-nails.png marks the five nails (r = nail, g = 0 cuticle … 1 tip), so the
   TINTATips on the hand shift at the French tip like the floating ones.
   Mesh frame: back of the hand +z, middle fingertip at TIP.
   ============================================================ */
const TIP = new THREE.Vector3(-0.8, -0.92, 0.28);
const HAND_ROT_Z = -1.007;   // turns the middle finger to point along −x
const HAND_TILT = -0.7;      // tips the back of the hand up toward the camera
const HAND_SCALE = 1.8;

function Hand() {
  const { scene } = useGLTF("/models/hand.glb", false, true);
  const [skin, nails] = useTexture(["/models/hand-skin.jpg", "/models/hand-nails.png"]);
  const { geo, mat } = useMemo(() => {
    skin.colorSpace = THREE.SRGBColorSpace;
    const geo = geoOf(scene);
    const mat = new THREE.MeshPhysicalMaterial({ map: skin, roughness: 0.55, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffd8c4"), clearcoat: 0.2, clearcoatRoughness: 0.3 });
    const nailTex = { value: nails }, base = { value: new THREE.Color("#c9b8ea") };
    mat.onBeforeCompile = (s) => {
      s.uniforms.uTip = tipUniform; s.uniforms.uNails = nailTex; s.uniforms.uBase = base;
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uTip;\nuniform vec3 uBase;\nuniform sampler2D uNails;\nfloat nailK = 0.0;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          vec4 nm = texture2D(uNails, vMapUv);
          nailK = smoothstep(0.35, 0.65, nm.r);
          float tipK = smoothstep(0.52, 0.56, nm.g);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(uBase, uTip, tipK), nailK);`)
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.1, nailK);");
    };
    return { geo, mat };
  }, [scene, skin, nails]);
  return (
    <group rotation={[HAND_TILT, 0, 0]} scale={HAND_SCALE}>
      <group rotation={[0, 0, HAND_ROT_Z]}>
        <mesh geometry={geo} material={mat} position={TIP.clone().negate()} castShadow />
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
  { pos: new THREE.Vector3(2.9, 1.5, 6.4), look: new THREE.Vector3(2.5, 0.75, 0) },
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
    hand.current.position.set(CLIP.x - 0.12 + (1 - hIn) * 7, CLIP.y, CLIP.z);
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
      <color attach="background" args={[bg]} />
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
