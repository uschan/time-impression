
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Scissors, Hand } from 'lucide-react';
import { ClothPoint, ClothConstraint } from './types';
import { THREAD_TEXT } from '../../constants';

const WhaleFallEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const [mode, setMode] = useState<'INTERACT' | 'TEAR'>('INTERACT');

  const requestRef = useRef<number>(0);
  
  const stateRef = useRef<{
    points: ClothPoint[];
    constraints: ClothConstraint[];
    cols: number;
    rows: number;
  }>({ points: [], constraints: [], cols: 0, rows: 0 });
  
  const mouseRef = useRef({ x: -1000, y: -1000, lastX: -1000, lastY: -1000, isDown: false });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Configuration ---
    const SPACING = 18; // Readable text size spacing
    const ITERATIONS = 3; 
    const GRAVITY = 0.15;
    const FRICTION = 0.98;
    const TEAR_THRESHOLD = SPACING * 4; // Tear if stretched 4x
    
    // Aesthetic
    const TEXT_COLOR = '#e0e0e0';
    const BG_COLOR = '#0a0a0a';

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Grid Dimensions
      const cols = Math.ceil(canvas.width / SPACING) + 2;
      const rows = Math.ceil(canvas.height / SPACING/ 1.5); // Tighter vertical spacing for text density
      
      const points: ClothPoint[] = [];
      const constraints: ClothConstraint[] = [];
      
      const fullText = THREAD_TEXT.repeat(Math.ceil((cols * rows) / THREAD_TEXT.length) + 1);
      let charIdx = 0;

      // 1. Create Grid
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x - 1) * SPACING;
          const py = y * (SPACING * 1.5) - 50; // Start slightly above
          
          // Pin the top row
          const pinned = y === 0;

          points.push({
            x: px, y: py,
            oldX: px, oldY: py,
            pinned: pinned,
            char: fullText[charIdx++ % fullText.length]
          });
        }
      }

      // 2. Create Constraints (Structural + Shear)
      const getIndex = (x: number, y: number) => y * cols + x;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = getIndex(x, y);
          
          // Structural (Right)
          if (x < cols - 1) {
            constraints.push({ p1: idx, p2: getIndex(x + 1, y), length: SPACING });
          }
          // Structural (Down)
          if (y < rows - 1) {
            constraints.push({ p1: idx, p2: getIndex(x, y + 1), length: SPACING * 1.5 });
          }
        }
      }

      stateRef.current = { points, constraints, cols, rows };
    };

    const animate = () => {
      const { points, constraints } = stateRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isDown = mouseRef.current.isDown;
      
      // Clear
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- 1. Verlet Physics ---
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.pinned) continue;

        const vx = (p.x - p.oldX) * FRICTION;
        const vy = (p.y - p.oldY) * FRICTION;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx;
        p.y += vy + GRAVITY;

        // Interaction
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx*dx + dy*dy;
        
        if (isDown) {
            if (mode === 'TEAR') {
                // Tearing logic happens in constraints, 
                // but we add a small repulsion here to visualize the cutter
                if (distSq < 400) {
                     const dist = Math.sqrt(distSq);
                     const force = (20 - dist) / 10;
                     p.x += (dx/dist) * force;
                     p.y += (dy/dist) * force;
                }
            } else {
                // Drag / Wave
                if (distSq < 2500) { // 50px radius
                    const dist = Math.sqrt(distSq);
                    const force = (50 - dist) / 50;
                    
                    // Mouse velocity influence
                    const mvx = mx - mouseRef.current.lastX;
                    const mvy = my - mouseRef.current.lastY;
                    
                    p.x += mvx * force * 0.8 + (dx/dist)*force*2;
                    p.y += mvy * force * 0.8 + (dy/dist)*force*2;
                }
            }
        }
        
        // Floor constraint (stacking on floor)
        if (p.y > canvas.height - 20) {
            p.y = canvas.height - 20;
            // Add friction on floor
            const f = 0.5; 
            p.oldX = p.x - (p.x - p.oldX) * f;
        }
      }

      // --- 2. Constraint Solving ---
      // Multiple iterations makes it stiffer (more like cloth, less like jelly)
      for (let i = 0; i < ITERATIONS; i++) {
        for (let c = constraints.length - 1; c >= 0; c--) {
           const con = constraints[c];
           const p1 = points[con.p1];
           const p2 = points[con.p2];

           const dx = p1.x - p2.x;
           const dy = p1.y - p2.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           // TEARING Check
           let broken = false;
           if (dist > TEAR_THRESHOLD) broken = true; // Snap if stretched too far
           
           if (mode === 'TEAR' && isDown) {
               // Cut if line segment intersects mouse
               // Simple proximity check to midpoint
               const midX = (p1.x + p2.x)/2;
               const midY = (p1.y + p2.y)/2;
               const dMouse = (midX-mx)**2 + (midY-my)**2;
               if (dMouse < 225) broken = true; // 15px radius cut
           }

           if (broken) {
               constraints.splice(c, 1);
               continue;
           }

           // Fix Distance
           const diff = (con.length - dist) / dist * 0.5; // Stiffness 0.5 per side = 1.0 total
           const offsetX = dx * diff;
           const offsetY = dy * diff;

           if (!p1.pinned) {
             p1.x += offsetX;
             p1.y += offsetY;
           }
           if (!p2.pinned) {
             p2.x -= offsetX;
             p2.y -= offsetY;
           }
        }
      }

      // --- 3. Render ---
      
      // A. Draw Constraints (Subtle "Threads")
      // Only draw threads if they are stretched, to show "tension"
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)'; // Cyan faint threads
      ctx.lineWidth = 1;
      
      for (let i = 0; i < constraints.length; i++) {
          const con = constraints[i];
          const p1 = points[con.p1];
          const p2 = points[con.p2];
          
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // B. Draw Text (The "Fabric")
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Use Monospace for grid alignment
      ctx.font = '14px "Courier New", monospace';

      for (let i = 0; i < points.length; i++) {
          const p = points[i];
          
          // Skip if offscreen significantly
          if (p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) continue;

          ctx.fillStyle = TEXT_COLOR;
          ctx.fillText(p.char || '.', p.x, p.y);
      }
      
      // Cursor
      if (mode === 'TEAR') {
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mx, my, 15, 0, Math.PI*2);
          ctx.moveTo(mx - 20, my);
          ctx.lineTo(mx + 20, my); // Crosshair
          ctx.moveTo(mx, my - 20);
          ctx.lineTo(mx, my + 20);
          ctx.stroke();
      }

      // Update Mouse Last Pos
      mouseRef.current.lastX = mx;
      mouseRef.current.lastY = my;

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
        // Right click to Tear instantly?
        if (e.button === 2) {
            setMode('TEAR');
        }
        mouseRef.current.isDown = true;
    };
    
    const handleMouseUp = () => {
        mouseRef.current.isDown = false;
    };

    // --- Touch Support ---
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            const t = e.touches[0];
            mouseRef.current.x = t.clientX;
            mouseRef.current.y = t.clientY;
            mouseRef.current.lastX = t.clientX;
            mouseRef.current.lastY = t.clientY;
            mouseRef.current.isDown = true;
        }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (e.touches.length > 0) {
            const t = e.touches[0];
            mouseRef.current.x = t.clientX;
            mouseRef.current.y = t.clientY;
        }
    };
    
    const handleTouchEnd = () => {
        mouseRef.current.isDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Touch Events
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    window.addEventListener('contextmenu', handleContextMenu);
    
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key, mode]);

  return (
    <div className="relative w-full h-full cursor-none bg-[#0a0a0a]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      <div className="absolute top-20 left-4 flex gap-4">
          <button 
            onClick={handleRestart}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white/70 hover:text-white z-10"
            title="Reset Fabric"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            onClick={() => setMode(m => m === 'INTERACT' ? 'TEAR' : 'INTERACT')}
            className={`p-2 rounded-full transition-colors shadow-sm z-10 flex items-center gap-2 ${
                mode === 'TEAR' 
                ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {mode === 'TEAR' ? <Scissors size={20} /> : <Hand size={20} />}
            <span className="text-xs font-serif uppercase tracking-widest hidden sm:inline">
                {mode === 'TEAR' ? 'CUT' : 'TOUCH'}
            </span>
          </button>
      </div>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/30 font-serif text-sm tracking-[0.5em] uppercase opacity-60">
            TEXTILE / {mode === 'TEAR' ? 'DECONSTRUCT' : 'WEAVE'}
        </h2>
      </div>
    </div>
  );
};

export default WhaleFallEffect;
