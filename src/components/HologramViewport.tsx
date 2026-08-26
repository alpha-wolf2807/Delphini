import React, { useEffect, useRef } from 'react';

interface HologramViewportProps {
  id: string;
  label: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  rotation: number; // in degrees
  distance: number; // distance in px from center
  scale: number;
  offsetX: number;
  offsetY: number;
  onCanvasRef: (id: string, canvas: HTMLCanvasElement | null) => void;
}

export const HologramViewport: React.FC<HologramViewportProps> = ({
  id,
  rotation,
  distance,
  scale,
  offsetX,
  offsetY,
  onCanvasRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onCanvasRef(id, canvasRef.current);
    return () => {
      onCanvasRef(id, null);
    };
  }, [id, onCanvasRef]);

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out bg-black overflow-hidden select-none"
      style={{
        width: '420px',
        height: '240px',
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) translateY(-${distance}px) scale(${scale})`,
        transformOrigin: 'center center'
      }}
    >
      <canvas
        ref={canvasRef}
        width={420}
        height={240}
        className="w-full h-full object-contain bg-black select-none pointer-events-none"
        style={{
          backgroundColor: '#000000',
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
};
