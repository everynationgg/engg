import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Icosahedron, Dodecahedron, Tetrahedron, TorusKnot } from "@react-three/drei";
import * as THREE from "three";

interface PackVisual3DProps {
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
  isSelected: boolean;
}

const PackShape = ({ rarity, color, isSelected }: PackVisual3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate slowly, but faster if selected
      const speed = isSelected ? 2 : 0.5;
      meshRef.current.rotation.x += delta * 0.2 * speed;
      meshRef.current.rotation.y += delta * 0.3 * speed;
    }
  });

  const materialProps = {
    color: color,
    emissive: color,
    emissiveIntensity: isSelected ? 0.8 : 0.2,
    toneMapped: false,
    wireframe: rarity === "epic",
  };

  return (
    <Float speed={isSelected ? 4 : 2} rotationIntensity={isSelected ? 2 : 0.5} floatIntensity={isSelected ? 2 : 1}>
      {rarity === "common" && (
        <Tetrahedron ref={meshRef} args={[1.5, 0]}>
          <meshStandardMaterial {...materialProps} />
        </Tetrahedron>
      )}
      {rarity === "rare" && (
        <Dodecahedron ref={meshRef} args={[1.2, 0]}>
          <meshStandardMaterial {...materialProps} />
        </Dodecahedron>
      )}
      {rarity === "epic" && (
        <group ref={meshRef as any}>
          <Icosahedron args={[1.4, 1]}>
            <meshStandardMaterial {...materialProps} wireframe />
          </Icosahedron>
          <Icosahedron args={[0.8, 0]}>
            <meshStandardMaterial {...materialProps} wireframe={false} emissiveIntensity={isSelected ? 1 : 0.5} />
          </Icosahedron>
        </group>
      )}
      {rarity === "legendary" && (
        <TorusKnot ref={meshRef as any} args={[0.8, 0.25, 100, 16]}>
           <MeshDistortMaterial 
             {...materialProps} 
             distort={isSelected ? 0.4 : 0.2} 
             speed={isSelected ? 5 : 2} 
             emissiveIntensity={isSelected ? 1.5 : 0.5}
           />
        </TorusKnot>
      )}
    </Float>
  );
};

export default function PackVisual3D({ rarity, color, isSelected }: PackVisual3DProps) {
  return (
    <div className={`w-32 h-32 relative z-10 transition-transform duration-700 ${isSelected ? "scale-110 -translate-y-2" : "opacity-80 group-hover:opacity-100"}`}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={color} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <PackShape rarity={rarity} color={color} isSelected={isSelected} />
      </Canvas>
    </div>
  );
}
