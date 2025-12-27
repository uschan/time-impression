import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ShadowObject, DustParticle } from './types';
import { ECLIPSE_WORDS } from './constants';

const EclipseEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const objectsRef = useRef<ShadowObject[]>([]);
  const dustRef = useRef<DustParticle[]>([]);
  const mouseRef = useRef({ x: window.innerWidth/2, y: window.innerHeight/2 });

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

      // 1. Setup Text Objects
      const objects: ShadowObject[] = [];
      const cols = 4;
      const rows = 3;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      ctx.font = '900 80px "Arial Black", sans-serif';

      for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            const word = ECLIPSE_WORDS[(i + j * cols) % ECLIPSE_WORDS.length];
            const metrics = ctx.measureText(word);
            const w = metrics.width;
            const h = 50; 

            // Center in cell with some random offset
            const cx = (i + 0.5) * cellW + (Math.random()-0.5) * 80;
            const cy = (j + 0.5) * cellH + (Math.random()-0.5) * 80;

            objects.push({
                text: word,
                x: cx,
                y: cy,
                originX: cx,
                originY: cy,
                vx: 0,
                vy: 0,
                width: w,
                height: h
            });
        }
      }
      objectsRef.current = objects;
      
      // 2. Setup Ambient Dust
      const dust: DustParticle[] = [];
      for(let i=0; i<150; i++) {
          dust.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: Math.random() * 2,
              alpha: Math.random() * 0.5
          });
      }
      dustRef.current = dust;
    };

    const drawVolumetricShadow = (obj: ShadowObject, mx: number, my: number) => {
        const dx = obj.x - mx;
        const dy = obj.y - my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Shadow Length - gets longer when light is close
        const shadowLen = 3000; 

        // Corners for shadow projection
        const corners = [
            { x: obj.x - obj.width/2, y: obj.y - obj.height/2 }, // TL
            { x: obj.x + obj.width/2, y: obj.y - obj.height/2 }, // TR
            { x: obj.x + obj.width/2, y: obj.y + obj.height/2 }, // BR
            { x: obj.x - obj.width/2, y: obj.y + obj.height/2 }, // BL
        ];

        // Create Shadow Path
        ctx.beginPath();
        
        // Simple hull algorithm for rects: project all points, form a shape
        // For efficiency, we just project the quad formed by the outermost points relative to light
        // But simply drawing quads for each edge works well for "volume"
        
        corners.forEach((c, i) => {
             const nextC = corners[(i+1)%4];
             
             // Project both points away from light
             const angle1 = Math.atan2(c.y - my, c.x - mx);
             const angle2 = Math.atan2(nextC.y - my, nextC.x - mx);
             
             const p1x = c.x + Math.cos(angle1) * shadowLen;
             const p1y = c.y + Math.sin(angle1) * shadowLen;
             const p2x = nextC.x + Math.cos(angle2) * shadowLen;
             const p2y = nextC.y + Math.sin(angle2) * shadowLen;
             
             ctx.moveTo(c.x, c.y);
             ctx.lineTo(p1x, p1y);
             ctx.lineTo(p2x, p2y);
             ctx.lineTo(nextC.x, nextC.y);
             ctx.lineTo(c.x, c.y);
        });
        
        // Volumetric Fill: Not solid black.
        // It should be a gradient that starts dark near the object and fades out.
        // But since we are doing "Light vs Shadow", and the background is dark,
        // The shadow should essentially mask the light.
        
        // Technique: We are drawing ON TOP of the light. So drawing BLACK works to "cut" the light.
        // Use a linear gradient along the shadow vector to fade the shadow edge (Penumbra simulation)
        
        const angle = Math.atan2(dy, dx);
        const grad = ctx.createLinearGradient(
            obj.x, obj.y, 
            obj.x + Math.cos(angle) * 800, 
            obj.y + Math.sin(angle) * 800
        );
        grad.addColorStop(0, 'rgba(0,0,0,1)'); // Solid shadow near object
        grad.addColorStop(1, 'rgba(0,0,0,0)'); // Fade out far away
        
        ctx.fillStyle = grad;
        // Blur the shadow slightly for realism
        // ctx.filter = 'blur(4px)'; // Too expensive for many objects? Let's try.
        // Performance Note: Blur is expensive. Use gradient for soft feel instead.
        ctx.fill();
    };

    const animate = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // 1. Base Layer: Deep Dark Room
      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. The Light Source (Flashlight)
      // Drawn BEHIND the objects and shadows (conceptually), but we need shadows to BLOCK it.
      // So we draw Light -> Shadows (Black) -> Objects (Grey/Lit).
      
      const lightRadius = 700;
      const lightGrad = ctx.createRadialGradient(mx, my, 0, mx, my, lightRadius);
      lightGrad.addColorStop(0, 'rgba(255, 255, 240, 0.85)'); // Warm bright center
      lightGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.3)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Draw Light
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      // 3. Draw Shadows (Blocking the light)
      const objects = objectsRef.current;
      
      objects.forEach(obj => {
          // Physics: "Light Pressure"
          // Objects move slightly away from light
          const dx = obj.x - mx;
          const dy = obj.y - my;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const pushX = (dx / dist) * Math.max(0, (400 - dist) * 0.05);
          const pushY = (dy / dist) * Math.max(0, (400 - dist) * 0.05);
          
          // Spring back to origin
          const springX = (obj.originX - obj.x) * 0.05;
          const springY = (obj.originY - obj.y) * 0.05;
          
          obj.vx += pushX + springX;
          obj.vy += pushY + springY;
          obj.vx *= 0.9;
          obj.vy *= 0.9;
          
          obj.x += obj.vx;
          obj.y += obj.vy;

          drawVolumetricShadow(obj, mx, my);
      });

      // 4. Draw Objects (The blockers)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 80px "Arial Black", sans-serif';
      
      objects.forEach(obj => {
          // Object styling:
          // If light is close, object face is lit? No, backlight effect usually makes them dark silhouettes.
          // Let's make them dark grey with a faint rim light if close.
          
          const dx = mx - obj.x;
          const dy = my - obj.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const brightness = Math.max(0.1, 1 - dist/800);

          ctx.fillStyle = `rgb(${20 + brightness*30}, ${20 + brightness*30}, ${20 + brightness*30})`;
          ctx.fillText(obj.text, obj.x, obj.y);
          
          // Subtle Rim highlight on the side facing the light
          // Just a simple fillText with offset and clipping is hard. 
          // We'll skip rim light for performance and stick to silhouette aesthetic.
      });

      // 5. Dust Motes (Atmosphere)
      // Only visible in the light
      const dust = dustRef.current;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      
      dust.forEach(p => {
         p.x += p.vx;
         p.y += p.vy;
         
         // Wrap around
         if (p.x < 0) p.x = canvas.width;
         if (p.x > canvas.width) p.x = 0;
         if (p.y < 0) p.y = canvas.height;
         if (p.y > canvas.height) p.y = 0;
         
         // Visibility based on distance to mouse (Light cone)
         const dx = p.x - mx;
         const dy = p.y - my;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         if (dist < lightRadius) {
             const alpha = (1 - dist/lightRadius) * p.alpha;
             ctx.globalAlpha = alpha;
             ctx.beginPath();
             ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
             ctx.fill();
         }
      });
      ctx.globalAlpha = 1;

      // 6. Vignette (Film Noir feel)
      const gradV = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height*0.4, canvas.width/2, canvas.height/2, canvas.height);
      gradV.addColorStop(0, 'rgba(0,0,0,0)');
      gradV.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = gradV;
      ctx.fillRect(0,0,canvas.width, canvas.height);

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
    <div className="relative w-full h-full cursor-none bg-[#050505]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/30 transition-colors shadow-sm text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-white/40 font-serif text-sm tracking-[0.5em] uppercase mix-blend-overlay">
            ECLIPSE / VOLUMETRIC
        </h2>
      </div>
    </div>
  );
};

export default EclipseEffect;