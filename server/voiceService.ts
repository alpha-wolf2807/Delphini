import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export class VoiceService {
  private configPath: string;
  private generatedDir: string;
  private voiceConfig: VoiceConfig;

  constructor() {
    this.configPath = path.join(__dirname, '..', 'config', 'voice.json');
    this.generatedDir = path.join(__dirname, '..', 'public', 'assets', 'audio', 'generated');
    
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }

    this.voiceConfig = this.loadConfig();
  }

  loadConfig(): VoiceConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[VoiceService] Failed to load voice config:', e);
    }
    return {
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

  getConfig(): VoiceConfig {
    return this.voiceConfig;
  }

  async synthesize(text: string): Promise<{ audioUrl: string; durationEstimate: number }> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Text cannot be empty");
    }

    // Cache key based on text and voice model
    const hash = crypto.createHash('md5').update(`${this.voiceConfig.model}:${trimmed}`).digest('hex');
    const filename = `delphini_${hash}.wav`;
    const outputPath = path.join(this.generatedDir, filename);
    const audioUrl = `/assets/audio/generated/${filename}`;

    // Estimated duration: ~150 words per minute -> ~2.5 words per second
    const wordCount = trimmed.split(/\s+/).length;
    const durationEstimate = Math.max(1.8, Math.ceil((wordCount / 2.5) * 10) / 10);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      console.log(`[VoiceService] Serving cached voice synthesis for: "${trimmed.substring(0, 30)}..."`);
      return { audioUrl, durationEstimate };
    }

    console.log(`[VoiceService] Synthesizing speech with Delphini Voice (${this.voiceConfig.model}): "${trimmed}"`);

    // Run Python edge-tts synthesis script
    return new Promise((resolve, reject) => {
      const pythonScript = `
import asyncio
import edge_tts
import sys

async def main():
    voice = "${this.voiceConfig.model}"
    text = sys.argv[1]
    out_file = sys.argv[2]
    rate = "${this.voiceConfig.rate || '+0%'}"
    pitch = "${this.voiceConfig.pitch || '+0Hz'}"
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(out_file)

if __name__ == '__main__':
    asyncio.run(main())
`;

      const proc = spawn('python', ['-c', pythonScript, trimmed, outputPath]);
      
      let errorData = '';
      proc.stderr.on('data', (d) => { errorData += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          console.log(`[VoiceService] Voice synthesized successfully: ${filename}`);
          resolve({ audioUrl, durationEstimate });
        } else {
          console.error(`[VoiceService] Python synthesis error (code ${code}):`, errorData);
          // If python edge-tts fails for any offline reason, fallback gracefully
          reject(new Error(`TTS synthesis failed: ${errorData || 'Unknown error'}`));
        }
      });
    });
  }
}
