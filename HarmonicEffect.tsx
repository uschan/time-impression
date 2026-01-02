
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// Create a soft glow texture programmatically to avoid external assets
const getGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(230, 200, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(100, 100, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
};

const HarmonicEffect: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse, viewport, camera } = useThree();
  
  // Configuration
  const PARTICLE_COUNT = 4000;
  const isMobile = viewport.width < 10;
  
  // 1. Setup Particles Data
  const { positions, colors, sizes, initialData } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const initData = [];

    const color1 = new THREE.Color('#4f46e5'); // Indigo
    const color2 = new THREE.Color('#ec4899'); // Pink
    const color3 = new THREE.Color('#22d3ee'); // Cyan

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Create a twisted torus / double helix shape
      const t = (i / PARTICLE_COUNT) * Math.PI * 20; // Long spiral
      const radius = 3 + Math.random() * 2; // Tube radius
      
      // Harmonic spiral math
      const x = Math.cos(t) * radius;
      const y = Math.sin(t) * radius * 0.5 + (Math.random()-0.5) * 2;
      const z = (i / PARTICLE_COUNT) * 40 - 20; // Spread along Z axis

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color gradient based on position
      const mixedColor = color1.clone().lerp(color2, (z + 20) / 40).lerp(color3, Math.random() * 0.3);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;

      // Random sizes for depth
      siz[i] = Math.random() * 2;

      initData.push({
        angle: t,
        radius: radius,
        speed: 0.02 + Math.random() * 0.02,
        yOffset: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2
      });
    }
    return { positions: pos, colors: col, sizes: siz, initialData: initData };
  }, []);

  const glowTexture = useMemo(() => getGlowTexture(), []);

  // 2. Animation Loop
  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    
    // Mouse influence (converted to 3D space approx)
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;

    // Heartbeat / Breathing Rhythm
    const heartbeat = Math.sin(time * 2) * 0.1 + Math.sin(time * 8) * 0.05 + 1; // Complex rhythm

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const data = initialData[i];
      const i3 = i * 3;

      // Organic Flow Motion
      // Move along the spiral
      const currentAngle = data.angle + time * data.speed;
      
      // Calculate base position on the spiral
      let x = Math.cos(currentAngle) * data.radius * heartbeat;
      let y = Math.sin(currentAngle) * data.radius * heartbeat + Math.sin(time + data.phase) * 0.5;
      let z = data.baseZ;

      // Mouse Interaction: Magnetic Pull / Swirl
      const dx = mx - x;
      const dy = my - y;
      const distSq = dx*dx + dy*dy;
      const dist = Math.sqrt(distSq);
      
      // If close to mouse, particles get excited and pulled slightly
      if (dist < 8) {
        const force = (1 - dist / 8);
        x += dx * force * 0.1;
        y += dy * force * 0.1;
        // Make them sparkle (size up)
        sizes[i] = (Math.random() * 3 + 2) * heartbeat;
      } else {
        // Normal breathing size
        sizes[i] = (Math.sin(time * 3 + data.phase) + 2) * 0.8;
      }

      // Add wave undulation along Z
      y += Math.sin(z * 0.5 + time) * 1.5;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.size.needsUpdate = true;

    // Subtle camera sway
    camera.position.x = Math.sin(time * 0.1) * 2;
    camera.position.y = Math.cos(time * 0.15) * 2;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <color attach="background" args={['#020205']} />
      
      {/* 1. Deep Space Atmosphere */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={0.5} />
      <fog attach="fog" args={['#020205', 10, 50]} />

      {/* 2. The Flowing Soul Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={sizes.length}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        {/* Magic Material for Glow */}
        <pointsMaterial
          size={isMobile ? 0.3 : 0.4}
          vertexColors
          map={glowTexture}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending} // CRITICAL for the "light" look
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 3. Poetic Typography */}
      {/* Floating independently from particles for readability but visually integrated */}
      <group>
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <Text
            position={[0, 1, 0]}
            fontSize={isMobile ? 1.2 : 2.5}
            font="https://fonts.gstatic.com/s/cormorantgaramond/v16/co3BmX5slCNuHLi8bLeY9MK7whWMhyjYpHtK.woff" // Elegant Serif
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.1}
          >
            Resonance
            <meshBasicMaterial color="#fff" transparent opacity={0.9} toneMapped={false} />
          </Text>
        </Float>

        <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
          <Text
            position={[0, -1.5, 0]}
            fontSize={isMobile ? 0.5 : 0.8}
            font="https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.woff" // Clean Sans
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.3}
          >
            THE UNIVERSE BREATHES WITH YOU
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} toneMapped={false} />
          </Text>
        </Float>
      </group>
      
      {/* 4. Ambient Lighting for Scene (affects standard materials if any) */}
      <ambientLight intensity={0.5} />
    </>
  );
};

export default HarmonicEffect;
