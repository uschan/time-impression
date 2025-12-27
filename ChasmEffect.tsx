import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AbyssObject } from './types';
import { CHASM_WORDS } from './constants';

interface Debris {
    x: number;
    y: number;
    size: number;
    speed: number;
    angle: number;
    dist: number;
    color: string;
}

const ChasmEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const bodiesRef = useRef<AbyssObject[]>([]);
  const debrisRef = useRef<Debris[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, dragId: -1, lastX: 0, lastY: 0 });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Config
    const CHASM_RADIUS = 60; 
    const EVENT_HORIZON = 180; 

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const bodies: AbyssObject[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      CHASM_WORDS.forEach((word, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 500;
        
        bodies.push({
          id: i,
          text: word,
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          angle: angle + Math.PI/2, 
          angularVelocity: (Math.random() - 0.5) * 0.02,
          isDragging: false,
          state: 'SURFACE',
          depth: 1
        });
      });
      bodiesRef.current = bodies;
      
      // Init Debris (Accretion Disk Particles)
      const debris: Debris[] = [];
      for(let i=0; i<300; i++) {
          debris.push({
              x: 0, y: 0,
              angle: Math.random() * Math.PI * 2,
              dist: CHASM_RADIUS + Math.random() * 400,
              size: Math.random() * 2,
              speed: 0.01 + Math.random() * 0.03,
              color: Math.random() > 0.8 ? '#ff8888' : '#8888ff' // Redshift/Blueshift hint
          });
      }
      debrisRef.current = debris;
      
      mouseRef.current.x = centerX;
      mouseRef.current.y = centerY;
    };

    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 1. Background
      const grad = ctx.createRadialGradient(centerX, centerY, CHASM_RADIUS, centerX, centerY, canvas.width);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.2, '#1a1a1a');
      grad.addColorStop(1, '#050505');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Accretion Debris
      const debris = debrisRef.current;
      debris.forEach(p => {
          // Spiral mechanics
          p.angle += p.speed * (200 / p.dist); // Faster near center
          p.dist -= 0.5; // Fall in
          
          if (p.dist < CHASM_RADIUS) {
              p.dist = 400 + Math.random() * 200;
              p.angle = Math.random() * Math.PI * 2;
          }
          
          const px = centerX + Math.cos(p.angle) * p.dist;
          const py = centerY + Math.sin(p.angle) * p.dist;
          
          // Draw trail-like effect? Just dots for now.
          const alpha = Math.min(1, (p.dist - CHASM_RADIUS) / 100);
          
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI*2);
          ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 3. Draw Black Hole
      ctx.beginPath();
      ctx.arc(centerX, centerY, CHASM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      
      // Accretion disk rings
      ctx.beginPath();
      ctx.arc(centerX, centerY, CHASM_RADIUS + 5, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, CHASM_RADIUS + 20, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
      ctx.stroke();

      // 4. Update Bodies (Words)
      const bodies = bodiesRef.current;

      bodies.forEach(b => {
        if (b.isDragging) {
             const dx = mouseRef.current.x - b.x;
             const dy = mouseRef.current.y - b.y;
             b.vx = dx * 0.1;
             b.vy = dy * 0.1;
             b.x += b.vx;
             b.y += b.vy;
        } else {
             // ORBITAL PHYSICS
             const dx = centerX - b.x;
             const dy = centerY - b.y;
             const distSq = dx*dx + dy*dy;
             const dist = Math.sqrt(distSq);
             
             const gravityStrength = 800 / (dist + 10); 
             const angleToCenter = Math.atan2(dy, dx);
             
             // Gravity
             const ax = Math.cos(angleToCenter) * gravityStrength * 0.05;
             const ay = Math.sin(angleToCenter) * gravityStrength * 0.05;
             
             b.vx += ax;
             b.vy += ay;
             
             b.vx *= 0.99; 
             b.vy *= 0.99;
             
             b.x += b.vx;
             b.y += b.vy;
             
             // Align text
             const moveAngle = Math.atan2(b.vy, b.vx);
             b.angle += (moveAngle - b.angle) * 0.1;
        }

        // Render
        const dx = centerX - b.x;
        const dy = centerY - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let stretch = 1;
        let thinness = 1;
        let alpha = 1;
        
        if (dist < EVENT_HORIZON) {
            const t = Math.max(0, (dist - CHASM_RADIUS) / (EVENT_HORIZON - CHASM_RADIUS));
            stretch = 1 + (1-t) * 4; 
            thinness = 0.2 + t * 0.8; 
            alpha = t; 
        }
        
        if (dist < CHASM_RADIUS) {
            const angle = Math.random() * Math.PI * 2;
            const respawnDist = Math.max(canvas.width, canvas.height) * 0.7;
            b.x = centerX + Math.cos(angle) * respawnDist;
            b.y = centerY + Math.sin(angle) * respawnDist;
            const tangent = angle + Math.PI/2;
            b.vx = Math.cos(tangent) * 4;
            b.vy = Math.sin(tangent) * 4;
        } else {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
            ctx.scale(stretch, thinness);
            
            ctx.fillStyle = b.isDragging ? '#fff' : `rgba(200, 200, 200, ${alpha})`;
            if (dist < EVENT_HORIZON) {
                 ctx.fillStyle = `rgba(255, ${Math.floor(255 * alpha)}, ${Math.floor(255 * alpha)}, ${alpha})`;
            }

            ctx.font = 'bold 24px "Arial Black"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.text, 0, 0);
            
            ctx.restore();
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseDown = (e: MouseEvent) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
        mouseRef.current.lastX = e.clientX;
        mouseRef.current.lastY = e.clientY;

        const bodies = bodiesRef.current;
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            const dx = e.clientX - b.x;
            const dy = e.clientY - b.y;
            if (dx*dx + dy*dy < 1600) { 
                b.isDragging = true;
                mouseRef.current.dragId = b.id;
                break;
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
        mouseRef.current.isDown = false;
        if (mouseRef.current.dragId !== -1) {
            const b = bodiesRef.current.find(b => b.id === mouseRef.current.dragId);
            if (b) {
                b.isDragging = false;
                b.vx = (e.clientX - mouseRef.current.lastX) * 0.2;
                b.vy = (e.clientY - mouseRef.current.lastY) * 0.2;
            }
            mouseRef.current.dragId = -1;
        }
        mouseRef.current.lastX = e.clientX;
        mouseRef.current.lastY = e.clientY;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    init();
    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      cancelAnimationFrame(requestRef.current);
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [key]);

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing bg-[#050505]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-white/50 hover:text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/30 font-serif text-sm tracking-[0.5em] uppercase">
            CHASM / SPAGHETTIFICATION
        </h2>
      </div>
    </div>
  );
};

export default ChasmEffect;