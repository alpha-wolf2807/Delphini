import React, { useRef, useEffect } from 'react';
import { HologramMediaState } from '../types';

interface HologramViewportProps {
  id: string;
  label: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  rotation: number; // in degrees
  distance: number; // distance in px from center
  scale: number;
  offsetX: number;
  offsetY: number;
  state: HologramMediaState;
  videoUrl: string | null;
  holdImageUrl: string | null;
  isBlackScreen: boolean;
  onVideoEnd?: () => void;
}

export const HologramViewport: React.FC<HologramViewportProps> = ({
  label,
  rotation,
  distance,
  scale,
  offsetX,
  offsetY,
  state,
  videoUrl,
  holdImageUrl,
  isBlackScreen,
  onVideoEnd
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (state === 'PLAYING_VIDEO' && videoUrl && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn(`[Viewport ${label}] Video play error:`, err);
      });
    }
  }, [state, videoUrl, label]);

  if (isBlackScreen || state === 'BLACK_OUT') {
    return (
      <div 
        className="absolute bg-black pointer-events-none"
        style={{
          width: '420px',
          height: '240px',
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) translateY(-${distance}px) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      />
    );
  }

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out"
      style={{
        width: '420px',
        height: '240px',
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) translateY(-${distance}px) scale(${scale})`,
        transformOrigin: 'center center'
      }}
    >
      {/* Video View (Active during playback) */}
      {state === 'PLAYING_VIDEO' && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          autoPlay
          onEnded={onVideoEnd}
          className="w-full h-full object-contain bg-black"
          style={{
            backgroundColor: '#000000',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* Hold Image View (Active when video completed or idle) */}
      {(state === 'HOLD_IMAGE' || state === 'IDLE' || (state !== 'PLAYING_VIDEO' && holdImageUrl)) && (
        <img
          src={holdImageUrl || '/assets/images/delphini_idle.png'}
          alt="Hologram Hold"
          className="w-full h-full object-contain bg-black select-none"
          style={{
            backgroundColor: '#000000',
            mixBlendMode: 'screen'
          }}
          onError={(e) => {
            // Fallback placeholder image if not found
            (e.target as HTMLImageElement).src = '/assets/images/delphini_idle.png';
          }}
        />
      )}
    </div>
  );
};
