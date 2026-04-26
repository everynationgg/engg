import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Instances, Instance, Environment } from "@react-three/drei";
import * as THREE from "three";

const ParticleField = ({ count = 50 }: { count?: number }) => {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  return (
    <Instances>
      <torusGeometry args={[0.2, 0.03, 8, 32]} />
      <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} />
      {particles.map((data, i) => (
        <Particle key={i} {...data} />
      ))}
    </Instances>
  );
};

const Particle = ({ t, factor, speed, xFactor, yFactor, zFactor }: any) => {
  const ref = useRef<any>(null);
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ref.current) {
      // Particles fly from center to top-right (where the balance usually is)
      const p = (time * speed * factor) % 1;
      ref.current.position.set(
        xFactor * (1 - p) * 0.1 + p * 10,
        yFactor * (1 - p) * 0.1 + p * 10,
        zFactor * (1 - p) * 0.1 - p * 5
      );
      ref.current.scale.setScalar(1 - p);
      ref.current.rotation.set(time, time, time);
    }
  });
  return <Instance ref={ref} />;
};

export default function CreditInjection3D() {
  return (
    <div className="fixed inset-0 z-[1200] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <Environment preset="city" />
        <ParticleField count={80} />
      </Canvas>
    </div>
  );
}
