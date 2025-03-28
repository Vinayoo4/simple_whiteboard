import React, { useRef, useEffect } from 'react';
import { useWhiteboardStore } from '../store/whiteboard';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    strokes, 
    currentStroke, 
    addPoint, 
    startDrawing, 
    stopDrawing,
    color,
    width 
  } = useWhiteboardStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [strokes, currentStroke, color, width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startDrawing();
    addPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addPoint({ x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-300 rounded-lg shadow-lg bg-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
};