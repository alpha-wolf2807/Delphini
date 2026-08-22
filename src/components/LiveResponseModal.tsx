import React, { useState } from 'react';
import { X, Send, Sparkles, Zap, MessageSquare } from 'lucide-react';

interface LiveResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLiveResponse: (text: string) => void;
}

const PRESET_ANSWERS = [
  "Delphini is designed as a modular holographic interface. New actions can be added without changing the core holographic rendering engine.",
  "The four-sided Pepper's Ghost prism reflects synchronized high-contrast viewports, creating a full 360-degree floating optical hologram without 3D glasses.",
  "The smart stylus is engineered with titanium alloy casing, precision haptic nib, and an inductive charging power cell.",
  "All speech and audio pass through Delphini's unified neural voice architecture to maintain a single consistent character identity."
];

export const LiveResponseModal: React.FC<LiveResponseModalProps> = ({
  isOpen,
  onClose,
  onSendLiveResponse
}) => {
  const [text, setText] = useState('');
  const [lastSentText, setLastSentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    setIsSending(true);
    onSendLiveResponse(text.trim());
    setLastSentText(text.trim());
    setTimeout(() => {
      setIsSending(false);
      setText('');
      onClose();
    }, 600);
  };

  const handleSelectPreset = (preset: string) => {
    setText(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel-glow rounded-2xl p-6 border border-cyan-400/40 bg-slate-950 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-delphini-cyan" />
            <h2 className="text-xl font-bold text-slate-100 tracking-wide font-sans">
              Live Delphini Response
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">
            Type anything for Delphini to say during unscripted Q&A. The hologram will trigger its explaining animation and speak using the <strong className="text-delphini-cyan">unified Delphini female voice</strong>.
          </p>

          {/* Preset Quick-Replies */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-delphini-cyan" /> Quick Preset Responses (Click to insert):
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {PRESET_ANSWERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-delphini-cyan/50 text-xs text-slate-300 transition-colors line-clamp-2"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-delphini-cyan mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              What Delphini Should Say:
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Delphini is a modular holographic interface capable of explaining complex components..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-delphini-cyan focus:ring-1 focus:ring-delphini-cyan text-sm resize-none font-sans"
              autoFocus
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 flex items-center justify-between border-t border-delphini-border">
            <span className="text-xs text-slate-500 font-mono">
              Voice: <span className="text-cyan-400">delphini-female</span>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!text.trim() || isSending}
                onClick={handleSend}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-delphini-cyan to-delphini-blue text-black font-bold text-sm hover:opacity-95 shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Transmitting...' : 'Speak as Delphini'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
