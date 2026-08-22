import React, { useState, useEffect } from 'react';
import { VideoAsset, ImageAsset, ActionItem } from '../types';
import { X, Sparkles, Video, Image as ImageIcon, Volume2, PlusCircle, CheckCircle } from 'lucide-react';

interface ActionCreatorModalProps {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
  onActionCreated: (newAction: ActionItem) => void;
}

export const ActionCreatorModal: React.FC<ActionCreatorModalProps> = ({
  isOpen,
  roomId,
  onClose,
  onActionCreated
}) => {
  const [name, setName] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedHoldImage, setSelectedHoldImage] = useState('');
  const [category, setCategory] = useState('Objects');
  const [audioMode, setAudioMode] = useState<'delphini-engine' | 'pre-generated' | 'silent'>('delphini-engine');
  const [customAudioUrl, setCustomAudioUrl] = useState('');

  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const fetchAssets = async () => {
    try {
      const [vRes, iRes] = await Promise.all([
        fetch('/api/assets/videos'),
        fetch('/api/assets/images')
      ]);
      if (vRes.ok && iRes.ok) {
        const vData = await vRes.json();
        const iData = await iRes.json();
        setVideos(vData);
        setImages(iData);
        if (vData.length > 0 && !selectedVideo) setSelectedVideo(vData[0].file);
        if (iData.length > 0 && !selectedHoldImage) setSelectedHoldImage(iData[0].file);
      }
    } catch (e) {
      console.error('Failed to load asset registries:', e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter an action name.');
      return;
    }
    if (!selectedVideo || !selectedHoldImage) {
      setErrorMsg('Please select both a video asset and a hold image.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const newActionId = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const payload: Partial<ActionItem> = {
      id: newActionId,
      name: name.trim(),
      category,
      spokenText: spokenText.trim(),
      video: selectedVideo,
      holdImage: selectedHoldImage,
      audio: customAudioUrl.trim() || undefined,
      audioMode,
      description: `Custom action: ${name.trim()}`
    };

    try {
      const res = await fetch(`/api/actions?roomId=${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Action "${name}" created successfully!`);
        setTimeout(() => {
          onActionCreated(data.action);
          onClose();
        }, 800);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save action.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error saving action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-2xl p-6 border border-delphini-cyan/40 bg-slate-950 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-delphini-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-delphini-cyan" />
            <h2 className="text-xl font-bold text-slate-100 tracking-wide font-sans">
              Create Holographic Action
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {/* 1. Action Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-delphini-cyan mb-1">
              1. Action Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Show Quantum Pen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-delphini-cyan focus:ring-1 focus:ring-delphini-cyan text-sm"
            />
          </div>

          {/* 2. Sentence to Speak */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-delphini-cyan mb-1 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              2. Sentence to Speak (Delphini Voice)
            </label>
            <input
              type="text"
              placeholder="e.g. Here is the quantum stylus you requested."
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-delphini-cyan focus:ring-1 focus:ring-delphini-cyan text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Will use the centralized unified Delphini female voice identity.
            </p>
          </div>

          {/* 3. Video Asset Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-delphini-cyan mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              3. Video Asset (Plays once) *
            </label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-delphini-cyan text-sm"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.file}>
                  {v.name} ({v.file})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Hold Image Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-delphini-cyan mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              4. Hold Image (Remains indefinitely after video) *
            </label>
            <select
              value={selectedHoldImage}
              onChange={(e) => setSelectedHoldImage(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-delphini-cyan text-sm"
            >
              {images.map((img) => (
                <option key={img.id} value={img.file}>
                  {img.name} ({img.file})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Category & Audio Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              >
                <option value="Character">Character</option>
                <option value="Objects">Objects</option>
                <option value="Presentation">Presentation</option>
                <option value="Special">Special</option>
                <option value="System">System</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Audio Mode
              </label>
              <select
                value={audioMode}
                onChange={(e) => setAudioMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              >
                <option value="delphini-engine">Delphini VoiceEngine</option>
                <option value="pre-generated">Pre-Generated Audio</option>
                <option value="silent">Silent</option>
              </select>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-delphini-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-delphini-cyan to-delphini-blue text-black font-bold text-sm hover:opacity-95 shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {isSubmitting ? 'Creating Action...' : 'Save & Add Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
