import React from 'react';
import { CalibrationSettings } from '../types';
import { Sliders, RotateCcw, Save, X, Eye } from 'lucide-react';

interface CalibrationPanelProps {
  calibration: CalibrationSettings;
  showGrid: boolean;
  onUpdate: (updated: Partial<CalibrationSettings>) => void;
  onToggleGrid: (show: boolean) => void;
  onSave: () => void;
  onClose: () => void;
  onReset: () => void;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  calibration,
  showGrid,
  onUpdate,
  onToggleGrid,
  onSave,
  onClose,
  onReset
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 glass-panel-glow rounded-2xl p-5 border border-delphini-cyan/50 text-slate-100 shadow-2xl bg-slate-950/90 backdrop-blur-lg">
      <div className="flex items-center justify-between pb-3 border-b border-delphini-border">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-delphini-cyan" />
          <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-cyan-300">
            Prism Calibration
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        {/* Toggle Alignment Grid */}
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-300 font-mono flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-delphini-cyan" /> Alignment Grid:
          </span>
          <button
            type="button"
            onClick={() => onToggleGrid(!showGrid)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition-all ${
              showGrid 
                ? 'bg-delphini-cyan/20 border-delphini-cyan text-delphini-cyan shadow-glow-sm' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showGrid ? 'VISIBLE' : 'HIDDEN'}
          </button>
        </div>

        {/* Scale Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1 font-mono">
            <span>Scale</span>
            <span className="text-delphini-cyan">{calibration.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.02"
            value={calibration.scale}
            onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
            className="w-full accent-delphini-cyan cursor-pointer"
          />
        </div>

        {/* Radial Distance / Gap */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1 font-mono">
            <span>Prism Gap / Distance</span>
            <span className="text-delphini-cyan">{calibration.gap}px</span>
          </div>
          <input
            type="range"
            min="-80"
            max="150"
            step="2"
            value={calibration.gap}
            onChange={(e) => onUpdate({ gap: parseInt(e.target.value) })}
            className="w-full accent-delphini-cyan cursor-pointer"
          />
        </div>

        {/* Offset X Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1 font-mono">
            <span>Center Offset X</span>
            <span className="text-delphini-cyan">{calibration.offsetX}px</span>
          </div>
          <input
            type="range"
            min="-200"
            max="200"
            step="2"
            value={calibration.offsetX}
            onChange={(e) => onUpdate({ offsetX: parseInt(e.target.value) })}
            className="w-full accent-delphini-cyan cursor-pointer"
          />
        </div>

        {/* Offset Y Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1 font-mono">
            <span>Center Offset Y</span>
            <span className="text-delphini-cyan">{calibration.offsetY}px</span>
          </div>
          <input
            type="range"
            min="-200"
            max="200"
            step="2"
            value={calibration.offsetY}
            onChange={(e) => onUpdate({ offsetY: parseInt(e.target.value) })}
            className="w-full accent-delphini-cyan cursor-pointer"
          />
        </div>

        {/* Rotation Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1 font-mono">
            <span>Rotation Offset</span>
            <span className="text-delphini-cyan">{calibration.rotation}°</span>
          </div>
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            value={calibration.rotation}
            onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
            className="w-full accent-delphini-cyan cursor-pointer"
          />
        </div>

        {/* Controls Footer */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-delphini-border">
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 rounded-lg bg-delphini-cyan text-black font-bold flex items-center gap-1 text-[11px] shadow-glow-sm hover:opacity-90 transition-opacity"
          >
            <Save className="w-3 h-3" /> Save to System
          </button>
        </div>
      </div>
    </div>
  );
};
