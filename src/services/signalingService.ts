import { SERVER_API_SOCKET_ENDPOINT } from '../constant';
import { BaseSocketMessage, SocketAction } from '../interfaces/Message';

export interface SignalingConfig {
  endpoint: string;
  roomId?: string;
  userId?: string;
}

export interface SignalingCallbacks {
  onOpen?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export class SignalingService {
  private ws: WebSocket | null = null;
  private config: SignalingConfig;
  private callbacks: SignalingCallbacks;

  constructor(config: SignalingConfig, callbacks: SignalingCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const { endpoint, roomId } = this.config;
      const url = roomId 
        ? `${endpoint}?roomId=${roomId}`
        : endpoint;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.callbacks.onOpen?.();
        resolve(this.ws!);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.callbacks.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        this.callbacks.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.callbacks.onClose?.();
      };
    });
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  sendAction(action: SocketAction, data: any = {}): void {
    const message = {
      action,
      roomId: this.config.roomId,
      username: this.config.userId,
      data
    };
    this.send(message);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const createChatSignaling = (roomId: string, callbacks: SignalingCallbacks) => {
  return new SignalingService(
    {
      endpoint: `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint`,
      roomId
    },
    callbacks
  );
};

export const createCallSignaling = (roomId: string, userId: string, callbacks: SignalingCallbacks) => {
  return new SignalingService(
    {
      endpoint: `${SERVER_API_SOCKET_ENDPOINT}chat-socket-endpoint`,
      roomId,
      userId
    },
    callbacks
  );
};

export const createRoomInfoSignaling = (callbacks: SignalingCallbacks) => {
  return new SignalingService(
    {
      endpoint: `${SERVER_API_SOCKET_ENDPOINT}room-info-endpoint`
    },
    callbacks
  );
};
