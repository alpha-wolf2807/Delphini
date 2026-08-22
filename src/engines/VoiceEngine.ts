import { VoiceConfig } from '../types';

export interface VoiceEngineListener {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (err: Error) => void;
}

export class VoiceEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private voiceConfig: VoiceConfig | null = null;
  private listeners: Set<VoiceEngineListener> = new Set();
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.fetchVoiceConfig();
  }

  async fetchVoiceConfig(): Promise<VoiceConfig> {
    try {
      const res = await fetch('/api/voice/config');
      if (res.ok) {
        this.voiceConfig = await res.json();
        return this.voiceConfig!;
      }
    } catch (e) {
      console.warn('[VoiceEngine] Failed to fetch voice config from server:', e);
    }
    this.voiceConfig = {
      id: "delphini-female",
      name: "Delphini AI Voice (Neural Female)",
      engine: "local-neural",
      model: "en-US-AriaNeural",
      language: "en-US",
      speaker: "female",
      speed: 1.0,
      pitch: "+0Hz",
      rate: "+0%",
      volume: "+0%",
      description: "Unified Delphini female voice identity."
    };
    return this.voiceConfig;
  }

  subscribe(listener: VoiceEngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getVoiceInfo(): VoiceConfig {
    return this.voiceConfig || {
      id: "delphini-female",
      name: "Delphini AI Voice (Neural Female)",
      engine: "local-neural",
      model: "en-US-AriaNeural",
      language: "en-US",
      speaker: "female",
      speed: 1.0,
      pitch: "+0Hz",
      rate: "+0%",
      volume: "+0%",
      description: "Unified Delphini female voice identity."
    };
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        if (!url || this.audioCache.has(url)) {
          return resolve();
        }
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.oncanplaythrough = () => {
          this.audioCache.set(url, audio);
          resolve();
        };
        audio.onerror = () => {
          console.warn(`[VoiceEngine] Preload failed for audio: ${url}`);
          resolve();
        };
        audio.load();
      });
    });
    await Promise.all(promises);
    console.log(`[VoiceEngine] Preloaded ${urls.length} Delphini audio assets`);
  }

  playPreGeneratedAudio(url: string): Promise<void> {
    this.stop();
    return new Promise((resolve, reject) => {
      console.log(`[VoiceEngine] Playing pre-generated Delphini voice: ${url}`);
      const audio = new Audio(url);
      this.currentAudio = audio;

      for (const l of this.listeners) l.onSpeechStart?.();

      audio.onended = () => {
        this.currentAudio = null;
        for (const l of this.listeners) l.onSpeechEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        console.warn(`[VoiceEngine] Audio playback error for ${url}:`, e);
        this.currentAudio = null;
        for (const l of this.listeners) {
          l.onError?.(new Error(`Audio playback failed for ${url}`));
          l.onSpeechEnd?.();
        }
        resolve(); // resolve so flow does not crash
      };

      audio.play().catch(err => {
        console.warn('[VoiceEngine] Autoplay prevented or playback error:', err);
        for (const l of this.listeners) l.onSpeechEnd?.();
        resolve();
      });
    });
  }

  async speak(text: string, directAudioUrl?: string): Promise<void> {
    this.stop();
    console.log(`[VoiceEngine] Speaking with unified Delphini female voice: "${text}"`);
    
    let audioUrlToPlay = directAudioUrl;

    if (!audioUrlToPlay) {
      try {
        const response = await fetch('/api/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          const data = await response.json();
          audioUrlToPlay = data.audioUrl;
        } else {
          throw new Error('TTS server returned error');
        }
      } catch (err) {
        console.error('[VoiceEngine] Failed to synthesize live speech:', err);
      }
    }

    if (audioUrlToPlay) {
      return this.playPreGeneratedAudio(audioUrlToPlay);
    } else {
      // Fallback: Notify listeners of simulated speech duration without breaking presentation
      console.warn('[VoiceEngine] Running audio-less speech timing fallback');
      for (const l of this.listeners) l.onSpeechStart?.();
      const words = text.trim().split(/\s+/).length;
      const durationMs = Math.max(2000, (words / 2.5) * 1000);
      await new Promise(r => setTimeout(r, durationMs));
      for (const l of this.listeners) l.onSpeechEnd?.();
    }
  }
}
