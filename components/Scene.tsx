"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const REST_X = 2.0;   // fingertip resting just outside the opening (nail visible)
const IN_X = 1.02;    // fingertip dipped inside the device
const OPENING_X = 1.55;

/* Smooth almond press-on shell: tip along +y, curved across x, normal +z. */
function useNailGeometry() {
  return useMemo(() => {
    const g = new THREE.SphereGeometry(1, 96, 64);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = (y + 1) / 2;
      x *= 0.36 * (1 - Math.pow(t, 3) * 0.5);
      y *= 0.5;
      z *= 0.06;
      z -= x * x * 0.9;
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
}

function Finger({ nailMat }: { nailMat: React.RefObject<THREE.MeshPhysicalMaterial | null> }) {
  const nail = useNailGeometry();
  const skin = (
    <meshPhysicalMaterial color="#e2b199" roughness={0.48} sheen={1} sheenRoughness={0.6} sheenColor="#ffd8c4" clearcoat={0.15} clearcoatRoughness={0.6} />
  );
  // Built with the fingertip at x = 0, finger extending toward +x.
  return (
    <group rotation={[0.85, 0, 0.1]}>
      <mesh position={[1.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.165, 3.2, 16, 48]} />{skin}
      </mesh>
      {/* TINTATip press-on, lying on top of the fingertip, tip pointing −x */}
      <group position={[0.22, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={nail} rotation={[-Math.PI / 2, 0, 0]} scale={[0.47, 0.5, 0.6]} castShadow>
          <meshPhysicalMaterial ref={nailMat} roughness={0.08} clearcoat={1} clearcoatRoughness={0.03} />
        </mesh>
      </group>
    </group>
  );
}

function Device({ hex }: { hex: string }) {
  const finger = useRef<THREE.Group>(null!);
  const nailMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const [shown] = useState(() => new THREE.Color(hex));   // colour currently on the nail
  const target = useMemo(() => new THREE.Color(hex), [hex]);
  const dipStart = useRef(-10);
  const lastHex = useRef(hex);
  const applying = useRef(false);
  const glowCol = useMemo(() => new THREE.Color(hex), []); // eslint-disable-line react-hooks/exhaustive-deps

  const opening = useMemo(() => {
    const w = 0.205, h = 0.235, s = new THREE.Shape();
    s.moveTo(-w, -h); s.lineTo(-w, h * 0.25);
    s.bezierCurveTo(-w, h * 1.05, w, h * 1.05, w, h * 0.25); s.lineTo(w, -h); s.closePath();
    return new THREE.ShapeGeometry(s, 40);
  }, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (lastHex.current !== hex) { lastHex.current = hex; dipStart.current = t; applying.current = false; }
    const k = t - dipStart.current;
    const dipping = k < 1.05;
    // finger slides in, waits, slides out
    const goal = dipping && k > 0.0 ? IN_X : REST_X;
    const x = finger.current.position.x;
    finger.current.position.x = THREE.MathUtils.damp(x, goal, dipping ? 7 : 4.5, dt);
    finger.current.position.y = Math.sin(t * 1.3) * 0.012;
    const inside = finger.current.position.x < IN_X + 0.12;

    // colour flips only while the nail is inside the device
    if (inside && k > 0.45) applying.current = true;
    if (applying.current) shown.lerp(target, 0.25);
    if (nailMat.current) nailMat.current.color.copy(shown);

    const pulse = inside && dipping ? 1 : 0;
    glowCol.lerp(target, 0.08);
    glow.current.color.copy(glowCol);
    glow.current.emissive.copy(glowCol);
    glow.current.emissiveIntensity = THREE.MathUtils.damp(glow.current.emissiveIntensity, 0.5 + pulse * 3.2, 6, dt);
    light.current.color.copy(glowCol);
    light.current.intensity = THREE.MathUtils.damp(light.current.intensity, 0.8 + pulse * 7, 6, dt);
  });

  return (
    <group>
      <RoundedBox args={[3.1, 0.6, 0.66]} radius={0.17} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f3f3f5" metalness={0.2} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.2} />
      </RoundedBox>
      <mesh geometry={opening} position={[OPENING_X + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#0e0a0c" roughness={0.7} />
      </mesh>
      <mesh geometry={opening} position={[OPENING_X + 0.004, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.78}>
        <meshStandardMaterial ref={glow} emissiveIntensity={0.5} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <pointLight ref={light} position={[OPENING_X + 0.35, 0.05, 0.2]} distance={2.6} decay={2} />
      <group ref={finger} position={[REST_X, 0, 0]}>
        <Finger nailMat={nailMat} />
      </group>
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const mobile = aspect < 0.9;
  useFrame(({ pointer, clock }) => {
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, -0.42 + pointer.x * 0.12, 0.05);
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, 0.32 - pointer.y * 0.06, 0.05);
    g.current.position.y = (mobile ? 0.95 : -0.15) + Math.sin(clock.elapsedTime * 0.6) * 0.03;
  });
  return <group ref={g} scale={mobile ? 0.44 : 1} position-x={mobile ? -0.15 : -1.05}>{children}</group>;
}

export default function Scene({ hex, bg }: { hex: string; bg: string }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.6, 6.4], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 5, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Rig><Device hex={hex} /></Rig>
      <ContactShadows position={[0, -0.75, 0]} opacity={0.5} scale={12} blur={2.4} far={3} color="#000" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="ring" color={bg} intensity={1.5} position={[0, 0, -6]} scale={6} />
      </Environment>
    </Canvas>
  );
}
