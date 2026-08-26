import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HologramViewport } from './HologramViewport';
import { CalibrationSettings, HologramMediaState } from '../types';

interface FourSideRendererProps {
  state: HologramMediaState;
  videoUrl: string | null;
  holdImageUrl: string | null;
  isBlackScreen: boolean;
  isLooping?: boolean;
  calibration: CalibrationSettings;
  showCalibrationGrid?: boolean;
  onVideoEnd?: () => void;
}

export const FourSideRenderer: React.FC<FourSideRendererProps> = ({
  state,
  videoUrl,
  holdImageUrl,
  isBlackScreen,
  isLooping = false,
  calibration,
  showCalibrationGrid = false,
  onVideoEnd
}) => {
  // Single Master Video Dual-Buffer Refs (Offscreen)
  const masterVideoA = useRef<HTMLVideoElement | null>(null);
  const masterVideoB = useRef<HTMLVideoElement | null>(null);
  const masterImage = useRef<HTMLImageElement | null>(null);

  const [activeMasterSlot, setActiveMasterSlot] = useState<'A' | 'B' | 'NONE'>('NONE');
  const [slotAUrl, setSlotAUrl] = useState<string | null>(null);
  const [slotBUrl, setSlotBUrl] = useState<string | null>(null);

  // Store 4 Canvas Element References
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const onCanvasRef = useCallback((id: string, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasRefs.current.set(id, canvas);
    } else {
      canvasRefs.current.delete(id);
    }
  }, []);

  const isVideoState = state === 'PLAYING_VIDEO' || state === 'ENTRY_PLAYING';

  // Initialize Master Offscreen Elements
  useEffect(() => {
    const vA = document.createElement('video');
    vA.playsInline = true;
    vA.muted = false;
    vA.preload = 'auto';
    masterVideoA.current = vA;

    const vB = document.createElement('video');
    vB.playsInline = true;
    vB.muted = false;
    vB.preload = 'auto';
    masterVideoB.current = vB;

    const img = new Image();
    masterImage.current = img;

    return () => {
      vA.pause();
      vB.pause();
      masterVideoA.current = null;
      masterVideoB.current = null;
      masterImage.current = null;
    };
  }, []);

  // Update Hold Image Source
  useEffect(() => {
    if (masterImage.current && holdImageUrl) {
      masterImage.current.src = holdImageUrl;
    }
  }, [holdImageUrl]);

  // Master Video Source & Dual-Buffer Swap Management
  useEffect(() => {
    if (isVideoState && videoUrl) {
      if (activeMasterSlot === 'A' && slotAUrl === videoUrl) {
        masterVideoA.current?.play().catch(() => {});
        return;
      }
      if (activeMasterSlot === 'B' && slotBUrl === videoUrl) {
        masterVideoB.current?.play().catch(() => {});
        return;
      }

      if (activeMasterSlot === 'A' || activeMasterSlot === 'NONE') {
        setSlotBUrl(videoUrl);
        if (masterVideoB.current) {
          const v = masterVideoB.current;
          v.src = videoUrl;
          v.loop = isLooping;
          v.currentTime = 0;
          v.onended = () => onVideoEnd?.();
          v.play().then(() => {
            setActiveMasterSlot('B');
          }).catch(err => {
            console.warn('[FourSideRenderer] Master Video B play error:', err);
            setActiveMasterSlot('B');
          });
        }
      } else {
        setSlotAUrl(videoUrl);
        if (masterVideoA.current) {
          const v = masterVideoA.current;
          v.src = videoUrl;
          v.loop = isLooping;
          v.currentTime = 0;
          v.onended = () => onVideoEnd?.();
          v.play().then(() => {
            setActiveMasterSlot('A');
          }).catch(err => {
            console.warn('[FourSideRenderer] Master Video A play error:', err);
            setActiveMasterSlot('A');
          });
        }
      }
    } else if (!isVideoState) {
      setActiveMasterSlot('NONE');
      masterVideoA.current?.pause();
      masterVideoB.current?.pause();
    }
  }, [state, videoUrl, isLooping, onVideoEnd]);

  // Update looping state on active video
  useEffect(() => {
    if (activeMasterSlot === 'A' && masterVideoA.current) {
      masterVideoA.current.loop = isLooping;
    } else if (activeMasterSlot === 'B' && masterVideoB.current) {
      masterVideoB.current.loop = isLooping;
    }
  }, [isLooping, activeMasterSlot]);

  // 60 FPS RequestAnimationFrame Canvas Mirroring Render Loop
  useEffect(() => {
    let animFrameId: number;

    const renderLoop = () => {
      let activeDrawable: HTMLVideoElement | HTMLImageElement | null = null;

      if (state === 'AWAITING_ENTRY' || isBlackScreen || state === 'BLACK_OUT') {
        activeDrawable = null;
      } else if (isVideoState) {
        if (activeMasterSlot === 'A' && masterVideoA.current && masterVideoA.current.readyState >= 2) {
          activeDrawable = masterVideoA.current;
        } else if (activeMasterSlot === 'B' && masterVideoB.current && masterVideoB.current.readyState >= 2) {
          activeDrawable = masterVideoB.current;
        } else if (masterImage.current && masterImage.current.complete && masterImage.current.naturalWidth > 0) {
          activeDrawable = masterImage.current;
        }
      } else {
        if (masterImage.current && masterImage.current.complete && masterImage.current.naturalWidth > 0) {
          activeDrawable = masterImage.current;
        }
      }

      // Synchronously paint activeDrawable onto all 4 canvas viewports at exact same micro-second tick
      canvasRefs.current.forEach((canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!activeDrawable) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(activeDrawable, 0, 0, canvas.width, canvas.height);
        }
      });

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [state, activeMasterSlot, isVideoState, isBlackScreen]);

  const baseDistance = 270 + (calibration.gap || 0);

  const quadrants = [
    { id: 'top', label: 'TOP' as const, angle: 180 + calibration.rotation, dist: baseDistance },
    { id: 'bottom', label: 'BOTTOM' as const, angle: 0 + calibration.rotation, dist: baseDistance },
    { id: 'left', label: 'LEFT' as const, angle: 90 + calibration.rotation, dist: baseDistance },
    { id: 'right', label: 'RIGHT' as const, angle: 270 + calibration.rotation, dist: baseDistance }
  ];

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center"
      style={{
        backgroundColor: '#000000',
        filter: `brightness(${calibration.brightness || 1}) contrast(${calibration.contrast || 1})`
      }}
    >
      {/* Prism Center Target & Alignment Crosshairs in Calibration Mode */}
      {showCalibrationGrid && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          <div 
            className="border-2 border-dashed border-cyan-400/60 rounded-sm"
            style={{
              width: `${calibration.prismSizeMm || 120}px`,
              height: `${calibration.prismSizeMm || 120}px`,
              transform: `translate(${calibration.offsetX}px, ${calibration.offsetY}px)`
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-[10px] text-cyan-400/80 font-mono">
              PRISM CENTER
            </div>
          </div>
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
          <div className="absolute w-[360px] h-[360px] rounded-full border border-cyan-500/10" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-cyan-500/10" />
        </div>
      )}

      {/* 4 Synchronized Canvas Viewports (100% Frame Lock Sync) */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          transform: `translate(${calibration.offsetX}px, ${calibration.offsetY}px)`
        }}
      >
        {quadrants.map((quad) => (
          <HologramViewport
            key={quad.id}
            id={quad.id}
            label={quad.label}
            rotation={quad.angle}
            distance={quad.dist}
            scale={calibration.scale}
            offsetX={0}
            offsetY={0}
            onCanvasRef={onCanvasRef}
          />
        ))}
      </div>
    </div>
  );
};
