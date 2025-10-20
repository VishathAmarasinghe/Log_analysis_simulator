import WebSocket, { WebSocketServer } from "ws";
import config from "../config/config";

let wss: WebSocketServer | null = null;
let connections: Set<WebSocket> = new Set();

export function initWebSocket(): void {
  if (!config.streaming.websocket.enabled) return;
  
  wss = new WebSocketServer({ port: config.streaming.websocket.port });
  
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket client connected");
    
    connections.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to log simulator WebSocket",
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages (for filtering, commands, etc.)
    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      connections.delete(ws);
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      connections.delete(ws);
    });
    
    // Check connection limit
    if (connections.size > config.streaming.websocket.maxConnections) {
      ws.close(1008, "Max connections reached");
    }
  });
  
  console.log(`WebSocket server started on port ${config.streaming.websocket.port}`);
}

function handleClientMessage(ws: WebSocket, data: any): void {
  // Handle client commands (subscribe, unsubscribe, filter, etc.)
  switch (data.action) {
    case "ping":
      ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
      break;
    
    case "subscribe":
      // Future: implement filtering
      ws.send(JSON.stringify({ type: "subscribed", filters: data.filters }));
      break;
    
    default:
      ws.send(JSON.stringify({ type: "error", message: "Unknown action" }));
  }
}

export function broadcastLog(logType: string, logData: any): void {
  if (!wss || connections.size === 0) return;
  
  const message = JSON.stringify({
    log_type: logType,
    timestamp: new Date().toISOString(),
    data: logData
  });
  
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        console.error("Failed to send WebSocket message:", error);
      }
    }
  });
}

export function getConnectionCount(): number {
  return connections.size;
}

export function closeWebSocket(): void {
  if (wss) {
    connections.forEach((ws) => ws.close());
    wss.close();
    console.log("WebSocket server closed");
  }
}

