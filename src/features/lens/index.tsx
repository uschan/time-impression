
import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { BlobPoint } from './types';
import { LENS_TEXT } from '../../constants';

const LensEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [key, setKey] = useState(0); 
  const requestRef = useRef<number>(0);
  
  // Physics State
  const mouseRef = useRef({ x: window.innerWidth/2, y: window.innerHeight/2, vx: 0, vy: 0 });
  const centerRef = useRef({ x: window.innerWidth/2, y: window.innerHeight/2 });
  
  // Blob Vertices
  const pointsRef = useRef<BlobPoint[]>([]);

  const handleRestart = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Offscreen setup
    const bgCanvas = bgCanvasRef.current;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    // --- Configuration ---
    const BLOB_RADIUS = 160;
    const POINT_COUNT = 12; // Number of control points for the shape
    const STIFFNESS = 0.08; // Spring strength
    const DAMPING = 0.82; // Inertia damping
    const MAGNIFICATION = 1.3;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;

      // Initialize Blob Points in a circle
      const points: BlobPoint[] = [];
      for (let i = 0; i < POINT_COUNT; i++) {
          const angle = (Math.PI * 2 * i) / POINT_COUNT;
          points.push({
              x: canvas.width/2 + Math.cos(angle) * BLOB_RADIUS,
              y: canvas.height/2 + Math.sin(angle) * BLOB_RADIUS,
              vx: 0,
              vy: 0,
              baseAngle: angle
          });
      }
      pointsRef.current = points;

      drawBackground(bgCtx);
    };

    const drawBackground = (ctx: CanvasRenderingContext2D) => {
        // High-end Editorial Look
        ctx.fillStyle = '#f2f2f2'; 
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(0,0,0,0.03)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for(let x=0; x<ctx.canvas.width; x+=gridSize) {
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke();
        }

        ctx.fillStyle = '#000';
        ctx.font = '900 120px "Arial", sans-serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '-5px';
        
        // Split text for visual interest
        const cx = ctx.canvas.width/2;
        const cy = ctx.canvas.height/2;
        
        ctx.fillText("LIQUID", cx, cy - 80);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; // Shadow text
        ctx.fillText("FORM", cx, cy + 80);
        
        ctx.fillStyle = '#111';
        ctx.font = '300 24px "Times New Roman", serif';
        ctx.letterSpacing = '2px';
        ctx.fillText("THE AESTHETICS OF FLOW", cx, cy);

        // Floating elements
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - 300, cy - 200, 40, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.fillRect(cx + 280, cy + 180, 20, 20);
    };

    // Helper: Draw smooth curve through points
    const drawBlobPath = (ctx: CanvasRenderingContext2D, points: BlobPoint[]) => {
        ctx.beginPath();
        // Move to the midpoint between the last and first point
        const xc1 = (points[points.length - 1].x + points[0].x) / 2;
        const yc1 = (points[points.length - 1].y + points[0].y) / 2;
        ctx.moveTo(xc1, yc1);

        for (let i = 0; i < points.length; i++) {
            const next = points[(i + 1) % points.length];
            const xc = (points[i].x + next.x) / 2;
            const yc = (points[i].y + next.y) / 2;
            // Quadratic curve uses the point as control point, and midpoint as destination
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.closePath();
    };

    const animate = () => {
      // 1. Move Center with Lag (Smooth follow)
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;
      
      // Calculate mouse velocity for deformation
      mouseRef.current.vx = (targetX - centerRef.current.x) * 0.1;
      mouseRef.current.vy = (targetY - centerRef.current.y) * 0.1;
      
      centerRef.current.x += mouseRef.current.vx;
      centerRef.current.y += mouseRef.current.vy;
      
      const cx = centerRef.current.x;
      const cy = centerRef.current.y;

      // 2. Physics Update for Vertices (Soft Body)
      const points = pointsRef.current;
      const time = Date.now() * 0.002;

      points.forEach((p, i) => {
          // Ideal position (Circle shape)
          // Add sine wave breathing to radius
          const breathe = Math.sin(time + i) * 10;
          const targetRadius = BLOB_RADIUS + breathe;
          
          const idealX = cx + Math.cos(p.baseAngle) * targetRadius;
          const idealY = cy + Math.sin(p.baseAngle) * targetRadius;

          // Spring force towards ideal
          const ax = (idealX - p.x) * STIFFNESS;
          const ay = (idealY - p.y) * STIFFNESS;

          p.vx += ax;
          p.vy += ay;
          
          // Fluid Inertia: Points try to maintain momentum, creating "drag" effect
          // When moving fast, the back points lag, front points compress
          
          p.vx *= DAMPING;
          p.vy *= DAMPING;

          p.x += p.vx;
          p.y += p.vy;
      });

      // 3. Render
      // Draw static BG
      ctx.drawImage(bgCanvasRef.current, 0, 0);

      // --- THE LIQUID LENS ---
      ctx.save();
      
      // Define path
      drawBlobPath(ctx, points);
      ctx.clip(); // Mask everything inside the blob

      // Clear background color behind lens (white/glass)
      ctx.fillStyle = '#f8f8f8';
      ctx.fill();

      // DRAW REFRACTION (Chromattic Aberration)
      // We draw the background multiple times with offsets
      
      const lensW = BLOB_RADIUS * 2;
      const lensH = BLOB_RADIUS * 2;
      const srcW = lensW / MAGNIFICATION;
      const srcH = lensH / MAGNIFICATION;
      
      // Sample around the 'cx, cy' 
      
      const startX = cx - srcW/2;
      const startY = cy - srcH/2;

      // Red Channel
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(bgCanvasRef.current, 
        startX - 8, startY, srcW, srcH, 
        cx - BLOB_RADIUS, cy - BLOB_RADIUS, lensW, lensH
      );
      
      // Blue Channel
      ctx.globalAlpha = 0.8;
      ctx.drawImage(bgCanvasRef.current, 
        startX + 8, startY, srcW, srcH, 
        cx - BLOB_RADIUS, cy - BLOB_RADIUS, lensW, lensH
      );
      
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      
      // --- GLOSSY REFLECTIONS (The "Liquid" look) ---
      
      // 1. Specular Highlights (Plastic/Glass shine)
      
      // Inner Glow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(0.85, 0.85); // Shrink
      ctx.translate(-cx, -cy);
      drawBlobPath(ctx, points);
      
      const grad = ctx.createLinearGradient(cx - 100, cy - 100, cx + 50, cy + 50);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // 2. Sharp "Wet" Highlights
      // Small bright spots
      ctx.beginPath();
      // Offset highlight based on mouse movement (opposite direction) to simulate rotation?
      // Or just static light source from top-left
      ctx.ellipse(cx - BLOB_RADIUS*0.4, cy - BLOB_RADIUS*0.4, 40, 20, Math.PI/4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.filter = 'blur(5px)';
      ctx.fill();
      ctx.filter = 'none';

      // 3. Rim Light (Edge)
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; // Subtle shadow rim
      drawBlobPath(ctx, points);
      ctx.stroke();
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Bright rim
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
      drawBlobPath(ctx, points);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore(); // End Clip

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Direct mapping, physics handles smoothing
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
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
    <div className="relative w-full h-full cursor-none bg-[#f2f2f2]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={handleRestart}
        className="absolute top-20 left-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors shadow-sm text-gray-800 z-10"
      >
        <RotateCcw size={20} />
      </button>
      
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-black font-serif text-sm tracking-[0.5em] uppercase opacity-30">
            LIQUID / SOFT BODY
        </h2>
      </div>
    </div>
  );
};

export default LensEffect;
