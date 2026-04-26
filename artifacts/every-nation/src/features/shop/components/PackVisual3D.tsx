import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Icosahedron, Dodecahedron, Tetrahedron, TorusKnot, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

interface PackVisual3DProps {
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
  isSelected: boolean;
}

const HologramPedestal = ({ color, isSelected }: { color: string, isSelected: boolean }) => {
  const baseRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (baseRef.current) {
      baseRef.current.rotation.y = time * 0.2;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = -time * 0.5;
    }
  });

  return (
    <group position={[0, -1.8, 0]}>
      {/* Main Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.2, 32]} />
        <meshStandardMaterial color="#0a0a0a" metalness={1} roughness={0.2} />
      </mesh>

      {/* Glowing Rings */}
      <group ref={ringsRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.3, 1.35, 64]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.8 : 0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <ringGeometry args={[0.9, 0.95, 64]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 1 : 0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Light Beam */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 3, 32, 1, true]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isSelected ? 0.15 : 0.05} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

const PackShape = ({ rarity, color, isSelected }: PackVisual3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    // Explicitly update the timer to calculate the current delta
    if (state.clock && (state.clock as any).update) {
      (state.clock as any).update();
    }
    const delta = state.clock.getDelta();

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
    emissiveIntensity: isSelected ? 1.2 : 0.6,
    metalness: 0.9,
    roughness: 0.1,
    toneMapped: false,
    wireframe: rarity === "epic",
  };

  return (
    <group>
      <HologramPedestal color={color} isSelected={isSelected} />
      
      <Float speed={isSelected ? 4 : 2} rotationIntensity={isSelected ? 2 : 0.5} floatIntensity={isSelected ? 2 : 1}>
        <group position={[0, 0.2, 0]}>
          {rarity === "common" ? (
            <Tetrahedron ref={meshRef} args={[1.3, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Tetrahedron>
          ) : rarity === "rare" ? (
            <Dodecahedron ref={meshRef} args={[1.0, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Dodecahedron>
          ) : rarity === "epic" ? (
            <group ref={meshRef as any}>
              <Icosahedron args={[1.2, 1]}>
                <meshStandardMaterial {...materialProps} wireframe />
              </Icosahedron>
              <Icosahedron args={[0.7, 0]}>
                <meshStandardMaterial {...materialProps} wireframe={false} emissiveIntensity={isSelected ? 1.5 : 0.8} />
              </Icosahedron>
            </group>
          ) : (
            <TorusKnot ref={meshRef as any} args={[0.7, 0.22, 100, 16]}>
               <MeshDistortMaterial 
                 {...materialProps} 
                 distort={isSelected ? 0.4 : 0.2} 
                 speed={isSelected ? 5 : 2} 
                 emissiveIntensity={isSelected ? 2.0 : 0.8}
               />
            </TorusKnot>
          )}
        </group>
      </Float>
    </group>
  );
};

export default function PackVisual3D({ rarity, color, isSelected }: PackVisual3DProps) {
  // Use THREE.Timer to resolve deprecation warning of THREE.Clock in Three.js r169+
  const timer = useRef(new (THREE as any).Timer());

  return (
    <div className={`w-32 h-32 relative z-10 transition-transform duration-700 ${isSelected ? "scale-110 -translate-y-2" : "opacity-80 group-hover:opacity-100"}`}>
      <Canvas 
        camera={{ position: [0, 0, 4.5], fov: 50 }} 
        gl={{ alpha: true }}
        onCreated={(state) => {
          // Replace the default clock with our Timer
          state.set({ clock: timer.current as any });
        }}
      >
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} intensity={2} color={color} penumbra={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        
        <Environment preset="city" />
        
        <PackShape rarity={rarity} color={color} isSelected={isSelected} />
        
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color={color} />
      </Canvas>
    </div>
  );
}
