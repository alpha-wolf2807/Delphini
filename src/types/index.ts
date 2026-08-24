export interface ActionItem {
  id: string;
  name: string;
  category: string;
  spokenText: string;
  video: string;
  holdImage: string;
  audio?: string;
  audioMode?: string;
  description?: string;
  createdAt?: number;
}

export interface VideoAsset {
  id: string;
  name: string;
  file: string;
  category?: string;
  duration?: number;
}

export interface ImageAsset {
  id: string;
  name: string;
  file: string;
  category?: string;
}

export interface VoiceConfig {
  id: string;
  name: string;
  engine: string;
  model: string;
  language: string;
  speaker: string;
  speed: number;
  pitch: string;
  rate: string;
  volume: string;
  description: string;
}

export interface CalibrationSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
  gap: number;
  rotation: number;
  brightness: number;
  contrast: number;
  prismSizeMm?: number;
  quadrantDistance?: number;
}

export type HologramMediaState = 'IDLE' | 'PLAYING_VIDEO' | 'HOLD_IMAGE' | 'TRANSITIONING' | 'BLACK_OUT';

export interface HologramStatus {
  state: HologramMediaState;
  currentActionId?: string;
  videoUrl?: string;
  holdImageUrl?: string;
  audioUrl?: string;
  isBlackScreen: boolean;
  timestamp: number;
}

export interface WebSocketMessage {
  type: string;
  roomId?: string;
  role?: 'PROJECTION' | 'REMOTE';
  actionId?: string;
  text?: string;
  audioUrl?: string;
  durationEstimate?: number;
  videoUrl?: string;
  holdImageUrl?: string;
  enabled?: boolean;
  calibration?: Partial<CalibrationSettings>;
  state?: HologramMediaState;
  timestamp?: number;
  clientTimestamp?: number;
  serverTimestamp?: number;
  projectionOnline?: boolean;
  status?: string;
  actions?: ActionItem[];
}
