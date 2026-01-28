import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { WsEvent } from "./types.js";

let wss: WebSocketServer;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("[ws] client connected");

    ws.on("close", () => {
      console.log("[ws] client disconnected");
    });

    ws.on("error", (err) => {
      console.error("[ws] error:", err.message);
    });

    // Heartbeat
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30_000);

    ws.on("close", () => clearInterval(ping));
  });

  return wss;
}

export function broadcast(event: WsEvent) {
  if (!wss) return;
  const data = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
