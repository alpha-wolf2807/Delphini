import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DelphiniWSClient } from '../utils/websocketClient';
import { ActionItem, HologramMediaState, WebSocketMessage, CalibrationSettings } from '../types';
import { ActionCreatorModal } from '../components/ActionCreatorModal';
import { LiveResponseModal } from '../components/LiveResponseModal';
import { RemotePrismControl } from '../components/RemotePrismControl';
import { MacroSequenceModal } from '../components/MacroSequenceModal';
import { soundFX } from '../utils/soundEffects';
import {
  Sparkles,
  Zap,
  RotateCcw,
  EyeOff,
  Plus,
  Radio,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
  Layers,
  Send,
  AlertTriangle,
  Star,
  Search,
  Sliders,
  Play,
  Activity,
  Maximize2
} from 'lucide-react';

export const RemotePortal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoom = searchParams.get('room') || 'DEL-4821';
  const [roomId, setRoomId] = useState(initialRoom);

  // Subsystem States
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(['SHOW_PEN', 'HI', 'EXPAND_PEN']);
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Network & Room Status
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('DISCONNECTED');
  const [projectionOnline, setProjectionOnline] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [hologramState, setHologramState] = useState<HologramMediaState>('IDLE');

  // Calibration Settings state for remote tuning
  const [calibration, setCalibration] = useState<CalibrationSettings>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    gap: 0,
    rotation: 0,
    brightness: 1.0,
    contrast: 1.1,
    prismSizeMm: 120,
    quadrantDistance: 280
  });

  // Modals
  const [isActionCreatorOpen, setIsActionCreatorOpen] = useState(false);
  const [isLiveResponseOpen, setIsLiveResponseOpen] = useState(false);
  const [isPrismControlOpen, setIsPrismControlOpen] = useState(false);
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);

  const wsClientRef = useRef<DelphiniWSClient | null>(null);

  useEffect(() => {
    fetchActions();
    fetchCalibration();
    setupWebSocket(roomId);

    return () => {
      wsClientRef.current?.disconnect();
    };
  }, [roomId]);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data: ActionItem[] = await res.json();
        setActions(data);
      }
    } catch (e) {
      console.error('Failed to load actions:', e);
    }
  };

  const fetchCalibration = async () => {
    try {
      const res = await fetch('/api/calibration');
      if (res.ok) {
        const data = await res.json();
        setCalibration(data);
      }
    } catch (e) {
      console.error('Failed to load calibration:', e);
    }
  };

  const setupWebSocket = (room: string) => {
    wsClientRef.current?.disconnect();
    wsClientRef.current = new DelphiniWSClient({
      roomId: room,
      role: 'REMOTE',
      onMessage: (msg: WebSocketMessage) => {
        handleIncomingMessage(msg);
      },
      onStatusChange: (status, lat) => {
        setWsStatus(status);
        if (lat !== undefined) setLatency(lat);
      }
    });
  };

  const handleIncomingMessage = (msg: WebSocketMessage) => {
    switch (msg.type) {
      case 'ROOM_STATE':
        setProjectionOnline(!!msg.projectionOnline);
        break;

      case 'PROJECTION_STATUS':
        setProjectionOnline(msg.status === 'ONLINE');
        break;

      case 'HOLOGRAM_STATE_CHANGED':
        if (msg.state) setHologramState(msg.state);
        break;

      case 'ACTIONS_UPDATED':
        if (msg.actions) setActions(msg.actions);
        break;

      case 'CALIBRATION_UPDATED':
        if (msg.calibration) setCalibration(prev => ({ ...prev, ...msg.calibration }));
        break;

      case 'ACTION_ACK':
        setLastTriggeredId(msg.actionId || null);
        setLastTriggerTime(Date.now());
        break;
    }
  };

  const triggerAction = (actionId: string) => {
    soundFX.playTrigger();
    setLastTriggeredId(actionId);
    setLastTriggerTime(Date.now());

    wsClientRef.current?.send({
      type: 'ACTION',
      actionId,
      timestamp: Date.now()
    });
  };

  const triggerReset = () => {
    soundFX.playEmergency();
    setLastTriggeredId('RESET');
    setLastTriggerTime(Date.now());
    wsClientRef.current?.send({
      type: 'RESET_HOLOGRAM',
      timestamp: Date.now()
    });
  };

  const toggleBlackScreen = () => {
    soundFX.playEmergency();
    const next = !isBlackScreen;
    setIsBlackScreen(next);
    wsClientRef.current?.send({
      type: 'BLACK_SCREEN',
      enabled: next,
      timestamp: Date.now()
    });
  };

  const handleSendLiveResponse = (text: string) => {
    wsClientRef.current?.send({
      type: 'LIVE_RESPONSE',
      text,
      timestamp: Date.now()
    });
    setLastTriggeredId('LIVE_RESPONSE');
    setLastTriggerTime(Date.now());
  };

  const toggleFavorite = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    soundFX.playClick();
    setFavorites(prev => 
      prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]
    );
  };

  const handleUpdateCalibration = (updated: Partial<CalibrationSettings>) => {
    const newCal = { ...calibration, ...updated };
    setCalibration(newCal);
    wsClientRef.current?.send({
      type: 'CALIBRATION_UPDATE',
      calibration: updated,
      timestamp: Date.now()
    });
  };

  const handleSaveCalibration = async () => {
    try {
      await fetch(`/api/calibration?roomId=${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calibration)
      });
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  };

  const runMacroSequence = async (sequence: { actionId: string; delaySeconds: number }[]) => {
    for (const step of sequence) {
      triggerAction(step.actionId);
      await new Promise(r => setTimeout(r, step.delaySeconds * 1000));
    }
  };

  const toggleSoundFX = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
    if (!next) soundFX.playClick();
  };

  // Filter actions by category & search query
  const categories = Array.from(new Set(['ALL', 'FAVORITES', ...actions.map(a => a.category || 'General')]));
  const filteredActions = actions.filter(action => {
    const matchesSearch = searchQuery === '' ||
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (action.spokenText && action.spokenText.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'FAVORITES') return favorites.includes(action.id);
    return action.category === activeCategory;
  });

  const activeExecutingAction = actions.find(a => a.id === lastTriggeredId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 pb-24 font-sans selection:bg-delphini-cyan selection:text-black">
      {/* Top Console Deck Header */}
      <header className="max-w-5xl mx-auto glass-panel rounded-2xl p-4 md:p-5 border border-delphini-border shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-delphini-cyan/10 border border-delphini-cyan/30 text-delphini-cyan shadow-glow-sm">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-wider font-mono text-white">
                  DELPHINI CONTROL DECK
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  OPERATOR PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-time Holographic Control & Neural Voice Console
              </p>
            </div>
          </div>

          {/* Controls & Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Projection State Indicator */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono transition-all ${
              projectionOnline
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${projectionOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              <span>{projectionOnline ? 'Projection Online' : 'Projection Offline'}</span>
            </div>

            {/* Room Code */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-delphini-cyan" />
              <span className="text-slate-400">Room:</span>
              <input
                type="text"
                value={roomId}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setRoomId(val);
                  setSearchParams({ room: val });
                }}
                className="w-20 bg-transparent text-cyan-300 font-bold focus:outline-none text-xs"
              />
            </div>

            {/* Sound FX Toggle */}
            <button
              onClick={toggleSoundFX}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-cyan-950 border-cyan-700/50 text-cyan-300'
              }`}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Latency */}
            {wsStatus === 'CONNECTED' && (
              <div className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{latency} ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Alert */}
        {!projectionOnline && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Projection Portal is offline in room <strong>{roomId}</strong>. Open <code className="text-cyan-300">/projection</code> on the projection laptop.
            </span>
          </div>
        )}

        {/* Live Hologram Execution Activity Bar */}
        {lastTriggeredId && (Date.now() - lastTriggerTime < 5000) && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-xs font-mono flex items-center justify-between text-cyan-300 animate-fadeIn shadow-glow-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>
                EXECUTING HOLOGRAM ACTION: <strong className="text-white">{activeExecutingAction?.name || lastTriggeredId}</strong>
              </span>
            </div>
            <span className="text-[10px] bg-cyan-900 px-2 py-0.5 rounded text-cyan-200 border border-cyan-600">
              INSTANT TRIGGERED
            </span>
          </div>
        )}
      </header>

      {/* Main Control Deck */}
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Quick Action Trigger Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Live Response Modal Trigger */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsLiveResponseOpen(true);
            }}
            className="p-4 rounded-2xl glass-panel-glow border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 to-slate-950 hover:border-cyan-400 text-left transition-all group shadow-glow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-400 text-black font-bold group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <Send className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-cyan-300 font-mono">
                ⚡ LIVE SPEECH
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                Voice Dictation & Q&A
              </p>
            </div>
          </button>

          {/* Macro Sequence Trigger */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsMacroModalOpen(true);
            }}
            className="p-4 rounded-2xl glass-panel border border-slate-700 hover:border-cyan-400/60 bg-slate-900/70 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <Layers className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-white font-mono">
                ▶ MACRO PLAYLIST
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                Automated Sequences
              </p>
            </div>
          </button>

          {/* Remote Prism Control Trigger */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsPrismControlOpen(true);
            }}
            className="p-4 rounded-2xl glass-panel border border-slate-700 hover:border-purple-400/60 bg-slate-900/70 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400 border border-slate-700 group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-white font-mono">
                🎛 PRISM TUNING
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                Scale, Brightness & Offsets
              </p>
            </div>
          </button>

          {/* Action Creator Trigger */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsActionCreatorOpen(true);
            }}
            className="p-4 rounded-2xl glass-panel border border-slate-700 hover:border-cyan-400/60 bg-slate-900/70 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-white font-mono">
                + NEW ACTION
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                Define Custom Media
              </p>
            </div>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundFX.playClick();
                  setActiveCategory(cat);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-delphini-cyan text-black shadow-glow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat === 'FAVORITES' && <Star className="w-3.5 h-3.5 fill-current" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Dynamic Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action) => {
            const isRecentlyTriggered = lastTriggeredId === action.id && (Date.now() - lastTriggerTime < 3000);
            const isFav = favorites.includes(action.id);

            return (
              <button
                key={action.id}
                onClick={() => triggerAction(action.id)}
                className={`relative p-5 rounded-2xl text-left transition-all duration-150 active:scale-[0.97] border flex flex-col justify-between h-44 group ${
                  isRecentlyTriggered
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-glow-strong scale-[1.02]'
                    : 'glass-button hover:border-cyan-400/80'
                }`}
              >
                {/* Header: Category & Favorite */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 text-cyan-400 border border-slate-800">
                    {action.category || 'General'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-300">
                      {action.id}
                    </span>
                    <button
                      onClick={(e) => toggleFavorite(e, action.id)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                      title={isFav ? 'Remove Favorite' : 'Mark Favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Main Action Title */}
                <div className="my-auto">
                  <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                    {action.name}
                  </h3>
                  {action.spokenText && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic font-sans flex items-start gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400/70 shrink-0 mt-0.5" />
                      <span>"{action.spokenText}"</span>
                    </p>
                  )}
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 w-full">
                  <span className="truncate max-w-[140px]">{action.video.split('/').pop()}</span>
                  {isRecentlyTriggered ? (
                    <span className="text-cyan-300 font-bold flex items-center gap-1 animate-pulse">
                      <CheckCircle className="w-3.5 h-3.5" /> EXECUTING
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-cyan-400 transition-colors font-bold flex items-center gap-1">
                      TRIGGER &rarr;
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Emergency System Controls Deck */}
        <div className="pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 mb-3">
            Emergency System Controls
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reset Hologram Button */}
            <button
              onClick={triggerReset}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center gap-2 font-mono text-xs font-bold transition-colors active:scale-98"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              [ RESET HOLOGRAM TO IDLE ]
            </button>

            {/* Blackout Safety Button */}
            <button
              onClick={toggleBlackScreen}
              className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all active:scale-98 ${
                isBlackScreen
                  ? 'bg-red-950/80 border-red-500 text-red-300 shadow-glow-sm'
                  : 'bg-slate-900/90 border-slate-800 hover:border-red-900 text-slate-300 hover:text-red-400'
              }`}
            >
              <EyeOff className="w-4 h-4 text-red-400" />
              {isBlackScreen ? '[ BLACK SCREEN ACTIVE — CLICK TO RESTORE ]' : '[ BLACK SCREEN SAFETY SHUTOFF ]'}
            </button>
          </div>
        </div>
      </main>

      {/* Action Creator Modal */}
      <ActionCreatorModal
        isOpen={isActionCreatorOpen}
        roomId={roomId}
        onClose={() => setIsActionCreatorOpen(false)}
        onActionCreated={(newAction) => {
          setActions((prev) => {
            const idx = prev.findIndex(a => a.id === newAction.id);
            if (idx >= 0) {
              const cp = [...prev];
              cp[idx] = newAction;
              return cp;
            }
            return [...prev, newAction];
          });
        }}
      />

      {/* Live Response Modal */}
      <LiveResponseModal
        isOpen={isLiveResponseOpen}
        onClose={() => setIsLiveResponseOpen(false)}
        onSendLiveResponse={handleSendLiveResponse}
      />

      {/* Remote Prism Calibration Drawer */}
      <RemotePrismControl
        isOpen={isPrismControlOpen}
        calibration={calibration}
        onClose={() => setIsPrismControlOpen(false)}
        onUpdateCalibration={handleUpdateCalibration}
        onSaveCalibration={handleSaveCalibration}
      />

      {/* Macro Sequence Playlist Modal */}
      <MacroSequenceModal
        isOpen={isMacroModalOpen}
        actions={actions}
        onClose={() => setIsMacroModalOpen(false)}
        onRunMacro={runMacroSequence}
      />
    </div>
  );
};
