import express from "express";
import { createServer } from "http";
import { setupWebSocket, broadcast } from "./ws.js";
import { startLoop, stopLoop, getState } from "./ralph.js";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3001", 10);

// REST endpoints
app.post("/api/start", (req, res) => {
  const { mode, maxIterations } = req.body as {
    mode?: "plan" | "build";
    maxIterations?: number;
  };

  const loopMode = mode === "plan" ? "plan" : "build";
  const max = typeof maxIterations === "number" && maxIterations > 0 ? maxIterations : 0;

  // Start loop in background (don't await)
  startLoop(loopMode, max);

  res.json({ ok: true, mode: loopMode, maxIterations: max });
});

app.post("/api/stop", (_req, res) => {
  stopLoop();
  res.json({ ok: true });
});

app.get("/api/status", (_req, res) => {
  res.json(getState());
});

// HTTP + WebSocket server
const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] WebSocket at ws://localhost:${PORT}/ws`);
});
