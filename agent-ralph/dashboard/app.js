// State
const state = {
  connected: false,
  loopState: null,
  lastEventId: 0,
  subagents: new Map(),
  mainLogs: [],
  selectedSubagent: null
};

// DOM elements
const els = {
  status: document.getElementById('status'),
  progress: document.getElementById('progress'),
  stopBtn: document.getElementById('stopBtn'),
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
    updateStatus('running');

    // Request missed events
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
    updateStatus('disconnected');

    // Reconnect after 2 seconds
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onerror = () => ws.close();
}

function handleEvent(event) {
  if (event.id) state.lastEventId = event.id;

  switch (event.type) {
    case 'state':
      state.loopState = event.data;
      updateProgress();
      updateStatus(event.data.status);
      break;

    case 'loop:start':
      updateStatus('running');
      addMainLog('system', 'Loop started', event);
      break;

    case 'loop:complete':
    case 'loop:stopped':
      updateStatus(event.type === 'loop:complete' ? 'completed' : 'stopped');
      addMainLog('system', `Loop ${event.reason}`, event);
      break;

    case 'cycle:start':
      addMainLog('system', `Cycle ${event.cycle} started`, event);
      break;

    case 'iteration:start':
      addMainLog('system', `${event.phase} iteration ${event.iteration}`, event);
      updateProgress();
      break;

    case 'claude:message':
      handleClaudeMessage(event.raw);
      break;

    case 'subagent:start':
      state.subagents.set(event.id, {
        id: event.id,
        type: event.type,
        description: event.description,
        status: 'running',
        logs: []
      });
      updateSubagentList();
      addMainLog('tool', `Sub-agent started: ${event.description}`, event);
      break;

    case 'subagent:stop':
      const sub = state.subagents.get(event.id);
      if (sub) {
        sub.status = 'done';
        updateSubagentList();
      }
      break;

    case 'error':
      addMainLog('error', event.message, event);
      break;
  }
}

function handleClaudeMessage(raw) {
  if (!raw) return;

  // Extract text content
  if (raw.type === 'assistant' && raw.message?.content) {
    raw.message.content.forEach(block => {
      if (block.type === 'text') {
        addMainLog('text', block.text);
      } else if (block.type === 'tool_use') {
        addMainLog('tool', `Tool: ${block.name}`);
      }
    });
  }
}

function addMainLog(type, text, event = {}) {
  const entry = { type, text, timestamp: event.timestamp || Date.now() };
  state.mainLogs.push(entry);

  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `
    <div class="timestamp">${formatTime(entry.timestamp)}</div>
    <div>${escapeHtml(text)}</div>
  `;

  els.mainLog.appendChild(div);
  els.mainLog.scrollTop = els.mainLog.scrollHeight;
}

function updateStatus(status) {
  els.status.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  els.status.className = `status ${status}`;
  els.stopBtn.disabled = status !== 'running';
}

function updateProgress() {
  const s = state.loopState;
  if (!s) return;

  const cycleText = s.totalCycles > 0
    ? `Cycle ${s.currentCycle}/${s.totalCycles}`
    : `Cycle ${s.currentCycle}`;
  const phaseText = `${s.currentPhase} ${s.currentIteration}/${s.phaseIterations[s.currentPhase]}`;

  els.progress.textContent = `${cycleText} • ${phaseText}`;
}

function updateSubagentList() {
  els.subagentCount.textContent = `(${state.subagents.size})`;
  els.subagentList.innerHTML = '';

  state.subagents.forEach((sub, id) => {
    const div = document.createElement('div');
    div.className = 'subagent-item';
    div.innerHTML = `
      <div class="type">${sub.type || 'unknown'}</div>
      <div class="desc">${escapeHtml(sub.description || '')}</div>
      <span class="status-badge ${sub.status}">${sub.status}</span>
    `;
    div.onclick = () => openSubagentModal(sub);
    els.subagentList.appendChild(div);
  });
}

function openSubagentModal(sub) {
  state.selectedSubagent = sub;
  els.modalTitle.textContent = `${sub.type}: ${sub.description}`;
  els.modalLog.innerHTML = sub.logs.map(log => `
    <div class="log-entry">
      <div class="timestamp">${formatTime(log.timestamp)}</div>
      <div>${escapeHtml(log.text)}</div>
    </div>
  `).join('');
  els.modal.classList.remove('hidden');
}

// Utils
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
els.stopBtn.onclick = async () => {
  els.stopBtn.disabled = true;
  await fetch('/api/stop', { method: 'POST' });
};

els.closeModal.onclick = () => {
  els.modal.classList.add('hidden');
};

els.modal.onclick = (e) => {
  if (e.target === els.modal) {
    els.modal.classList.add('hidden');
  }
};

// Init
connect();
