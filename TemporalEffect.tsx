import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Data structure for particle simulation
interface ParticleData {
  initialX: number;
  initialY: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  returnForce: number;
  drag: number;
  phase: number;
}

const TemporalEffect: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Check if mobile based on viewport aspect ratio
  const isMobile = viewport.width < 10;

  // 1. Generate Particles from Text
  const particles = useMemo(() => {
    const tempCanvas = document.createElement('canvas');
    const width = 1000; 
    const height = 500;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) return [];

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Main Title
    ctx.font = '900 150px "Times New Roman", serif';
    ctx.fillText('TEMPORAL', width / 2, height / 2 - 50);
    
    // Subtitle
    ctx.font = 'italic 40px "Times New Roman", serif';
    ctx.fillText('The Sands of Time', width / 2, height / 2 + 80);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const pData: ParticleData[] = [];
    // Optimization step
    const step = isMobile ? 6 : 4; 

    // Calculate dynamic scaling factor to fit viewport
    const contentPixelWidth = 800;
    const targetWorldWidth = viewport.width * 0.85;
    const scale = targetWorldWidth / contentPixelWidth;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        if (alpha > 128) {
          const px = (x - width / 2) * scale;
          const py = -(y - height / 2) * scale; 
          
          pData.push({
            initialX: px,
            initialY: py,
            x: px,
            y: py,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            returnForce: 0.015 + Math.random() * 0.03,
            drag: 0.90 + Math.random() * 0.05,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    }
    return pData;
  }, [viewport.width, isMobile]);

  // 2. Animation Loop
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    
    const mx = mouse.x * (viewport.width / 2); 
    const my = mouse.y * (viewport.height / 2);

    // Phantom Pendulum Logic
    const pendulumFreq = 0.5;
    const pendulumAmp = viewport.width * 0.4;
    const pX = Math.sin(time * pendulumFreq) * pendulumAmp;
    const pY = Math.cos(time * pendulumFreq) * -2 + (isMobile ? 1 : 2); 
    
    const count = particles.length;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // 1. Mouse Interaction
      const dx = mx - p.x;
      const dy = my - p.y;
      const distSq = dx*dx + dy*dy;
      const mouseRadius = 4;

      if (distSq < mouseRadius * mouseRadius) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / mouseRadius) * 2.0;
        
        p.vx -= (dx / dist) * force * 0.5;
        p.vy -= (dy / dist) * force * 0.5;
        p.vz += Math.random() * force * 0.5;
      }

      // 2. Pendulum Interaction
      const pdx = pX - p.x;
      const pdy = pY - p.y;
      const pDistSq = pdx*pdx + pdy*pdy;
      const pendulumRadius = isMobile ? 3 : 5;
      
      if (pDistSq < pendulumRadius * pendulumRadius) {
          const dist = Math.sqrt(pDistSq);
          const force = (1 - dist / pendulumRadius);
          
          const angle = Math.atan2(pdy, pdx);
          const swirlX = -Math.sin(angle);
          const swirlY = Math.cos(angle);
          
          p.vx += swirlX * force * 0.3 + (Math.random()-0.5) * 0.5;
          p.vy += swirlY * force * 0.3 + (Math.random()-0.5) * 0.5;
          p.vz += force * 0.5;
      }

      // 3. Noise / Turbulence
      const noiseScale = 0.05;
      p.vx += Math.sin(time * 2 + p.y * noiseScale) * 0.002;
      p.vy += Math.cos(time * 1.5 + p.x * noiseScale) * 0.002;

      // 4. Return to Origin
      const ox = p.initialX - p.x;
      const oy = p.initialY - p.y;
      const oz = 0 - p.z;
      
      p.vx += ox * p.returnForce;
      p.vy += oy * p.returnForce;
      p.vz += oz * p.returnForce;

      // 5. Physics Integration
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vz *= p.drag;

      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // Update Matrix
      dummy.position.set(p.x, p.y, p.z);
      
      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      dummy.rotation.set(
          speed * 5 + time, 
          speed * 3 + p.phase, 
          speed * 2
      );
      
      const scale = Math.max(0.1, 1 - Math.abs(p.z) * 0.05);
      const baseSize = isMobile ? 1.5 : 1.0; 
      dummy.scale.setScalar(scale * baseSize);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting optimized for visibility */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffeebb" distance={50} decay={2} />
      <pointLight position={[-10, -5, 5]} intensity={2.0} color="#aaddff" distance={50} decay={2} />
      <pointLight position={[0, 0, 5]} intensity={1.0} color="#ffaa00" distance={15} />

      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, particles.length]}
      >
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial 
          color="#fbbf24" // Bright Amber
          roughness={0.2} 
          metalness={0.5} // Lower metalness to prevent dark shadows
          emissive="#d97706" // Strong orange emissive
          emissiveIntensity={0.8}
        />
      </instancedMesh>
    </>
  );
};

export default TemporalEffect;