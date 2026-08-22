import { WebSocketMessage } from '../types';

export interface WebSocketClientOptions {
  url?: string;
  roomId: string;
  role: 'PROJECTION' | 'REMOTE';
  onMessage: (message: WebSocketMessage) => void;
  onStatusChange: (status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING', latency?: number) => void;
}

export class DelphiniWSClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private lastPingSent: number = 0;
  private isExplicitlyClosed: boolean = false;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
    this.connect();
  }

  private getWSUrl(): string {
    if (this.options.url) return this.options.url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In dev with Vite, ws target is port 3001 or proxied /ws
    return `${protocol}//${host}/ws`;
  }

  connect() {
    this.isExplicitlyClosed = false;
    const wsUrl = this.getWSUrl();
    console.log(`[DelphiniWS] Connecting to ${wsUrl} (Room: ${this.options.roomId}, Role: ${this.options.role})...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[DelphiniWS] Connected as ${this.options.role} in room ${this.options.roomId}`);
        this.options.onStatusChange('CONNECTED');

        // Send JOIN_ROOM handshake
        this.send({
          type: 'JOIN_ROOM',
          roomId: this.options.roomId,
          role: this.options.role,
          timestamp: Date.now()
        });

        // Start ping loop for latency tracking
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          
          if (msg.type === 'PONG' && msg.clientTimestamp) {
            const latency = Date.now() - msg.clientTimestamp;
            this.options.onStatusChange('CONNECTED', latency);
            return;
          }

          this.options.onMessage(msg);
        } catch (err) {
          console.error('[DelphiniWS] Parse message error:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopPingLoop();
        if (!this.isExplicitlyClosed) {
          console.warn('[DelphiniWS] Disconnected, scheduling reconnect in 2s...');
          this.options.onStatusChange('RECONNECTING');
          this.reconnectTimeout = setTimeout(() => this.connect(), 2000);
        } else {
          this.options.onStatusChange('DISCONNECTED');
        }
      };

      this.ws.onerror = (err) => {
        console.error('[DelphiniWS] Socket error:', err);
      };
    } catch (e) {
      console.error('[DelphiniWS] Connection initialization failed:', e);
      this.options.onStatusChange('RECONNECTING');
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSent = Date.now();
        this.send({
          type: 'PING',
          timestamp: this.lastPingSent
        });
      }
    }, 2500);
  }

  private stopPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopPingLoop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
