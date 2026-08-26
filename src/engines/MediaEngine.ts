import { HologramMediaState, EntryConfig } from '../types';

export interface MediaEngineListener {
  onStateChange?: (state: HologramMediaState, metadata?: { videoUrl?: string; holdImageUrl?: string; isLooping?: boolean }) => void;
  onVideoEnd?: () => void;
  onError?: (err: Error) => void;
}

export class MediaEngine {
  private state: HologramMediaState = 'IDLE';
  private currentVideoUrl: string | null = null;
  private currentHoldImageUrl: string | null = null;
  private isBlackScreen: boolean = false;
  private isLooping: boolean = false;
  private listeners: Set<MediaEngineListener> = new Set();
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();
  private preloadedImages: Map<string, HTMLImageElement> = new Map();
  private entryConfig: EntryConfig = {
    videoUrl: '/assets/videos/N--DELPHINI INTRODUCTION.mp4',
    holdImageUrl: '/assets/images/Fallback image.png',
    autoPlayOnLoad: false
  };

  constructor() {
    this.state = 'IDLE';
    this.fetchEntryConfig();
  }

  async fetchEntryConfig(): Promise<EntryConfig> {
    try {
      const res = await fetch('/api/entry');
      if (res.ok) {
        this.entryConfig = await res.json();
      }
    } catch (e) {
      console.warn('[MediaEngine] Failed to fetch entry config from server:', e);
    }
    return this.entryConfig;
  }

  setEntryConfig(config: Partial<EntryConfig>) {
    this.entryConfig = { ...this.entryConfig, ...config };
  }

  getEntryConfig(): EntryConfig {
    return this.entryConfig;
  }

  subscribe(listener: MediaEngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: HologramMediaState) {
    this.state = state;
    for (const l of this.listeners) {
      l.onStateChange?.(state, {
        videoUrl: this.currentVideoUrl || undefined,
        holdImageUrl: this.currentHoldImageUrl || undefined,
        isLooping: this.isLooping
      });
    }
  }

  getCurrentState(): {
    state: HologramMediaState;
    videoUrl: string | null;
    holdImageUrl: string | null;
    isBlackScreen: boolean;
    isLooping: boolean;
  } {
    return {
      state: this.state,
      videoUrl: this.currentVideoUrl,
      holdImageUrl: this.currentHoldImageUrl,
      isBlackScreen: this.isBlackScreen,
      isLooping: this.isLooping
    };
  }

  async preloadVideo(url: string): Promise<boolean> {
    if (this.preloadedVideos.has(url)) return true;
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.oncanplaythrough = () => {
        this.preloadedVideos.set(url, video);
        resolve(true);
      };
      video.onerror = () => {
        console.warn(`[MediaEngine] Failed to preload video: ${url}`);
        resolve(false);
      };
      video.load();
    });
  }

  async preloadImage(url: string): Promise<boolean> {
    if (this.preloadedImages.has(url)) return true;
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.preloadedImages.set(url, img);
        resolve(true);
      };
      img.onerror = () => {
        console.warn(`[MediaEngine] Failed to preload image: ${url}`);
        resolve(false);
      };
    });
  }

  playVideo(videoUrl: string, holdImageUrl: string = '/assets/images/Fallback image.png', isLooping: boolean = false) {
    this.currentVideoUrl = videoUrl;
    this.currentHoldImageUrl = holdImageUrl || '/assets/images/Fallback image.png';
    this.isBlackScreen = false;
    this.isLooping = isLooping;
    this.notify('PLAYING_VIDEO');
    console.log(`[MediaEngine] Playing Video: ${videoUrl} (Looping: ${isLooping}) -> Will Hold: ${this.currentHoldImageUrl}`);
  }

  playEntry(videoUrl?: string, holdImageUrl?: string) {
    const video = videoUrl || this.entryConfig.videoUrl || '/assets/videos/N--DELPHINI INTRODUCTION.mp4';
    const hold = holdImageUrl || this.entryConfig.holdImageUrl || '/assets/images/Fallback image.png';
    this.currentVideoUrl = video;
    this.currentHoldImageUrl = hold;
    this.isBlackScreen = false;
    this.isLooping = false;
    this.notify('ENTRY_PLAYING');
    console.log(`[MediaEngine] Playing Delphini Entry Video: ${video}`);
  }

  setAwaitingEntry() {
    this.currentVideoUrl = null;
    this.isBlackScreen = false;
    this.isLooping = false;
    this.notify('AWAITING_ENTRY');
    console.log('[MediaEngine] Hologram awaiting grand entry trigger');
  }

  setLooping(isLooping: boolean) {
    this.isLooping = isLooping;
    this.notify(this.state);
  }

  handleVideoEnded() {
    // If video was set to loop dynamically, keep state as playing
    if (this.isLooping) {
      console.log('[MediaEngine] Video loop iteration completed while looping active');
      return;
    }

    const fallbackImage = this.currentHoldImageUrl || '/assets/images/Fallback image.png';
    console.log(`[MediaEngine] Video ended -> Transitioning to Persistent Hold Image: ${fallbackImage}`);
    this.currentHoldImageUrl = fallbackImage;
    this.notify('HOLD_IMAGE');
    for (const l of this.listeners) {
      l.onVideoEnd?.();
    }
  }

  holdImage(imageUrl: string = '/assets/images/Fallback image.png') {
    this.currentVideoUrl = null;
    this.currentHoldImageUrl = imageUrl || '/assets/images/Fallback image.png';
    this.isBlackScreen = false;
    this.isLooping = false;
    this.notify('HOLD_IMAGE');
    console.log(`[MediaEngine] Showing Hold Image: ${this.currentHoldImageUrl}`);
  }

  setBlackScreen(enabled: boolean) {
    this.isBlackScreen = enabled;
    if (enabled) {
      this.notify('BLACK_OUT');
    } else {
      this.currentHoldImageUrl = this.currentHoldImageUrl || '/assets/images/Fallback image.png';
      this.notify('HOLD_IMAGE');
    }
    console.log(`[MediaEngine] Black Screen: ${enabled}`);
  }

  reset(defaultHoldImage: string = '/assets/images/Fallback image.png') {
    this.currentVideoUrl = null;
    this.currentHoldImageUrl = defaultHoldImage;
    this.isBlackScreen = false;
    this.isLooping = false;
    this.notify('HOLD_IMAGE');
    console.log('[MediaEngine] Reset to idle fallback state');
  }
}
