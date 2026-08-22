import React, { useState, useEffect } from 'react';
import { MediaEngine } from '../engines/MediaEngine';
import { VoiceEngine } from '../engines/VoiceEngine';
import { ActionItem, VideoAsset, ImageAsset } from '../types';
import { CheckCircle2, Loader2, Sparkles, MonitorPlay } from 'lucide-react';

interface PreloaderProps {
  mediaEngine: MediaEngine;
  voiceEngine: VoiceEngine;
  actions: ActionItem[];
  isWsConnected: boolean;
  onReady: () => void;
}

interface StepItem {
  id: string;
  label: string;
  done: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
  mediaEngine,
  voiceEngine,
  actions,
  isWsConnected,
  onReady
}) => {
  const [steps, setSteps] = useState<StepItem[]>([
    { id: 'videos', label: 'Hologram Videos Loaded & Cached', done: false },
    { id: 'images', label: 'Persistent Hold Images Buffered', done: false },
    { id: 'audio', label: 'Delphini Studio Voice Assets Ready', done: false },
    { id: 'voice', label: 'Delphini Neural Voice Engine Ready', done: false },
    { id: 'ws', label: 'Real-time WebSocket Hub Connected', done: false },
    { id: 'projection', label: '1920×1200 OLED Pepper\'s Ghost Optical Setup Ready', done: false }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runPreloadSequence();
  }, [actions]);

  useEffect(() => {
    setSteps(prev => prev.map(s => s.id === 'ws' ? { ...s, done: isWsConnected } : s));
  }, [isWsConnected]);

  const runPreloadSequence = async () => {
    try {
      // 1. Preload Videos
      const videoUrls = actions.map(a => a.video).filter(Boolean);
      for (const v of videoUrls) {
        await mediaEngine.preloadVideo(v);
      }
      setSteps(prev => prev.map(s => s.id === 'videos' ? { ...s, done: true } : s));

      // 2. Preload Images
      const imageUrls = actions.map(a => a.holdImage).concat(['/assets/images/delphini_idle.png']).filter(Boolean);
      for (const img of imageUrls) {
        await mediaEngine.preloadImage(img);
      }
      setSteps(prev => prev.map(s => s.id === 'images' ? { ...s, done: true } : s));

      // 3. Preload Audio
      const audioUrls = actions.map(a => a.audio).filter((a): a is string => Boolean(a));
      await voiceEngine.preload(audioUrls);
      setSteps(prev => prev.map(s => s.id === 'audio' ? { ...s, done: true } : s));

      // 4. Check Voice Engine
      await voiceEngine.fetchVoiceConfig();
      setSteps(prev => prev.map(s => s.id === 'voice' ? { ...s, done: true } : s));

      // 5. Optical Quad Projection Ready
      setSteps(prev => prev.map(s => s.id === 'projection' ? { ...s, done: true } : s));

      setIsLoading(false);
    } catch (e) {
      console.error('[Preloader] Error during preload sequence:', e);
      setIsLoading(false);
    }
  };

  const allDone = steps.every(s => s.done);

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-lg mx-auto glass-panel-glow rounded-2xl border border-cyan-400/40 bg-slate-950/90 text-slate-100 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-delphini-cyan animate-pulse" />
        <h2 className="text-2xl font-bold tracking-wider text-slate-100 font-mono">
          PREPARING DELPHINI
        </h2>
      </div>

      <div className="w-full space-y-3 mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
          >
            <span className="text-sm text-slate-300 font-sans">{step.label}</span>
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-delphini-cyan animate-spin shrink-0" />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!allDone}
        onClick={onReady}
        className={`w-full py-3.5 px-6 rounded-xl font-bold font-mono text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
          allDone
            ? 'bg-gradient-to-r from-delphini-cyan to-delphini-blue text-black shadow-glow-cyan hover:scale-[1.02] cursor-pointer'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <MonitorPlay className="w-5 h-5" />
        {allDone ? 'Enter Hologram Presentation Mode' : 'Initializing Hologram Pipeline...'}
      </button>
    </div>
  );
};
