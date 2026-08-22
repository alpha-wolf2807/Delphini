import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MonitorPlay, Radio, Settings, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-delphini-cyan selection:text-black">
      <div className="max-w-4xl mx-auto w-full space-y-12 my-auto">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase shadow-glow-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Interactive Holographic Interface
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white font-mono">
            DELPHINI
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-sans">
            Four-Sided Pepper's Ghost Optical Presentation System with Centralized Unified Female Neural Voice
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Projection Portal */}
          <Link
            to="/projection?room=DEL-4821"
            className="group glass-panel-glow rounded-3xl p-8 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all duration-200 flex flex-col justify-between h-72 shadow-glow-sm hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-cyan-400 text-black font-bold">
                  <MonitorPlay className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-cyan-400">
                  /projection
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                PROJECTION PORTAL
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                Runs on the ASUS Vivobook 14 Flip OLED display folded flat at 180° under the four-sided transparent prism. Pure black fullscreen renderer.
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold pt-4 border-t border-slate-800">
              <span>Launch Projection Display</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Remote Control Portal */}
          <Link
            to="/remote?room=DEL-4821"
            className="group glass-panel rounded-3xl p-8 border border-slate-700 hover:border-cyan-400 text-left transition-all duration-200 flex flex-col justify-between h-72 hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 group-hover:border-cyan-400">
                  <Radio className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
                  /remote
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                REMOTE CONTROL PORTAL
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                Tactile operator control deck for triggering scripted actions, dynamic live text responses, and emergency system safety toggles.
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold pt-4 border-t border-slate-800">
              <span>Open Operator Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* System Features Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="block text-cyan-400 font-mono font-bold text-base">4-Sided Prism</span>
            <span className="text-[11px] text-slate-500 font-mono">Synchronized 360° View</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="block text-cyan-400 font-mono font-bold text-base">Unified Voice</span>
            <span className="text-[11px] text-slate-500 font-mono">Single Neural Female Identity</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="block text-cyan-400 font-mono font-bold text-base">Live Response</span>
            <span className="text-[11px] text-slate-500 font-mono">Unscripted Q&A Fallback</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="block text-cyan-400 font-mono font-bold text-base">Room DEL-4821</span>
            <span className="text-[11px] text-slate-500 font-mono">Instant QR Pairing</span>
          </div>
        </div>

        {/* Footer Admin Link */}
        <div className="text-center pt-6 border-t border-slate-900 flex items-center justify-center gap-6 text-xs text-slate-500 font-mono">
          <Link to="/admin" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> System Admin & Voice Inspector
          </Link>
        </div>
      </div>
    </div>
  );
};
