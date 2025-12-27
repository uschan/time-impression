import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { KineticCell } from './types';
import { KINETIC_TEXT } from './constants';

const KineticEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const cellsRef = useRef<KineticCell[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const cells: KineticCell[] = [];
      const words = KINETIC_TEXT.split(' ');
      
      // Much higher density
      const COLUMNS = Math.floor(canvas.width / 40);
      const ROWS = Math.floor(canvas.height / 25);
      
      const cellW = canvas.width / COLUMNS;
      const cellH = canvas.height / ROWS;
      
      for(let y=0; y<ROWS; y++) {
          for(let x=0; x<COLUMNS; x++) {
              const cx = x * cellW + cellW/2;
              const cy = y * cellH + cellH/2;
              
              // Pattern generation: alternating words or solid blocks
              const word = words[(x + y * COLUMNS) % words.length];
              
              cells.push({
                  char: word,
                  x: cx,
                  y: cy,
                  originX: cx,
                  originY: cy,
                  width: cellW,
                  height: cellH,
                  stretchX: 1,
                  stretchY: 1,
                  weight: 400 
              });
          }
      }
      cellsRef.current = cells;
    };

    const animate = () => {
      // High contrast aesthetic
      ctx.fillStyle = '#111'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cells = cellsRef.current;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const time = Date.now() * 0.002;

      cells.forEach(cell => {
          const dx = mx - cell.originX;
          const dy = my - cell.originY;
          const distSq = dx*dx + dy*dy;
          const dist = Math.sqrt(distSq);
          
          const maxDist = 300;
          
          let displaceX = 0;
          let displaceY = 0;
          let scale = 1;
          
          // Wave / Ripples
          // Global wave
          const wave = Math.sin(cell.originX * 0.01 + cell.originY * 0.01 + time) * 5;
          
          if (dist < maxDist) {
              const effect = (1 - dist / maxDist);
              const power = effect * effect * effect; // Sharper falloff
              
              // Push away logic (Displacement Map style)
              const angle = Math.atan2(dy, dx);
              
              // Push text away from mouse to create a "lens" or "bubble"
              const push = 60 * power;
              displaceX = -Math.cos(angle) * push;
              displaceY = -Math.sin(angle) * push;
              
              // Magnify
              scale = 1 + power * 2.5; 
          }
          
          // Apply physics smoothing
          cell.x += (cell.originX + displaceX - cell.x) * 0.1;
          cell.y += (cell.originY + displaceY + wave - cell.y) * 0.1;
          cell.stretchX += (scale - cell.stretchX) * 0.1;

          // Render
          const fontSize = Math.min(cell.width, cell.height) * 0.7 * cell.stretchX;
          
          if (fontSize < 2) return; // Optimization

          ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
          
          // Dynamic Color
          // White normally, but turning Cyan/Magenta on high distortion
          if (cell.stretchX > 1.5) {
             const t = (cell.stretchX - 1.5) / 2;
             ctx.fillStyle = `rgb(${255 * (1-t)}, 255, ${255 * (1-t) + 100})`;
          } else {
             ctx.fillStyle = '#444';
             if (Math.abs(mx - cell.x) < 50 && Math.abs(my - cell.y) < 50) {
                 ctx.fillStyle = '#fff';
             }
          }
          
          ctx.fillText(cell.char, cell.x, cell.y);
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
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
    <div className="relative w-full h-full cursor-none bg-[#111]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors shadow-sm z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white font-sans font-black text-sm tracking-tighter uppercase opacity-50">
            KINETIC / DISPLACEMENT
        </h2>
      </div>
    </div>
  );
};

export default KineticEffect;