import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles() {
  const count = 300;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, [count]);

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#00f3ff" size={0.05} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

function AntiGravityScene() {
  const groupRef = useRef<THREE.Group>(null);
  const centralObjRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scrollY = window.scrollY;
    
    // Smooth mouse parallax
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.2, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.2, 0.05);
      // Scroll controls rotation
      groupRef.current.rotation.z = scrollY * 0.001;
    }

    if (centralObjRef.current) {
      centralObjRef.current.rotation.x = time * 0.1;
      centralObjRef.current.rotation.y = time * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#00f3ff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#8a2be2" />
      
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={centralObjRef}>
          <octahedronGeometry args={[2, 0]} />
          <meshPhysicalMaterial 
            color="#050510" 
            metalness={0.8} 
            roughness={0.2} 
            clearcoat={1} 
            wireframe={true}
          />
        </mesh>
        
        <mesh scale={0.9}>
          <icosahedronGeometry args={[2, 1]} />
          <meshPhysicalMaterial 
            color="#00f3ff" 
            transparent 
            opacity={0.1} 
            metalness={0.1}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Orbiting elements */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2} position={[
          Math.cos(i * Math.PI * 0.4) * 4,
          Math.sin(i * Math.PI * 0.4) * 4,
          (Math.random() - 0.5) * 2
        ]}>
          <mesh scale={0.2 + Math.random() * 0.3}>
            <boxGeometry />
            <meshStandardMaterial color="#8a2be2" wireframe opacity={0.5} transparent />
          </mesh>
        </Float>
      ))}

      <Particles />
    </group>
  );
}

export default function AntiGravity3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <AntiGravityScene />
      </Canvas>
    </div>
  );
}
