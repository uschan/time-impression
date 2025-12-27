import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

const HarmonicEffect: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport, clock } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Configuration
  const COUNT_X = 50;
  const COUNT_Y = 50;
  const TOTAL = COUNT_X * COUNT_Y;
  const SEPARATION = 0.5;

  // Initialize data
  const particles = useMemo(() => {
    const data = [];
    for (let x = 0; x < COUNT_X; x++) {
      for (let y = 0; y < COUNT_Y; y++) {
        data.push({
          x: (x - COUNT_X / 2) * SEPARATION,
          y: (y - COUNT_Y / 2) * SEPARATION,
          z: 0,
          factor: Math.random() * 0.5 + 0.5, // Random speed modifier
          offset: Math.random() * Math.PI * 2,
        });
      }
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    const mx = mouse.x * viewport.width / 2;
    const my = mouse.y * viewport.height / 2;

    for (let i = 0; i < TOTAL; i++) {
      const p = particles[i];
      
      // 1. Wave Motion (Sinusoidal field)
      // Combines multiple waves for "musical" feel
      const zBase = Math.sin(p.x * 0.3 + t * 2) * 2 + Math.cos(p.y * 0.3 + t * 1.5) * 2;
      const noise = Math.sin(p.x * 1 + p.y * 1 + t * 3) * 0.5;
      
      let targetZ = zBase + noise;

      // 2. Interactive Ripple
      const dx = mx - p.x;
      const dy = my - p.y;
      const distSq = dx*dx + dy*dy;
      const radius = 100;
      
      if (distSq < radius) {
          const dist = Math.sqrt(distSq);
          // Push down/away
          const force = (1 - dist / Math.sqrt(radius)) * 5;
          targetZ -= force;
      }

      // Update position
      dummy.position.set(p.x, p.y, targetZ);
      
      // Update Scale based on height (Visualizer style)
      const scale = Math.max(0.2, (targetZ + 5) / 5);
      dummy.scale.set(scale, scale, scale);
      
      // Update Rotation
      dummy.rotation.set(t * p.factor, t * p.factor, 0);

      // Color Shift Logic (Passed via instance color if enabled, but here relying on lights)
      // A simple color shift in material is cheaper.

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={['#0a0510']} />
      
      {/* Background Atmosphere */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#0a0510', 10, 60]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#ff00ff" />
      <pointLight position={[-10, -10, -10]} intensity={2.0} color="#00ffff" />
      
      {/* Floating 3D Text Layers */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-1, 1]}>
        <Text
          position={[0, 0, 5]}
          fontSize={3}
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.9}
        >
          HARMONY
          <meshStandardMaterial emissive="#fff" emissiveIntensity={0.2} toneMapped={false} />
        </Text>
      </Float>

      <Float speed={3} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-2, 2]}>
         <Text
          position={[-8, 4, 2]}
          fontSize={1.5}
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          RESONANCE
        </Text>
      </Float>

      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.8} floatingRange={[-2, 2]}>
         <Text
          position={[8, -4, 2]}
          fontSize={1.5}
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          color="#ff00ff"
          anchorX="center"
          anchorY="middle"
        >
          FREQUENCY
        </Text>
      </Float>

      {/* The Particle Field */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL]}>
        {/* Simple geometric shape for particles */}
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial 
            color="#8888ff" 
            roughness={0.1} 
            metalness={0.8} 
            emissive="#4400ff"
            emissiveIntensity={0.5}
        />
      </instancedMesh>
    </>
  );
};

export default HarmonicEffect;