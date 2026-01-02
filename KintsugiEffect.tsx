
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Shard, Point } from './types';
import { KINTSUGI_TEXT } from './constants';

const KintsugiEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const shardsRef = useRef<Shard[]>([]);
  const goldTrailRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, lastX: -1000, lastY: -1000 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Text Canvas
    const tCanvas = textCanvasRef.current;
    const tCtx = tCanvas.getContext('2d');
    if (!tCtx) return;

    // --- Configuration ---
    const HEAL_RADIUS = 150;
    
    // Function to draw text on source canvas
    const drawSourceText = () => {
        tCanvas.width = window.innerWidth;
        tCanvas.height = window.innerHeight;
        
        tCtx.fillStyle = '#1a1a1a'; // Background matching app
        tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);
        
        tCtx.fillStyle = '#e0e0e0';
        tCtx.font = '24px "Georgia", serif';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        
        const lines = KINTSUGI_TEXT.split('\n');
        const lineHeight = 40;
        const totalHeight = lines.length * lineHeight;
        const startY = (tCanvas.height - totalHeight) / 2;
        
        lines.forEach((line, i) => {
            // Emphasize the quote
            if (i === 1) {
                tCtx.font = 'italic 28px "Georgia", serif';
                tCtx.fillStyle = '#fff';
            } else {
                tCtx.font = '20px "Georgia", serif';
                tCtx.fillStyle = '#ccc';
            }
            tCtx.fillText(line.trim(), tCanvas.width / 2, startY + i * lineHeight);
        });
    };

    // Robust Shard Generation using Grid Perturbation
    const createShards = () => {
        const width = canvas.width;
        const height = canvas.height;
        
        const polygons: Point[][] = [];
        
        // Grid configuration for irregular shards
        const cols = 6;
        const rows = 5;
        const cellW = width / cols;
        const cellH = height / rows;
        
        // Create a grid of points, perturb them
        const gridPoints: Point[][] = [];
        for(let y=0; y<=rows; y++) {
            const rowArr = [];
            for(let x=0; x<=cols; x++) {
                // Keep edges straight, perturb internal points
                if (x === 0 || x === cols || y === 0 || y === rows) {
                    rowArr.push({ x: x * cellW, y: y * cellH });
                } else {
                    // Internal points jittered to create organic shards
                    rowArr.push({ 
                        x: x * cellW + (Math.random()-0.5) * cellW * 0.8, 
                        y: y * cellH + (Math.random()-0.5) * cellH * 0.8
                    });
                }
            }
            gridPoints.push(rowArr);
        }
        
        // Create quads/triangles from grid
        for(let y=0; y<rows; y++) {
            for(let x=0; x<cols; x++) {
                const p1 = gridPoints[y][x];
                const p2 = gridPoints[y][x+1];
                const p3 = gridPoints[y+1][x+1];
                const p4 = gridPoints[y+1][x];
                
                // Split quad into 2 triangles for more "shard" look
                // Randomize diagonal split
                if (Math.random() > 0.5) {
                    polygons.push([p1, p2, p3]);
                    polygons.push([p1, p3, p4]);
                } else {
                    polygons.push([p1, p2, p4]);
                    polygons.push([p2, p3, p4]);
                }
            }
        }
        
        // Create Shard Objects
        const shards: Shard[] = polygons.map(poly => {
            // Calc center
            let cx = 0, cy = 0;
            poly.forEach(p => { cx += p.x; cy += p.y; });
            cx /= poly.length;
            
            // Random displacement (Broken state)
            const angle = (Math.random() - 0.5) * 0.5; // Slight rotation
            const dist = 50 + Math.random() * 100;
            const dir = Math.random() * Math.PI * 2;
            const offsetX = Math.cos(dir) * dist;
            const offsetY = Math.sin(dir) * dist;
            
            return {
                path: poly,
                center: { x: cx, y: cy },
                
                x: cx + offsetX,
                y: cy + offsetY,
                angle: angle,
                
                targetX: cx,
                targetY: cy,
                targetAngle: 0,
                
                healed: 0,
                
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                va: (Math.random() - 0.5) * 0.002
            };
        });
        
        shardsRef.current = shards;
    };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      drawSourceText();
      createShards();
      goldTrailRef.current = [];
    };

    const animate = () => {
      // Clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const shards = shardsRef.current;
      const trail = goldTrailRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // Update Gold Trail (Mouse movement adds gold)
      if (mx > 0) {
          trail.push({ x: mx, y: my });
          if (trail.length > 50) trail.shift();
      }

      // Update Shards
      shards.forEach(s => {
          // Check proximity to Gold Trail or Mouse
          let distToHeal = Infinity;
          
          // Check mouse
          const dx = mx - s.x;
          const dy = my - s.y;
          distToHeal = Math.min(distToHeal, Math.sqrt(dx*dx + dy*dy));
          
          // Check trail (simple sample)
          for(let i=0; i<trail.length; i+=5) {
              const tx = trail[i].x - s.x;
              const ty = trail[i].y - s.y;
              distToHeal = Math.min(distToHeal, Math.sqrt(tx*tx + ty*ty));
          }
          
          // Healing Logic
          if (distToHeal < HEAL_RADIUS) {
              s.healed = Math.min(1, s.healed + 0.02);
          }
          
          // Movement Logic
          // Lerp between broken state (drift) and target state (healed)
          if (s.healed < 1) {
              // Drift when broken
              s.x += s.vx;
              s.y += s.vy;
              s.angle += s.va;
          }
          
          // Move towards healed state based on 'healed' factor
          const targetX = s.targetX;
          const targetY = s.targetY;
          const targetAngle = s.targetAngle;
          
          if (s.healed > 0) {
              s.x += (targetX - s.x) * 0.1 * s.healed;
              s.y += (targetY - s.y) * 0.1 * s.healed;
              s.angle += (targetAngle - s.angle) * 0.1 * s.healed;
              
              // Reduce drift as it heals
              s.vx *= 0.9;
              s.vy *= 0.9;
              s.va *= 0.9;
          }
      });

      // Render Shards
      shards.forEach(s => {
          ctx.save();
          
          // Transform context to shard's current position/rotation relative to its center
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle);
          ctx.translate(-s.center.x, -s.center.y);
          
          // Define Path for Clipping and Stroking
          ctx.beginPath();
          if (s.path.length > 0) {
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for(let i=1; i<s.path.length; i++) {
                ctx.lineTo(s.path[i].x, s.path[i].y);
            }
            ctx.closePath();
          }
          
          // 1. Draw Text Content (Clipped)
          ctx.save();
          ctx.clip();
          // Draw the full text source; clipping ensures only this shard's piece is seen.
          // Because we transformed the context, the image moves with the shard.
          ctx.drawImage(textCanvasRef.current, 0, 0);
          ctx.restore();
          
          // 2. Draw Gold Seams (Kintsugi Effect)
          if (s.healed > 0.01) {
              const alpha = Math.max(0, s.healed);
              
              // Gold Glow
              ctx.shadowColor = '#FFD700';
              ctx.shadowBlur = 10 * s.healed;
              
              // Gold Stroke
              ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
              ctx.lineWidth = 2 * s.healed;
              ctx.stroke();
              
              ctx.shadowBlur = 0;
          }
          
          ctx.restore();
      });
      
      // Draw Brush Trail
      if (trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length - 1; i++) {
            const xc = (trail[i].x + trail[i + 1].x) / 2;
            const yc = (trail[i].y + trail[i + 1].y) / 2;
            ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
          }
          ctx.lineTo(trail[trail.length-1].x, trail[trail.length-1].y);
          
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#FFD700';
          ctx.shadowColor = '#DAA520';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, lastX: mouseRef.current.x, lastY: mouseRef.current.y };
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
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-yellow-500/50 hover:text-yellow-400 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-yellow-600/40 font-serif text-sm tracking-[0.5em] uppercase shadow-lg">
            KINTSUGI / REPAIR
        </h2>
      </div>
    </div>
  );
};

export default KintsugiEffect;
