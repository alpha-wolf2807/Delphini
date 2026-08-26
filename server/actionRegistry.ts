import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export interface CalibrationSettings {
  scale: number;
  offsetX: number;
  offsetY: number;
  gap: number;
  rotation: number;
  brightness?: number;
  contrast?: number;
  prismSizeMm?: number;
  quadrantDistance?: number;
}

export interface EntryConfig {
  videoUrl: string;
  holdImageUrl: string;
  autoPlayOnLoad?: boolean;
}

export class ActionRegistry {
  private configDir: string;
  private actionsPath: string;
  private videosPath: string;
  private imagesPath: string;
  private calibrationPath: string;
  private entryPath: string;

  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    this.actionsPath = path.join(this.configDir, 'actions.json');
    this.videosPath = path.join(this.configDir, 'videos.json');
    this.imagesPath = path.join(this.configDir, 'images.json');
    this.calibrationPath = path.join(this.configDir, 'calibration.json');
    this.entryPath = path.join(this.configDir, 'entry.json');
  }

  getActions(): ActionItem[] {
    try {
      if (fs.existsSync(this.actionsPath)) {
        return JSON.parse(fs.readFileSync(this.actionsPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[ActionRegistry] Error reading actions.json:', e);
    }
    return [];
  }

  saveAction(action: ActionItem): ActionItem[] {
    const actions = this.getActions();
    const existingIndex = actions.findIndex(a => a.id.toUpperCase() === action.id.toUpperCase());

    const cleanAction: ActionItem = {
      id: action.id.trim().toUpperCase().replace(/\s+/g, '_'),
      name: action.name.trim(),
      category: action.category || 'General',
      spokenText: action.spokenText || '',
      video: action.video,
      holdImage: action.holdImage,
      audio: action.audio || '',
      audioMode: action.audioMode || 'delphini-engine',
      description: action.description || '',
      createdAt: action.createdAt || Date.now()
    };

    if (existingIndex >= 0) {
      actions[existingIndex] = cleanAction;
    } else {
      actions.push(cleanAction);
    }

    fs.writeFileSync(this.actionsPath, JSON.stringify(actions, null, 2), 'utf-8');
    console.log(`[ActionRegistry] Action saved: ${cleanAction.id} (${cleanAction.name})`);
    return actions;
  }

  deleteAction(actionId: string): ActionItem[] {
    const actions = this.getActions();
    const filtered = actions.filter(a => a.id.toUpperCase() !== actionId.trim().toUpperCase());
    fs.writeFileSync(this.actionsPath, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[ActionRegistry] Action deleted: ${actionId}`);
    return filtered;
  }

  getVideos(): VideoAsset[] {
    try {
      if (fs.existsSync(this.videosPath)) {
        return JSON.parse(fs.readFileSync(this.videosPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[ActionRegistry] Error reading videos.json:', e);
    }
    return [];
  }

  getImages(): ImageAsset[] {
    try {
      if (fs.existsSync(this.imagesPath)) {
        return JSON.parse(fs.readFileSync(this.imagesPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[ActionRegistry] Error reading images.json:', e);
    }
    return [];
  }

  getCalibration(): CalibrationSettings {
    try {
      if (fs.existsSync(this.calibrationPath)) {
        return JSON.parse(fs.readFileSync(this.calibrationPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[ActionRegistry] Error reading calibration.json:', e);
    }
    return {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      gap: 0,
      rotation: 0,
      brightness: 1.0,
      contrast: 1.1
    };
  }

  saveCalibration(settings: Partial<CalibrationSettings>): CalibrationSettings {
    const current = this.getCalibration();
    const updated = { ...current, ...settings };
    fs.writeFileSync(this.calibrationPath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[ActionRegistry] Calibration settings updated');
    return updated;
  }

  getEntryConfig(): EntryConfig {
    try {
      if (fs.existsSync(this.entryPath)) {
        return JSON.parse(fs.readFileSync(this.entryPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[ActionRegistry] Error reading entry.json:', e);
    }
    return {
      videoUrl: '/assets/videos/N--DELPHINI INTRODUCTION.mp4',
      holdImageUrl: '/assets/images/Fallback image.png',
      autoPlayOnLoad: false
    };
  }

  saveEntryConfig(config: Partial<EntryConfig>): EntryConfig {
    const current = this.getEntryConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(this.entryPath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[ActionRegistry] Entry config updated');
    return updated;
  }
}
