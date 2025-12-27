import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { GalaxyStar } from './types';
import { GALAXY_TEXT } from './constants';

const GalaxyEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const starsRef = useRef<GalaxyStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

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

      const stars: GalaxyStar[] = [];
      const count = 150; // Optimized count
      const words = GALAXY_TEXT.split(' ');
      
      for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 50 + Math.pow(Math.random(), 2) * (Math.min(canvas.width, canvas.height)/2 - 50);
        
        const t = r / (Math.min(canvas.width, canvas.height)/2);
        let color = '#fff';
        if (t < 0.2) color = '#FFFDD0'; 
        else if (t < 0.4) color = '#FFD700'; 
        else if (t < 0.7) color = '#BA55D3'; 
        else color = '#4169E1'; 

        stars.push({
          x: 0, y: 0, z: 0,
          angle: angle + Math.random()*0.5, 
          radius: r,
          speed: 0.002 + (1/r) * 0.5, 
          char: words[i % words.length],
          size: 10 + Math.random() * 8,
          color: color
        });
      }
      starsRef.current = stars;
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.4)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const stars = starsRef.current;
      
      const mx = (mouseRef.current.x - cx) * 0.0005;
      const my = (mouseRef.current.y - cy) * 0.0005;

      stars.forEach(s => {
        s.angle += s.speed;
        
        const rawX = Math.cos(s.angle) * s.radius;
        const rawY = Math.sin(s.angle) * s.radius * 0.6; 
        const rawZ = Math.sin(s.angle) * s.radius * 0.5;
        
        const tiltedY = rawY * Math.cos(my * 10) - rawZ * Math.sin(my * 10);
        const tiltedZ = rawY * Math.sin(my * 10) + rawZ * Math.cos(my * 10);
        
        const tiltedX = rawX * Math.cos(mx * 10) - tiltedZ * Math.sin(mx * 10);
        const finalZ = rawX * Math.sin(mx * 10) + tiltedZ * Math.cos(mx * 10);

        s.x = cx + tiltedX;
        s.y = cy + tiltedY;
        s.z = finalZ;
      });

      stars.sort((a, b) => a.z - b.z);

      // Draw Connections (Optimized)
      // Removed complex gradients inside loop
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.15)'; // Static color, fast rendering
      
      ctx.beginPath();
      for(let i=0; i<stars.length; i++) {
        const s1 = stars[i];
        if (s1.z < 0) continue; 

        // Limit range to avoid N^2
        for(let j=i+1; j<Math.min(i+10, stars.length); j++) {
            const s2 = stars[j];
            const dx = s1.x - s2.x;
            const dy = s1.y - s2.y;
            if (dx*dx + dy*dy < 4000) { 
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
            }
        }
      }
      ctx.stroke();

      // Draw Stars
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      stars.forEach(s => {
        const scale = (s.z + 500) / 500;
        const alpha = Math.max(0.1, Math.min(1, scale));
        
        if (scale > 0) {
            ctx.font = `${Math.max(8, s.size * scale)}px "Arial", sans-serif`;
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.fillText(s.char, s.x, s.y);
        }
      });
      
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

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
    <div className="relative w-full h-full cursor-move bg-[#0a0a0f]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg">
            GALAXY / ORBIT
        </h2>
      </div>
    </div>
  );
};

export default GalaxyEffect;