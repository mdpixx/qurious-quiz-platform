import { useEffect, useRef, useCallback } from "react";
import { wsClient } from "@/lib/websocket";

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onConnect, onDisconnect, onError } = options;
  const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const connect = async () => {
      try {
        await wsClient.connect();
        onConnect?.();
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        onError?.(error as Event);
      }
    };

    connect();

    return () => {
      // Clean up callbacks
      callbacksRef.current.forEach((callbacks, messageType) => {
        callbacks.forEach(callback => {
          wsClient.off(messageType, callback);
        });
      });
      callbacksRef.current.clear();
      
      wsClient.disconnect();
      onDisconnect?.();
    };
  }, [onConnect, onDisconnect, onError]);

  const subscribe = useCallback((messageType: string, callback: (data: any) => void) => {
    wsClient.on(messageType, callback);
    
    // Track callback for cleanup
    if (!callbacksRef.current.has(messageType)) {
      callbacksRef.current.set(messageType, new Set());
    }
    callbacksRef.current.get(messageType)!.add(callback);

    return () => {
      wsClient.off(messageType, callback);
      
      const callbacks = callbacksRef.current.get(messageType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          callbacksRef.current.delete(messageType);
        }
      }
    };
  }, []);

  const send = useCallback((message: any) => {
    wsClient.send(message);
  }, []);

  const isConnected = wsClient.isConnected;

  return {
    subscribe,
    send,
    isConnected
  };
}
