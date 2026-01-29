import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startLoop, stopLoop, getState, setBroadcast, LoopConfig } from './loop.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WsEvent {
  id: number;
  type: string;
  timestamp: number;
  [key: string]: any;
}

const PID_FILE = resolve(__dirname, 'ralph.pid');
const CONFIG_FILE = resolve(__dirname, 'ralph.config.json');
const EVENT_BUFFER_SIZE = 1000;

let server: ReturnType<typeof createServer> | null = null;
let wss: WebSocketServer | null = null;
const eventBuffer: WsEvent[] = [];
const clients = new Set<WebSocket>();

// Load default config
function loadConfig(): LoopConfig {
  if (existsSync(CONFIG_FILE)) {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    return {
      plan: raw.plan ?? 1,
      build: raw.build ?? 5,
      cycles: raw.cycles ?? 0,
      stopOnZeroTasks: raw.stopOnZeroTasks ?? true
    };
  }
  return { plan: 1, build: 5, cycles: 0, stopOnZeroTasks: true };
}

// Save config
function saveConfig(config: LoopConfig) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Broadcast to all connected clients
function broadcast(event: WsEvent) {
  eventBuffer.push(event);
  if (eventBuffer.length > EVENT_BUFFER_SIZE) {
    eventBuffer.shift();
  }

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

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down...`);

  await stopLoop();

  clients.forEach(client => client.close());
  clients.clear();

  if (wss) wss.close();

  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }

  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

async function main() {
  // Check for existing PID
  if (existsSync(PID_FILE)) {
    const existingPid = readFileSync(PID_FILE, 'utf-8').trim();
    try {
      process.kill(parseInt(existingPid), 0);
      console.error(`Ralph server already running (PID: ${existingPid})`);
      process.exit(1);
    } catch {
      // Process not running, remove stale PID
      unlinkSync(PID_FILE);
    }
  }

  // Write PID
  writeFileSync(PID_FILE, process.pid.toString());

  // Set broadcast function for loop
  setBroadcast(broadcast);

  const app = express();
  app.use(express.json());

  // Serve dashboard static files
  app.use(express.static(resolve(__dirname, 'dashboard')));

  // API: Get status
  app.get('/api/status', (req, res) => {
    const state = getState();
    const config = loadConfig();
    res.json({ state, config, bufferedEvents: eventBuffer.length });
  });

  // API: Get config
  app.get('/api/config', (req, res) => {
    res.json(loadConfig());
  });

  // API: Save config
  app.post('/api/config', (req, res) => {
    const config: LoopConfig = {
      plan: req.body.plan ?? 1,
      build: req.body.build ?? 5,
      cycles: req.body.cycles ?? 0,
      stopOnZeroTasks: req.body.stopOnZeroTasks ?? true
    };
    saveConfig(config);
    res.json({ success: true, config });
  });

  // API: Start loop
  app.post('/api/start', async (req, res) => {
    const state = getState();
    if (state.status === 'running') {
      return res.status(400).json({ error: 'Loop already running' });
    }

    const config: LoopConfig = {
      plan: req.body.plan ?? 1,
      build: req.body.build ?? 5,
      cycles: req.body.cycles ?? 0,
      stopOnZeroTasks: req.body.stopOnZeroTasks ?? true
    };

    // Save config for future reference
    saveConfig(config);

    // Start loop in background (don't await)
    startLoop(config, broadcast).catch(err => {
      console.error('Loop error:', err);
    });

    res.json({ success: true, message: 'Loop started', config });
  });

  // API: Stop loop
  app.post('/api/stop', async (req, res) => {
    await stopLoop();
    res.json({ success: true, message: 'Stop signal sent' });
  });

  // Create HTTP server
  const port = 3001;
  server = createServer(app);

  // Create WebSocket server
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`Client connected (${clients.size} total)`);

    // Send current state immediately
    const state = getState();
    const config = loadConfig();
    ws.send(JSON.stringify({ type: 'init', state, config }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

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

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => clearInterval(pingInterval));
  });

  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(port, () => {
    console.log(`Agent Ralph Dashboard: http://localhost:${port}`);
    console.log('Status: Idle (waiting for start command)');
  });
}

main().catch(console.error);
