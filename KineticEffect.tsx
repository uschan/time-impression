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
      
      const COLUMNS = 6;
      const ROWS = 8;
      
      const cellW = canvas.width / COLUMNS;
      const cellH = canvas.height / ROWS;
      
      for(let y=0; y<ROWS; y++) {
          for(let x=0; x<COLUMNS; x++) {
              const cx = x * cellW + cellW/2;
              const cy = y * cellH + cellH/2;
              
              // Pick random word
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
                  weight: 400 // Font weight
              });
          }
      }
      cellsRef.current = cells;
    };

    const animate = () => {
      // Brutalist background
      ctx.fillStyle = '#f2f2f2'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cells = cellsRef.current;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw Grid Lines (Subtle)
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const cellW = cells[0]?.width || 100;
      const cellH = cells[0]?.height || 100;
      
      // Render Cells
      cells.forEach(cell => {
          // Calculate distance to mouse
          const dx = cell.originX - mx;
          const dy = cell.originY - my;
          const distSq = dx*dx + dy*dy;
          const radius = 350; // Influence radius
          
          let targetStretchX = 1;
          let targetStretchY = 1;
          let targetWeight = 400;
          
          if (distSq < radius * radius) {
              const dist = Math.sqrt(distSq);
              const t = 1 - dist / radius;
              // Ease t
              const ease = t * t;
              
              // Calculate direction of stretch
              // If mouse is mostly horizontal relative to cell, stretch width
              const angle = Math.atan2(dy, dx);
              const absCos = Math.abs(Math.cos(angle));
              const absSin = Math.abs(Math.sin(angle));
              
              // STRETCH LOGIC:
              // Push text away creates compression? Or pull creates stretch?
              // Let's make it expand in width/height based on proximity
              
              targetStretchX = 1 + ease * 2.0 * absCos; // Stretch wide
              targetStretchY = 1 + ease * 1.5 * absSin; // Stretch tall
              targetWeight = 400 + ease * 500; // Boldness increases
          }
          
          // Smooth Interpolation (Elastic feel)
          cell.stretchX += (targetStretchX - cell.stretchX) * 0.1;
          cell.stretchY += (targetStretchY - cell.stretchY) * 0.1;
          cell.weight += (targetWeight - cell.weight) * 0.1;
          
          // Draw
          ctx.save();
          ctx.translate(cell.originX, cell.originY);
          
          // Apply variable transform
          ctx.scale(cell.stretchX, cell.stretchY);
          
          // Variable Font Simulation using standard font weights + scaling
          // Since we can't easily animate font-weight property in Canvas smoothy without specific fonts loaded,
          // We will simulate weight/impact by scaling and color.
          
          const fontSize = Math.min(cell.width, cell.height) * 0.25;
          // Use Arial Black or Impact for maximum kinetic feel
          ctx.font = `900 ${fontSize}px "Arial Black", "Impact", sans-serif`;
          
          ctx.fillStyle = '#111';
          
          // If stretched heavily, maybe change color to accent
          if (cell.stretchX > 1.5 || cell.stretchY > 1.5) {
               ctx.fillStyle = '#ff3300'; // Kinetic Orange
          }
          
          ctx.fillText(cell.char, 0, 0);
          
          ctx.restore();
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
    <div className="relative w-full h-full cursor-none bg-[#f2f2f2]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-black font-sans font-black text-sm tracking-tighter uppercase opacity-80">
            KINETIC / VARIABLE
        </h2>
      </div>
    </div>
  );
};

export default KineticEffect;