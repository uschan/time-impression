
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TEXT_CONTENT } from './constants';

interface SandChar {
  char: string;
  x: number; // Grid coordinates, not pixel
  y: number;
  active: boolean; // True if falling
  color: string;
}

const ErosionEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  // Grid State
  const gridRef = useRef<(SandChar | null)[][]>([]);
  const activeParticlesRef = useRef<SandChar[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const FONT_SIZE = 10; // Very small
    const CHAR_W = 6; // approx width for dense packing
    const LINE_H = 10;
    
    // Physics
    const GRAVITY_PROB = 0.9; // Speed factor

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Calculate Grid
      const cols = Math.floor(canvas.width / CHAR_W);
      const rows = Math.floor(canvas.height / LINE_H);
      
      // Initialize empty grid
      const grid: (SandChar | null)[][] = Array(cols).fill(null).map(() => Array(rows).fill(null));
      const active: SandChar[] = [];

      // Fill Grid with Text
      // Repeat text to fill screen
      const text = TEXT_CONTENT.replace(/\n/g, ' ').repeat(20); 
      let charIdx = 0;
      
      const marginX = 4;
      const marginY = 4;
      
      for(let y = marginY; y < rows - marginY; y++) {
          for(let x = marginX; x < cols - marginX; x++) {
              if (charIdx >= text.length) charIdx = 0;
              
              const char = text[charIdx++];
              if (char === ' ') continue; // Don't spawn particles for spaces

              const particle: SandChar = {
                  char,
                  x,
                  y,
                  active: false,
                  color: '#2a2a2a'
              };
              grid[x][y] = particle;
          }
      }

      gridRef.current = grid;
      activeParticlesRef.current = active;
    };

    const updatePhysics = () => {
        const grid = gridRef.current;
        const active = activeParticlesRef.current;
        const cols = grid.length;
        const rows = grid[0].length;
        const mxGrid = Math.floor(mouseRef.current.x / CHAR_W);
        const myGrid = Math.floor(mouseRef.current.y / LINE_H);

        // 1. Wake up particles near mouse
        const brushSize = 5;
        for(let i = -brushSize; i <= brushSize; i++) {
            for(let j = -brushSize; j <= brushSize; j++) {
                if (i*i + j*j > brushSize*brushSize) continue;
                
                const gx = mxGrid + i;
                const gy = myGrid + j;
                
                if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
                    const p = grid[gx][gy];
                    if (p && !p.active) {
                        p.active = true;
                        active.push(p);
                    }
                }
            }
        }

        // 2. Process Active Particles (Bottom-Up logic usually, but here we iterate active list)
        // Optimization: iterate backwards to allow removal
        for (let i = active.length - 1; i >= 0; i--) {
            const p = active[i];
            
            // Random check to simulate varying speed / granular friction
            if (Math.random() > GRAVITY_PROB) continue;

            const x = p.x;
            const y = p.y;
            
            // Try to move down
            if (y < rows - 1) {
                if (grid[x][y+1] === null) {
                    // Fall straight down
                    grid[x][y] = null;
                    p.y++;
                    grid[x][p.y] = p;
                } else {
                    // Try diagonals (sand piling)
                    const leftOpen = x > 0 && grid[x-1][y+1] === null;
                    const rightOpen = x < cols - 1 && grid[x+1][y+1] === null;
                    
                    if (leftOpen && rightOpen) {
                        grid[x][y] = null;
                        p.y++;
                        p.x += Math.random() < 0.5 ? -1 : 1;
                        grid[p.x][p.y] = p;
                    } else if (leftOpen) {
                        grid[x][y] = null;
                        p.y++;
                        p.x--;
                        grid[p.x][p.y] = p;
                    } else if (rightOpen) {
                        grid[x][y] = null;
                        p.y++;
                        p.x++;
                        grid[p.x][p.y] = p;
                    } else {
                        // Stuck
                        // Check if we should sleep?
                        // For simplicity, keep active but maybe optimize later
                        // If completely surrounded, sleep
                    }
                }
            } else {
                // Hit bottom floor
            }
        }
    };

    const animate = () => {
      // Logic
      updatePhysics();

      // Render
      ctx.fillStyle = '#e8e6e1'; // Vintage paper background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const grid = gridRef.current;
      const cols = grid.length;
      const rows = grid[0].length;
      
      // Rendering optimization: Only render occupied cells
      // Since it's a grid, we loop grid? Or loop active + keep a list of static?
      // Looping 200x100 = 20,000 is fine.
      
      for(let x = 0; x < cols; x++) {
          for(let y = 0; y < rows; y++) {
              const p = grid[x][y];
              if (p) {
                  const px = x * CHAR_W + CHAR_W/2;
                  const py = y * LINE_H + LINE_H/2;
                  
                  // Color nuance: Active particles are darker/redder?
                  if (p.active) {
                       ctx.fillStyle = '#111';
                  } else {
                       ctx.fillStyle = '#333';
                  }
                  
                  ctx.fillText(p.char, px, py);
              }
          }
      }

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
    <div className="relative w-full h-full cursor-crosshair bg-[#e8e6e1]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors shadow-sm text-black/60 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-black/40 font-serif text-sm tracking-[0.5em] uppercase">
            EROSION / ENTROPY
        </h2>
      </div>
    </div>
  );
};

export default ErosionEffect;
