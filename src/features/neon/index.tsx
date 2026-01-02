
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NeonDrop, FireworkParticle } from './types';
import { NEON_CHARS } from '../../constants';

const NeonEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const dropsRef = useRef<NeonDrop[]>([]);
  const sparksRef = useRef<FireworkParticle[]>([]);
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

      // Config
      const COL_WIDTH = 24;
      const COLUMNS = Math.floor(canvas.width / COL_WIDTH);
      
      const drops: NeonDrop[] = [];
      
      for(let i=0; i<COLUMNS; i++) {
        // Random start time
        const length = 8 + Math.random() * 20;
        const chars = [];
        for(let k=0; k<length; k++) {
            chars.push(NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)]);
        }
        
        drops.push({
            x: i * COL_WIDTH,
            y: Math.random() * -1000, // Start above
            speed: 3 + Math.random() * 4,
            chars: chars,
            colorH: Math.random() < 0.3 ? 320 : (Math.random() < 0.5 ? 180 : 280), // Magenta, Cyan, Purple
            brightness: 0.5 + Math.random() * 0.5,
            fontSize: 16 + Math.random() * 8,
            length: length
        });
      }
      
      dropsRef.current = drops;
      sparksRef.current = [];
    };

    const spawnExplosion = (x: number, y: number) => {
      const count = 40;
      const hueBase = Math.random() * 360;
      
      for(let i=0; i<count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 6;
        const life = 60 + Math.random() * 40;
        
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed + (Math.random()-0.5)*2,
          vy: Math.sin(angle) * speed + (Math.random()-0.5)*2,
          char: NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)],
          color: `hsl(${hueBase + Math.random()*60}, 100%, 70%)`,
          life: life,
          maxLife: life,
          size: 14 + Math.random() * 10
        });
      }
    };

    const animate = () => {
      // Dark Trail Effect (The Matrix fade)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5, 5, 10, 0.25)'; // Slightly faster fade for clearer fireworks
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drops = dropsRef.current;
      const sparks = sparksRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Enable Additive Blending for Glow
      ctx.globalCompositeOperation = 'lighter';

      // --- 1. Rain Logic ---
      drops.forEach(drop => {
         drop.y += drop.speed;
         
         if (drop.y - (drop.length * drop.fontSize) > canvas.height) {
             drop.y = -200;
             drop.speed = 3 + Math.random() * 4;
             drop.x = Math.floor(Math.random() * (canvas.width / 24)) * 24;
             drop.colorH = Math.random() < 0.33 ? 320 : (Math.random() < 0.5 ? 190 : 270);
         }

         // Mouse interaction (Repel)
         const dx = drop.x - mx;
         const dy = drop.y - my;
         const dist = Math.sqrt(dx*dx + dy*dy);
         let activeColorH = drop.colorH;
         let activeBright = drop.brightness;
         
         if (dist < 150) {
             activeBright = 1.0;
             activeColorH = (activeColorH + 180) % 360; 
             drop.y -= 2; 
         }

         ctx.font = `bold ${drop.fontSize}px "Courier New", monospace`;
         
         for(let i=0; i<drop.length; i++) {
             const charY = drop.y - i * drop.fontSize;
             // Skip if offscreen
             if (charY > canvas.height + 50) continue;

             const fade = 1 - (i / drop.length);
             const alpha = fade * activeBright;
             
             if (Math.random() < 0.05) {
                 drop.chars[i] = NEON_CHARS[Math.floor(Math.random() * NEON_CHARS.length)];
             }

             const char = drop.chars[i];
             
             if (i === 0) { // Head
                 ctx.fillStyle = '#fff';
                 ctx.shadowColor = `hsl(${activeColorH}, 100%, 50%)`;
                 ctx.shadowBlur = 15;
             } else {
                 ctx.fillStyle = `hsla(${activeColorH}, 90%, 60%, ${alpha})`;
                 ctx.shadowBlur = 0;
             }
             
             ctx.fillText(char, drop.x, charY);
         }
      });

      // --- 2. Fireworks Logic ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        
        p.life--;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.vx *= 0.96; // Drag
        p.vy *= 0.96;
        
        const alpha = p.life / p.maxLife;
        
        ctx.font = `bold ${p.size}px "Courier New", monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        
        ctx.fillText(p.char, p.x, p.y);
        ctx.globalAlpha = 1.0;
      }
      
      ctx.shadowBlur = 0;
      
      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      spawnExplosion(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-crosshair bg-[#05050a]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-black/50 border border-white/20 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg" style={{textShadow: '0 0 10px rgba(0,255,255,0.5)'}}>
            NEON / FIREWORKS
        </h2>
        <p className="text-white/30 text-[10px] tracking-widest mt-2">CLICK TO DETONATE</p>
      </div>
    </div>
  );
};

export default NeonEffect;
