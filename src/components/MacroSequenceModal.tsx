import React, { useState } from 'react';
import { ActionItem } from '../types';
import { X, Play, Plus, Trash2, Clock, Layers, Sparkles, CheckCircle2, Pause, SkipForward } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface MacroSequenceModalProps {
  isOpen: boolean;
  actions: ActionItem[];
  onClose: () => void;
  onRunMacro: (sequence: { actionId: string; delaySeconds: number }[]) => void;
}

export const MacroSequenceModal: React.FC<MacroSequenceModalProps> = ({
  isOpen,
  actions,
  onClose,
  onRunMacro
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string>(actions[0]?.id || '');
  const [delay, setDelay] = useState<number>(4);
  const [sequence, setSequence] = useState<{ id: string; actionId: string; name: string; delaySeconds: number }[]>([
    { id: '1', actionId: 'HI', name: 'Delphini Greeting', delaySeconds: 3 },
    { id: '2', actionId: 'SHOW_PEN', name: 'Smart Stylus Assembly', delaySeconds: 5 },
    { id: '3', actionId: 'EXPAND_PEN', name: 'Internal Component Exploded View', delaySeconds: 6 },
    { id: '4', actionId: 'ASSEMBLE_PEN', name: 'Component Reassembly', delaySeconds: 4 },
    { id: '5', actionId: 'GOODBYE', name: 'Farewell & Closing Statement', delaySeconds: 4 }
  ]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    soundFX.playClick();
    const act = actions.find(a => a.id === selectedActionId);
    if (!act) return;
    setSequence(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        actionId: act.id,
        name: act.name,
        delaySeconds: delay
      }
    ]);
  };

  const handleRemoveStep = (id: string) => {
    soundFX.playClick();
    setSequence(prev => prev.filter(s => s.id !== id));
  };

  const handleStartMacro = () => {
    if (sequence.length === 0) return;
    soundFX.playTrigger();
    onRunMacro(sequence.map(s => ({ actionId: s.actionId, delaySeconds: s.delaySeconds })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel-glow rounded-2xl p-6 border border-cyan-400/40 bg-slate-950 text-slate-100 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-delphini-cyan" />
            <div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Automated Presentation Playlist
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Queue sequential holographic actions to run automatically with delays
              </p>
            </div>
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

        {/* Modal Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Add Action Step Controls */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Select Action:</label>
              <select
                value={selectedActionId}
                onChange={(e) => setSelectedActionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {actions.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Delay (sec):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value, 10) || 3)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleAddStep}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Step
            </button>
          </div>

          {/* Sequence List */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase mb-2">
              <span>Sequence Steps ({sequence.length})</span>
              <span>Total Est: ~{sequence.reduce((acc, curr) => acc + curr.delaySeconds, 0)}s</span>
            </div>

            <div className="space-y-2">
              {sequence.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs font-mono transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/50 flex items-center justify-center text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-white font-bold">{step.name}</div>
                      <div className="text-[10px] text-slate-400">{step.actionId}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{step.delaySeconds}s delay</span>
                    </div>
                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-delphini-border flex items-center justify-between shrink-0">
          <button
            onClick={() => setSequence([])}
            className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-mono transition-colors"
          >
            Clear All
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              disabled={sequence.length === 0}
              onClick={handleStartMacro}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-delphini-cyan to-delphini-blue text-black font-bold text-xs font-mono uppercase tracking-wider shadow-glow-cyan flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" /> Start Presentation Macro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
