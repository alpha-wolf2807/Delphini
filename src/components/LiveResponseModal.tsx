import React, { useState, useRef } from 'react';
import { ActionItem } from '../types';
import { X, Send, Sparkles, Zap, MessageSquare, Mic, MicOff, Volume2, Video, Star } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface LiveResponseModalProps {
  isOpen: boolean;
  actions?: ActionItem[];
  favorites?: string[];
  onClose: () => void;
  onSendLiveResponse: (text: string, videoUrl?: string, holdImageUrl?: string) => void;
}

const PRESET_ANSWERS = [
  "Delphini is designed as a modular holographic interface. New actions can be added without changing the core holographic rendering engine.",
  "The four-sided Pepper's Ghost prism reflects synchronized high-contrast viewports, creating a full 360-degree floating optical hologram without 3D glasses.",
  "The smart stylus is engineered with titanium alloy casing, precision haptic nib, and an inductive charging power cell.",
  "All speech and audio pass through Delphini's unified neural voice architecture to maintain a single consistent character identity."
];

export const LiveResponseModal: React.FC<LiveResponseModalProps> = ({
  isOpen,
  actions = [],
  favorites = [],
  onClose,
  onSendLiveResponse
}) => {
  const [text, setText] = useState('');
  const [selectedActionId, setSelectedActionId] = useState<string>('DELPHINI_EXPLAIN');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FAVORITES'>('ALL');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  const toggleVoiceDictation = () => {
    soundFX.playClick();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('[SpeechDictation] Error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('[SpeechDictation] Initialization failed:', e);
      setIsListening(false);
    }
  };

  const selectedAction = actions.find(a => a.id === selectedActionId) || actions[0];

  const handleSend = () => {
    if (!text.trim()) return;
    soundFX.playTransmit();
    setIsSending(true);
    const videoUrl = selectedAction?.video || '/assets/videos/delphini_explain.mp4';
    const holdImageUrl = selectedAction?.holdImage || '/assets/images/Fallback image.png';
    
    onSendLiveResponse(text.trim(), videoUrl, holdImageUrl);
    setTimeout(() => {
      setIsSending(false);
      setText('');
      onClose();
    }, 500);
  };

  const handleSelectPreset = (preset: string) => {
    soundFX.playClick();
    setText(preset);
  };

  // Available actions for video selection
  const displayedActions = filterMode === 'FAVORITES'
    ? actions.filter(a => favorites.includes(a.id))
    : actions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel-glow rounded-2xl p-6 border border-cyan-400/40 bg-slate-950 text-slate-100 shadow-2xl max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-delphini-cyan animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100 tracking-wide font-sans">
              Live Delphini Speech Response
            </h2>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4 flex-1">
          <p className="text-xs text-slate-400">
            Select any video (or pick from Favorites) and dictate or type unscripted text for Delphini to say live.
          </p>

          {/* Video Selection Section */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                Select Avatar Video / Reaction:
              </label>

              {/* Favorites vs All filter pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setFilterMode('ALL');
                  }}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterMode === 'ALL' ? 'bg-cyan-400 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({actions.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setFilterMode('FAVORITES');
                  }}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    filterMode === 'FAVORITES' ? 'bg-amber-400 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className="w-2.5 h-2.5 fill-current" /> Favorites ({favorites.length})
                </button>
              </div>
            </div>

            <select
              value={selectedActionId}
              onChange={(e) => {
                soundFX.playClick();
                setSelectedActionId(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {displayedActions.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} ({act.category || 'General'}) — {act.video.split('/').pop()}
                </option>
              ))}
            </select>
          </div>

          {/* Preset Quick-Replies */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-delphini-cyan" /> Quick Preset Responses (Click to insert):
            </label>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {PRESET_ANSWERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-delphini-cyan/50 text-xs text-slate-300 transition-colors line-clamp-2"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Area & Voice Dictation Trigger */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-delphini-cyan flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-3.5 h-3.5" />
                What Delphini Should Say:
              </label>

              {/* Dictation Button */}
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isListening
                    ? 'bg-rose-950 border border-rose-500 text-rose-300 animate-pulse shadow-glow-sm'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Listening... (Click to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Voice Dictation Mic</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Delphini is a modular holographic interface capable of explaining complex components..."
              className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white focus:outline-none focus:border-delphini-cyan focus:ring-1 focus:ring-delphini-cyan text-sm resize-none font-sans transition-colors ${
                isListening ? 'border-rose-500/80 bg-slate-900/90' : 'border-slate-700'
              }`}
              autoFocus
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 flex items-center justify-between border-t border-delphini-border shrink-0">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Neural Voice: <strong className="text-cyan-300">delphini-female</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!text.trim() || isSending}
                onClick={handleSend}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-delphini-cyan to-delphini-blue text-black font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Transmitting Beam...' : 'Transmit Speech to Hologram'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
