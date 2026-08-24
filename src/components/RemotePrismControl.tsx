import React from 'react';
import { CalibrationSettings } from '../types';
import { X, Sliders, Sun, Contrast, Maximize, RotateCw, Move, RefreshCw, Save } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface RemotePrismControlProps {
  isOpen: boolean;
  calibration: CalibrationSettings;
  onClose: () => void;
  onUpdateCalibration: (updated: Partial<CalibrationSettings>) => void;
  onSaveCalibration: () => void;
}

export const RemotePrismControl: React.FC<RemotePrismControlProps> = ({
  isOpen,
  calibration,
  onClose,
  onUpdateCalibration,
  onSaveCalibration
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-t-3xl sm:rounded-2xl p-6 border border-cyan-500/40 bg-slate-950 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
              Remote Prism Adjustments
            </h2>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="mt-5 space-y-5">
          {/* Scale */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5 text-cyan-400" /> Hologram Scale
              </span>
              <span className="text-cyan-300 font-bold">{Math.round((calibration.scale || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={calibration.scale || 1.0}
              onChange={(e) => onUpdateCalibration({ scale: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Display Brightness
              </span>
              <span className="text-amber-300 font-bold">{Math.round((calibration.brightness || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={calibration.brightness || 1.0}
              onChange={(e) => onUpdateCalibration({ brightness: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-cyan-400" /> Pepper's Ghost Contrast
              </span>
              <span className="text-cyan-300 font-bold">{Math.round((calibration.contrast || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={calibration.contrast || 1.1}
              onChange={(e) => onUpdateCalibration({ contrast: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-purple-400" /> Quadrant Alignment Rotation
              </span>
              <span className="text-purple-300 font-bold">{calibration.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={calibration.rotation || 0}
              onChange={(e) => onUpdateCalibration({ rotation: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Offsets (X & Y) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span className="flex items-center gap-1"><Move className="w-3 h-3 text-cyan-400" /> Center X</span>
                <span className="text-cyan-300">{calibration.offsetX || 0}px</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="2"
                value={calibration.offsetX || 0}
                onChange={(e) => onUpdateCalibration({ offsetX: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span className="flex items-center gap-1"><Move className="w-3 h-3 text-cyan-400" /> Center Y</span>
                <span className="text-cyan-300">{calibration.offsetY || 0}px</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="2"
                value={calibration.offsetY || 0}
                onChange={(e) => onUpdateCalibration({ offsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-delphini-border flex items-center justify-between">
          <button
            onClick={() => {
              soundFX.playClick();
              onUpdateCalibration({
                scale: 1.0,
                brightness: 1.0,
                contrast: 1.1,
                rotation: 0,
                offsetX: 0,
                offsetY: 0
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>

          <button
            onClick={() => {
              soundFX.playTrigger();
              onSaveCalibration();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-delphini-cyan text-black font-bold text-xs font-mono shadow-glow-cyan flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" /> Save Prism Settings
          </button>
        </div>
      </div>
    </div>
  );
};
