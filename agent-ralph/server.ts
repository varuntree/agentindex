import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WsEvent {
  id: number;
  type: string;
  timestamp: number;
  [key: string]: any;
}

const STATE_FILE = resolve(__dirname, 'ralph.state.json');
const EVENT_BUFFER_SIZE = 1000;

let server: ReturnType<typeof createServer> | null = null;
let wss: WebSocketServer | null = null;
const eventBuffer: WsEvent[] = [];
const clients = new Set<WebSocket>();

// Broadcast to all connected clients
export function broadcast(event: WsEvent) {
  // Add to buffer
  eventBuffer.push(event);
  if (eventBuffer.length > EVENT_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  // Send to all clients
  const message = JSON.stringify(event);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Get events since lastEventId
function getEventsSince(lastEventId: number): WsEvent[] {
  return eventBuffer.filter(e => e.id > lastEventId);
}

// Get current state
function getState() {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  }
  return null;
}

// Start server
export async function startServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  // Serve dashboard static files
  app.use(express.static(resolve(__dirname, 'dashboard')));

  // API: Get status
  app.get('/api/status', (req, res) => {
    const state = getState();
    res.json({ state, bufferedEvents: eventBuffer.length });
  });

  // API: Stop loop
  app.post('/api/stop', (req, res) => {
    process.kill(process.pid, 'SIGTERM');
    res.json({ success: true, message: 'Stop signal sent' });
  });

  // Create HTTP server
  server = createServer(app);

  // Create WebSocket server
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`Client connected (${clients.size} total)`);

    // Send current state immediately
    const state = getState();
    if (state) {
      ws.send(JSON.stringify({ type: 'state', data: state }));
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Handle sync request (replay missed events)
        if (msg.type === 'sync' && typeof msg.lastEventId === 'number') {
          const missed = getEventsSince(msg.lastEventId);
          missed.forEach(event => {
            ws.send(JSON.stringify(event));
          });
        }
      } catch {}
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`Client disconnected (${clients.size} total)`);
    });

    // Heartbeat
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => clearInterval(pingInterval));
  });

  return new Promise((resolve) => {
    server!.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve();
    });
  });
}

// Stop server
export async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    clients.forEach(client => client.close());
    clients.clear();

    if (wss) {
      wss.close();
    }

    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}
