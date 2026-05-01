import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Icosahedron, Dodecahedron, Tetrahedron, TorusKnot, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

interface PackVisual3DProps {
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
  isSelected: boolean;
  isHovered?: boolean;
}

// Per-rarity behavior config — drives how "alive" each tier feels
const RARITY_BEHAVIOR = {
  common:    { rotSpeed: 0.15, floatSpeed: 1,   floatIntensity: 0.3, emissiveBase: 0.15, emissiveActive: 0.7,  spotIntensity: 1.2 },
  rare:      { rotSpeed: 0.2,  floatSpeed: 1.2, floatIntensity: 0.4, emissiveBase: 0.2,  emissiveActive: 1.0,  spotIntensity: 1.5 },
  epic:      { rotSpeed: 0.25, floatSpeed: 2,   floatIntensity: 0.8, emissiveBase: 0.35, emissiveActive: 1.6,  spotIntensity: 3   },
  legendary: { rotSpeed: 0.3,  floatSpeed: 1.5, floatIntensity: 0.5, emissiveBase: 0.25, emissiveActive: 2.0,  spotIntensity: 2   },
};

const PackShape = ({ rarity, color, isSelected, isHovered = false }: PackVisual3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const behavior = RARITY_BEHAVIOR[rarity];
  
  // Interpolation target for smooth transitions
  const targetSpeed = useRef(behavior.rotSpeed);
  const currentSpeed = useRef(behavior.rotSpeed);

  useFrame((state) => {
    const delta = state.clock.getDelta();
    const time = state.clock.getElapsedTime();

    // Calculate target speed based on state
    if (isSelected) {
      targetSpeed.current = behavior.rotSpeed * 4;
    } else if (isHovered) {
      targetSpeed.current = behavior.rotSpeed * 2.5;
    } else {
      targetSpeed.current = behavior.rotSpeed;
    }

    // Smooth interpolation (lerp) for speed changes
    currentSpeed.current += (targetSpeed.current - currentSpeed.current) * 0.05;

    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2 * currentSpeed.current;
      meshRef.current.rotation.y += delta * 0.3 * currentSpeed.current;

      // Subtle "breathing" scale — tight amplitude to stay smooth
      if (isSelected) {
        const breathe = 1 + Math.sin(time * 1.5) * 0.012;
        meshRef.current.scale.setScalar(breathe);
      } else if (isHovered) {
        const breathe = 1 + Math.sin(time * 1.8) * 0.008;
        meshRef.current.scale.setScalar(breathe);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  // Three.js does not natively support CSS Level 4 space-separated HSL. 
  // Convert "hsl(185 100% 50%)" to "hsl(185, 100%, 50%)"
  const threeColor = color.replace(/hsl\(([\d.]+)\s+([\d.]+%)\s+([\d.]+%)\)/, "hsl($1, $2, $3)");

  const emissiveIntensity = isSelected
    ? behavior.emissiveActive
    : isHovered
      ? (behavior.emissiveBase + behavior.emissiveActive) / 2
      : behavior.emissiveBase;

  const materialProps = {
    color: threeColor,
    emissive: threeColor,
    emissiveIntensity,
    metalness: 0.9,
    roughness: 0.1,
    toneMapped: false,
    wireframe: rarity === "epic",
  };

  const floatSpeed = isSelected ? behavior.floatSpeed * 1.5 : isHovered ? behavior.floatSpeed * 1.2 : behavior.floatSpeed;
  const rotIntensity = isSelected ? 2 : isHovered ? 1.2 : 0.5;
  const floatIntensity = isSelected ? behavior.floatIntensity * 1.5 : isHovered ? behavior.floatIntensity * 1.2 : behavior.floatIntensity;

  return (
    <Float speed={floatSpeed} rotationIntensity={rotIntensity} floatIntensity={floatIntensity}>
      {rarity === "common" ? (
        <Tetrahedron ref={meshRef} args={[1.5, 0]}>
          <meshStandardMaterial {...materialProps} />
        </Tetrahedron>
      ) : rarity === "rare" ? (
        <Dodecahedron ref={meshRef} args={[1.2, 0]}>
          <meshStandardMaterial {...materialProps} />
        </Dodecahedron>
      ) : rarity === "epic" ? (
        <group ref={meshRef as any}>
          <Icosahedron args={[1.4, 1]}>
            <meshStandardMaterial {...materialProps} wireframe emissiveIntensity={emissiveIntensity * 0.6} />
          </Icosahedron>
          <Icosahedron args={[0.8, 0]}>
            <meshStandardMaterial {...materialProps} wireframe={false} emissiveIntensity={emissiveIntensity * 1.8} />
          </Icosahedron>
        </group>
      ) : (
        <TorusKnot ref={meshRef as any} args={[0.8, 0.25, 100, 16]}>
           <MeshDistortMaterial 
             {...materialProps} 
             distort={isSelected ? 0.45 : isHovered ? 0.3 : 0.2} 
             speed={isSelected ? 6 : isHovered ? 4 : 2} 
             emissiveIntensity={emissiveIntensity}
           />
        </TorusKnot>
      )}
    </Float>
  );
};

export default function PackVisual3D({ rarity, color, isSelected, isHovered = false }: PackVisual3DProps) {
  const behavior = RARITY_BEHAVIOR[rarity];
  const spotIntensity = isSelected ? behavior.spotIntensity * 1.5 : isHovered ? behavior.spotIntensity * 1.2 : behavior.spotIntensity;

  return (
    <div className={`w-full h-full relative z-10 transition-all duration-700 ${isSelected ? "scale-110 -translate-y-1" : isHovered ? "scale-105 opacity-90" : "opacity-60"}`}>
      <Canvas 
        camera={{ position: [0, 0, 4.5], fov: 50 }} 
        gl={{ alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={isSelected ? 0.4 : 0.2} />
        <spotLight position={[10, 10, 10]} intensity={spotIntensity} color={color} penumbra={1} />
        <pointLight position={[-10, -10, -10]} intensity={isSelected ? 1.5 : 1} color="#ffffff" />
        
        <Environment preset="city" />
        
        <PackShape rarity={rarity} color={color} isSelected={isSelected} isHovered={isHovered} />
        
        <ContactShadows position={[0, -2, 0]} opacity={isSelected ? 0.6 : 0.3} scale={10} blur={2} far={4} color={color} />
      </Canvas>
    </div>
  );
}
