# agent-ralph-ui

Real-time dashboard for monitoring Ralph loop executions. Connects to the Ralph agent via WebSocket and displays main agent output, subagent activity, and execution status.

## Quick start

```bash
pnpm install
pnpm dev        # starts server + vite client concurrently
```

Server runs on Express + WS. Client is React 19 + Zustand + Tailwind.

## Architecture

```
server/
  index.ts        # Express + WS server entry
  ralph.ts        # Ralph agent SDK integration
  ws.ts           # WebSocket broadcast
  types.ts        # Shared server types

src/
  App.tsx          # Root layout: Header, StatusBar, MainPanel, SubagentSidebar, SubagentPanel
  store/
    ralphStore.ts  # Zustand store — messages, subagents, active selection
  hooks/
    useRalphSocket.ts  # WS client, feeds events into store
    useAutoScroll.ts   # Auto-scroll with manual-scroll-up detection
  components/
    Header.tsx          # Top bar
    StatusBar.tsx       # Agent status / phase indicator
    MainPanel.tsx       # Primary agent message stream
    SubagentSidebar.tsx # Right sidebar listing all subagents
    SubagentPanel.tsx   # Slide-over drawer (fixed right) showing selected subagent detail
    MessageBlock.tsx    # Single message renderer
    ToolCallBlock.tsx   # Tool call renderer
  lib/
    format.ts      # Display formatting utils
    types.ts       # Client-side types
```

## UI layout

- **MainPanel** — scrollable message stream from the primary Ralph agent
- **SubagentSidebar** (right, 256px) — lists spawned subagents with status badges
- **SubagentPanel** — fixed 420px slide-over drawer from right edge; opens when a subagent is selected, shows type/description/status, message count, start time, and message list

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Server + client in parallel |
| `pnpm dev:server` | Server only (tsx watch) |
| `pnpm dev:client` | Vite dev server only |
| `pnpm build` | TypeScript check + Vite production build |
| `pnpm preview` | Preview production build |
