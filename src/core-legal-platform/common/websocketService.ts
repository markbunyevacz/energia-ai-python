interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * @class WebSocketService
 * @description Manages the WebSocket connection for real-time communication with the backend.
 * It handles connection, reconnection, sending/receiving messages, and event subscriptions.
 * This ensures a persistent and reliable communication channel.
 *
 * @version 1.1.0
 * @author Jogi AI
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // a more conservative delay
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private readonly websocketUrl: string;

  constructor() {
    // Real-time WebSocket URL from environment variables, with a fallback for local development.
    // This allows for flexible configuration between different environments (development, staging, production).
    this.websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
  }

  /**
   * @function connect
   * @description Establishes a WebSocket connection if one is not already open.
   * It sets up all the necessary event handlers for the WebSocket lifecycle.
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.websocketUrl);
      
      this.ws.onopen = () => {
        // console.log(`WebSocket connected to ${this.websocketUrl}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          // console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        // console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        // console.error('WebSocket error:', error);
      };
    } catch (error) {
      // console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  /**
   * @function reconnect
   * @description Handles reconnection logic with exponential backoff to avoid overwhelming the server.
   * This is crucial for maintaining a stable connection in case of network issues.
   * @private
   */
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        // console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
    } else {
      // console.error('WebSocket reconnection failed after maximum attempts.');
    }
  }

  /**
   * @function handleMessage
   * @description Parses incoming WebSocket messages and dispatches them to the appropriate listeners.
   * This is the core of the event-based communication.
   * @param message The WebSocketMessage received from the server.
   * @private
   */
  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(listener => listener(message.data));
  }

  /**
   * @function subscribe
   * @description Allows other parts of the application to subscribe to specific message types.
   * @param eventType The type of event to subscribe to.
   * @param callback The function to call when an event of the specified type is received.
   * @returns A function to unsubscribe from the event.
   */
  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    return () => {
      const listeners = this.listeners.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * @function send
   * @description Sends a message to the WebSocket server.
   * The message is stringified and sent as a WebSocketMessage.
   * @param type The type of the message.
   * @param data The payload of the message.
   */
  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      // console.error('WebSocket is not connected. Cannot send message.');
    }
  }

  /**
   * @function disconnect
   * @description Closes the WebSocket connection.
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * @const websocketService
 * @description A singleton instance of the WebSocketService.
 * This ensures that there is only one WebSocket connection manager throughout the application.
 */
export const websocketService = new WebSocketService();
