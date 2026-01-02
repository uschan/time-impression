
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TEXT_CONTENT } from './constants';

interface EmberChar {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  life: number; // 1.0 = fresh, < 0 = gone
  state: 'STABLE' | 'BURNING' | 'ASH';
  heat: number; // 0 to 1
  delay: number; // Random delay before burning fully
}

const EmberEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const particlesRef = useRef<EmberChar[]>([]);
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
    const FONT_SIZE = 12; 
    const CHAR_SPACING = 7;
    const LINE_HEIGHT = 14;
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: EmberChar[] = [];
      const cols = Math.floor(canvas.width / CHAR_SPACING);
      const rows = Math.floor(canvas.height / LINE_HEIGHT);
      
      const text = TEXT_CONTENT.replace(/\n/g, ' ').repeat(10);
      let charIdx = 0;
      
      const marginX = 20;
      const marginY = 40;
      
      // Create grid of text
      for(let y = marginY; y < canvas.height - marginY; y += LINE_HEIGHT) {
          for(let x = marginX; x < canvas.width - marginX; x += CHAR_SPACING) {
              if (charIdx >= text.length) charIdx = 0;
              
              const char = text[charIdx++];
              if (char === ' ') continue;

              particles.push({
                  char,
                  x,
                  y,
                  originX: x,
                  originY: y,
                  vx: 0,
                  vy: 0,
                  life: 1.0,
                  state: 'STABLE',
                  heat: 0,
                  delay: Math.random() * 20
              });
          }
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      // 1. Dark Background with subtle flicker
      const flicker = Math.random() * 0.02;
      ctx.fillStyle = `rgba(5, 1, 0, ${0.2 + flicker})`; // Clearing with transparency for slight trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      const time = Date.now() * 0.002;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${FONT_SIZE}px "Courier New", monospace`;

      let activeCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        if (p.life <= 0) continue;
        activeCount++;

        // Interaction
        if (p.state === 'STABLE') {
            const dx = mx - p.x;
            const dy = my - p.y;
            const distSq = dx*dx + dy*dy;
            
            // Heat up if mouse is near
            // Reduced from 10000 (100px) to 400 (20px) for precise burning/drawing
            if (distSq < 400) { 
                p.heat += 0.2; // Increase heat rate for quick swipes
                if (p.heat > 0.8) {
                    p.state = 'BURNING';
                }
            } else {
                // Cool down slightly if not burnt yet
                p.heat = Math.max(0, p.heat - 0.01);
            }
        } else if (p.state === 'BURNING') {
            p.delay--;
            if (p.delay <= 0) {
                p.state = 'ASH';
                // Initial upward burst
                p.vy = -0.5 - Math.random() * 1.0;
                p.vx = (Math.random() - 0.5) * 1;
            }
        }

        // Physics & Render
        if (p.state === 'STABLE') {
            // Slight heat shimmer
            const jitterX = p.heat > 0 ? (Math.random()-0.5) * p.heat * 2 : 0;
            const jitterY = p.heat > 0 ? (Math.random()-0.5) * p.heat * 2 : 0;
            
            // Color mapping: Grey -> Red -> White
            let color = '#333';
            if (p.heat > 0.3) color = '#521'; // Dull red
            if (p.heat > 0.6) color = '#f40'; // Bright orange
            if (p.heat > 0.9) color = '#fff'; // White hot
            
            ctx.fillStyle = color;
            // Add glow if heating up
            if (p.heat > 0.5) {
                ctx.shadowColor = '#f40';
                ctx.shadowBlur = p.heat * 10;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.fillText(p.char, p.x + jitterX, p.y + jitterY);
            
        } else if (p.state === 'BURNING') {
            // Intense flickering
            const flicker = Math.random();
            ctx.fillStyle = flicker > 0.5 ? '#fff' : '#f80';
            ctx.shadowColor = '#f40';
            ctx.shadowBlur = 15;
            
            ctx.fillText(p.char, p.x + (Math.random()-0.5)*2, p.y + (Math.random()-0.5)*2);

        } else if (p.state === 'ASH') {
            // Float upwards with turbulence
            p.x += p.vx + Math.sin(p.y * 0.05 + time) * 0.5;
            p.y += p.vy;
            
            // Gravity/Buoyancy
            p.vy -= 0.02; // Accelerate up
            
            // Fade out
            p.life -= 0.008;
            
            // Render Ash
            const size = FONT_SIZE * p.life;
            if (size > 0.5) {
                ctx.shadowBlur = 0;
                // Ash color: dark grey/black
                ctx.fillStyle = `rgba(80, 80, 80, ${p.life})`;
                
                // Maybe draw as a small particle instead of char
                ctx.beginPath();
                ctx.arc(p.x, p.y, size/3, 0, Math.PI*2);
                ctx.fill();
                
                // Occasional lingering ember spark
                if (Math.random() < 0.05 && p.life > 0.5) {
                     ctx.fillStyle = `rgba(255, 100, 0, ${p.life})`;
                     ctx.fillRect(p.x, p.y, 1.5, 1.5);
                }
            }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Add Touch Support
    const handleTouchMove = (e: TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (e.touches.length > 0) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });

    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-none bg-[#050100]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-orange-500/50 hover:text-orange-400 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-orange-900/40 font-serif text-sm tracking-[0.5em] uppercase shadow-lg mix-blend-screen">
            EMBER / ASH
        </h2>
      </div>
    </div>
  );
};

export default EmberEffect;
