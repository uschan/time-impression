
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NoteParticle, WaveWire, WavePoint } from './types';
import { SYNTAX_TEXT } from '../../constants';

const SyntaxFreedomEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 });
  
  const stateRef = useRef<{
    wires: WaveWire[];
    particles: NoteParticle[];
  }>({ wires: [], particles: [] });

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIRE_COUNT = 6;
    const WIRE_SPACING = 70;
    const POINTS_PER_WIRE = 40; 
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const rectWidth = Math.min(600, canvas.width * 0.85);
      const startY = centerY - (WIRE_COUNT * WIRE_SPACING) / 2 + 50;
      const startX = centerX - rectWidth / 2 - 50; 
      const endX = centerX + rectWidth / 2 + 50;
      const wireWidth = endX - startX;

      const wires: WaveWire[] = [];
      for (let i = 0; i < WIRE_COUNT; i++) {
        const points: WavePoint[] = [];
        
        // Organic curve bias for this wire
        const curveBias = (Math.random() - 0.5) * 60;
        const curveFreq = 2 + Math.random() * 2;

        for (let j = 0; j <= POINTS_PER_WIRE; j++) {
           const t = j / POINTS_PER_WIRE;
           const x = startX + t * wireWidth;
           
           // Natural sagging / curve
           const sag = Math.sin(t * Math.PI) * curveBias;
           // Slight random noise
           const noise = Math.sin(t * Math.PI * curveFreq) * 5;
           
           const y = startY + i * WIRE_SPACING + sag + noise;
           
           points.push({
             x,
             y, // Resting Y varies now
             dy: 0,
             vel: 0,
             force: 0
           });
        }

        wires.push({
          points,
          y: startY + i * WIRE_SPACING, // Approx Y
          tension: 0.05 + Math.random() * 0.05, // Varied tension
          damping: 0.94, 
          color: '#333'
        });
      }

      const particles: NoteParticle[] = [];
      const words = SYNTAX_TEXT.split(' ');
      const symbols = ['∑', '∫', '∞', '≠', '≈', '∇', '∂', '∅', '∏'];
      
      let wireIdx = 0;
      let t = 0.05; 
      
      ctx.font = '16px "Courier New", monospace';

      for (let word of words) {
        const wordWidthEstimate = word.length * 0.02; 
        
        if (t + wordWidthEstimate > 0.95) {
          wireIdx = (wireIdx + 1) % WIRE_COUNT;
          t = 0.05;
        }

        for (let char of word) {
           // 15% chance to replace with math symbol
           let displayChar = char;
           if (Math.random() < 0.15) {
               displayChar = symbols[Math.floor(Math.random() * symbols.length)];
           }

           particles.push({
             char: displayChar,
             wireIndex: wireIdx,
             t: t,
             x: 0, y: 0, vx: 0, vy: 0,
             angle: 0,
             floating: false,
             opacity: 1
           });
           t += 0.015; 
        }
        t += 0.02; 
      }

      stateRef.current = { wires, particles };
    };

    const animate = () => {
      const { wires, particles } = stateRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const rectWidth = Math.min(500, canvas.width * 0.8);
      const rectHeight = Math.min(700, canvas.height * 0.8);
      const rectX = centerX - rectWidth / 2;
      const rectY = centerY - rectHeight / 2;

      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(rectX + 20, rectY + 20, rectWidth, rectHeight);

      ctx.fillStyle = '#89CFF0';
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
      
      ctx.save();
      ctx.fillStyle = '#222';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText("SYNTAX", rectX + 30, rectY + rectHeight - 100);
      ctx.font = '36px "Courier New", monospace';
      ctx.fillText("OF", rectX + 30, rectY + rectHeight - 60);
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillText("FREEDOM", rectX + 30, rectY + rectHeight - 20);
      ctx.restore();

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const mouseVy = mouseRef.current.vy;

      wires.forEach(wire => {
         // Propagation
         for (let i = 1; i < wire.points.length - 1; i++) {
            const p = wire.points[i];
            const prev = wire.points[i-1];
            const next = wire.points[i+1];

            // 1D Wave equation force
            // NOTE: We calculate force relative to RESTING positions (p.y) + dy
            const targetY = p.y; // Original rest
            const currentY = p.y + p.dy;
            
            // Laplacian smoothing on displacement
            const force = wire.tension * (prev.dy + next.dy - 2 * p.dy);
            p.vel += force;
            p.vel *= wire.damping;
            p.dy += p.vel;
         }

         // Mouse Interaction
         for (let i = 1; i < wire.points.length - 1; i++) {
           const p = wire.points[i];
           const dx = p.x - mouseX;
           const dy = (p.y + p.dy) - mouseY;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist < 40) {
             const pushForce = Math.abs(mouseVy) * 0.5 + 2; 
             const direction = dy > 0 ? 1 : -1;
             p.vel += direction * pushForce * 0.2;
             p.dy += direction * 2;
           }
         }
         
         wire.points[0].dy = 0;
         wire.points[wire.points.length-1].dy = 0;
      });

      // Draw Wires
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;

      wires.forEach(wire => {
         const pts = wire.points;
         ctx.moveTo(pts[0].x, pts[0].y + pts[0].dy);
         for (let i = 1; i < pts.length - 2; i++) {
           const xc = (pts[i].x + pts[i+1].x) / 2;
           // Important: use stored Y + displacement DY
           const yc = (pts[i].y + pts[i].dy + pts[i+1].y + pts[i+1].dy) / 2;
           ctx.quadraticCurveTo(pts[i].x, pts[i].y + pts[i].dy, xc, yc);
         }
         const last = pts[pts.length-1];
         const secondLast = pts[pts.length-2];
         ctx.quadraticCurveTo(secondLast.x, secondLast.y + secondLast.dy, last.x, last.y + last.dy);
      });
      ctx.stroke();

      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';

      particles.forEach(p => {
        const wire = wires[p.wireIndex];
        const pts = wire.points;
        const totalPts = pts.length - 1;
        
        const floatIdx = p.t * totalPts;
        const idx = Math.floor(floatIdx);
        const subT = floatIdx - idx;
        
        const p1 = pts[idx];
        const p2 = pts[Math.min(idx+1, totalPts)];
        
        const wireX = p1.x + (p2.x - p1.x) * subT;
        const wireY = (p1.y + p1.dy) * (1 - subT) + (p2.y + p2.dy) * subT;
        
        const dx = p2.x - p1.x;
        const dy = (p2.y + p2.dy) - (p1.y + p1.dy);
        const wireAngle = Math.atan2(dy, dx);
        
        const wireVel = p1.vel * (1 - subT) + p2.vel * subT;

        if (!p.floating) {
          p.x = wireX;
          p.y = wireY;
          p.angle = wireAngle;
          
          if (Math.abs(wireVel) > 4.0) {
             p.floating = true;
             p.vx = (Math.random() - 0.5) * 5;
             p.vy = wireVel * 1.5; 
             p.angle += (Math.random() - 0.5);
          }
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.vx *= 0.99;
          p.angle += p.vx * 0.05;
          
          const dxHome = wireX - p.x;
          const dyHome = wireY - p.y;
          p.vx += dxHome * 0.005;
          p.vy += dyHome * 0.005;
          
          const distSq = dxHome*dxHome + dyHome*dyHome;
          if (distSq < 100 && Math.abs(p.vy) < 2) {
            p.floating = false;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const vx = e.clientX - mouseRef.current.x;
      const vy = e.clientY - mouseRef.current.y;
      mouseRef.current = { x: e.clientX, y: e.clientY, vx, vy };
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
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm text-gray-600 hover:text-blue-500 z-10"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

export default SyntaxFreedomEffect;
