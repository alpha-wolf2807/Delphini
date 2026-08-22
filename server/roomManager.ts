import { WebSocket } from 'ws';

export interface RoomClient {
  ws: WebSocket;
  role: 'PROJECTION' | 'REMOTE';
  id: string;
  connectedAt: number;
  lastPing?: number;
}

export interface Room {
  id: string;
  projection?: RoomClient;
  remotes: Map<string, RoomClient>;
  createdAt: number;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    // Initialize default demo room
    this.createRoom('DEL-4821');
  }

  createRoom(roomId?: string): Room {
    const id = roomId || `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
    if (this.rooms.has(id)) {
      return this.rooms.get(id)!;
    }
    const room: Room = {
      id,
      remotes: new Map(),
      createdAt: Date.now()
    };
    this.rooms.set(id, room);
    console.log(`[RoomManager] Room created: ${id}`);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  joinRoom(roomId: string, client: RoomClient): { success: boolean; room: Room } {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }

    if (client.role === 'PROJECTION') {
      if (room.projection && room.projection.ws !== client.ws) {
        try {
          room.projection.ws.close(1000, 'Replaced by newer projection instance');
        } catch (e) {}
      }
      room.projection = client;
      console.log(`[RoomManager] Projection joined room ${roomId} (Client ID: ${client.id})`);
      
      // Notify all remotes that projection is ONLINE
      this.broadcastToRoom(roomId, {
        type: 'PROJECTION_STATUS',
        status: 'ONLINE',
        roomId
      });
    } else {
      room.remotes.set(client.id, client);
      console.log(`[RoomManager] Remote joined room ${roomId} (Client ID: ${client.id}, Total Remotes: ${room.remotes.size})`);
      
      // Send initial room status to newly joined remote
      client.ws.send(JSON.stringify({
        type: 'ROOM_STATE',
        roomId,
        projectionOnline: !!room.projection,
        remoteCount: room.remotes.size
      }));
    }

    return { success: true, room };
  }

  leaveRoom(client: RoomClient) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.projection && room.projection.ws === client.ws) {
        room.projection = undefined;
        console.log(`[RoomManager] Projection disconnected from room ${roomId}`);
        this.broadcastToRoom(roomId, {
          type: 'PROJECTION_STATUS',
          status: 'OFFLINE',
          roomId
        });
      }
      if (room.remotes.has(client.id)) {
        room.remotes.delete(client.id);
        console.log(`[RoomManager] Remote ${client.id} left room ${roomId}`);
      }
    }
  }

  broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = typeof message === 'string' ? message : JSON.stringify(message);

    if (room.projection && room.projection.ws !== excludeWs && room.projection.ws.readyState === WebSocket.OPEN) {
      room.projection.ws.send(data);
    }

    for (const remote of room.remotes.values()) {
      if (remote.ws !== excludeWs && remote.ws.readyState === WebSocket.OPEN) {
        remote.ws.send(data);
      }
    }
  }

  sendToProjection(roomId: string, message: any): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.projection || room.projection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    room.projection.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    return true;
  }
}
