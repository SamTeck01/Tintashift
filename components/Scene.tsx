"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* ---------- press-on nail (almond, gently curved) ---------- */
function useNailGeometry() {
  return useMemo(() => {
    // smooth almond press-on: deformed, curved ellipsoid shell
    const g = new THREE.SphereGeometry(1, 96, 96);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = (y + 1) / 2;                       // 0 bottom → 1 tip
      x *= 0.36 * (1 - Math.pow(t, 2.2) * 0.75);   // taper to almond point
      y *= 0.62;
      z *= 0.07;
      z -= x * x * 2.2;                            // C-curve across the nail
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
}

const NAILS = [
  { p: [-2.6, 1.05, -0.6], r: [0.35, 0.55, 0.5] },
  { p: [-1.65, 1.55, -1.0], r: [0.2, -0.3, 0.25] },
  { p: [-0.55, 1.75, -1.3], r: [0.4, 0.3, -0.1] },
  { p: [-2.9, -0.15, -0.2], r: [0.2, -0.6, 0.9] },
  { p: [0.55, 1.35, -0.7], r: [0.25, -0.4, -0.5] },
] as const;

function Nail({ i, geo, target, shiftAt }: { i: number; geo: THREE.BufferGeometry; target: THREE.Color; shiftAt: React.RefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const n = NAILS[i];
  const [init] = useState(() => target.clone());
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const local = t - shiftAt.current! - i * 0.09;           // staggered wave
    const k = THREE.MathUtils.clamp(local / 0.9, 0, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    ref.current.position.set(n.p[0], n.p[1] + Math.sin(t * 0.8 + i) * 0.06, n.p[2]);
    ref.current.rotation.set(n.r[0] + Math.sin(t * 0.5 + i) * 0.05, n.r[1] + ease * Math.PI * 2, n.r[2]);
    if (k > 0.35) { mat.current.color.lerp(target, 0.18); mat.current.emissive.copy(mat.current.color); }
    mat.current.emissiveIntensity = Math.sin(k * Math.PI) * 0.35;
  });
  return (
    <mesh ref={ref} geometry={geo} castShadow scale={0.62}>
      <meshPhysicalMaterial ref={mat} color={init} emissive={init} emissiveIntensity={0} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
    </mesh>
  );
}

/* ---------- TINTAShift Device: rounded aluminium bar, nail-shaped opening at one end ---------- */
function Device({ target, shiftAt }: { target: THREE.Color; shiftAt: React.RefObject<number> }) {
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const [init] = useState(() => target.clone());
  const opening = useMemo(() => {
    const w = 0.17, h = 0.21, s = new THREE.Shape();
    s.moveTo(-w, -h); s.lineTo(-w, h * 0.2);
    s.bezierCurveTo(-w, h, w, h, w, h * 0.2); s.lineTo(w, -h); s.closePath();
    return new THREE.ShapeGeometry(s, 32);
  }, []);
  useFrame(({ clock }) => {
    const k = clock.elapsedTime - shiftAt.current!;
    const pulse = k < 1.4 ? Math.sin((k / 1.4) * Math.PI) : 0;
    glow.current.color.lerp(target, 0.12);
    glow.current.emissive.lerp(target, 0.12);
    glow.current.emissiveIntensity = 0.6 + pulse * 2.4;
    light.current.color.lerp(target, 0.12);
    light.current.intensity = 1.2 + pulse * 5;
  });
  return (
    <group position={[-0.7, -0.35, 0.3]} rotation={[0.12, -0.72, 0.06]} scale={0.82}>
      <RoundedBox args={[3.1, 0.56, 0.62]} radius={0.16} smoothness={8} castShadow>
        <meshPhysicalMaterial color="#f4f4f6" metalness={0.18} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} />
      </RoundedBox>
      {/* opening + inner glow */}
      <mesh geometry={opening} position={[1.553, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#120c10" roughness={0.6} />
      </mesh>
      <mesh geometry={opening} position={[1.556, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.72}>
        <meshStandardMaterial ref={glow} color={init} emissive={init} emissiveIntensity={0.6} toneMapped={false} transparent opacity={0.92} />
      </mesh>
      <pointLight ref={light} position={[1.9, 0, 0.1]} distance={3} decay={2} />
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const mobile = aspect < 0.9;
  useFrame(({ pointer, clock }) => {
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, pointer.x * 0.18, 0.05);
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -pointer.y * 0.08, 0.05);
    g.current.position.y = (mobile ? 0.8 : -0.25) + Math.sin(clock.elapsedTime * 0.6) * 0.04;
  });
  return <group ref={g} scale={mobile ? 0.52 : 1} position-x={mobile ? 0.45 : 0}>{children}</group>;
}

function Shift({ hex, shiftAt }: { hex: string; shiftAt: React.RefObject<number> }) {
  // Register shade change time from inside the render loop clock.
  const last = useRef(hex);
  useFrame(({ clock }) => {
    if (last.current !== hex) { last.current = hex; shiftAt.current = clock.elapsedTime; }
  });
  return null;
}

export default function Scene({ hex, bg }: { hex: string; bg: string }) {
  const geo = useNailGeometry();
  const target = useMemo(() => new THREE.Color(hex), [hex]);
  const shiftAt = useRef(-10);
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.35, 6.2], fov: 32 }} gl={{ antialias: true, alpha: true }}>
      <Shift hex={hex} shiftAt={shiftAt} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Rig>
        <Device target={target} shiftAt={shiftAt} />
        {NAILS.map((_, i) => <Nail key={i} i={i} geo={geo} target={target} shiftAt={shiftAt} />)}
      </Rig>
      <ContactShadows position={[0, -0.95, 0]} opacity={0.45} scale={12} blur={2.6} far={3} color={new THREE.Color(bg).multiplyScalar(0.25)} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="ring" color={bg} intensity={2} position={[0, 0, -6]} scale={6} />
      </Environment>
    </Canvas>
  );
}
