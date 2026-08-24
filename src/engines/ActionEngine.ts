import { ActionItem, HologramStatus } from '../types';
import { MediaEngine } from './MediaEngine';
import { VoiceEngine } from './VoiceEngine';

export class ActionEngine {
  private mediaEngine: MediaEngine;
  private voiceEngine: VoiceEngine;
  private actions: Map<string, ActionItem> = new Map();
  private currentActionId: string | null = null;
  private onStatusChangeCallback?: (status: HologramStatus) => void;

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
      timestamp: Date.now()
    });
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
    console.log(`[ActionEngine] Executing Live Response: "${text}" (Video: ${videoUrl || 'default'})`);
    this.currentActionId = 'LIVE_RESPONSE';

    // 1. Stop previous audio
    this.voiceEngine.stop();

    // 2. Play selected video (or default explain video) and set hold image
    const targetVideo = videoUrl || '/assets/videos/delphini_explain.mp4';
    const targetHold = holdImageUrl || '/assets/images/Fallback image.png';
    this.mediaEngine.playVideo(targetVideo, targetHold);

    // 3. Speak using the unified Delphini female voice
    await this.voiceEngine.speak(text, directAudioUrl || undefined);

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
