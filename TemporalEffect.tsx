import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import './types';

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
    const width = 1200; 
    const height = 800; // Increased height for wrapping
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) return [];

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Config for text wrapping
    const text = "I still remember your light";
    const fontSize = isMobile ? 120 : 160;
    ctx.font = `900 ${fontSize}px "Times New Roman", serif`;
    
    // Basic word wrap logic
    const words = text.split(' ');
    let line = '';
    const lines = [];
    // Mobile needs tighter margins
    const maxWidth = width * (isMobile ? 0.9 : 0.8); 

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines centered
    const lineHeight = fontSize * 1.1;
    const startY = (height - (lines.length * lineHeight)) / 2 + lineHeight/2;

    lines.forEach((l, i) => {
        ctx.fillText(l, width / 2, startY + i * lineHeight);
    });

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const pData: ParticleData[] = [];
    // Higher density for clearer text
    const step = isMobile ? 5 : 4; 

    // Calculate dynamic scaling factor to fit viewport
    // Map canvas pixel space to viewport world space
    const targetWorldWidth = viewport.width * (isMobile ? 0.9 : 0.7);
    const scale = targetWorldWidth / 1000; // rough approx

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
            returnForce: 0.02 + Math.random() * 0.04, // Slightly stronger return
            drag: 0.85 + Math.random() * 0.05,
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

      // 1. Mouse Interaction (Reduced Radius)
      const dx = mx - p.x;
      const dy = my - p.y;
      const distSq = dx*dx + dy*dy;
      // Smaller radius so text remains readable while particles dance around cursor
      const mouseRadius = 2.5; 

      if (distSq < mouseRadius * mouseRadius) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / mouseRadius) * 2.0;
        
        // Swirl instead of just explode
        const angle = Math.atan2(dy, dx);
        
        p.vx -= Math.cos(angle) * force * 0.2;
        p.vy -= Math.sin(angle) * force * 0.2;
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
      const baseSize = isMobile ? 1.2 : 1.0; 
      dummy.scale.setScalar(scale * baseSize);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <color attach="background" args={['#050505']} />
      
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
          color="#fbbf24" 
          roughness={0.2} 
          metalness={0.5} 
          emissive="#d97706" 
          emissiveIntensity={0.8}
        />
      </instancedMesh>

      {/* HTML UI Layer for the Capsule */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div 
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: '90%',
            maxWidth: '500px',
            pointerEvents: 'auto'
          }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-center shadow-xl">
            <p className="text-amber-100/90 font-serif text-sm leading-relaxed tracking-wide">
              一起经历了那么多，被风吹散过，但我还记得你闪闪发光的样子，忍不住还要悄悄靠近你。
            </p>
          </div>
        </div>
      </Html>
    </>
  );
};

export default TemporalEffect;