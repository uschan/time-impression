
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { RainDrop } from './types';
import { VAPOR_TEXT } from './config';

const VaporEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // We use offscreen canvases to pre-render the "Sharp" and "Blurred" scenes
  const sharpCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const blurCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const fogMaskCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const mouseRef = useRef({ x: -1000, y: -1000, lastX: -1000, lastY: -1000, isDown: false });
  const dropsRef = useRef<RainDrop[]>([]);
  
  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Offscreen Contexts
    const sharpCanvas = sharpCanvasRef.current;
    const sharpCtx = sharpCanvas.getContext('2d');
    
    const blurCanvas = blurCanvasRef.current;
    const blurCtx = blurCanvas.getContext('2d');

    const fogCanvas = fogMaskCanvasRef.current;
    const fogCtx = fogCanvas.getContext('2d');

    if (!sharpCtx || !blurCtx || !fogCtx) return;

    const init = () => {
      // 1. Resize all canvases
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      canvas.width = w;
      canvas.height = h;
      sharpCanvas.width = w;
      sharpCanvas.height = h;
      blurCanvas.width = w;
      blurCanvas.height = h;
      fogCanvas.width = w;
      fogCanvas.height = h;

      // 2. Draw "Sharp" Scene (The view outside the window)
      // Background: Dark, rainy mood
      const grad = sharpCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a'); // Slate 900
      grad.addColorStop(1, '#020617'); // Slate 950
      sharpCtx.fillStyle = grad;
      sharpCtx.fillRect(0, 0, w, h);
      
      // Add some "city lights" bokeh to background
      for(let i=0; i<30; i++) {
          const bx = Math.random() * w;
          const by = Math.random() * h;
          const br = 20 + Math.random() * 80;
          sharpCtx.beginPath();
          sharpCtx.arc(bx, by, br, 0, Math.PI*2);
          const bColor = Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.05)' : 'rgba(168, 85, 247, 0.05)';
          sharpCtx.fillStyle = bColor;
          sharpCtx.fill();
      }

      // Draw The Poem (Sharp)
      sharpCtx.fillStyle = '#e2e8f0'; // Slate 200
      sharpCtx.font = '24px "Times New Roman", serif';
      sharpCtx.textAlign = 'center';
      sharpCtx.textBaseline = 'middle';
      
      const lines = VAPOR_TEXT.split('\n');
      const lineHeight = 40;
      const startY = (h - lines.length * lineHeight) / 2;
      
      lines.forEach((line, i) => {
          sharpCtx.fillText(line.trim(), w/2, startY + i * lineHeight);
      });

      // 3. Create "Blur" Scene
      // We draw the sharp scene, then apply a heavy blur
      blurCtx.filter = 'blur(12px)'; // Heavy fog
      blurCtx.drawImage(sharpCanvas, 0, 0);
      blurCtx.filter = 'none';

      // 4. Initialize Fog Mask
      // White = Fog exists. Black = Clear.
      // Start completely foggy (White)
      fogCtx.fillStyle = '#ffffff';
      fogCtx.fillRect(0, 0, w, h);

      // 5. Initialize Raindrops
      const drops: RainDrop[] = [];
      const dropCount = 50; 
      for(let i=0; i<dropCount; i++) {
          drops.push(createDrop(w, h));
      }
      dropsRef.current = drops;
    };

    const createDrop = (w: number, h: number): RainDrop => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 2 + Math.random() * 3,
        size: 2 + Math.random() * 3,
        trailLength: 5 + Math.random() * 15
    });

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // --- 1. Update Fog Mask ---
      
      // A. Re-fogging (Thermodynamics)
      // Slowly paint white (fog) over the mask with very low alpha
      fogCtx.globalCompositeOperation = 'source-over';
      fogCtx.fillStyle = 'rgba(255, 255, 255, 0.005)'; // Adjust speed of refogging here
      fogCtx.fillRect(0, 0, w, h);

      // B. Wiping (Interaction)
      // Mouse/Finger acts as eraser (draws Black/Transparent on the White fog mask)
      if (mx > 0) {
          fogCtx.globalCompositeOperation = 'destination-out';
          
          // Reduced radius for precision (was 60, now 25)
          const brushRadius = 25;
          
          const gradient = fogCtx.createRadialGradient(mx, my, brushRadius * 0.2, mx, my, brushRadius);
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          
          fogCtx.fillStyle = gradient;
          fogCtx.beginPath();
          fogCtx.arc(mx, my, brushRadius, 0, Math.PI*2);
          fogCtx.fill();
      }
      
      // C. Rain Wiping
      // Raindrops also cut small paths through the fog
      fogCtx.globalCompositeOperation = 'destination-out';
      dropsRef.current.forEach(d => {
           // Small clear trail behind drop
           fogCtx.lineWidth = d.size;
           fogCtx.lineCap = 'round';
           fogCtx.strokeStyle = 'rgba(0,0,0,0.5)'; // Only partially clears fog
           fogCtx.beginPath();
           fogCtx.moveTo(d.x, d.y);
           fogCtx.lineTo(d.x, d.y - d.trailLength);
           fogCtx.stroke();
      });

      // --- 2. Composite Scenes ---

      // A. Draw Blurred Scene (Base Layer)
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(blurCanvas, 0, 0);

      // B. Mask with Fog
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(fogCanvas, 0, 0);
      
      // C. Put Sharp behind it
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(sharpCanvas, 0, 0);
      
      // Reset
      ctx.globalCompositeOperation = 'source-over';

      // --- 3. Update & Draw Raindrops ---
      // Raindrops act as lenses. They should be clear (Sharp) even if on top of Fog.
      // So we draw them last, sampling from Sharp Canvas.
      
      dropsRef.current.forEach(d => {
          d.y += d.vy;
          d.x += (Math.random() - 0.5) * 0.5; // Jitter
          
          if (d.y > h) {
              d.y = -20;
              d.x = Math.random() * w;
          }

          // Draw the drop
          // It's a circle that reveals the sharp image
          // Visual style: Bright edge, dark inner shadow, sharp content
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI*2);
          
          // Clip to drop shape
          ctx.save();
          ctx.clip();
          
          // Draw Sharp Image (refraction simulation: slightly offset/scaled)
          // Just drawing sharp image at correct position is enough for "clear" look
          ctx.drawImage(sharpCanvas, 0, 0);
          
          ctx.restore();
          
          // Gloss / Highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Shine dot
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(d.x - d.size*0.3, d.y - d.size*0.3, d.size*0.2, 0, Math.PI*2);
          ctx.fill();

          ctx.restore();
      });

      // Update Mouse Last Pos
      mouseRef.current.lastX = mx;
      mouseRef.current.lastY = my;

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    
    // Add touch support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            mouseRef.current.x = e.touches[0].clientX;
            mouseRef.current.y = e.touches[0].clientY;
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
    <div className="relative w-full h-full cursor-none bg-[#020617]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shadow-sm text-slate-300 hover:text-white z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-slate-400/50 font-serif text-sm tracking-[0.5em] uppercase shadow-lg">
            VAPOR / WINDOW
        </h2>
      </div>
    </div>
  );
};

export default VaporEffect;
