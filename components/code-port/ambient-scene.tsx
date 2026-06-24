"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function FloatingCore() {
  const group = useRef<Mesh>(null);

  useFrame((state) => {
    if (!group.current) {
      return;
    }

    group.current.rotation.x = state.clock.elapsedTime * 0.16;
    group.current.rotation.y = state.clock.elapsedTime * 0.22;
  });

  return (
    <mesh ref={group} position={[0, 0.1, 0]}>
      <Icosahedron args={[1.1, 8]}>
        <MeshDistortMaterial
          color="#78aead"
          transparent
          opacity={0.72}
          roughness={0.06}
          metalness={0.18}
          distort={0.36}
          speed={1.8}
        />
      </Icosahedron>
    </mesh>
  );
}

export function AmbientScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      <div className="mesh-overlay absolute inset-0 opacity-40" />
      <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 2]} intensity={2.2} color="#f8efe4" />
        <pointLight position={[-2, -1, 2]} intensity={2.4} color="#2f7f81" />
        <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.3}>
          <FloatingCore />
        </Float>
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
          <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.18} position={[-1.75, -0.6, -0.7]}>
            <meshPhysicalMaterial color="#f4eee8" transparent opacity={0.48} roughness={0.08} transmission={0.82} thickness={1.2} />
          </RoundedBox>
        </Float>
        <Float speed={1.5} rotationIntensity={1} floatIntensity={1.1}>
          <RoundedBox args={[0.7, 1.2, 0.35]} radius={0.18} position={[1.9, 0.8, -1]}>
            <meshPhysicalMaterial color="#c68c5d" transparent opacity={0.34} roughness={0.18} transmission={0.68} thickness={0.9} />
          </RoundedBox>
        </Float>
      </Canvas>
    </div>
  );
}
