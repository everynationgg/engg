import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

function Particles() {
  const count = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#a855f7" size={0.03} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

function AntiGravityScene({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const centralObjRef = useRef<THREE.Mesh>(null);
  const { mouse, camera } = useThree();

  // Create an array of orbiting objects
  const orbiters = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      speed: 0.5 + Math.random(),
      radius: 3 + Math.random() * 3,
      angle: (i / 8) * Math.PI * 2,
      yOffset: (Math.random() - 0.5) * 4,
      scale: 0.1 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? "#00f3ff" : "#a855f7"
    }));
  }, []);

  const orbiterRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Smooth mouse parallax mapping
    const targetRotX = mouse.y * 0.3;
    const targetRotY = mouse.x * 0.3;

    if (groupRef.current) {
      // Ease group rotation towards mouse
      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.05;
    }

    if (centralObjRef.current) {
      // Base rotation + scroll rotation
      centralObjRef.current.rotation.x = time * 0.2 + scrollProgress * Math.PI * 2;
      centralObjRef.current.rotation.y = time * 0.3 + scrollProgress * Math.PI;
    }

    // Orbiters animation
    orbiterRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const config = orbiters[idx];
      const currentAngle = config.angle + time * config.speed + (scrollProgress * Math.PI);
      
      // Calculate smooth orbital path
      mesh.position.x = Math.cos(currentAngle) * config.radius;
      mesh.position.z = Math.sin(currentAngle) * config.radius;
      mesh.position.y = config.yOffset + Math.sin(time * 2 + idx) * 0.5;
      
      // Individual rotation
      mesh.rotation.x = time * config.speed;
      mesh.rotation.y = time * config.speed * 1.5;
    });

    // Camera zoom/move based on scroll
    // Interpolate camera Z from 8 (top) to 5 (bottom)
    const targetCamZ = 8 - (scrollProgress * 3);
    const targetCamY = scrollProgress * 2;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={2} color="#00f3ff" />
      <directionalLight position={[-5, -10, -5]} intensity={2} color="#a855f7" />
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#ffffff" distance={10} />
      
      {/* Central Abstract Core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={centralObjRef}>
          <icosahedronGeometry args={[1.8, 1]} />
          <meshPhysicalMaterial 
            color="#050510" 
            emissive="#001133"
            emissiveIntensity={0.5}
            metalness={0.9} 
            roughness={0.1} 
            wireframe={true}
          />
        </mesh>
        {/* Inner solid glowing core */}
        <mesh scale={0.8}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={1} opacity={0.8} transparent />
        </mesh>
      </Float>

      {/* Orbiting Elements */}
      {orbiters.map((config, i) => (
        <mesh 
          key={i} 
          ref={(el) => (orbiterRefs.current[i] = el)}
          scale={config.scale}
        >
          <boxGeometry />
          <meshStandardMaterial 
            color={config.color} 
            emissive={config.color}
            emissiveIntensity={1.5}
            transparent 
            opacity={0.8} 
          />
        </mesh>
      ))}

      <Particles />

      {/* Soft Bloom Postprocessing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.8} />
      </EffectComposer>
    </group>
  );
}

// Full Interactive Component Section
export default function AntiGravity3D({ isBackground = false }: { isBackground?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // If it's just used as a background on another page
  if (isBackground) {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <AntiGravityScene scrollProgress={0} />
        </Canvas>
      </div>
    );
  }

  // Interactive Scroll Section Mode
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (latest) => {
      setScrollProgress(latest);
    });
    return () => unsub();
  }, [scrollYProgress]);

  // UI Animation Stages
  const stage1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.4], [1, 1, 0]);
  const stage1Y = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  const stage2Opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]);
  const stage2Y = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [50, 0, -50]);

  const stage3Opacity = useTransform(scrollYProgress, [0.6, 0.8, 1], [0, 1, 1]);
  const stage3Y = useTransform(scrollYProgress, [0.6, 0.8], [50, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#020205]">
      {/* Fixed 3D Canvas */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020205]/80 to-[#020205] z-0 pointer-events-none" />
        
        <Canvas className="z-10" camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
          <AntiGravityScene scrollProgress={scrollProgress} />
        </Canvas>
        
        {/* UI Overlay Layers */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center p-8 text-center">
          
          {/* Stage 1 */}
          <motion.div 
            style={{ opacity: stage1Opacity, y: stage1Y }}
            className="absolute flex flex-col items-center gap-6"
          >
            <div className="px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-md">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">Phase 01</span>
            </div>
            <h1 className="font-inter text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
              Defy <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Gravity</span>
            </h1>
            <p className="font-inter text-lg text-white/50 max-w-md leading-relaxed">
              Experience the next generation of spatial interfaces. Scroll to interact with the core.
            </p>
          </motion.div>

          {/* Stage 2 */}
          <motion.div 
            style={{ opacity: stage2Opacity, y: stage2Y }}
            className="absolute flex flex-col items-center gap-6"
          >
            <div className="px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/5 backdrop-blur-md">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-purple-400">Phase 02</span>
            </div>
            <h2 className="font-inter text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
              Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Sync</span>
            </h2>
            <p className="font-inter text-lg text-white/50 max-w-md leading-relaxed">
              The orbital matrix responds to your presence. The closer you get, the stronger the connection.
            </p>
          </motion.div>

          {/* Stage 3 */}
          <motion.div 
            style={{ opacity: stage3Opacity, y: stage3Y }}
            className="absolute flex flex-col items-center gap-6"
          >
            <div className="px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-md">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">Phase 03</span>
            </div>
            <h2 className="font-inter text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
              Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">Velocity</span>
            </h2>
            <p className="font-inter text-lg text-white/50 max-w-md leading-relaxed">
              You have reached the inner core. Systems are fully operational and ready for deployment.
            </p>
            <button className="mt-8 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-inter font-medium text-white backdrop-blur-md pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Initialize Sequence
            </button>
          </motion.div>

        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-50">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-white">Scroll</span>
        </div>
      </div>
    </div>
  );
}
