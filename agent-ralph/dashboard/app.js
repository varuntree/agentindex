// State
const state = {
  connected: false,
  loopState: null,
  config: null,
  lastEventId: 0,
  subagents: new Map(),
  mainLogs: []
};

// DOM elements
const els = {
  status: document.getElementById('status'),
  progress: document.getElementById('progress'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  planInput: document.getElementById('planInput'),
  buildInput: document.getElementById('buildInput'),
  cyclesInput: document.getElementById('cyclesInput'),
  stopOnZeroInput: document.getElementById('stopOnZeroInput'),
  mainLog: document.getElementById('mainLog'),
  subagentList: document.getElementById('subagentList'),
  subagentCount: document.getElementById('subagentCount'),
  modal: document.getElementById('subagentModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalLog: document.getElementById('modalLog'),
  closeModal: document.getElementById('closeModal')
};

// WebSocket
let ws = null;
let reconnectTimer = null;

function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    state.connected = true;
    updateConnectionStatus();

    if (state.lastEventId > 0) {
      ws.send(JSON.stringify({ type: 'sync', lastEventId: state.lastEventId }));
    }
  };

  ws.onmessage = (e) => {
    const event = JSON.parse(e.data);
    handleEvent(event);
  };

  ws.onclose = () => {
    state.connected = false;
    updateStatus('connecting');
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onerror = () => ws.close();
}

function handleEvent(event) {
  if (event.id) state.lastEventId = event.id;

  switch (event.type) {
    case 'init':
      state.loopState = event.state;
      state.config = event.config;
      updateUI();
      break;

    case 'loop:start':
      state.loopState = { ...state.loopState, status: 'running' };
      state.config = event.config;
      updateUI();
      addMainLog('system', `Loop started: ${event.config.plan} plan, ${event.config.build} build per cycle`);
      break;

    case 'loop:complete':
      state.loopState = { ...state.loopState, status: 'completed' };
      updateUI();
      addMainLog('system', `Loop completed: ${event.reason}`);
      break;

    case 'loop:stopped':
      state.loopState = { ...state.loopState, status: 'stopped' };
      updateUI();
      addMainLog('system', `Loop stopped: ${event.reason}`);
      break;

    case 'cycle:start':
      addMainLog('system', `Cycle ${event.cycle} started`);
      break;

    case 'cycle:complete':
      addMainLog('system', `Cycle ${event.cycle} completed`);
      break;

    case 'iteration:start':
      state.loopState = {
        ...state.loopState,
        currentCycle: event.cycle,
        currentPhase: event.phase,
        currentIteration: event.iteration
      };
      updateProgress();
      addMainLog('system', `${event.phase.toUpperCase()} iteration ${event.iteration} started`);
      break;

    case 'iteration:complete':
      addMainLog('system', `${event.phase.toUpperCase()} iteration ${event.iteration} completed (exit: ${event.exitCode})`);
      break;

    case 'claude:message':
      handleClaudeMessage(event.raw);
      break;

    case 'subagent:start':
      state.subagents.set(event.id, {
        id: event.id,
        type: event.agentType || 'unknown',
        description: event.description || '',
        status: 'running',
        logs: []
      });
      updateSubagentList();
      addMainLog('tool', `Sub-agent: ${event.description || event.agentType}`);
      break;

    case 'subagent:stop':
      const sub = state.subagents.get(event.id);
      if (sub) {
        sub.status = 'done';
        updateSubagentList();
      }
      break;

    case 'git:push:start':
      addMainLog('system', 'Git push...');
      break;

    case 'git:push:complete':
      addMainLog('system', 'Git push complete');
      break;

    case 'error':
      addMainLog('error', event.message);
      break;
  }
}

function handleClaudeMessage(raw) {
  if (!raw) return;

  if (raw.type === 'assistant' && raw.message?.content) {
    raw.message.content.forEach(block => {
      if (block.type === 'text' && block.text) {
        // Truncate long text
        const text = block.text.length > 500
          ? block.text.substring(0, 500) + '...'
          : block.text;
        addMainLog('text', text);
      } else if (block.type === 'tool_use') {
        addMainLog('tool', `Tool: ${block.name}`);
      }
    });
  }
}

function addMainLog(type, text) {
  const entry = { type, text, timestamp: Date.now() };
  state.mainLogs.push(entry);

  // Limit logs
  if (state.mainLogs.length > 500) {
    state.mainLogs.shift();
    els.mainLog.removeChild(els.mainLog.firstChild);
  }

  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `
    <div class="timestamp">${formatTime(entry.timestamp)}</div>
    <div class="content">${escapeHtml(text)}</div>
  `;

  els.mainLog.appendChild(div);
  els.mainLog.scrollTop = els.mainLog.scrollHeight;
}

function updateUI() {
  updateStatus(state.loopState?.status || 'idle');
  updateProgress();
  updateControls();

  // Load config into inputs
  if (state.config) {
    els.planInput.value = state.config.plan;
    els.buildInput.value = state.config.build;
    els.cyclesInput.value = state.config.cycles;
    els.stopOnZeroInput.checked = state.config.stopOnZeroTasks;
  }
}

function updateConnectionStatus() {
  if (state.connected && state.loopState) {
    updateStatus(state.loopState.status);
  } else if (state.connected) {
    updateStatus('idle');
  } else {
    updateStatus('connecting');
  }
}

function updateStatus(status) {
  els.status.textContent = status;
  els.status.className = `status ${status}`;
}

function updateProgress() {
  const s = state.loopState;
  if (!s || s.status === 'idle') {
    els.progress.textContent = 'Ready to start';
    return;
  }

  if (s.status === 'completed') {
    els.progress.textContent = 'Completed';
    return;
  }

  if (s.status === 'stopped') {
    els.progress.textContent = 'Stopped';
    return;
  }

  const cycleText = s.totalCycles > 0
    ? `Cycle ${s.currentCycle}/${s.totalCycles}`
    : `Cycle ${s.currentCycle}`;

  const phase = s.currentPhase?.toUpperCase() || '-';
  const iter = s.currentIteration || 0;
  const maxIter = s.phaseIterations?.[s.currentPhase] || 0;

  els.progress.textContent = `${cycleText} • ${phase} ${iter}/${maxIter}`;
}

function updateControls() {
  const isRunning = state.loopState?.status === 'running';

  els.startBtn.disabled = isRunning;
  els.stopBtn.disabled = !isRunning;
  els.planInput.disabled = isRunning;
  els.buildInput.disabled = isRunning;
  els.cyclesInput.disabled = isRunning;
  els.stopOnZeroInput.disabled = isRunning;
}

function updateSubagentList() {
  els.subagentCount.textContent = `(${state.subagents.size})`;
  els.subagentList.innerHTML = '';

  // Show most recent first
  const subs = Array.from(state.subagents.values()).reverse();

  subs.forEach(sub => {
    const div = document.createElement('div');
    div.className = 'subagent-item';
    div.innerHTML = `
      <div class="type">${escapeHtml(sub.type)}</div>
      <div class="desc">${escapeHtml(sub.description)}</div>
      <span class="status-badge ${sub.status}">${sub.status}</span>
    `;
    div.onclick = () => openSubagentModal(sub);
    els.subagentList.appendChild(div);
  });
}

function openSubagentModal(sub) {
  els.modalTitle.textContent = `${sub.type}: ${sub.description}`;
  els.modalLog.innerHTML = sub.logs.length > 0
    ? sub.logs.map(log => `
        <div class="log-entry">
          <div class="timestamp">${formatTime(log.timestamp)}</div>
          <div class="content">${escapeHtml(log.text)}</div>
        </div>
      `).join('')
    : '<div class="empty-state"><div class="icon">📝</div><p>No detailed logs captured for this sub-agent</p></div>';
  els.modal.classList.remove('hidden');
}

// Utils
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// API calls
async function startLoop() {
  const config = {
    plan: parseInt(els.planInput.value) || 1,
    build: parseInt(els.buildInput.value) || 5,
    cycles: parseInt(els.cyclesInput.value) || 0,
    stopOnZeroTasks: els.stopOnZeroInput.checked
  };

  try {
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) {
      addMainLog('error', data.error || 'Failed to start');
    }
  } catch (err) {
    addMainLog('error', 'Failed to start: ' + err.message);
  }
}

async function stopLoop() {
  try {
    await fetch('/api/stop', { method: 'POST' });
  } catch (err) {
    addMainLog('error', 'Failed to stop: ' + err.message);
  }
}

// Event listeners
els.startBtn.onclick = startLoop;
els.stopBtn.onclick = stopLoop;

els.clearLogsBtn.onclick = () => {
  state.mainLogs = [];
  els.mainLog.innerHTML = '';
};

els.closeModal.onclick = () => {
  els.modal.classList.add('hidden');
};

els.modal.onclick = (e) => {
  if (e.target === els.modal) {
    els.modal.classList.add('hidden');
  }
};

// Show empty state initially
els.mainLog.innerHTML = '<div class="empty-state"><div class="icon">🚀</div><p>Configure settings above and click Start to begin</p></div>';

// Init
connect();
