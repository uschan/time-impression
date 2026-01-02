
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { OrbNode } from './types';
import { ORB_CHARS } from '../../constants';

const OrbEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const nodesRef = useRef<OrbNode[]>([]);
  const rotationRef = useRef({ x: 0, y: 0 });
  const momentumRef = useRef({ x: 0.003, y: 0.001 }); // Auto spin
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 });
  const pulseRef = useRef(0); // Time factor for pulse
  const collapseRef = useRef(0); // 0 (normal) to 1 (collapsed)

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const RADIUS = Math.min(window.innerWidth, window.innerHeight) * 0.35;
    const COUNT = 180;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const nodes: OrbNode[] = [];
      // Fibonacci Sphere Distribution
      const phi = Math.PI * (3 - Math.sqrt(5)); 

      for (let i = 0; i < COUNT; i++) {
        const y = 1 - (i / (COUNT - 1)) * 2; // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y); // Radius at y
        
        const theta = phi * i;
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        nodes.push({
          x: x * RADIUS,
          y: y * RADIUS,
          z: z * RADIUS,
          baseX: x * RADIUS,
          baseY: y * RADIUS,
          baseZ: z * RADIUS,
          char: ORB_CHARS[Math.floor(Math.random() * ORB_CHARS.length)],
          phase: Math.random() * Math.PI * 2,
          ring: Math.floor(Math.abs(y) * 5) // Simple ring grouping
        });
      }
      
      nodesRef.current = nodes;
    };

    const animate = () => {
      // 1. Cinematic Background
      ctx.fillStyle = '#020205';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const nodes = nodesRef.current;
      pulseRef.current += 0.02;
      
      // 2. Physics & Interaction
      if (!mouseRef.current.isDown) {
          // Normal Rotation
          rotationRef.current.y += momentumRef.current.x;
          rotationRef.current.x += momentumRef.current.y;
          // Smooth return to normal size
          collapseRef.current *= 0.9;
      } else {
          // Collapse / High Speed Spin
          rotationRef.current.y += 0.1; // Fast spin
          collapseRef.current += (1 - collapseRef.current) * 0.05; // Lerp to 1
      }
      
      const currentCollapse = collapseRef.current;
      
      // Pre-calculate Rotation Matrix
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);

      // 3. Draw Core Glow (Back)
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, RADIUS * 1.2);
      grad.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
      grad.addColorStop(0.4, 'rgba(0, 100, 255, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS * 1.5, 0, Math.PI*2);
      ctx.fill();

      // Project Nodes
      const projectedNodes: {
          x: number, y: number, z: number, scale: number, alpha: number, char: string, isRing: boolean
      }[] = [];

      nodes.forEach(node => {
         // Apply Physics Modifiers
         let modX = node.baseX;
         let modY = node.baseY;
         let modZ = node.baseZ;

         // Pulse Wave effect (scans vertically)
         const wave = Math.sin(pulseRef.current - node.baseY * 0.01);
         const waveExpansion = (wave > 0.8 ? (wave - 0.8) * 40 : 0) * (1 - currentCollapse);

         // Collapse effect
         const collapseFactor = 1 - currentCollapse * 0.8; // Shrink to 20%
         const jitter = currentCollapse * (Math.random() - 0.5) * 50; // Shake when collapsed

         modX = modX * collapseFactor + jitter;
         modY = modY * collapseFactor + jitter;
         modZ = modZ * collapseFactor + jitter;
         
         // Apply expansion
         const len = Math.sqrt(modX*modX + modY*modY + modZ*modZ);
         if (len > 0.001) {
             const scale = (len + waveExpansion) / len;
             modX *= scale;
             modY *= scale;
             modZ *= scale;
         }
         
         // Rotate around Y
         let rx = modX * cosY - modZ * sinY;
         let rz = modX * sinY + modZ * cosY;
         
         // Rotate around X
         let ry = modY * cosX - rz * sinX;
         rz = modY * sinX + rz * cosX;
         
         // Perspective Projection
         const perspective = 1000; 
         const scale = perspective / (perspective + rz);
         
         const x2d = rx * scale + cx;
         const y2d = ry * scale + cy;
         
         // Depth cues
         // Alpha: fade out back nodes significantly
         const alpha = Math.max(0.05, (scale - 0.6) * 2.5); 
         
         projectedNodes.push({
             x: x2d,
             y: y2d,
             z: rz, 
             scale: scale,
             alpha: alpha,
             char: node.char,
             isRing: node.ring % 2 === 0
         });
      });

      // Sort by Z (Painter's algorithm)
      projectedNodes.sort((a, b) => b.z - a.z);

      // 4. Draw Connections (Plexus)
      ctx.lineWidth = 0.8;
      ctx.lineCap = 'round';
      
      const drawLimit = Math.floor(projectedNodes.length * 0.7);
      
      for(let i=0; i<drawLimit; i++) {
          const p1 = projectedNodes[i];
          if (p1.alpha < 0.2) continue; 
          
          for(let j=i+1; j<Math.min(i+12, projectedNodes.length); j++) {
              const p2 = projectedNodes[j];
              
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distSq = dx*dx + dy*dy;
              
              const connectDist = 3600 * (1 - currentCollapse * 0.9); 

              if (distSq < connectDist) {
                   const avgAlpha = (p1.alpha + p2.alpha) / 2;
                   const distAlpha = 1 - (distSq / connectDist);
                   
                   ctx.strokeStyle = `rgba(100, 220, 255, ${avgAlpha * distAlpha * 0.4})`;
                   ctx.beginPath();
                   ctx.moveTo(p1.x, p1.y);
                   ctx.lineTo(p2.x, p2.y);
                   ctx.stroke();
              }
          }
      }

      // 5. Draw Nodes
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      projectedNodes.forEach(p => {
          const size = (12 * p.scale) * (1 - currentCollapse * 0.5);
          
          if (p.alpha > 0.1) {
              ctx.font = `${p.isRing ? 'bold' : 'normal'} ${size}px "Arial", monospace`;
              
              if (currentCollapse > 0.5) {
                 const intensity = Math.floor(currentCollapse * 255);
                 ctx.fillStyle = `rgba(255, ${255-intensity}, 100, ${p.alpha})`;
                 ctx.shadowColor = 'red';
                 ctx.shadowBlur = 20 * currentCollapse;
              } else {
                 const lightness = 50 + Math.floor(p.alpha * 50);
                 ctx.fillStyle = `hsla(190, 80%, ${lightness}%, ${p.alpha})`;
                 
                 if (p.alpha > 0.8) {
                    ctx.shadowColor = '#0ff';
                    ctx.shadowBlur = 10;
                 } else {
                    ctx.shadowBlur = 0;
                 }
              }
              
              ctx.fillText(p.char, p.x, p.y);
          }
      });
      
      ctx.shadowBlur = 0;

      requestRef.current = requestAnimationFrame(animate);
    };

    // Interaction Handlers (Mouse & Touch)
    const handleStart = (clientX: number, clientY: number) => {
        mouseRef.current.isDown = true;
        mouseRef.current.lastX = clientX;
        mouseRef.current.lastY = clientY;
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (mouseRef.current.isDown) {
            const dx = clientX - mouseRef.current.lastX;
            const dy = clientY - mouseRef.current.lastY;
            mouseRef.current.lastX = clientX;
            mouseRef.current.lastY = clientY;
            
            // Influence spin manually
            rotationRef.current.y += dx * 0.005;
            rotationRef.current.x += dy * 0.005;
        }
    };

    const handleEnd = () => {
        mouseRef.current.isDown = false;
        momentumRef.current = { x: 0.02, y: 0.005 };
    };

    // Mouse Listeners
    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    // Touch Listeners
    const onTouchStart = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    const onTouchMove = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            e.preventDefault(); // Prevent scrolling
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    // Add touch support
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing bg-[#020205]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/30 transition-colors shadow-sm text-cyan-200 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-cyan-500/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg" style={{textShadow: '0 0 20px cyan'}}>
            ORB / SINGULARITY
        </h2>
      </div>
    </div>
  );
};

export default OrbEffect;
