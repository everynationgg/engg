import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Torus, Environment } from "@react-three/drei";
import * as THREE from "three";

interface CurrencyChip3DProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChipModel = ({ size = 1, color = "#00f3ff" }: { size?: number, color?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <group scale={[size, size, size]}>
        {/* Outer Ring */}
        <Torus args={[0.8, 0.1, 16, 100]}>
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={1} 
            metalness={1} 
            roughness={0.1} 
          />
        </Torus>
        {/* Inner Core */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
          <meshStandardMaterial 
            color="#050505" 
            metalness={1} 
            roughness={0.1} 
          />
        </mesh>
        {/* Core Detail */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  );
};

export default function CurrencyChip3D({ size = 1, color = "#00f3ff", className = "" }: CurrencyChip3DProps) {
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: size * 40, height: size * 40 }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 40 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color={color} />
        <Environment preset="city" />
        <ChipModel size={size} color={color} />
      </Canvas>
    </div>
  );
}
