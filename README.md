# DELPHINI — Interactive Holographic Interface

> **A Production-Quality Hackathon Prototype for 4-Sided Pepper's Ghost Holographic Optical Projection**

---

## 🌌 System Overview

**DELPHINI** is an interactive, web-based holographic presentation appliance built for an **ASUS Vivobook 14 Flip OLED (1920 × 1200 display)** folded flat at 180° with a transparent 4-sided Pepper's Ghost prism placed on the screen.

The system connects two dedicated interfaces in real time through a low-latency WebSocket hub:
1. **Projection Portal (`/projection`)**: Runs on the projection laptop under the prism. Pure black fullscreen viewport rendering 4 synchronized quadrant views (0°, 90°, 180°, 270°) with zero phase drift, automatic video-to-persistent-hold-image transitions, and local voice playback.
2. **Remote Control Portal (`/remote`)**: Runs on a hidden/friendly operator device (laptop/phone) with room pairing (`DEL-XXXX`), categorized dynamic action triggers, live latency meter, Action Creator modal, Live Response Q&A modal, and emergency blackout controls.
3. **Unified Voice Engine**: Delphini possesses **ONE consistent neural female voice identity** (`en-US-AriaNeural`) across all scripted actions, pre-generated audio files, and live on-demand Q&A responses.

---

## 🏗️ Architecture

```
                  ┌──────────────────────────────┐
                  │    DELPHINI SERVER (:3001)   │
                  │                              │
                  │  • WebSocket Hub (/ws)       │
                  │  • Room Manager (DEL-XXXX)   │
                  │  • Neural Voice TTS API      │
                  │  • Asset & Action Registry   │
                  └──────────────┬───────────────┘
                                 │
                     Secure WebSocket / WSS
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌───────────────────────┐                   ┌───────────────────────┐
│ REMOTE CONTROL PORTAL │                   │   PROJECTION PORTAL   │
│       (/remote)       │                   │     (/projection)     │
│                       │                   │                       │
│ • Dynamic Action Grid │                   │ • 4-Sided Renderer    │
│ • Live Response Modal │                   │ • Media Engine        │
│ • Action Creator      │                   │ • Voice Engine        │
│ • Latency & Room Stat │                   │ • Prism Calibration   │
│ • Emergency Reset     │                   │ • Preloader Checklist │
└───────────────────────┘                   └───────────┬───────────┘
                                                        │
                                                1920×1200 OLED
                                                        │
                                                4-SIDED PRISM
                                                        │
                                                        ▼
                                                    HOLOGRAM
```

---

## 🚀 Quick Start (Local Run)

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+) with `edge-tts`, `pillow`, and `imageio[ffmpeg]`

### 2. Start the System
```bash
# Start unified production server (serves frontend + WebSocket backend on :3001)
npm start
```
Or for frontend hot-reloading in development:
```bash
npm run dev
```

