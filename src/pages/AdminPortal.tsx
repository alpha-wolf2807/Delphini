import React, { useState, useEffect } from 'react';
import { ActionItem, VideoAsset, ImageAsset, VoiceConfig, CalibrationSettings } from '../types';
import { 
  Settings, 
  Volume2, 
  Video, 
  Image as ImageIcon, 
  Sliders, 
  Play, 
  CheckCircle,
  Database,
  Layers,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPortal: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [calibration, setCalibration] = useState<CalibrationSettings | null>(null);
  const [entryConfig, setEntryConfig] = useState<{ videoUrl: string; holdImageUrl: string; autoPlayOnLoad?: boolean }>({
    videoUrl: '/assets/videos/N--DELPHINI INTRODUCTION.mp4',
    holdImageUrl: '/assets/images/Fallback image.png',
    autoPlayOnLoad: false
  });
  const [entrySaveMsg, setEntrySaveMsg] = useState('');

  const [testText, setTestText] = useState('Delphini holographic interface voice test.');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [aRes, vRes, iRes, voiceRes, calRes, entryRes] = await Promise.all([
        fetch('/api/actions'),
        fetch('/api/assets/videos'),
        fetch('/api/assets/images'),
        fetch('/api/voice/config'),
        fetch('/api/calibration'),
        fetch('/api/entry')
      ]);

      if (aRes.ok) setActions(await aRes.json());
      if (vRes.ok) setVideos(await vRes.json());
      if (iRes.ok) setImages(await iRes.json());
      if (voiceRes.ok) setVoiceConfig(await voiceRes.json());
      if (calRes.ok) setCalibration(await calRes.json());
      if (entryRes.ok) setEntryConfig(await entryRes.json());
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const handleSaveEntryConfig = async () => {
    try {
      setEntrySaveMsg('Saving...');
      const res = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryConfig)
      });
      if (res.ok) {
        setEntrySaveMsg('Entry settings saved successfully!');
        setTimeout(() => setEntrySaveMsg(''), 3000);
      }
    } catch (e: any) {
      setEntrySaveMsg(`Save failed: ${e.message}`);
    }
  };

  const handleTestVoice = async () => {
    if (!testText.trim()) return;
    setIsPlayingVoice(true);
    setStatusMsg('Synthesizing with unified Delphini female voice...');

    try {
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg('Playing synthesized audio...');
        const audio = new Audio(data.audioUrl);
        audio.onended = () => {
          setIsPlayingVoice(false);
          setStatusMsg('Voice playback complete.');
        };
        audio.onerror = () => {
          setIsPlayingVoice(false);
          setStatusMsg('Audio playback failed.');
        };
        await audio.play();
      } else {
        setIsPlayingVoice(false);
        setStatusMsg('TTS server returned error.');
      }
    } catch (e: any) {
      setIsPlayingVoice(false);
      setStatusMsg(`Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-wide font-mono text-cyan-400">
                DELPHINI ADMIN & SYSTEM REGISTRY
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Asset verification, unified voice synthesis, and optical calibration inspection
              </p>
            </div>
          </div>
        </div>

        {/* 1. Unified Delphini Voice Engine Card */}
        <section className="glass-panel rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-delphini-cyan" />
            <h2 className="text-base font-bold font-mono text-white">
              Unified Delphini Female Voice Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Voice Identity:</span>
                <span className="text-cyan-300 font-bold">{voiceConfig?.id || 'delphini-female'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Model:</span>
                <span className="text-slate-200">{voiceConfig?.model || 'en-US-AriaNeural'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Language / Speaker:</span>
                <span className="text-slate-200">{voiceConfig?.language} ({voiceConfig?.speaker})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Pitch / Rate / Volume:</span>
                <span className="text-slate-200">{voiceConfig?.pitch} / {voiceConfig?.rate} / {voiceConfig?.volume}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase font-mono text-slate-400">
                Live Speech Tester
              </label>
              <textarea
                rows={2}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-400"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400">{statusMsg}</span>
                <button
                  onClick={handleTestVoice}
                  disabled={isPlayingVoice}
                  className="px-4 py-2 rounded-xl bg-delphini-cyan text-black font-bold font-mono text-xs flex items-center gap-1.5 shadow-glow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isPlayingVoice ? 'Speaking...' : 'Test Voice'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 1.5. Delphini Grand Entry Settings Card */}
        <section className="glass-panel-glow rounded-2xl p-6 border border-cyan-400/40 bg-slate-900/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-delphini-cyan" />
              <h2 className="text-base font-bold font-mono text-cyan-300">
                Delphini Grand Entry Video Configuration
              </h2>
            </div>
            {entrySaveMsg && <span className="text-xs font-mono text-emerald-400">{entrySaveMsg}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Select Entry Video Asset:</label>
              <select
                value={entryConfig.videoUrl}
                onChange={(e) => setEntryConfig(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {videos.map(v => (
                  <option key={v.id} value={v.file}>
                    {v.name} ({v.file.split('/').pop()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Select Post-Entry Hold Image Asset:</label>
              <select
                value={entryConfig.holdImageUrl}
                onChange={(e) => setEntryConfig(prev => ({ ...prev, holdImageUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {images.map(img => (
                  <option key={img.id} value={img.file}>
                    {img.name} ({img.file.split('/').pop()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={handleSaveEntryConfig}
              className="px-5 py-2 rounded-xl bg-delphini-cyan text-black font-bold font-mono text-xs shadow-glow-sm hover:opacity-90 transition-opacity"
            >
              Save Entry Configuration
            </button>
          </div>
        </section>

        {/* 2. Registered Actions List */}
        <section className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-delphini-cyan" />
            <h2 className="text-base font-bold font-mono text-white">
              Action Registry ({actions.length} Actions)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actions.map((act) => (
              <div key={act.id} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="font-bold text-cyan-300">{act.name}</span>
                  <span className="text-slate-500">[{act.id}]</span>
                </div>
                <p className="text-slate-400 italic">"{act.spokenText}"</p>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Video: {act.video.split('/').pop()}</span>
                  <span>Hold: {act.holdImage.split('/').pop()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Assets Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Videos */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                Video Assets ({videos.length})
              </h3>
            </div>
            <ul className="space-y-1 text-xs font-mono text-slate-300">
              {videos.map(v => (
                <li key={v.id} className="p-2 bg-slate-900/50 rounded-lg flex justify-between">
                  <span>{v.name}</span>
                  <span className="text-slate-500">{v.file}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Images */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                Hold Image Assets ({images.length})
              </h3>
            </div>
            <ul className="space-y-1 text-xs font-mono text-slate-300">
              {images.map(img => (
                <li key={img.id} className="p-2 bg-slate-900/50 rounded-lg flex justify-between">
                  <span>{img.name}</span>
                  <span className="text-slate-500">{img.file}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
