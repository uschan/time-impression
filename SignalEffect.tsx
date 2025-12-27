import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { SignalRow } from './types';
import { SIGNAL_TEXT } from './constants';

const SignalEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const rowsRef = useRef<SignalRow[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

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

      const rows: SignalRow[] = [];
      const fontSize = 40;
      const count = Math.ceil(canvas.height / fontSize) + 2;
      
      for(let i=0; i<count; i++) {
          rows.push({
              text: generateRandomLine(),
              y: i * fontSize,
              speed: 0.5 + Math.random() * 2,
              offset: Math.random() * 1000,
              glitchOffset: 0,
              rgbSplit: 0
          });
      }
      rowsRef.current = rows;
    };

    const generateRandomLine = () => {
        const words = [];
        const lineLen = 10;
        for(let i=0; i<lineLen; i++) {
            words.push(SIGNAL_TEXT[Math.floor(Math.random() * SIGNAL_TEXT.length)]);
        }
        return words.join("   ");
    };

    const animate = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      
      // CRT Background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      // Configure Text
      const fontSize = 40;
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.textBaseline = 'top';

      rowsRef.current.forEach((row, i) => {
          // Move
          row.offset -= row.speed;
          
          // Interaction: Interference
          // If mouse is near this row's Y
          const distY = Math.abs(my - row.y);
          let interference = Math.max(0, 1 - distY / 150); // 150px influence
          
          // Random global glitch spikes
          if (Math.random() < 0.01) interference = 1.0;
          
          // Apply Glitch state
          // 1. Horizontal Shift (Tearing)
          // High interference = large shift
          if (interference > 0.1) {
              row.glitchOffset = (Math.random() - 0.5) * 100 * interference;
              row.rgbSplit = interference * 20; // RGB split amount
              
              // Occasionally change speed
              if (Math.random() < 0.1) row.speed = (Math.random() - 0.5) * 20;
          } else {
              // Decay
              row.glitchOffset *= 0.8;
              row.rgbSplit *= 0.8;
              // Normalize speed
              row.speed += (2 - row.speed) * 0.1;
          }

          // Loop text logic
          const totalWidth = ctx.measureText(row.text).width;
          if (row.offset < -totalWidth) row.offset = 0;
          if (row.offset > 0) row.offset = -totalWidth;

          const x = row.offset + row.glitchOffset;
          const y = row.y;
          
          // Draw with RGB Split (Chromatic Aberration)
          const split = row.rgbSplit;
          
          if (split > 1) {
              ctx.globalCompositeOperation = 'screen';
              
              // Red
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.fillText(row.text, x - split, y);
              ctx.fillText(row.text, x - split + totalWidth, y); // Loop segment
              
              // Green
              ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
              ctx.fillText(row.text, x, y);
              ctx.fillText(row.text, x + totalWidth, y);

              // Blue
              ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
              ctx.fillText(row.text, x + split, y);
              ctx.fillText(row.text, x + split + totalWidth, y);
              
              ctx.globalCompositeOperation = 'source-over';
          } else {
              // Normal white/greenish text
              ctx.fillStyle = '#2a9';
              // Randomly flicker opacity
              ctx.globalAlpha = 0.8 + Math.random() * 0.2;
              ctx.fillText(row.text, x, y);
              ctx.fillText(row.text, x + totalWidth, y);
              ctx.globalAlpha = 1;
          }
      });
      
      // Post-Processing Overlays
      
      // 1. Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for(let i=0; i<canvas.height; i+=4) {
          ctx.fillRect(0, i, canvas.width, 2);
      }
      
      // 2. Rolling Bar (CRT Refresh)
      const barY = (t * 5) % canvas.height;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, barY, canvas.width, 50);

      // 3. Noise
      if (Math.random() < 0.1) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const w = Math.random() * 200;
          const h = Math.random() * 50;
          ctx.fillStyle = 'white';
          ctx.fillRect(x, y, w, h);
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
    <div className="relative w-full h-full cursor-none bg-[#050505] overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-green-500/20 rounded-full hover:bg-green-500/40 transition-colors shadow-sm text-green-400 z-10 border border-green-500/50"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-green-500 font-serif text-sm tracking-[0.5em] uppercase opacity-80 animate-pulse font-bold">
            SIGNAL / GLITCH
        </h2>
      </div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle, transparent 50%, black 150%)'
      }}></div>
    </div>
  );
};

export default SignalEffect;