import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Float, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const HarmonicEffect: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Text References for tracking position
  const text1Ref = useRef<THREE.Mesh>(null);
  const text2Ref = useRef<THREE.Mesh>(null);
  const text3Ref = useRef<THREE.Mesh>(null);

  // Configuration
  const isMobile = viewport.width < 10;
  const COUNT_X = isMobile ? 30 : 50; // Fewer particles on mobile for perf
  const COUNT_Y = isMobile ? 40 : 50;
  const TOTAL = COUNT_X * COUNT_Y;
  const SEPARATION = isMobile ? 0.4 : 0.5;

  // Initialize data
  const particles = useMemo(() => {
    const data = [];
    for (let x = 0; x < COUNT_X; x++) {
      for (let y = 0; y < COUNT_Y; y++) {
        data.push({
          x: (x - COUNT_X / 2) * SEPARATION,
          y: (y - COUNT_Y / 2) * SEPARATION,
          z: 0,
          factor: Math.random() * 0.5 + 0.5, 
          offset: Math.random() * Math.PI * 2,
          // Store default color
          baseColor: new THREE.Color('#5555aa'),
        });
      }
    }
    return data;
  }, [COUNT_X, COUNT_Y, SEPARATION]);

  // Reusable colors
  const colorCyan = useMemo(() => new THREE.Color('#00ffff'), []);
  const colorMagenta = useMemo(() => new THREE.Color('#ff00ff'), []);
  const colorWhite = useMemo(() => new THREE.Color('#ffffff'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    const mx = mouse.x * viewport.width / 2;
    const my = mouse.y * viewport.height / 2;

    // Get current text world positions
    const t1Pos = text1Ref.current ? text1Ref.current.position : new THREE.Vector3(0,0,100);
    const t2Pos = text2Ref.current ? text2Ref.current.position : new THREE.Vector3(0,0,100);
    const t3Pos = text3Ref.current ? text3Ref.current.position : new THREE.Vector3(0,0,100);

    for (let i = 0; i < TOTAL; i++) {
      const p = particles[i];
      
      // 1. Organic Wave Motion
      const zBase = Math.sin(p.x * 0.4 + t * 1.5) * 1.5 + Math.cos(p.y * 0.4 + t * 1.2) * 1.5;
      const noise = Math.sin(p.x * 0.8 + p.y * 0.8 + t * 2) * 0.5;
      let targetZ = zBase + noise;

      // 2. Interactive Ripple (Mouse)
      const dx = mx - p.x;
      const dy = my - p.y;
      const distSq = dx*dx + dy*dy;
      const mouseRadius = 15;
      if (distSq < mouseRadius * mouseRadius) {
          const force = (1 - Math.sqrt(distSq) / mouseRadius) * 4;
          targetZ -= force;
      }

      // 3. COLOR MIXING LOGIC
      // Check distance to text centers to dye particles
      // Text 1 (White/Harmony)
      const d1 = Math.sqrt((p.x - t1Pos.x)**2 + (p.y - t1Pos.y)**2);
      // Text 2 (Cyan/Resonance)
      const d2 = Math.sqrt((p.x - t2Pos.x)**2 + (p.y - t2Pos.y)**2);
      // Text 3 (Magenta/Frequency)
      const d3 = Math.sqrt((p.x - t3Pos.x)**2 + (p.y - t3Pos.y)**2);

      const influenceRadius = isMobile ? 4 : 5;
      
      // Reset to base
      tempColor.copy(p.baseColor);

      if (d1 < influenceRadius) tempColor.lerp(colorWhite, (1 - d1/influenceRadius) * 0.8);
      if (d2 < influenceRadius) tempColor.lerp(colorCyan, (1 - d2/influenceRadius) * 0.8);
      if (d3 < influenceRadius) tempColor.lerp(colorMagenta, (1 - d3/influenceRadius) * 0.8);

      meshRef.current.setColorAt(i, tempColor);

      // Update position
      dummy.position.set(p.x, p.y, targetZ);
      
      const scale = Math.max(0.1, (targetZ + 6) / 8);
      dummy.scale.set(scale, scale, scale);
      
      // Subtle rotation
      dummy.rotation.set(t * p.factor * 0.5, t * p.factor * 0.5, 0);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={['#05020a']} />
      
      {/* Background Atmosphere - Dreamier */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={0.5} />
      <fog attach="fog" args={['#05020a', 5, 50]} />

      {/* Softer Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#d8b4fe" /> {/* Lavender */}
      <pointLight position={[-10, -10, -5]} intensity={1.5} color="#67e8f9" /> {/* Cyan */}

      {/* Floating 3D Text Group with Sparkles */}
      <group position={[0, 0, 0]}>
        
        {/* CENTER TEXT - HARMONY */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.5, 0.5]}>
          <group position={[0, isMobile ? 3 : 0, 4]}>
            <Text
              ref={text1Ref}
              fontSize={isMobile ? 1.5 : 2.5}
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              maxWidth={viewport.width * 0.9}
            >
              HARMONY
              <meshStandardMaterial emissive="#fff" emissiveIntensity={0.5} toneMapped={false} />
            </Text>
            {/* Dispersion Sparkles */}
            <Sparkles count={30} scale={isMobile ? 3 : 5} size={4} speed={0.4} opacity={0.5} color="#ffffff" />
          </group>
        </Float>

        {/* LEFT/TOP TEXT - RESONANCE */}
        <Float speed={3} rotationIntensity={0.3} floatIntensity={0.8} floatingRange={[-1, 1]}>
          <group position={isMobile ? [0, 0, 2] : [-6, 3, 2]}>
            <Text
              ref={text2Ref}
              fontSize={isMobile ? 1.2 : 1.5}
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              color="#00ffff"
              anchorX="center"
              anchorY="middle"
            >
              RESONANCE
              <meshStandardMaterial emissive="#00ffff" emissiveIntensity={0.4} toneMapped={false} />
            </Text>
             <Sparkles count={20} scale={isMobile ? 2 : 4} size={3} speed={0.6} opacity={0.6} color="#00ffff" />
          </group>
        </Float>

        {/* RIGHT/BOTTOM TEXT - FREQUENCY */}
        <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6} floatingRange={[-1, 1]}>
          <group position={isMobile ? [0, -3, 2] : [6, -3, 2]}>
            <Text
              ref={text3Ref}
              fontSize={isMobile ? 1.2 : 1.5}
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              color="#ff00ff"
              anchorX="center"
              anchorY="middle"
            >
              FREQUENCY
              <meshStandardMaterial emissive="#ff00ff" emissiveIntensity={0.4} toneMapped={false} />
            </Text>
             <Sparkles count={20} scale={isMobile ? 2 : 4} size={3} speed={0.5} opacity={0.6} color="#ff00ff" />
          </group>
        </Float>

      </group>

      {/* The Particle Field */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL]}>
        {/* Use Sphere for softer look */}
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.6} 
            vertexColors // Enable instance color mixing
        />
      </instancedMesh>
    </>
  );
};

export default HarmonicEffect;