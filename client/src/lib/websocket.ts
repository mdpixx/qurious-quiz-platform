interface WebSocketMessage {
  type: string;
  sessionId?: string;
  participantId?: string;
  data?: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private callbacks = new Map<string, Set<(data: any) => void>>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error("Already connecting"));
        return;
      }

      this.isConnecting = true;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.isConnecting = false;
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.isConnecting = false;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }

  on(messageType: string, callback: (data: any) => void) {
    if (!this.callbacks.has(messageType)) {
      this.callbacks.set(messageType, new Set());
    }
    this.callbacks.get(messageType)!.add(callback);
  }

  off(messageType: string, callback: (data: any) => void) {
    const callbacks = this.callbacks.get(messageType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.callbacks.delete(messageType);
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.callbacks.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          console.error("Error in WebSocket callback:", error);
        }
      });
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      console.log("Attempting to reconnect WebSocket...");
      this.connect().catch(error => {
        console.error("Reconnect failed:", error);
        this.scheduleReconnect();
      });
    }, 3000);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