### 3. Open the Portals
- **Landing Page**: [http://localhost:3001](http://localhost:3001)
- **Projection Portal**: [http://localhost:3001/projection?room=DEL-4821](http://localhost:3001/projection?room=DEL-4821)
- **Remote Portal**: [http://localhost:3001/remote?room=DEL-4821](http://localhost:3001/remote?room=DEL-4821)
- **System Admin**: [http://localhost:3001/admin](http://localhost:3001/admin)

---

## 🎙️ The Unified Delphini Female Voice Engine

DELPHINI enforces a **single consistent voice identity** throughout the product:
- **Pre-generated Audio**: All default actions use pre-synthesized studio WAV files located in `public/assets/audio/delphini/`.
- **Live Response Synthesis**: Whenever the remote operator types arbitrary text into the Live Response modal, the backend Voice Engine converts the text into audio using the **exact same female voice model** (`en-US-AriaNeural`), transmits the URL to the projection portal, and plays the `delphini_explain.mp4` holographic talking animation.
- **Configuration**: Defined in `config/voice.json`:
```json
{
  "id": "delphini-female",
  "name": "Delphini AI Voice (Neural Female)",
  "engine": "local-neural",
  "model": "en-US-AriaNeural",
  "language": "en-US",
  "speaker": "female",
  "speed": 1.0,
  "pitch": "+0Hz",
  "rate": "+0%",
  "volume": "+0%"
}
```

---

## 📐 4-Sided Pepper's Ghost Hologram Renderer

The `FourSideRenderer` arranges four synchronized quadrant viewports facing outwards/inwards for a 4-sided pyramid prism:
- **TOP**: 180° radial orientation
- **RIGHT**: 270° radial orientation
- **BOTTOM**: 0° radial orientation
- **LEFT**: 90° radial orientation

### Prism Calibration:
Press <kbd>C</kbd> in Projection Portal or click **"Adjust Prism Calibration"**:
- **Scale**: Resize the hologram footprint (0.5x – 1.8x).
- **Prism Gap / Distance**: Adjust radial distance from the prism tip.
- **Center Offsets (X/Y)**: Align the hologram with the optical center of the physical prism.
- **Alignment Grid**: Toggle crosshairs and prism center alignment square.
- Calibration is persisted in `config/calibration.json`.

---

## 🎬 Media Lifecycle: Video to Persistent Hold Image

A core rule of the Delphini MediaEngine:
1. Video plays **once** (does not loop unexpectedly).
2. On video completion (`onEnded`), the engine **immediately transitions to the configured hold image**.
3. The hold image remains visible **indefinitely** in pure black space until the next action is triggered.

Example:
- `[SHOW PEN]`: Plays `pen_show.mp4` -> Transitions to `pen_final.png` -> Holds.
- `[EXPAND PEN]`: Plays `pen_expand.mp4` -> Transitions to `pen_components.png` -> Holds.
- `[ASSEMBLE PEN]`: Plays `pen_assemble.mp4` -> Transitions to `pen_final.png` -> Holds.

---

## ➕ Dynamic Action Creator

The Remote Portal allows operators to create new actions on the fly without modifying code:
1. Click **`[ + CREATE NEW ACTION ]`** on the Remote Portal.
2. Fill in:
   - **Action Name** (e.g. `Show Engine Matrix`)
   - **Sentence to Speak** (spoken via unified Delphini voice)
   - **Video Asset** (selected from `config/videos.json`)
   - **Hold Image** (selected from `config/images.json`)
   - **Category** (`Character`, `Objects`, `Special`, etc.)
   - **Audio Mode** (`Delphini VoiceEngine`, `Pre-Generated`, `Silent`)
3. Click **Save & Add Action** — the action is registered in `config/actions.json` and immediately renders as a clickable card on the remote console.

---

## ⚡ Live Response Q&A Fallback

If the audience asks an unscripted question during the hackathon presentation:
1. Operator clicks **`[ ⚡ LIVE RESPONSE MODE ]`**.
2. Types the answer (or clicks a preset).
3. Clicks **`[ Speak as Delphini ]`**.
4. The projection portal immediately:
   - Synthesizes the response in the **same female Delphini voice**.
   - Plays the `delphini_explain.mp4` talking animation.
   - Synchronizes speech audio with holographic waveforms.
   - Transitions into `delphini_explain_hold.png` or idle state on completion.

---

## 🎪 How to Run the Live Hackathon Presentation

1. **Physical Setup**:
   - Fold the ASUS Vivobook 14 Flip OLED flat at 180°.
   - Set Windows display brightness to 100% (for maximum OLED contrast).
   - Place the transparent 4-sided Pepper's Ghost prism in the center of the display.
2. **Launch Projection**:
   - Open `/projection?room=DEL-4821` on the projection laptop.
   - Verify preloader checklist shows all green checkmarks.
   - Click **"Enter Hologram Presentation Mode"** (or press <kbd>F</kbd> for fullscreen).
   - The screen is now pure black.
3. **Operator Connection**:
   - Open `/remote?room=DEL-4821` on the operator's laptop or smartphone (scan the QR code from setup mode).
   - Verify **"Projection Online"** shows green.
4. **Presenting**:
   - Presenter cues the operator ("Hey babe...", "Show them the pen", "Let's see inside").
   - Operator clicks `[ HI ]` -> `[ SHOW PEN ]` -> `[ EXPAND PEN ]` -> `[ ASSEMBLE PEN ]`.
   - Use `[ RESET HOLOGRAM ]` or `[ BLACK SCREEN ]` if needed.

---

## 🛠️ Regenerating Assets & Audio

To re-render all high-definition holographic videos, hold images, and Delphini audio files:
```bash
# Generate studio Delphini voice audio files
python server/scripts/generate_delphini_audio.py

# Generate Pepper's Ghost MP4 videos and PNG hold images
python server/scripts/generate_hologram_assets.py
```

---

## 🧪 Automated Testing

Run the full integration test suite (REST APIs, Voice Synthesis, WebSocket Handshake, Action Routing):
```bash
node test_system.js
```
