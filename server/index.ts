import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { RoomManager, RoomClient } from './roomManager.js';
import { ActionRegistry } from './actionRegistry.js';
import { VoiceService } from './voiceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Serve static assets from public/assets
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use(express.static(publicDir));
import fs from 'fs';
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Subsystems
const roomManager = new RoomManager();
const actionRegistry = new ActionRegistry();
const voiceService = new VoiceService();

// REST API Endpoints
app.get('/api/actions', (req, res) => {
  const actions = actionRegistry.getActions();
  res.json(actions);
});

app.post('/api/actions', async (req, res) => {
  try {
    const actionData = req.body;
    if (!actionData.name || !actionData.video || !actionData.holdImage) {
      return res.status(400).json({ error: 'Missing required action fields (name, video, holdImage)' });
    }

    // Auto-generate ID if not provided
    if (!actionData.id) {
      actionData.id = actionData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    }

    // If audioMode is 'delphini-engine' and spokenText is provided, synthesize audio file
    if (actionData.audioMode === 'delphini-engine' && actionData.spokenText && !actionData.audio) {
      try {
        const { audioUrl } = await voiceService.synthesize(actionData.spokenText);
        actionData.audio = audioUrl;
      } catch (err) {
        console.warn('[Server] Could not pre-synthesize voice for action:', err);
      }
    }

    const updatedActions = actionRegistry.saveAction(actionData);

    // Broadcast updated action list to all rooms
    const roomId = req.query.roomId as string || 'DEL-4821';
    roomManager.broadcastToRoom(roomId, {
      type: 'ACTIONS_UPDATED',
      actions: updatedActions
    });

    res.json({ success: true, action: actionData, actions: updatedActions });
  } catch (e: any) {
    console.error('[Server] Failed to save action:', e);
    res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
});

app.delete('/api/actions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedActions = actionRegistry.deleteAction(id);
    const roomId = (req.query.roomId as string) || 'DEL-4821';

    // Broadcast updated action list to all projection & remote clients in room
    roomManager.broadcastToRoom(roomId, {
      type: 'ACTIONS_UPDATED',
      actions: updatedActions
    });

    res.json({ success: true, deletedId: id, actions: updatedActions });
  } catch (e: any) {
    console.error('[Server] Failed to delete action:', e);
    res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
});

app.get('/api/assets/videos', (req, res) => {
  res.json(actionRegistry.getVideos());
});

app.get('/api/assets/images', (req, res) => {
  res.json(actionRegistry.getImages());
});

app.get('/api/calibration', (req, res) => {
  res.json(actionRegistry.getCalibration());
});

app.post('/api/calibration', (req, res) => {
  const updated = actionRegistry.saveCalibration(req.body);
  const roomId = req.query.roomId as string || 'DEL-4821';
  roomManager.broadcastToRoom(roomId, {
    type: 'CALIBRATION_UPDATED',
    calibration: updated
  });
  res.json(updated);
});

app.get('/api/entry', (req, res) => {
  res.json(actionRegistry.getEntryConfig());
});

app.post('/api/entry', (req, res) => {
  const updated = actionRegistry.saveEntryConfig(req.body);
  const roomId = req.query.roomId as string || 'DEL-4821';
  roomManager.broadcastToRoom(roomId, {
    type: 'ENTRY_CONFIG_UPDATED',
    entryConfig: updated
  });
  res.json(updated);
});

app.get('/api/voice/config', (req, res) => {
  res.json(voiceService.getConfig());
});

