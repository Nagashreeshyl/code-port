"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, RoundedBox, Torus } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

function Sculpture() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current) {
      return;
    }

    group.current.rotation.y = state.clock.elapsedTime * 0.18;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
  });

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.7} floatIntensity={1.4}>
        <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.32} position={[0, 0.1, 0]}>
          <MeshTransmissionMaterial
            color="#f2e7d7"
            roughness={0.08}
            thickness={0.8}
            transmission={1}
            chromaticAberration={0.04}
            anisotropy={0.2}
          />
        </RoundedBox>
      </Float>
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1.8}>
        <Torus args={[1.45, 0.18, 24, 100]} rotation={[1.2, 0, 0.8]}>
          <meshPhysicalMaterial color="#2f7f81" roughness={0.18} metalness={0.32} transparent opacity={0.58} />
        </Torus>
      </Float>
      <Float speed={1.4} rotationIntensity={0.8} floatIntensity={1.2}>
        <RoundedBox args={[0.55, 2.3, 0.3]} radius={0.12} position={[-1.8, 0.4, -0.9]} rotation={[0.6, 0.3, 0.55]}>
          <meshPhysicalMaterial color="#c68c5d" roughness={0.22} transparent opacity={0.4} />
        </RoundedBox>
      </Float>
    </group>
  );
}

export function PortfolioScene() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 38 }}>
        <ambientLight intensity={1.35} />
        <directionalLight position={[3, 4, 2]} intensity={2.1} color="#f8f0e6" />
        <pointLight position={[-3, -2, 2]} intensity={2.8} color="#2f7f81" />
        <Sculpture />
      </Canvas>
    </div>
  );
}
