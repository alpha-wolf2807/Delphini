import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActionEngine } from '../engines/ActionEngine';
import { MediaEngine } from '../engines/MediaEngine';
import { VoiceEngine } from '../engines/VoiceEngine';
import { FourSideRenderer } from '../components/FourSideRenderer';
import { CalibrationPanel } from '../components/CalibrationPanel';
import { Preloader } from '../components/Preloader';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { DelphiniWSClient } from '../utils/websocketClient';
import { ActionItem, CalibrationSettings, HologramStatus } from '../types';
import { 
  Maximize2, 
  Minimize2, 
  Sliders, 
  QrCode, 
  Radio, 
  Sparkles, 
  Volume2, 
  Layers, 
  ShieldCheck,
  EyeOff
} from 'lucide-react';

export const ProjectionPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'DEL-4821';

  // Presentation vs Setup Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Engines
  const mediaEngineRef = useRef<MediaEngine>(new MediaEngine());
  const voiceEngineRef = useRef<VoiceEngine>(new VoiceEngine());
  const actionEngineRef = useRef<ActionEngine>(
    new ActionEngine(mediaEngineRef.current, voiceEngineRef.current)
  );

  // State
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [hologramStatus, setHologramStatus] = useState<HologramStatus>({
    state: 'AWAITING_ENTRY',
    holdImageUrl: '/assets/images/Fallback image.png',
    isBlackScreen: false,
    timestamp: Date.now()
  });

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

  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('DISCONNECTED');
  const [latency, setLatency] = useState<number>(0);
  const wsClientRef = useRef<DelphiniWSClient | null>(null);

  // Remote portal connection URL
  const remoteUrl = `${window.location.origin}/remote?room=${encodeURIComponent(roomId)}`;

  useEffect(() => {
    // 1. Fetch Actions & Calibration
    fetchActions();
    fetchCalibration();
    mediaEngineRef.current.setAwaitingEntry();

    // 2. Setup ActionEngine status listener
    actionEngineRef.current.onStatusChange((status) => {
      setHologramStatus(status);
      // Forward state to connected remotes
      if (wsClientRef.current) {
        wsClientRef.current.send({
          type: 'HOLOGRAM_STATE_UPDATE',
          state: status.state,
          actionId: status.currentActionId,
          timestamp: Date.now()
        });
      }
    });

    // 3. Connect WebSocket as PROJECTION
    wsClientRef.current = new DelphiniWSClient({
      roomId,
      role: 'PROJECTION',
      onMessage: (msg) => {
        handleIncomingMessage(msg);
      },
      onStatusChange: (status, lat) => {
        setWsStatus(status);
        if (lat !== undefined) setLatency(lat);
      }
    });

    // 4. Global Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresentationMode(false);
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey) {
        setShowCalibration(prev => !prev);
      } else if (e.key.toLowerCase() === 'b' && !e.ctrlKey) {
        actionEngineRef.current.setBlackScreen(!mediaEngineRef.current.getCurrentState().isBlackScreen);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      wsClientRef.current?.disconnect();
    };
  }, [roomId]);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data: ActionItem[] = await res.json();
        setActions(data);
        actionEngineRef.current.setActions(data);
      }
    } catch (e) {
      console.error('Failed to fetch actions:', e);
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
      console.error('Failed to fetch calibration:', e);
    }
  };

  const handleIncomingMessage = (msg: any) => {
    console.log('[Projection] Received WS command:', msg.type);

    switch (msg.type) {
      case 'EXECUTE_ACTION':
        if (msg.actionId) {
          actionEngineRef.current.execute(msg.actionId);
        }
        break;

      case 'EXECUTE_LIVE_RESPONSE':
        if (msg.text) {
          actionEngineRef.current.executeLiveResponse(
            msg.text,
            msg.audioUrl,
            msg.durationEstimate || 4.0,
            msg.videoUrl,
            msg.holdImageUrl
          );
        }
        break;

      case 'EXECUTE_ENTRY':
        actionEngineRef.current.triggerEntry();
        break;

      case 'ENTRY_CONFIG_UPDATED':
        if (msg.entryConfig) {
          mediaEngineRef.current.setEntryConfig(msg.entryConfig);
        }
        break;

      case 'RESET_HOLOGRAM':
        actionEngineRef.current.reset();
        break;

      case 'SET_BLACK_SCREEN':
        actionEngineRef.current.setBlackScreen(msg.enabled);
        break;

      case 'CALIBRATION_UPDATED':
        if (msg.calibration) {
          setCalibration(prev => ({ ...prev, ...msg.calibration }));
        }
        break;

      case 'ACTIONS_UPDATED':
        if (msg.actions) {
          setActions(msg.actions);
          actionEngineRef.current.setActions(msg.actions);
        }
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSaveCalibration = async () => {
    try {
      await fetch(`/api/calibration?roomId=${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calibration)
      });
      alert('Calibration settings saved to system configuration.');
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  };

  return (
    <div className={`relative w-screen h-screen bg-black overflow-hidden select-none ${isPresentationMode ? 'cursor-none' : ''}`}>
      {/* 4-Sided Pepper's Ghost Hologram Renderer */}
      <div className="w-full h-full">
        <FourSideRenderer
          state={hologramStatus.state}
          videoUrl={hologramStatus.videoUrl || null}
          holdImageUrl={hologramStatus.holdImageUrl || '/assets/images/delphini_idle.png'}
          isBlackScreen={hologramStatus.isBlackScreen}
          isLooping={hologramStatus.isLooping}
          calibration={calibration}
          showCalibrationGrid={showGrid}
          onVideoEnd={() => mediaEngineRef.current.handleVideoEnded()}
        />
      </div>

      {/* SETUP / DEBUG OVERLAY (Hidden in Presentation Mode) */}
      {!isPresentationMode && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <h1 className="text-xl font-black tracking-widest text-cyan-400 font-mono">
                  DELPHINI PROJECTION PORTAL
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  ASUS Vivobook 14 Flip OLED — 1920×1200 Display Setup
                </p>
              </div>
            </div>

            {/* Status & Room Badge */}
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono">
                <Radio className={`w-3.5 h-3.5 ${wsStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className="text-slate-300">Room: <strong className="text-cyan-400">{roomId}</strong></span>
                {latency > 0 && <span className="text-slate-500">({latency}ms)</span>}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Stage: Preloader & QR Pairing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto max-w-4xl mx-auto w-full items-center">
            {/* Preloader Component */}
            <div>
              <Preloader
                mediaEngine={mediaEngineRef.current}
                voiceEngine={voiceEngineRef.current}
                actions={actions}
                isWsConnected={wsStatus === 'CONNECTED'}
                onReady={() => {
                  setIsPresentationMode(true);
                  if (!document.fullscreenElement) toggleFullscreen();
                }}
              />
            </div>

            {/* Operator QR Code Pairing Card */}
            <div className="glass-panel rounded-2xl p-6 border border-delphini-border flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold font-mono uppercase mb-3">
                <QrCode className="w-4 h-4" /> Remote Operator Pairing
              </div>
              <QRCodeDisplay url={remoteUrl} size={170} />
              <div className="mt-4">
                <p className="text-xs text-slate-300 font-mono">
                  Scan to open <span className="text-cyan-400">Remote Console</span> on operator device.
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1 break-all">
                  {remoteUrl}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Shortcuts & Calibration Trigger */}
          <div className="flex items-center justify-between pt-4 border-t border-delphini-border text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-4">
              <span>Press <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300">ESC</kbd> to exit presentation</span>
              <span><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300">C</kbd> Calibration</span>
              <span><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300">B</kbd> Blackout</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalibration(prev => !prev)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 flex items-center gap-2 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" /> Adjust Prism Calibration
              </button>
              <button
                onClick={() => {
                  setIsPresentationMode(true);
                  if (!document.fullscreenElement) toggleFullscreen();
                }}
                className="px-6 py-2 rounded-xl bg-delphini-cyan text-black font-bold shadow-glow-sm hover:opacity-90 transition-opacity"
              >
                Enter Presentation Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Calibration Controls */}
      {showCalibration && (
        <CalibrationPanel
          calibration={calibration}
          showGrid={showGrid}
          onUpdate={(updated) => setCalibration(prev => ({ ...prev, ...updated }))}
          onToggleGrid={(val) => setShowGrid(val)}
          onSave={handleSaveCalibration}
          onClose={() => setShowCalibration(false)}
          onReset={() => {
            setCalibration({
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
          }}
        />
      )}
    </div>
  );
};
