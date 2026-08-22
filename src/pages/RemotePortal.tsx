import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DelphiniWSClient } from '../utils/websocketClient';
import { ActionItem, HologramMediaState, WebSocketMessage } from '../types';
import { ActionCreatorModal } from '../components/ActionCreatorModal';
import { LiveResponseModal } from '../components/LiveResponseModal';
import {
  Sparkles,
  Zap,
  RotateCcw,
  EyeOff,
  Plus,
  Radio,
  Wifi,
  WifiOff,
  Volume2,
  CheckCircle,
  Clock,
  Layers,
  Send,
  AlertTriangle
} from 'lucide-react';

export const RemotePortal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoom = searchParams.get('room') || 'DEL-4821';
  const [roomId, setRoomId] = useState(initialRoom);

  // Subsystem States
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);
  const [isBlackScreen, setIsBlackScreen] = useState(false);

  // Network & Room Status
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('DISCONNECTED');
  const [projectionOnline, setProjectionOnline] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [hologramState, setHologramState] = useState<HologramMediaState>('IDLE');

  // Modals
  const [isActionCreatorOpen, setIsActionCreatorOpen] = useState(false);
  const [isLiveResponseOpen, setIsLiveResponseOpen] = useState(false);

  const wsClientRef = useRef<DelphiniWSClient | null>(null);

  useEffect(() => {
    fetchActions();
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

      case 'ACTION_ACK':
        setLastTriggeredId(msg.actionId || null);
        setLastTriggerTime(Date.now());
        break;
    }
  };

  const triggerAction = (actionId: string) => {
    if (!wsClientRef.current) return;
    setLastTriggeredId(actionId);
    setLastTriggerTime(Date.now());

    wsClientRef.current.send({
      type: 'ACTION',
      actionId,
      timestamp: Date.now()
    });
  };

  const triggerReset = () => {
    if (!wsClientRef.current) return;
    setLastTriggeredId('RESET');
    setLastTriggerTime(Date.now());
    wsClientRef.current.send({
      type: 'RESET_HOLOGRAM',
      timestamp: Date.now()
    });
  };

  const toggleBlackScreen = () => {
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

  // Group actions by category
  const categories = Array.from(new Set(['ALL', ...actions.map(a => a.category || 'General')]));
  const filteredActions = activeCategory === 'ALL'
    ? actions
    : actions.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 pb-24 font-sans selection:bg-delphini-cyan selection:text-black">
      {/* Top Header Console */}
      <header className="max-w-5xl mx-auto glass-panel rounded-2xl p-4 md:p-5 border border-delphini-border shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-delphini-cyan/10 border border-delphini-cyan/30 text-delphini-cyan shadow-glow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-wider font-mono text-white">
                  DELPHINI CONTROL DECK
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  OPERATOR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-time Holographic Presentation Interface
              </p>
            </div>
          </div>

          {/* Status Indicators & Room Input */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Projection State Indicator */}
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono transition-all ${
              projectionOnline
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${projectionOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>{projectionOnline ? 'Projection Online' : 'Projection Offline'}</span>
            </div>

            {/* Room Code Selector */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
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

            {/* Latency Meter */}
            {wsStatus === 'CONNECTED' && (
              <div className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{latency} ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Warning Alert if Projection is not connected */}
        {!projectionOnline && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Projection Portal is currently offline in room <strong>{roomId}</strong>. Please ensure the projection laptop is running <code className="text-cyan-300">/projection</code>.
            </span>
          </div>
        )}
      </header>

      {/* Main Control Stage */}
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Quick Trigger Banner: Live Response & Action Creator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Response Modal Trigger */}
          <button
            onClick={() => setIsLiveResponseOpen(true)}
            className="p-4 rounded-2xl glass-panel-glow border border-cyan-400/40 bg-gradient-to-r from-cyan-950/60 to-slate-950 hover:border-cyan-400 text-left transition-all group shadow-glow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-400 text-black font-bold group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-cyan-300 font-mono flex items-center gap-2">
                    ⚡ LIVE RESPONSE MODE
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Type unscripted text for Delphini to speak in real-time
                  </p>
                </div>
              </div>
              <Send className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          {/* Action Creator Modal Trigger */}
          <button
            onClick={() => setIsActionCreatorOpen(true)}
            className="p-4 rounded-2xl glass-panel border border-slate-700 hover:border-delphini-cyan/60 bg-slate-900/60 hover:bg-slate-900 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-delphini-cyan border border-slate-700 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    + CREATE NEW ACTION
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define custom actions with video, hold images & voice
                  </p>
                </div>
              </div>
              <Layers className="w-4 h-4 text-slate-400 group-hover:text-delphini-cyan transition-colors" />
            </div>
          </button>
        </div>

        {/* Action Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-delphini-cyan text-black shadow-glow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action) => {
            const isRecentlyTriggered = lastTriggeredId === action.id && (Date.now() - lastTriggerTime < 2500);

            return (
              <button
                key={action.id}
                onClick={() => triggerAction(action.id)}
                className={`relative p-5 rounded-2xl text-left transition-all duration-150 active:scale-[0.98] border flex flex-col justify-between h-44 group ${
                  isRecentlyTriggered
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-glow-strong scale-[1.02]'
                    : 'glass-button hover:border-cyan-400/80'
                }`}
              >
                {/* Card Header: Category & Action ID */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-slate-900 text-cyan-400 border border-slate-800">
                    {action.category || 'General'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-300">
                    {action.id}
                  </span>
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

                {/* Card Footer: Asset metadata & trigger state */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 w-full">
                  <span className="truncate max-w-[150px]">{action.video.split('/').pop()}</span>
                  {isRecentlyTriggered ? (
                    <span className="text-cyan-300 font-bold flex items-center gap-1 animate-pulse">
                      <CheckCircle className="w-3 h-3" /> EXECUTING
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-cyan-400 transition-colors font-bold">
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
    </div>
  );
};
