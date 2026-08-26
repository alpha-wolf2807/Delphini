import { ActionItem, HologramStatus } from '../types';
import { MediaEngine } from './MediaEngine';
import { VoiceEngine } from './VoiceEngine';

export class ActionEngine {
  private mediaEngine: MediaEngine;
  private voiceEngine: VoiceEngine;
  private actions: Map<string, ActionItem> = new Map();
  private currentActionId: string | null = null;
  private onStatusChangeCallback?: (status: HologramStatus) => void;
  private isLiveSpeechActive: boolean = false;

  constructor(mediaEngine: MediaEngine, voiceEngine: VoiceEngine) {
    this.mediaEngine = mediaEngine;
    this.voiceEngine = voiceEngine;

    // Listen to media engine state changes
    this.mediaEngine.subscribe({
      onStateChange: (state, meta) => {
        this.emitStatus();
      },
      onVideoEnd: () => {
        console.log('[ActionEngine] Video finished, holding image indefinitely');
        this.emitStatus();
      }
    });

    this.voiceEngine.subscribe({
      onSpeechEnd: () => {
        console.log('[ActionEngine] Delphini speech completed');
        this.isLiveSpeechActive = false;
        // Turn off looping on MediaEngine if speech ended
        if (this.currentActionId === 'LIVE_RESPONSE') {
          this.mediaEngine.setLooping(false);
          // Transition to hold image once speech finishes
          this.mediaEngine.handleVideoEnded();
        }
      }
    });
  }

  setActions(actionsList: ActionItem[]) {
    this.actions.clear();
    for (const a of actionsList) {
      this.actions.set(a.id.toUpperCase(), a);
    }
    console.log(`[ActionEngine] Loaded ${this.actions.size} actions into registry`);
  }

  onStatusChange(cb: (status: HologramStatus) => void) {
    this.onStatusChangeCallback = cb;
  }

  private emitStatus() {
    if (!this.onStatusChangeCallback) return;
    const media = this.mediaEngine.getCurrentState();
    this.onStatusChangeCallback({
      state: media.state,
      currentActionId: this.currentActionId || undefined,
      videoUrl: media.videoUrl || undefined,
      holdImageUrl: media.holdImageUrl || undefined,
      isBlackScreen: media.isBlackScreen,
      isLooping: media.isLooping,
      timestamp: Date.now()
    });
  }

  triggerEntry() {
    console.log('[ActionEngine] Triggering Delphini Grand Entry');
    this.currentActionId = 'DELPHINI_ENTRY';
    this.voiceEngine.stop();
    this.mediaEngine.playEntry();
    this.emitStatus();
  }

  async execute(actionId: string): Promise<boolean> {
    const key = actionId.toUpperCase().trim();
    const action = this.actions.get(key);
    
    if (!action) {
      console.warn(`[ActionEngine] Action ID not found: ${actionId}`);
      return false;
    }

    console.log(`[ActionEngine] Executing Action: ${action.id} ("${action.name}")`);
    this.currentActionId = action.id;

    // 1. Stop any currently active TTS / speech audio
    this.voiceEngine.stop();

    // 2. Start Video on MediaEngine (video's built-in native audio plays through master viewport)
    this.mediaEngine.playVideo(action.video, action.holdImage);

    this.emitStatus();
    return true;
  }

  async executeLiveResponse(
    text: string,
    directAudioUrl?: string | null,
    durationEstimate: number = 4.0,
    videoUrl?: string | null,
    holdImageUrl?: string | null
  ) {
    console.log(`[ActionEngine] Executing Live Response: "${text}" (Speech duration estimate: ${durationEstimate}s, Video: ${videoUrl || 'default'})`);
    this.currentActionId = 'LIVE_RESPONSE';

    // 1. Stop previous audio
    this.voiceEngine.stop();
    this.isLiveSpeechActive = true;

    const targetVideo = videoUrl || '/assets/videos/delphini_explain.mp4';
    const targetHold = holdImageUrl || '/assets/images/Fallback image.png';
    const defaultVideoLength = 8.5; // Average talking video length in seconds

    // If speech response is long (> 8.5s), enable seamless looping until speech finishes
    const shouldLoop = durationEstimate > defaultVideoLength;
    console.log(`[ActionEngine] Live response looping strategy: ${shouldLoop ? 'LOOPING UNTIL SPEECH ENDS' : 'SINGLE PASS WITH SPEECH SYNC'}`);

    // Preload video into media engine buffer first
    await this.mediaEngine.preloadVideo(targetVideo);

    let hasVideoStarted = false;
    const startVideoSync = () => {
      if (!hasVideoStarted) {
        hasVideoStarted = true;
        console.log('[ActionEngine] Speech output started -> Syncing avatar video playback at exact millisecond!');
        this.mediaEngine.playVideo(targetVideo, targetHold, shouldLoop);
        this.emitStatus();
      }
    };

    // Listen for exact speech start millisecond
    const unsubscribeSpeech = this.voiceEngine.subscribe({
      onSpeechStart: () => {
        startVideoSync();
      }
    });

    // 2. Speak using the unified Delphini female voice
    try {
      await this.voiceEngine.speak(text, directAudioUrl || undefined);
    } finally {
      // Fallback: Ensure video started even if onSpeechStart didn't fire
      startVideoSync();
      unsubscribeSpeech();
    }

    this.emitStatus();
  }

  reset() {
    this.currentActionId = null;
    this.voiceEngine.stop();
    this.mediaEngine.reset('/assets/images/Fallback image.png');
    this.emitStatus();
  }

  setBlackScreen(enabled: boolean) {
    if (enabled) {
      this.voiceEngine.stop();
    }
    this.mediaEngine.setBlackScreen(enabled);
    this.emitStatus();
  }
}
