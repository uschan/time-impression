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
    // Mobile needs a tighter canvas to keep text readable when scaled down
    const width = 1000; 
    const height = 500;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) return [];

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Adjust font size based on intended density
    // Main Title
    ctx.font = '900 150px "Times New Roman", serif';
    ctx.fillText('TEMPORAL', width / 2, height / 2 - 50);
    
    // Subtitle
    ctx.font = 'italic 40px "Times New Roman", serif';
    ctx.fillText('The Sands of Time', width / 2, height / 2 + 80);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const pData: ParticleData[] = [];
    // Mobile optimization: slightly less particles for performance
    const step = isMobile ? 6 : 4; 

    // Calculate dynamic scaling factor to fit viewport
    // The text in canvas is approx 800px wide.
    // We want it to occupy about 80% of the viewport width.
    const contentPixelWidth = 800;
    const targetWorldWidth = viewport.width * 0.85;
    const scale = targetWorldWidth / contentPixelWidth;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        if (alpha > 128) {
          // Map 2D pixel to 3D world space using the calculated scale
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
            // Particles on the edge return slower (erosion effect)
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
    
    // Mouse Position in World Space
    const mx = mouse.x * (viewport.width / 2); 
    const my = mouse.y * (viewport.height / 2);

    // --- The "Phantom Pendulum" Logic ---
    // An invisible pendulum swings across the screen to create automatic movement
    const pendulumFreq = 0.5;
    const pendulumAmp = viewport.width * 0.4;
    const pX = Math.sin(time * pendulumFreq) * pendulumAmp;
    // It dips down in the middle
    const pY = Math.cos(time * pendulumFreq) * -2 + (isMobile ? 1 : 2); 
    
    const count = particles.length;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // 1. Mouse Interaction (Wind)
      const dx = mx - p.x;
      const dy = my - p.y;
      const distSq = dx*dx + dy*dy;
      const mouseRadius = 4; // Radius 2 world units

      if (distSq < mouseRadius * mouseRadius) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / mouseRadius) * 2.0;
        
        p.vx -= (dx / dist) * force * 0.5;
        p.vy -= (dy / dist) * force * 0.5;
        p.vz += Math.random() * force * 0.5; // Kick up sand
      }

      // 2. Pendulum Interaction (Time Eraser)
      const pdx = pX - p.x;
      const pdy = pY - p.y;
      const pDistSq = pdx*pdx + pdy*pdy;
      const pendulumRadius = isMobile ? 3 : 5;
      
      if (pDistSq < pendulumRadius * pendulumRadius) {
          const dist = Math.sqrt(pDistSq);
          const force = (1 - dist / pendulumRadius);
          
          // Swirl effect
          const angle = Math.atan2(pdy, pdx);
          const swirlX = -Math.sin(angle);
          const swirlY = Math.cos(angle);
          
          p.vx += swirlX * force * 0.3 + (Math.random()-0.5) * 0.5;
          p.vy += swirlY * force * 0.3 + (Math.random()-0.5) * 0.5;
          p.vz += force * 0.5;
      }

      // 3. Noise / Turbulence (Brownian motion)
      // Makes it look like floating dust/sand
      const noiseScale = 0.05;
      p.vx += Math.sin(time * 2 + p.y * noiseScale) * 0.002;
      p.vy += Math.cos(time * 1.5 + p.x * noiseScale) * 0.002;

      // 4. Return to Origin (Elasticity)
      const ox = p.initialX - p.x;
      const oy = p.initialY - p.y;
      const oz = 0 - p.z;
      
      // Hooke's law
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
      
      // Rotate particle to catch light
      // Rotation depends on velocity (spin when moving fast) + time
      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      dummy.rotation.set(
          speed * 5 + time, 
          speed * 3 + p.phase, 
          speed * 2
      );
      
      // Scale: Particles shrink when they fly far away (erosion fade)
      // or scale based on distance from Z plane
      const scale = Math.max(0.1, 1 - Math.abs(p.z) * 0.05);
      // Mobile particles slightly larger for visibility
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
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} />
      {/* Main warm light (Sun/Sand) */}
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#ffcc00" distance={50} decay={2} />
      {/* Rim light (Cool/Time) */}
      <pointLight position={[-10, -5, 5]} intensity={1.5} color="#4488ff" distance={50} decay={2} />
      
      {/* Volumetric-ish glow light near center */}
      <pointLight position={[0, 0, 2]} intensity={0.5} color="#ffaa55" distance={10} />

      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, particles.length]}
      >
        {/* Use a thin box or plane for "flake" look, reflects light better than cube */}
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial 
          color="#d4af37" // Metallic Gold
          roughness={0.3} // Shiny
          metalness={0.8}
          emissive="#553300" // Slight inner glow
          emissiveIntensity={0.2}
        />
      </instancedMesh>
    </>
  );
};

export default TemporalEffect;