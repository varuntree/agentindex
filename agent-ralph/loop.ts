import { spawn, ChildProcess } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface LoopConfig {
  plan: number;
  build: number;
  cycles: number;
  stopOnZeroTasks: boolean;
}

export interface LoopState {
  status: 'idle' | 'running' | 'stopped' | 'completed';
  currentCycle: number;
  totalCycles: number;
  currentPhase: 'plan' | 'build' | null;
  currentIteration: number;
  phaseIterations: { plan: number; build: number };
  startedAt: string | null;
  lastEventId: number;
  pendingTasks: number | null;
}

const STATE_FILE = resolve(__dirname, 'ralph.state.json');
const PROJECT_ROOT = resolve(__dirname, '..');

let state: LoopState = createInitialState();
let isShuttingDown = false;
let currentProcess: ChildProcess | null = null;
let eventId = 0;
let broadcastFn: ((event: any) => void) | null = null;

function createInitialState(): LoopState {
  return {
    status: 'idle',
    currentCycle: 0,
    totalCycles: 0,
    currentPhase: null,
    currentIteration: 0,
    phaseIterations: { plan: 0, build: 0 },
    startedAt: null,
    lastEventId: 0,
    pendingTasks: null
  };
}

export function getState(): LoopState {
  return { ...state };
}

function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function emit(type: string, data: any = {}) {
  const event = { id: ++eventId, type, ...data, timestamp: Date.now() };
  state.lastEventId = eventId;
  if (broadcastFn) broadcastFn(event);
  return event;
}

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

      text.split('\n').filter(Boolean).forEach(line => {
        try {
          const event = JSON.parse(line);
          emit('claude:message', { raw: event });

          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use' && block.name === 'Task') {
                emit('subagent:start', {
                  id: block.id,
                  agentType: block.input?.subagent_type,
                  description: block.input?.description
                });
              }
            }
          }
        } catch {}
      });

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

async function gitPush() {
  emit('git:push:start');
  return new Promise<void>((resolve) => {
    const git = spawn('git', ['push'], { cwd: PROJECT_ROOT });
    git.on('close', (code) => {
      if (code !== 0) {
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

async function runLoop(config: LoopConfig) {
  while (!isShuttingDown) {
    if (config.cycles > 0 && state.currentCycle > config.cycles) {
      state.status = 'completed';
      emit('loop:complete', { reason: 'max_cycles_reached' });
      break;
    }

    emit('cycle:start', { cycle: state.currentCycle });

    // Plan phase
    if (config.plan > 0) {
      state.currentPhase = 'plan';
      for (let i = 1; i <= config.plan && !isShuttingDown; i++) {
        state.currentIteration = i;
        saveState();
        await runIteration('plan');
        await gitPush();
      }
    }

    // Build phase
    if (config.build > 0) {
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
    }

    if (!isShuttingDown) {
      emit('cycle:complete', { cycle: state.currentCycle });
      state.currentCycle++;
    }
  }

  saveState();
}

export async function startLoop(config: LoopConfig, broadcast: (event: any) => void): Promise<void> {
  if (state.status === 'running') {
    throw new Error('Loop already running');
  }

  broadcastFn = broadcast;
  isShuttingDown = false;

  state = {
    status: 'running',
    currentCycle: 1,
    totalCycles: config.cycles,
    currentPhase: null,
    currentIteration: 0,
    phaseIterations: { plan: config.plan, build: config.build },
    startedAt: new Date().toISOString(),
    lastEventId: eventId,
    pendingTasks: null
  };

  saveState();
  emit('loop:start', { config });

  try {
    await runLoop(config);
  } catch (error) {
    emit('error', { message: String(error) });
    state.status = 'stopped';
    saveState();
  }
}

export async function stopLoop(): Promise<void> {
  if (state.status !== 'running') {
    return;
  }

  isShuttingDown = true;

  if (currentProcess) {
    currentProcess.kill('SIGTERM');
  }

  state.status = 'stopped';
  emit('loop:stopped', { reason: 'user_requested' });
  saveState();
}

export function setBroadcast(fn: (event: any) => void) {
  broadcastFn = fn;
}