app.post('/api/tts/speak', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required' });
    }

    const result = await voiceService.synthesize(text);
    res.json({ success: true, audioUrl: result.audioUrl, durationEstimate: result.durationEstimate });
  } catch (e: any) {
    console.warn('[Server] Python TTS synthesis unavailable, returning Web Speech API fallback payload:', e.message);
    const words = (req.body.text || '').trim().split(/\s+/).length;
    const durationEstimate = Math.max(1.8, Math.ceil((words / 2.5) * 10) / 10);
    res.json({ success: false, audioUrl: null, fallback: 'web-speech', durationEstimate });
  }
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, req) => {
  const clientId = `client_${Math.random().toString(36).substring(2, 9)}`;
  let currentRoomId = '';
  let clientRole: 'PROJECTION' | 'REMOTE' = 'REMOTE';

  const clientInfo: RoomClient = {
    ws,
    id: clientId,
    role: clientRole,
    connectedAt: Date.now()
  };

  ws.on('message', async (data: string) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'JOIN_ROOM': {
          currentRoomId = message.roomId || 'DEL-4821';
          clientRole = message.role || 'REMOTE';
          clientInfo.role = clientRole;

          roomManager.joinRoom(currentRoomId, clientInfo);
          break;
        }

        case 'ACTION': {
          if (!currentRoomId) return;
          console.log(`[WS] Action triggered in room ${currentRoomId}: ${message.actionId}`);

          // Route action directly to projection
          roomManager.sendToProjection(currentRoomId, {
            type: 'EXECUTE_ACTION',
            actionId: message.actionId,
            timestamp: Date.now()
          });

          // Acknowledge back to remote
          ws.send(JSON.stringify({
            type: 'ACTION_ACK',
            actionId: message.actionId,
            timestamp: Date.now()
          }));
          break;
        }

        case 'LIVE_RESPONSE': {
          if (!currentRoomId) return;
          const text = message.text?.trim();
          if (!text) return;

          const videoUrl = message.videoUrl || null;
          const holdImageUrl = message.holdImageUrl || '/assets/images/Fallback image.png';

          console.log(`[WS] Live Response received in room ${currentRoomId}: "${text}" (Video: ${videoUrl || 'default'})`);

          try {
            // Synthesize speech with Delphini Unified Voice
            const ttsResult = await voiceService.synthesize(text);

            // Send to projection with synthesized Delphini audio URL, custom videoUrl and duration
            roomManager.sendToProjection(currentRoomId, {
              type: 'EXECUTE_LIVE_RESPONSE',
              text,
              audioUrl: ttsResult.audioUrl,
              durationEstimate: ttsResult.durationEstimate,
              videoUrl,
              holdImageUrl,
              timestamp: Date.now()
            });

            ws.send(JSON.stringify({
              type: 'LIVE_RESPONSE_SENT',
              text,
              audioUrl: ttsResult.audioUrl,
              videoUrl,
              timestamp: Date.now()
            }));
          } catch (ttsErr: any) {
            console.error('[WS] Live TTS error:', ttsErr);
            // Even if offline/error, send live response with fallback
            roomManager.sendToProjection(currentRoomId, {
              type: 'EXECUTE_LIVE_RESPONSE',
              text,
              audioUrl: null,
              durationEstimate: 3.5,
              videoUrl,
              holdImageUrl,
              timestamp: Date.now()
            });
          }
          break;
        }

        case 'RESET_HOLOGRAM': {
          if (!currentRoomId) return;
          console.log(`[WS] Reset hologram command in room ${currentRoomId}`);
          roomManager.sendToProjection(currentRoomId, {
            type: 'RESET_HOLOGRAM',
            timestamp: Date.now()
          });
          break;
        }

        case 'BLACK_SCREEN': {
          if (!currentRoomId) return;
          console.log(`[WS] Black screen toggle in room ${currentRoomId}: ${message.enabled}`);
          roomManager.sendToProjection(currentRoomId, {
            type: 'SET_BLACK_SCREEN',
            enabled: message.enabled,
            timestamp: Date.now()
          });
          break;
        }

        case 'TRIGGER_ENTRY': {
          if (!currentRoomId) return;
          console.log(`[WS] Trigger entry command in room ${currentRoomId}`);
          roomManager.sendToProjection(currentRoomId, {
            type: 'EXECUTE_ENTRY',
            timestamp: Date.now()
          });
          break;
        }

        case 'ENTRY_CONFIG_UPDATE': {
          if (!currentRoomId) return;
          console.log(`[WS] Entry config updated in room ${currentRoomId}`);
          roomManager.broadcastToRoom(currentRoomId, {
            type: 'ENTRY_CONFIG_UPDATED',
            entryConfig: message.entryConfig,
            timestamp: Date.now()
          });
          break;
        }

        case 'HOLOGRAM_STATE_UPDATE': {
          // Projection reports its current state -> forward to Remotes
          if (!currentRoomId) return;
          roomManager.broadcastToRoom(currentRoomId, {
            type: 'HOLOGRAM_STATE_CHANGED',
            state: message.state,
            actionId: message.actionId,
            timestamp: Date.now()
          }, ws);
          break;
        }

        case 'CALIBRATION_UPDATE': {
          if (!currentRoomId) return;
          console.log(`[WS] Calibration live update received in room ${currentRoomId}`);
          roomManager.broadcastToRoom(currentRoomId, {
            type: 'CALIBRATION_UPDATED',
            calibration: message.calibration,
            timestamp: Date.now()
          });
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({
            type: 'PONG',
            clientTimestamp: message.timestamp,
            serverTimestamp: Date.now()
          }));
          break;
        }

        default:
          console.log('[WS] Unknown message type:', message.type);
      }
    } catch (e) {
      console.error('[WS] Message parse error:', e);
    }
  });

  ws.on('close', () => {
    roomManager.leaveRoom(clientInfo);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Client error (${clientId}):`, err);
    roomManager.leaveRoom(clientInfo);
  });
});

// SPA Route Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/assets')) {
    return next();
  }
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`   DELPHINI Interactive Holographic Server Running`);
  console.log(`   HTTP & WS Port: ${PORT}`);
  console.log(`   Default Room:   DEL-4821`);
  console.log(`======================================================\n`);
});
