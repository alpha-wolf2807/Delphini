import React from 'react';
import { HologramViewport } from './HologramViewport';
import { CalibrationSettings, HologramMediaState } from '../types';

interface FourSideRendererProps {
  state: HologramMediaState;
  videoUrl: string | null;
  holdImageUrl: string | null;
  isBlackScreen: boolean;
  calibration: CalibrationSettings;
  showCalibrationGrid?: boolean;
  onVideoEnd?: () => void;
}

export const FourSideRenderer: React.FC<FourSideRendererProps> = ({
  state,
  videoUrl,
  holdImageUrl,
  isBlackScreen,
  calibration,
  showCalibrationGrid = false,
  onVideoEnd
}) => {
  const baseDistance = 270 + (calibration.gap || 0);

  // Quadrants configuration:
  // TOP: 180° rotated (facing down towards center) or 0° depending on prism angle
  // BOTTOM: 0° rotated (facing up towards center)
  // LEFT: 90° rotated (facing right towards center)
  // RIGHT: 270° rotated (facing left towards center)
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
          {/* Center Prism Square */}
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

          {/* Crosshair Lines */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
          
          {/* Radial Alignment Circles */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-cyan-500/10" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-cyan-500/10" />
        </div>
      )}

      {/* 4 Synchronized Quadrant Viewports */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          transform: `translate(${calibration.offsetX}px, ${calibration.offsetY}px)`
        }}
      >
        {quadrants.map((quad, idx) => (
          <HologramViewport
            key={quad.id}
            id={quad.id}
            label={quad.label}
            rotation={quad.angle}
            distance={quad.dist}
            scale={calibration.scale}
            offsetX={0}
            offsetY={0}
            state={state}
            videoUrl={videoUrl}
            holdImageUrl={holdImageUrl}
            isBlackScreen={isBlackScreen}
            isMuted={idx !== 0}
            onVideoEnd={idx === 0 ? onVideoEnd : undefined} // Only trigger onEnded once from master viewport
          />
        ))}
      </div>
    </div>
  );
};
