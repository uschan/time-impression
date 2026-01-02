
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TEXT_CONTENT } from './constants';

interface GridPoint {
    char: string;
    originX: number;
    originY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const FluidEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const pointsRef = useRef<GridPoint[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const FONT_SIZE = 11;
    const SPACING_X = 14; 
    const SPACING_Y = 18;
    const FONT_FAMILY = '"Courier New", monospace'; // Code/Typewriter feel

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const points: GridPoint[] = [];
      
      const cols = Math.ceil(canvas.width / SPACING_X);
      const rows = Math.ceil(canvas.height / SPACING_Y);
      
      // Generate Content
      const text = TEXT_CONTENT.replace(/\s+/g, '').repeat(20);
      let charIdx = 0;

      for(let y = 0; y < rows; y++) {
          for(let x = 0; x < cols; x++) {
              if (charIdx >= text.length) charIdx = 0;
              
              const char = text[charIdx++];
              const px = x * SPACING_X + SPACING_X/2;
              const py = y * SPACING_Y + SPACING_Y/2;
              
              points.push({
                  char,
                  originX: px,
                  originY: py,
                  x: px,
                  y: py,
                  vx: 0,
                  vy: 0
              });
          }
      }
      pointsRef.current = points;
    };

    const animate = () => {
      const points = pointsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mvx = mouseRef.current.vx;
      const mvy = mouseRef.current.vy;

      // Clear (Dark Background for terminal feel)
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Physics params
      const SPRING = 0.05;
      const FRICTION = 0.92;
      const MOUSE_RADIUS = 150;
      const MOUSE_FORCE = 0.6; // How much it pushes

      for(let i=0; i<points.length; i++) {
          const p = points[i];
          
          // 1. Spring force back to origin
          const dxHome = p.originX - p.x;
          const dyHome = p.originY - p.y;
          
          p.vx += dxHome * SPRING;
          p.vy += dyHome * SPRING;

          // 2. Mouse Interaction (Magnetic Displacement)
          const dx = p.x - mx;
          const dy = p.y - my;
          const distSq = dx*dx + dy*dy;
          
          if (distSq < MOUSE_RADIUS * MOUSE_RADIUS) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist/MOUSE_RADIUS) * MOUSE_FORCE;
              
              // Push away
              // const angle = Math.atan2(dy, dx);
              // p.vx += Math.cos(angle) * force * 15;
              // p.vy += Math.sin(angle) * force * 15;
              
              // OR: Drag with mouse velocity (Fluid feel)
              p.vx += mvx * force * 0.5 + (dx/dist) * force * 2;
              p.vy += mvy * force * 0.5 + (dy/dist) * force * 2;
          }

          // 3. Update
          p.vx *= FRICTION;
          p.vy *= FRICTION;
          
          p.x += p.vx;
          p.y += p.vy;

          // 4. Render
          // Color based on velocity
          const speed = Math.abs(p.vx) + Math.abs(p.vy);
          if (speed > 1) {
              // High energy: Cyan/White
              const alpha = Math.min(1, speed * 0.1);
              ctx.fillStyle = `rgba(100, 255, 218, ${0.5 + alpha * 0.5})`;
          } else {
              // Resting: Dim Gray
              ctx.fillStyle = '#444';
          }
          
          // Optimization: Skip rendering if offscreen
          if (p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) continue;

          ctx.fillText(p.char, p.x, p.y);
      }
      
      // Decay mouse velocity
      mouseRef.current.vx *= 0.8;
      mouseRef.current.vy *= 0.8;

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const vx = e.clientX - mouseRef.current.lastX;
      const vy = e.clientY - mouseRef.current.lastY;
      mouseRef.current = { 
          x: e.clientX, 
          y: e.clientY, 
          vx: vx, 
          vy: vy, 
          lastX: e.clientX, 
          lastY: e.clientY 
      };
      
      // Initialize last pos if first move
      if (mouseRef.current.lastX === -1000) {
          mouseRef.current.lastX = e.clientX;
          mouseRef.current.lastY = e.clientY;
          mouseRef.current.vx = 0;
          mouseRef.current.vy = 0;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-none bg-[#080808]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white/50 hover:text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/20 font-serif text-sm tracking-[0.5em] uppercase">
            FLUID / MAGNETIC
        </h2>
      </div>
    </div>
  );
};

export default FluidEffect;
