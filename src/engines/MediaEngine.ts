import { HologramMediaState } from '../types';

export interface MediaEngineListener {
  onStateChange?: (state: HologramMediaState, metadata?: { videoUrl?: string; holdImageUrl?: string }) => void;
  onVideoEnd?: () => void;
  onError?: (err: Error) => void;
}

export class MediaEngine {
  private state: HologramMediaState = 'IDLE';
  private currentVideoUrl: string | null = null;
  private currentHoldImageUrl: string | null = null;
  private isBlackScreen: boolean = false;
  private listeners: Set<MediaEngineListener> = new Set();
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();
  private preloadedImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.state = 'IDLE';
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
        holdImageUrl: this.currentHoldImageUrl || undefined
      });
    }
  }

  getCurrentState(): {
    state: HologramMediaState;
    videoUrl: string | null;
    holdImageUrl: string | null;
    isBlackScreen: boolean;
  } {
    return {
      state: this.state,
      videoUrl: this.currentVideoUrl,
      holdImageUrl: this.currentHoldImageUrl,
      isBlackScreen: this.isBlackScreen
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

  playVideo(videoUrl: string, holdImageUrl: string) {
    this.currentVideoUrl = videoUrl;
    this.currentHoldImageUrl = holdImageUrl;
    this.isBlackScreen = false;
    this.notify('PLAYING_VIDEO');
    console.log(`[MediaEngine] Playing Video: ${videoUrl} -> Will Hold: ${holdImageUrl}`);
  }

  handleVideoEnded() {
    console.log(`[MediaEngine] Video ended -> Transitioning to Hold Image: ${this.currentHoldImageUrl}`);
    this.notify('HOLD_IMAGE');
    for (const l of this.listeners) {
      l.onVideoEnd?.();
    }
  }

  holdImage(imageUrl: string) {
    this.currentVideoUrl = null;
    this.currentHoldImageUrl = imageUrl;
    this.isBlackScreen = false;
    this.notify('HOLD_IMAGE');
    console.log(`[MediaEngine] Showing Hold Image: ${imageUrl}`);
  }

  setBlackScreen(enabled: boolean) {
    this.isBlackScreen = enabled;
    if (enabled) {
      this.notify('BLACK_OUT');
    } else {
      if (this.currentHoldImageUrl) {
        this.notify('HOLD_IMAGE');
      } else {
        this.notify('IDLE');
      }
    }
    console.log(`[MediaEngine] Black Screen: ${enabled}`);
  }

  reset(defaultHoldImage: string = '/assets/images/delphini_idle.png') {
    this.currentVideoUrl = null;
    this.currentHoldImageUrl = defaultHoldImage;
    this.isBlackScreen = false;
    this.notify('HOLD_IMAGE');
    console.log('[MediaEngine] Reset to idle hold state');
  }
}
