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
      
      // High density grid
      const COLUMNS = Math.floor(canvas.width / 30); // Smaller cells
      const ROWS = Math.floor(canvas.height / 20);
      
      const cellW = canvas.width / COLUMNS;
      const cellH = canvas.height / ROWS;
      
      for(let y=0; y<ROWS; y++) {
          for(let x=0; x<COLUMNS; x++) {
              const cx = x * cellW + cellW/2;
              const cy = y * cellH + cellH/2;
              
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
      // Vintage Dark Paper Background
      ctx.fillStyle = '#1a1a1a'; 
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
          
          const maxDist = 250;
          
          let displaceX = 0;
          let displaceY = 0;
          let scale = 1;
          
          // Organic Wave
          const wave = Math.sin(cell.originX * 0.02 + cell.originY * 0.02 + time) * 3;
          
          if (dist < maxDist) {
              const effect = (1 - dist / maxDist);
              const power = effect * effect; // Smoother falloff
              
              const angle = Math.atan2(dy, dx);
              
              // Gentle Push
              const push = 40 * power;
              displaceX = -Math.cos(angle) * push;
              displaceY = -Math.sin(angle) * push;
              
              // Magnify
              scale = 1 + power * 1.5; 
          }
          
          // Physics smoothing
          cell.x += (cell.originX + displaceX - cell.x) * 0.1;
          cell.y += (cell.originY + displaceY + wave - cell.y) * 0.1;
          cell.stretchX += (scale - cell.stretchX) * 0.1;

          // Vintage Typewriter Style
          // Smaller font relative to cell
          const fontSize = Math.min(cell.width, cell.height) * 0.5 * cell.stretchX;
          
          if (fontSize < 2) return; 

          // Using Courier New for that typewriter feel
          ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
          
          // Color logic: Aged white text
          if (cell.stretchX > 1.2) {
             // Highlight
             const t = (cell.stretchX - 1.2) / 1.5;
             ctx.fillStyle = `rgb(255, ${255 - t * 50}, ${200 - t * 100})`;
          } else {
             ctx.fillStyle = '#666'; // Dimmed by default
             // Cursor spotlight
             if (dist < 80) {
                 ctx.fillStyle = '#eee';
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
    <div className="relative w-full h-full cursor-none bg-[#1a1a1a]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors shadow-sm z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-gray-500 font-mono text-xs tracking-widest uppercase">
            KINETIC / TYPEWRITER
        </h2>
      </div>
    </div>
  );
};

export default KineticEffect;