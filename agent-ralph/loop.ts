import { spawn } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startServer, broadcast, stopServer } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Config {
  plan: number;
  build: number;
  cycles: number;
  stopOnZeroTasks: boolean;
  port: number;
}

interface State {
  status: 'running' | 'stopped' | 'completed';
  currentCycle: number;
  totalCycles: number;
  currentPhase: 'plan' | 'build';
  currentIteration: number;
  phaseIterations: { plan: number; build: number };
  startedAt: string;
  lastEventId: number;
  pendingTasks: number | null;
}

const CONFIG_FILE = resolve(__dirname, 'ralph.config.json');
const STATE_FILE = resolve(__dirname, 'ralph.state.json');
const PID_FILE = resolve(__dirname, 'ralph.pid');
const PROJECT_ROOT = resolve(__dirname, '..');

let config: Config;
let state: State;
let isShuttingDown = false;
let currentProcess: ReturnType<typeof spawn> | null = null;
let eventId = 0;

// Load config
function loadConfig(): Config {
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

// Save state
function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Initialize state
function initState(): State {
  return {
    status: 'running',
    currentCycle: 1,
    totalCycles: config.cycles,
    currentPhase: 'plan',
    currentIteration: 1,
    phaseIterations: { plan: config.plan, build: config.build },
    startedAt: new Date().toISOString(),
    lastEventId: 0,
    pendingTasks: null
  };
}

// Emit event
function emit(type: string, data: any = {}) {
  const event = { id: ++eventId, type, ...data, timestamp: Date.now() };
  state.lastEventId = eventId;
  broadcast(event);
  return event;
}

// Run single Claude iteration
async function runIteration(mode: 'plan' | 'build'): Promise<{ success: boolean; zeroPending: boolean }> {
  const promptFile = mode === 'plan' ? 'PROMPT_plan.md' : 'PROMPT_build.md';
  const promptPath = resolve(__dirname, promptFile);
  const prompt = readFileSync(promptPath, 'utf-8');

  emit('iteration:start', {
    cycle: state.currentCycle,
    phase: mode,
    iteration: state.currentIteration
  });

  return new Promise((resolve) => {
    let output = '';
    let zeroPending = false;

    currentProcess = spawn('claude', [
      '-p',
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json',
      '--model', 'opus'
    ], {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    currentProcess.stdin?.write(prompt);
    currentProcess.stdin?.end();

    currentProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;

      // Parse stream-json lines
      text.split('\n').filter(Boolean).forEach(line => {
        try {
          const event = JSON.parse(line);
          emit('claude:message', { raw: event });

          // Detect sub-agent spawns
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use' && block.name === 'Task') {
                emit('subagent:start', {
                  id: block.id,
                  type: block.input?.subagent_type,
                  description: block.input?.description
                });
              }
            }
          }
        } catch {}
      });

      // Check for zero pending signal
      if (text.includes('CYCLE_SIGNAL: ZERO_PENDING_TASKS')) {
        zeroPending = true;
      }
    });

    currentProcess.stderr?.on('data', (data: Buffer) => {
      emit('claude:stderr', { text: data.toString() });
    });

    currentProcess.on('close', (code) => {
      currentProcess = null;
      emit('iteration:complete', {
        cycle: state.currentCycle,
        phase: mode,
        iteration: state.currentIteration,
        exitCode: code
      });
      resolve({ success: code === 0, zeroPending });
    });
  });
}

// Git push
async function gitPush() {
  emit('git:push:start');
  return new Promise<void>((resolve) => {
    const git = spawn('git', ['push'], { cwd: PROJECT_ROOT });
    git.on('close', (code) => {
      if (code !== 0) {
        // Try with -u flag
        const gitRetry = spawn('git', ['push', '-u', 'origin', 'HEAD'], { cwd: PROJECT_ROOT });
        gitRetry.on('close', () => {
          emit('git:push:complete');
          resolve();
        });
      } else {
        emit('git:push:complete');
        resolve();
      }
    });
  });
}

// Main loop
async function runLoop() {
  while (!isShuttingDown) {
    // Check cycle limit
    if (config.cycles > 0 && state.currentCycle > config.cycles) {
      state.status = 'completed';
      emit('loop:complete', { reason: 'max_cycles_reached' });
      break;
    }

    emit('cycle:start', { cycle: state.currentCycle });

    // Plan phase
    state.currentPhase = 'plan';
    for (let i = 1; i <= config.plan && !isShuttingDown; i++) {
      state.currentIteration = i;
      saveState();
      const result = await runIteration('plan');
      await gitPush();
    }

    // Build phase
    state.currentPhase = 'build';
    for (let i = 1; i <= config.build && !isShuttingDown; i++) {
      state.currentIteration = i;
      saveState();
      const result = await runIteration('build');
      await gitPush();

      if (config.stopOnZeroTasks && result.zeroPending) {
        state.status = 'completed';
        emit('loop:complete', { reason: 'zero_pending_tasks' });
        isShuttingDown = true;
        break;
      }
    }

    emit('cycle:complete', { cycle: state.currentCycle });
    state.currentCycle++;
  }
}

// Shutdown handler
async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}, shutting down...`);
  emit('loop:stopped', { reason: signal });

  if (currentProcess) {
    currentProcess.kill('SIGTERM');
  }

  state.status = 'stopped';
  saveState();

  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }

  await stopServer();
  process.exit(0);
}

// Main
async function main() {
  // Check for existing PID
  if (existsSync(PID_FILE)) {
    const existingPid = readFileSync(PID_FILE, 'utf-8').trim();
    console.error(`Ralph already running (PID: ${existingPid}). Remove ${PID_FILE} if stale.`);
    process.exit(1);
  }

  // Write PID
  writeFileSync(PID_FILE, process.pid.toString());

  // Load config and init state
  config = loadConfig();
  state = initState();
  saveState();

  // Start server
  await startServer(config.port);
  console.log(`Dashboard: http://localhost:${config.port}`);

  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Safety timeout for shutdown
  process.on('exit', () => {
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
  });

  emit('loop:start', { config });

  try {
    await runLoop();
  } catch (error) {
    emit('error', { message: String(error) });
    state.status = 'stopped';
    saveState();
  }

  await shutdown('complete');
}

main();
