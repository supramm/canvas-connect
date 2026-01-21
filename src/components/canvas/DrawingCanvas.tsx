import React, { useRef, useEffect, useCallback } from 'react';
import { Point, DrawingStroke, CanvasState, renderCanvas, drawStroke } from '@/lib/canvas-engine';
import { User } from '@/hooks/useDrawingState';

interface DrawingCanvasProps {
  canvasState: CanvasState;
  currentStroke: DrawingStroke | null;
  users: User[];
  currentUserId: string;
  onDrawStart: (point: Point) => void;
  onDrawMove: (point: Point) => void;
  onDrawEnd: () => void;
  onCursorMove: (point: Point, isDrawing: boolean) => void;
}

export function DrawingCanvas({
  canvasState,
  currentStroke,
  users,
  currentUserId,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onCursorMove,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  // Get point from event
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure: 0.5,
    };
  }, []);

  // Mouse/touch handlers
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getPoint(e);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    onDrawStart(point);
    onCursorMove(point, true);
  }, [getPoint, onDrawStart, onCursorMove]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getPoint(e);
    
    // Always send cursor position
    onCursorMove(point, isDrawingRef.current);

    if (!isDrawingRef.current) return;
    
    // Throttle point collection for smooth drawing
    if (lastPointRef.current) {
      const dx = point.x - lastPointRef.current.x;
      const dy = point.y - lastPointRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only add point if moved enough
      if (distance < 2) return;
    }
    
    lastPointRef.current = point;
    onDrawMove(point);
  }, [getPoint, onDrawMove, onCursorMove]);

  const handleEnd = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      onDrawEnd();
      onCursorMove({ x: 0, y: 0 }, false);
    }
  }, [onDrawEnd, onCursorMove]);

  // Render main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCanvas(ctx, canvasState, canvas.width, canvas.height);

    // Draw current stroke preview
    if (currentStroke && currentStroke.points.length >= 2) {
      drawStroke(ctx, currentStroke);
    }
  }, [canvasState, currentStroke]);

  // Render cursor overlay
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw other users' cursors
    users.forEach(user => {
      if (user.id === currentUserId || !user.cursorPosition) return;

      const { x, y } = user.cursorPosition;

      // Draw cursor
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = user.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw user name
      ctx.save();
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = user.color;
      ctx.fillText(user.name, x + 12, y + 4);
      ctx.restore();

      // Draw "drawing" indicator
      if (user.isDrawing) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = user.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    });
  }, [users, currentUserId]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      
      if (!container || !canvas || !overlay) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      overlay.width = width * dpr;
      overlay.height = height * dpr;
      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        renderCanvas(ctx, canvasState, width, height);
      }

      const overlayCtx = overlay.getContext('2d');
      if (overlayCtx) {
        overlayCtx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasState]);

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-canvas overflow-hidden"
    >
      {/* Main drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none cursor-crosshair"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      
      {/* Cursor overlay canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
