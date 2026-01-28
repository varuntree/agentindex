# Claude Agent SDK (TypeScript) - Comprehensive Offline Documentation

**For AI Coding Agents implementing data pipelines**

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Installation & Setup](#2-installation--setup)
3. [Core API: query() Function](#3-core-api-query-function)
4. [Options / Configuration](#4-options--configuration)
5. [Available Built-in Tools](#5-available-built-in-tools)
6. [Sub-Agents (Multi-Agent Orchestration)](#6-sub-agents-multi-agent-orchestration)
7. [Structured Outputs](#7-structured-outputs)
8. [Web Tools (WebSearch & WebFetch)](#8-web-tools-websearch--webfetch)
9. [Custom MCP Tools](#9-custom-mcp-tools)
10. [Hooks](#10-hooks)
11. [Error Handling](#11-error-handling)
12. [Rate Limits](#12-rate-limits)
13. [Complete Code Examples](#13-complete-code-examples)

---

## 1. Overview & Architecture

**Reference:** https://platform.claude.com/docs/en/agent-sdk/overview

### What the SDK Does

The Claude Agent SDK enables you to build AI agents that autonomously read files, run commands, search the web, edit code, and more. It provides the same tools, agent loop, and context management that power Claude Code, but programmable in TypeScript.

Key capabilities:
- **Built-in tools** for reading files, running commands, and editing code out of the box
- **Multi-turn agentic loop** with streaming messages as Claude works
- **Context management** across multiple turns
- **Sub-agent spawning** for parallel task delegation
- **MCP integration** for external tools and data sources
- **Hooks** for custom validation, logging, and control

### 4-Stage Feedback Loop

The SDK implements an autonomous feedback loop:

1. **Gather context**: Claude reads files, searches code, analyzes the environment
2. **Take action**: Claude executes tools (Edit, Bash, etc.) to make changes
3. **Verify**: Claude observes tool results and checks if the task is complete
4. **Repeat**: If needed, Claude iterates until the task is done or max turns reached

### Runtime: Claude Code CLI

The SDK uses Claude Code as its runtime engine. You call `query()` in your TypeScript code, and the SDK spawns Claude Code processes to execute the agentic loop.

**Architecture:**
```
Your Application (TypeScript)
    ↓
query() function
    ↓
Claude Code CLI (spawned process)
    ↓
Claude API + Tool Execution
```

---

## 2. Installation & Setup

**Reference:** https://platform.claude.com/docs/en/agent-sdk/quickstart

### Installation

```bash
# Install Claude Code CLI first
curl -fsSL https://claude.ai/install.sh | bash

# Or use Homebrew
brew install --cask claude-code

# Or use WinGet (Windows)
winget install Anthropic.ClaudeCode

# Install the TypeScript SDK
npm install @anthropic-ai/claude-agent-sdk
```

### Authentication Methods

**1. CLI Authentication (Recommended)**

Run `claude` in your terminal and follow the prompts to authenticate. The SDK uses this authentication automatically.

**2. API Key**

Create a `.env` file:

```bash
ANTHROPIC_API_KEY=your-api-key
```

Get your key from https://platform.claude.com/

**3. Amazon Bedrock**

```bash
export CLAUDE_CODE_USE_BEDROCK=1
# Configure AWS credentials via standard AWS SDK methods
```

**4. Google Vertex AI**

```bash
export CLAUDE_CODE_USE_VERTEX=1
# Configure Google Cloud credentials via gcloud
```

**5. Microsoft Azure AI Foundry**

```bash
export CLAUDE_CODE_USE_FOUNDRY=1
# Configure Azure credentials
```

**Important:** Third-party developers cannot offer claude.ai login or rate limits. Use API key authentication.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your API key |
| `CLAUDE_CODE_USE_BEDROCK` | Set to `1` to use Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | Set to `1` to use Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | Set to `1` to use Azure Foundry |
| `ENABLE_TOOL_SEARCH` | Tool search mode: `auto`, `true`, `false`, or `auto:N` |

---

## 3. Core API: query() Function

**Reference:** https://platform.claude.com/docs/en/agent-sdk/typescript#query

### TypeScript Signature

```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string \| AsyncIterable<SDKUserMessage>` | The task description or async stream |
| `options` | `Options` | Configuration object (see Section 4) |

### Return Value: Query Object

```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<void>;
  rewindFiles(userMessageUuid: string): Promise<void>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(maxThinkingTokens: number | null): Promise<void>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;
}
```

### Streaming Async Iterator Pattern

The `query()` function returns an async generator that streams messages as the agent works:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix bugs in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  // Each iteration yields a message as Claude thinks, calls tools, and completes
  console.log(message.type); // "assistant", "user", "result", "system"
}
```

### Message Types Returned

All messages extend `SDKMessage`:

```typescript
type SDKMessage =
  | SDKAssistantMessage      // Claude's reasoning and tool calls
  | SDKUserMessage           // User input
  | SDKResultMessage         // Final result or error
  | SDKSystemMessage         // System initialization
  | SDKPartialAssistantMessage  // Streaming events (if enabled)
  | SDKCompactBoundaryMessage   // Conversation compaction marker
```

**SDKAssistantMessage:**
```typescript
{
  type: 'assistant';
  uuid: string;
  session_id: string;
  message: {
    content: Array<{
      type: 'text';
      text: string;
    } | {
      type: 'tool_use';
      name: string;
      input: Record<string, any>;
    }>;
  };
  parent_tool_use_id: string | null;
}
```

**SDKResultMessage:**
```typescript
{
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_execution'
          | 'error_max_budget_usd' | 'error_max_structured_output_retries';
  uuid: string;
  session_id: string;
  result?: string;  // Only on success
  errors?: string[];  // Only on error
  structured_output?: unknown;  // If output format defined
  duration_ms: number;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}
```

---

## 4. Options / Configuration

**Reference:** https://platform.claude.com/docs/en/agent-sdk/typescript#options

### Complete TypeScript Interface

```typescript
interface Options {
  // System Prompt
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };

  // Tools
  allowedTools?: string[];
  disallowedTools?: string[];
  tools?: string[] | { type: 'preset'; preset: 'claude_code' };

  // Permissions
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  allowDangerouslySkipPermissions?: boolean;  // Required with bypassPermissions
  canUseTool?: CanUseTool;

  // Agent Configuration
  agents?: Record<string, AgentDefinition>;
  maxTurns?: number;
  maxBudgetUsd?: number;
  maxThinkingTokens?: number;

  // MCP Servers
  mcpServers?: Record<string, McpServerConfig>;

  // Output Format
  outputFormat?: { type: 'json_schema'; schema: JSONSchema };

  // Session Management
  resume?: string;  // Session ID to resume
  forkSession?: boolean;
  continue?: boolean;
  resumeSessionAt?: string;  // Message UUID

  // Model
  model?: string;
  fallbackModel?: string;
  betas?: SdkBeta[];  // e.g., ['context-1m-2025-08-07']

  // Working Directory
  cwd?: string;
  additionalDirectories?: string[];

  // Hooks
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;

  // Environment
  env?: Record<string, string>;

  // Settings
  settingSources?: ('user' | 'project' | 'local')[];

  // Plugins
  plugins?: SdkPluginConfig[];

  // Streaming
  includePartialMessages?: boolean;

  // Advanced
  abortController?: AbortController;
  pathToClaudeCodeExecutable?: string;
  executable?: 'bun' | 'deno' | 'node';
  executableArgs?: string[];
  enableFileCheckpointing?: boolean;
  sandbox?: SandboxSettings;
}
```

### Key Options Explained

**systemPrompt**

Defines Claude's role and behavior.

```typescript
// Custom system prompt
systemPrompt: "You are a senior Python developer. Follow PEP 8."

// Use Claude Code's system prompt
systemPrompt: { type: 'preset', preset: 'claude_code' }

// Extend Claude Code's prompt
systemPrompt: {
  type: 'preset',
  preset: 'claude_code',
  append: 'Always write unit tests.'
}
```

**allowedTools**

Restricts which tools Claude can use.

```typescript
allowedTools: ["Read", "Edit", "Bash", "Glob", "Grep"]
```

**disallowedTools**

Blocks specific tools.

```typescript
disallowedTools: ["Bash", "Write"]  // Read-only mode
```

**permissionMode**

Controls permission behavior:

| Mode | Behavior |
|------|----------|
| `'default'` | No auto-approvals; triggers `canUseTool` callback |
| `'acceptEdits'` | Auto-approves file edits |
| `'bypassPermissions'` | Auto-approves everything (requires `allowDangerouslySkipPermissions: true`) |
| `'plan'` | No execution; planning only |

**agents**

Define sub-agents programmatically:

```typescript
agents: {
  'code-reviewer': {
    description: 'Expert code reviewer for security and quality',
    prompt: 'You are a code review specialist...',
    tools: ['Read', 'Grep', 'Glob'],
    model: 'sonnet'
  },
  'test-runner': {
    description: 'Runs and analyzes tests',
    prompt: 'You execute tests and report failures...',
    tools: ['Bash', 'Read']
  }
}
```

**mcpServers**

Connect to MCP servers:

```typescript
mcpServers: {
  'github': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
  },
  'remote-api': {
    type: 'sse',
    url: 'https://api.example.com/mcp',
    headers: { Authorization: `Bearer ${process.env.TOKEN}` }
  }
}
```

**outputFormat**

Request structured JSON output:

```typescript
outputFormat: {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      bugs_found: { type: 'number' },
      fixes: { type: 'array', items: { type: 'string' } }
    },
    required: ['summary', 'bugs_found']
  }
}
```

**maxTurns**

Limit conversation length:

```typescript
maxTurns: 20  // Agent stops after 20 turns
```

**maxBudgetUsd**

Cap spending per query:

```typescript
maxBudgetUsd: 0.50  // Stop at $0.50
```

**resume**

Continue a previous session:

```typescript
let sessionId: string;

// First query
for await (const msg of query({ prompt: "Read auth module", options: {} })) {
  if (msg.type === 'system' && msg.subtype === 'init') {
    sessionId = msg.session_id;
  }
}

// Resume later
for await (const msg of query({
  prompt: "Now find all callers",
  options: { resume: sessionId }
})) {
  // ...
}
```

**settingSources**

Control filesystem settings loading:

```typescript
// Load project settings (CLAUDE.md files)
settingSources: ['project']

// Load all settings
settingSources: ['user', 'project', 'local']

// No filesystem settings (default)
settingSources: []  // or omit entirely
```

**Note:** To use CLAUDE.md files, include `'project'` in `settingSources` AND use the Claude Code system prompt:

```typescript
systemPrompt: { type: 'preset', preset: 'claude_code' },
settingSources: ['project']
```

---

## 5. Available Built-in Tools

**Reference:** https://platform.claude.com/docs/en/agent-sdk/overview (Capabilities section)

### Core File Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **Read** | Read any file | `{ file_path: string, offset?: number, limit?: number }` | File contents with line numbers |
| **Write** | Create new files | `{ file_path: string, content: string }` | Confirmation message |
| **Edit** | Make precise edits | `{ file_path: string, old_string: string, new_string: string, replace_all?: boolean }` | Number of replacements |

### Search Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **Glob** | Find files by pattern | `{ pattern: string, path?: string }` | Matching file paths |
| **Grep** | Search file contents | `{ pattern: string, path?: string, glob?: string, type?: string, output_mode?: string }` | Matching lines or files |

### Execution Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **Bash** | Run terminal commands | `{ command: string, timeout?: number, run_in_background?: boolean }` | stdout/stderr, exit code |
| **Task** | Spawn sub-agent | `{ prompt: string, subagent_type: string, description: string }` | Sub-agent result |

### Web Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **WebSearch** | Search the web | `{ query: string, allowed_domains?: string[], blocked_domains?: string[] }` | Search results with citations |
| **WebFetch** | Fetch and parse URL | `{ url: string, prompt: string }` | AI-processed content |

### Interactive Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **AskUserQuestion** | Ask clarifying questions | `{ questions: Question[] }` | User answers |

### Jupyter Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| **NotebookEdit** | Edit notebook cells | `{ notebook_path: string, cell_id?: string, new_source: string, edit_mode?: string }` | Edit confirmation |

### MCP Tools

MCP tools follow the pattern: `mcp__<server-name>__<tool-name>`

Example: `mcp__github__list_issues`

---

## 6. Sub-Agents (Multi-Agent Orchestration)

**Reference:** https://platform.claude.com/docs/en/agent-sdk/subagents

### Overview

Sub-agents are separate agent instances for focused subtasks. Benefits:

- **Context isolation**: Prevent information overload
- **Parallelization**: Run multiple agents simultaneously
- **Specialized instructions**: Each agent has tailored expertise
- **Tool restrictions**: Limit risk with read-only agents

### AgentDefinition Interface

```typescript
interface AgentDefinition {
  description: string;       // When to use this agent
  prompt: string;            // Agent's system prompt
  tools?: string[];          // Allowed tools (inherits all if omitted)
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}
```

### Defining Sub-Agents

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review the authentication module for security issues",
  options: {
    // Task tool required for sub-agent invocation
    allowedTools: ['Read', 'Grep', 'Glob', 'Task'],
    agents: {
      'code-reviewer': {
        description: 'Expert code reviewer. Use for quality, security reviews.',
        prompt: `You are a code review specialist with expertise in security.

When reviewing code:
- Identify security vulnerabilities
- Check for performance issues
- Verify adherence to coding standards`,
        tools: ['Read', 'Grep', 'Glob'],  // Read-only
        model: 'sonnet'
      },
      'test-runner': {
        description: 'Runs and analyzes test suites',
        prompt: 'You are a test execution specialist...',
        tools: ['Bash', 'Read', 'Grep']
      }
    }
  }
})) {
  if ('result' in message) console.log(message.result);
}
```

### Invoking Sub-Agents

**Automatic Invocation:**

Claude automatically decides when to invoke sub-agents based on the `description` field.

**Explicit Invocation:**

```typescript
prompt: "Use the code-reviewer agent to check the authentication module"
```

### Dynamic Agent Configuration

Create agents at runtime based on conditions:

```typescript
function createSecurityAgent(level: 'basic' | 'strict') {
  return {
    description: 'Security code reviewer',
    prompt: `You are a ${level === 'strict' ? 'strict' : 'balanced'} security reviewer...`,
    tools: ['Read', 'Grep', 'Glob'],
    model: level === 'strict' ? 'opus' : 'sonnet'
  };
}

const options = {
  allowedTools: ['Read', 'Grep', 'Glob', 'Task'],
  agents: {
    'security-reviewer': createSecurityAgent('strict')
  }
};
```

### Detecting Sub-Agent Invocation

Sub-agents are invoked via the Task tool:

```typescript
for await (const message of query({ prompt: "...", options })) {
  // Check for Task tool use
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'tool_use' && block.name === 'Task') {
        console.log(`Sub-agent invoked: ${block.input.subagent_type}`);
      }
    }
  }

  // Check if inside sub-agent context
  if (message.parent_tool_use_id) {
    console.log("Message from inside sub-agent");
  }
}
```

### Parallel Execution

Multiple sub-agents can run concurrently:

```typescript
agents: {
  'style-checker': { /* ... */ },
  'security-scanner': { /* ... */ },
  'test-coverage': { /* ... */ }
}

// Claude can spawn all three in parallel
prompt: "Review this PR using all available agents"
```

### Context Isolation

Each sub-agent maintains separate context. The parent sees only the final result, not intermediate steps.

### Result Collection

Sub-agent results appear in the Task tool's result:

```typescript
// Task tool result contains sub-agent output
{
  type: 'tool_result',
  tool_use_id: '...',
  content: {
    result: "Security review complete: 3 issues found...",
    usage: { input_tokens: 1500, output_tokens: 300 },
    total_cost_usd: 0.02
  }
}
```

### Resuming Sub-Agents

To resume a sub-agent, capture the agent ID and session ID:

```typescript
let agentId: string | undefined;
let sessionId: string | undefined;

// First query
for await (const msg of query({ prompt: "Use Explore agent", options })) {
  if ('session_id' in msg) sessionId = msg.session_id;

  // Extract agent ID from message content
  const content = JSON.stringify(msg);
  const match = content.match(/agentId:\s*([a-f0-9-]+)/);
  if (match) agentId = match[1];
}

// Resume
if (agentId && sessionId) {
  for await (const msg of query({
    prompt: `Resume agent ${agentId} and continue`,
    options: { resume: sessionId }
  })) {
    // ...
  }
}
```

---

## 7. Structured Outputs

**Reference:** https://platform.claude.com/docs/en/agent-sdk/structured-outputs

### Overview

Structured outputs let you define the exact shape of data returned from an agent. After multi-turn tool use, you get validated JSON matching your schema.

### JSON Schema Output Format

```typescript
const schema = {
  type: 'object',
  properties: {
    company_name: { type: 'string' },
    founded_year: { type: 'number' },
    headquarters: { type: 'string' }
  },
  required: ['company_name']
};

for await (const message of query({
  prompt: 'Research Anthropic and provide key company information',
  options: {
    outputFormat: {
      type: 'json_schema',
      schema: schema
    }
  }
})) {
  if (message.type === 'result' && message.structured_output) {
    console.log(message.structured_output);
    // { company_name: "Anthropic", founded_year: 2021, headquarters: "San Francisco, CA" }
  }
}
```

### Zod Integration

Use Zod for type-safe schemas:

```typescript
import { z } from 'zod';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Define schema with Zod
const FeaturePlan = z.object({
  feature_name: z.string(),
  summary: z.string(),
  steps: z.array(z.object({
    step_number: z.number(),
    description: z.string(),
    estimated_complexity: z.enum(['low', 'medium', 'high'])
  })),
  risks: z.array(z.string())
});

type FeaturePlan = z.infer<typeof FeaturePlan>;

// Convert to JSON Schema
const schema = z.toJSONSchema(FeaturePlan);

// Use in query
for await (const message of query({
  prompt: 'Plan how to add dark mode support to a React app',
  options: {
    outputFormat: {
      type: 'json_schema',
      schema: schema
    }
  }
})) {
  if (message.type === 'result' && message.structured_output) {
    // Validate and parse
    const parsed = FeaturePlan.safeParse(message.structured_output);
    if (parsed.success) {
      const plan: FeaturePlan = parsed.data;
      console.log(`Feature: ${plan.feature_name}`);
      plan.steps.forEach(step => {
        console.log(`${step.step_number}. [${step.estimated_complexity}] ${step.description}`);
      });
    }
  }
}
```

### Receiving Structured Output

Structured output appears in the `structured_output` field of ResultMessage:

```typescript
if (message.type === 'result') {
  if (message.subtype === 'success' && message.structured_output) {
    // Use the validated output
    console.log(message.structured_output);
  } else if (message.subtype === 'error_max_structured_output_retries') {
    // Handle failure
    console.error('Could not produce valid output');
  }
}
```

### Error Handling

When structured output fails:

```typescript
type ResultMessage =
  | { subtype: 'success'; structured_output?: unknown; /* ... */ }
  | { subtype: 'error_max_structured_output_retries'; errors: string[]; /* ... */ };
```

Tips for avoiding errors:
- Keep schemas focused (avoid deeply nested structures)
- Make fields optional if data might be unavailable
- Use clear prompts that describe what output to produce

### Example: TODO Tracking

```typescript
const todoSchema = {
  type: 'object',
  properties: {
    todos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          author: { type: 'string' },
          date: { type: 'string' }
        },
        required: ['text', 'file', 'line']
      }
    },
    total_count: { type: 'number' }
  },
  required: ['todos', 'total_count']
};

for await (const message of query({
  prompt: 'Find all TODO comments and identify who added them',
  options: {
    outputFormat: {
      type: 'json_schema',
      schema: todoSchema
    }
  }
})) {
  if (message.type === 'result' && message.structured_output) {
    const data = message.structured_output as any;
    console.log(`Found ${data.total_count} TODOs`);
    data.todos.forEach((todo: any) => {
      console.log(`${todo.file}:${todo.line} - ${todo.text}`);
      if (todo.author) {
        console.log(`  Added by ${todo.author} on ${todo.date}`);
      }
    });
  }
}
```

---

## 8. Web Tools (WebSearch & WebFetch)

**Reference:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool

### WebSearch Tool

Searches the web and returns results with citations.

**Enabling:**

```typescript
allowedTools: ['WebSearch']
```

**Usage:**

```typescript
for await (const message of query({
  prompt: "What's the current weather in San Francisco?",
  options: {
    allowedTools: ['WebSearch']
  }
})) {
  // Claude automatically decides when to search
}
```

**Tool Input:**

```typescript
interface WebSearchInput {
  query: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
}
```

**Domain Filtering:**

```typescript
// Only search these domains
allowedTools: ['WebSearch'],
// Pass through options if needed
```

Domain rules:
- Don't include `http://` or `https://`
- Subdomains are automatically included (`example.com` covers `docs.example.com`)
- Wildcards supported in paths: `example.com/blog/*`

**Rate Limits:**

- $10 per 1,000 searches
- Standard token costs for search-generated content
- Citations don't count toward token limits

### WebFetch Tool

Fetches content from a URL and processes it with an AI model.

**Enabling:**

```typescript
allowedTools: ['WebFetch']
```

**Usage:**

```typescript
for await (const message of query({
  prompt: "Fetch https://example.com and summarize the content",
  options: {
    allowedTools: ['WebFetch']
  }
})) {
  // ...
}
```

**Tool Input:**

```typescript
interface WebFetchInput {
  url: string;
  prompt: string;  // What to extract from the page
}
```

**Note:** WebFetch converts HTML to markdown before processing.

### Beta Headers

Web tools are generally available and don't require beta headers.

---

## 9. Custom MCP Tools

**Reference:** https://platform.claude.com/docs/en/agent-sdk/mcp

### Overview

MCP (Model Context Protocol) connects agents to external tools and data sources. Three transport types:

1. **stdio**: Local processes
2. **HTTP/SSE**: Remote servers
3. **SDK servers**: In-process tools

### Creating In-Process MCP Servers

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Define a tool
const weatherTool = tool(
  'get_weather',
  'Get current weather for a city',
  z.object({
    city: z.string(),
    units: z.enum(['celsius', 'fahrenheit']).optional()
  }),
  async (args, extra) => {
    // Tool implementation
    const weather = await fetchWeather(args.city, args.units);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(weather)
      }]
    };
  }
);

// Create MCP server
const weatherServer = createSdkMcpServer({
  name: 'weather',
  version: '1.0.0',
  tools: [weatherTool]
});

// Use in query
for await (const message of query({
  prompt: "What's the weather in Tokyo?",
  options: {
    mcpServers: {
      'weather': weatherServer
    },
    allowedTools: ['mcp__weather__get_weather']
  }
})) {
  // ...
}
```

### Tool Decorator Equivalent

The TypeScript SDK uses the `tool()` function:

```typescript
const myTool = tool(
  'tool_name',
  'Tool description',
  z.object({ param: z.string() }),
  async (args, extra) => {
    return { content: [{ type: 'text', text: 'result' }] };
  }
);
```

### Connecting External MCP Servers

**stdio (Local Process):**

```typescript
mcpServers: {
  'github': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN
    }
  }
}
```

**HTTP/SSE (Remote):**

```typescript
mcpServers: {
  'remote-api': {
    type: 'sse',
    url: 'https://api.example.com/mcp/sse',
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`
    }
  }
}
```

### Allowing MCP Tools

MCP tools require explicit permission:

```typescript
allowedTools: [
  'mcp__github__*',              // All tools from github server
  'mcp__db__query',              // Only query tool from db server
  'mcp__slack__send_message'     // Specific tool
]
```

Or use permissionMode:

```typescript
permissionMode: 'acceptEdits'  // No need for allowedTools
```

### MCP Tool Search

Auto-activates when MCP tools exceed 10% of context:

```typescript
env: {
  ENABLE_TOOL_SEARCH: 'auto'     // Default
  // ENABLE_TOOL_SEARCH: 'auto:5'  // 5% threshold
  // ENABLE_TOOL_SEARCH: 'true'    // Always on
  // ENABLE_TOOL_SEARCH: 'false'   // Disabled
}
```

### Authentication

Pass credentials via environment variables:

```typescript
mcpServers: {
  'github': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN
    }
  }
}
```

For HTTP servers, use headers:

```typescript
mcpServers: {
  'api': {
    type: 'http',
    url: 'https://api.example.com/mcp',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`
    }
  }
}
```

---

## 10. Hooks

**Reference:** https://platform.claude.com/docs/en/agent-sdk/hooks

### Overview

Hooks intercept agent execution to add validation, logging, security controls, or custom logic.

**Use cases:**
- Block dangerous operations
- Log and audit tool calls
- Transform inputs and outputs
- Require human approval
- Track session lifecycle

### Available Hook Events

```typescript
type HookEvent =
  | 'PreToolUse'             // Before tool executes
  | 'PostToolUse'            // After tool executes
  | 'PostToolUseFailure'     // Tool execution failed
  | 'Notification'           // Agent status message
  | 'UserPromptSubmit'       // User submitted prompt
  | 'SessionStart'           // Session initialized
  | 'SessionEnd'             // Session terminated
  | 'Stop'                   // Agent execution stop
  | 'SubagentStart'          // Subagent initialized
  | 'SubagentStop'           // Subagent completed
  | 'PreCompact'             // Before conversation compaction
  | 'PermissionRequest';     // Permission dialog triggered
```

### Hook Callback Type

```typescript
type HookCallback = (
  input: HookInput,           // Event details
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;
```

### Hook Matchers

```typescript
interface HookCallbackMatcher {
  matcher?: string;  // Regex to match tool names
  hooks: HookCallback[];
}
```

### Configuring Hooks

```typescript
hooks: {
  PreToolUse: [
    { matcher: 'Write|Edit', hooks: [validateFilePath] },
    { matcher: 'Bash', hooks: [blockDangerousCommands] }
  ],
  PostToolUse: [
    { hooks: [auditLogger] }  // No matcher = all tools
  ],
  Stop: [
    { hooks: [cleanup] }
  ]
}
```

### Input Data

All hook inputs extend `BaseHookInput`:

```typescript
interface BaseHookInput {
  hook_event_name: string;
  session_id: string;
  transcript_path: string;
  cwd: string;
}
```

**PreToolUseHookInput:**

```typescript
interface PreToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: unknown;
}
```

**PostToolUseHookInput:**

```typescript
interface PostToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
}
```

### Callback Outputs

```typescript
interface SyncHookJSONOutput {
  continue?: boolean;              // Continue execution (default: true)
  suppressOutput?: boolean;        // Hide stdout (default: false)
  stopReason?: string;             // Message when continue=false
  systemMessage?: string;          // Inject context into conversation
  hookSpecificOutput?: {
    hookEventName: string;
    // PreToolUse specific:
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;
    // UserPromptSubmit, PostToolUse, SessionStart specific:
    additionalContext?: string;
  };
}
```

### Example: Block Dangerous Commands

```typescript
const blockDangerousCommands: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  const command = preInput.tool_input?.command as string;

  if (command?.includes('rm -rf /')) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Dangerous command blocked'
      }
    };
  }
  return {};
};

// Use in query
hooks: {
  PreToolUse: [
    { matcher: 'Bash', hooks: [blockDangerousCommands] }
  ]
}
```

### Example: Log File Changes

```typescript
import { appendFileSync } from 'fs';

const logFileChange: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PostToolUse') return {};

  const postInput = input as PostToolUseHookInput;
  const filePath = postInput.tool_input?.file_path as string;

  appendFileSync('./audit.log',
    `${new Date().toISOString()}: modified ${filePath}\n`
  );

  return {};
};

// Use in query
hooks: {
  PostToolUse: [
    { matcher: 'Edit|Write', hooks: [logFileChange] }
  ]
}
```

### Example: Redirect File Writes

```typescript
const redirectToSandbox: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  if (preInput.tool_name === 'Write') {
    const originalPath = preInput.tool_input?.file_path as string;
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput: {
          ...preInput.tool_input,
          file_path: `/sandbox${originalPath}`
        }
      }
    };
  }
  return {};
};
```

### Permission Decision Flow

When multiple hooks or rules apply:

1. **Deny** rules checked first (any match = immediate denial)
2. **Ask** rules checked second
3. **Allow** rules checked third
4. **Default to Ask** if nothing matches

---

## 11. Error Handling

### Exception Types

```typescript
// From Claude Code CLI
class CLINotFoundError extends Error {}
class CLIConnectionError extends Error {}
class ProcessError extends Error {}
class CLIJSONDecodeError extends Error {}
```

### Retry Patterns

```typescript
async function queryWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      for await (const message of query({ prompt, options: {} })) {
        if (message.type === 'result') {
          if (message.subtype === 'success') {
            return message.result;
          } else {
            throw new Error(`Query failed: ${message.errors?.join(', ')}`);
          }
        }
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Graceful Degradation

```typescript
for await (const message of query({ prompt: "...", options })) {
  if (message.type === 'result') {
    switch (message.subtype) {
      case 'success':
        console.log(message.result);
        break;
      case 'error_max_turns':
        console.warn('Hit max turns, partial result available');
        break;
      case 'error_max_budget_usd':
        console.error('Budget exceeded');
        break;
      case 'error_during_execution':
        console.error('Execution error:', message.errors);
        break;
      case 'error_max_structured_output_retries':
        console.error('Could not produce structured output');
        break;
    }
  }
}
```

### MCP Connection Errors

```typescript
for await (const message of query({ prompt: "...", options })) {
  if (message.type === 'system' && message.subtype === 'init') {
    const failedServers = message.mcp_servers.filter(
      s => s.status !== 'connected'
    );
    if (failedServers.length > 0) {
      console.warn('Failed MCP servers:', failedServers);
    }
  }
}
```

---

## 12. Rate Limits

**Reference:** https://platform.claude.com/docs/en/api/rate-limits

### Tier System

Organizations advance through tiers by purchasing credits:

| Tier | Credit Purchase | Max Monthly Spend |
|------|----------------|-------------------|
| Tier 1 | $5 | $100 |
| Tier 2 | $40 | $500 |
| Tier 3 | $200 | $1,000 |
| Tier 4 | $400 | $5,000 |

### Rate Limit Metrics

- **RPM**: Requests per minute
- **ITPM**: Input tokens per minute (uncached only)
- **OTPM**: Output tokens per minute

### Tier 4 Limits (Most Relevant for Agents)

| Model | RPM | ITPM | OTPM |
|-------|-----|------|------|
| Claude Sonnet 4.x | 4,000 | 2,000,000 | 400,000 |
| Claude Haiku 4.5 | 4,000 | 4,000,000 | 800,000 |
| Claude Opus 4.x | 4,000 | 2,000,000 | 400,000 |

### Token Bucket Algorithm

Capacity continuously replenishes up to your maximum, rather than resetting at fixed intervals.

### Cache-Aware Limits

**Key insight:** Only **uncached** input tokens count toward ITPM limits.

```
ITPM counted = input_tokens + cache_creation_input_tokens
ITPM NOT counted = cache_read_input_tokens
```

**Example:** With 2M ITPM limit and 80% cache hit rate, you can process 10M total input tokens/min (2M uncached + 8M cached).

### Prompt Caching Benefits

Use [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) for:
- System instructions
- Large context documents
- Tool definitions
- Conversation history

Cached tokens:
- Don't count toward ITPM rate limits
- Cost 10% of base input token price

### Response Headers

```typescript
'anthropic-ratelimit-requests-limit': '4000'
'anthropic-ratelimit-requests-remaining': '3999'
'anthropic-ratelimit-requests-reset': '2026-01-28T12:34:56Z'
'anthropic-ratelimit-input-tokens-limit': '2000000'
'anthropic-ratelimit-input-tokens-remaining': '1999000'
'anthropic-ratelimit-input-tokens-reset': '2026-01-28T12:34:56Z'
'anthropic-ratelimit-output-tokens-limit': '400000'
'anthropic-ratelimit-output-tokens-remaining': '399000'
'anthropic-ratelimit-output-tokens-reset': '2026-01-28T12:34:56Z'
```

---

## 13. Complete Code Examples

### Example 1: Simple Query

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find all TypeScript files in this project",
  options: {
    allowedTools: ["Glob", "Bash"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### Example 2: Query with Structured Output

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const BugReport = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  suggested_fix: z.string()
});

const BugReportList = z.object({
  bugs: z.array(BugReport),
  total_count: z.number()
});

type BugReportList = z.infer<typeof BugReportList>;

for await (const message of query({
  prompt: "Analyze auth.py for security vulnerabilities",
  options: {
    allowedTools: ["Read", "Grep"],
    outputFormat: {
      type: 'json_schema',
      schema: z.toJSONSchema(BugReportList)
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const parsed = BugReportList.safeParse(message.structured_output);
    if (parsed.success) {
      const report: BugReportList = parsed.data;
      console.log(`Found ${report.total_count} bugs`);
      report.bugs.forEach(bug => {
        console.log(`[${bug.severity}] ${bug.file}:${bug.line} - ${bug.description}`);
      });
    }
  }
}
```

### Example 3: Parent Agent Spawning Parallel Sub-Agents

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review this codebase comprehensively using all specialized agents",
  options: {
    allowedTools: ['Read', 'Grep', 'Glob', 'Task'],
    agents: {
      'style-checker': {
        description: 'Checks code style and formatting',
        prompt: 'Review code for style issues, naming conventions, and formatting',
        tools: ['Read', 'Grep', 'Glob']
      },
      'security-scanner': {
        description: 'Scans for security vulnerabilities',
        prompt: 'Identify security issues, unsafe patterns, and injection risks',
        tools: ['Read', 'Grep', 'Glob']
      },
      'test-coverage': {
        description: 'Analyzes test coverage',
        prompt: 'Find untested code paths and suggest test cases',
        tools: ['Read', 'Grep', 'Glob', 'Bash']
      }
    }
  }
})) {
  // Track sub-agent invocations
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'tool_use' && block.name === 'Task') {
        console.log(`Spawning sub-agent: ${block.input.subagent_type}`);
      }
    }
  }

  if (message.type === "result" && message.subtype === "success") {
    console.log("Comprehensive review complete:");
    console.log(message.result);
  }
}
```

### Example 4: Sub-Agent with WebSearch + WebFetch

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Research best practices for React hooks and create a guide",
  options: {
    allowedTools: ['Task', 'Write'],
    agents: {
      'researcher': {
        description: 'Web research specialist',
        prompt: 'Search the web and compile information from multiple sources',
        tools: ['WebSearch', 'WebFetch']
      }
    }
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### Example 5: Collecting Structured Data from Multiple Sub-Agents

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const IssueReport = z.object({
  category: z.string(),
  issues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    file: z.string()
  }))
});

const ComprehensiveReport = z.object({
  style_report: IssueReport,
  security_report: IssueReport,
  performance_report: IssueReport,
  summary: z.string()
});

type ComprehensiveReport = z.infer<typeof ComprehensiveReport>;

for await (const message of query({
  prompt: "Analyze this codebase and provide a comprehensive structured report",
  options: {
    allowedTools: ['Read', 'Grep', 'Glob', 'Task'],
    agents: {
      'style-checker': {
        description: 'Code style analysis',
        prompt: 'Find style issues',
        tools: ['Read', 'Grep']
      },
      'security-scanner': {
        description: 'Security analysis',
        prompt: 'Find security vulnerabilities',
        tools: ['Read', 'Grep']
      },
      'performance-analyzer': {
        description: 'Performance analysis',
        prompt: 'Find performance bottlenecks',
        tools: ['Read', 'Grep']
      }
    },
    outputFormat: {
      type: 'json_schema',
      schema: z.toJSONSchema(ComprehensiveReport)
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const parsed = ComprehensiveReport.safeParse(message.structured_output);
    if (parsed.success) {
      const report = parsed.data;
      console.log("Style issues:", report.style_report.issues.length);
      console.log("Security issues:", report.security_report.issues.length);
      console.log("Performance issues:", report.performance_report.issues.length);
      console.log("\nSummary:", report.summary);
    }
  }
}
```

### Example 6: Error Handling Patterns

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function robustQuery(prompt: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      for await (const message of query({
        prompt,
        options: {
          maxTurns: 20,
          maxBudgetUsd: 1.0
        }
      })) {
        // Check for MCP connection failures
        if (message.type === 'system' && message.subtype === 'init') {
          const failedServers = message.mcp_servers.filter(
            s => s.status !== 'connected'
          );
          if (failedServers.length > 0) {
            console.warn('Some MCP servers failed:', failedServers);
          }
        }

        // Handle result
        if (message.type === 'result') {
          switch (message.subtype) {
            case 'success':
              return { success: true, result: message.result };

            case 'error_max_turns':
              console.warn(`Attempt ${attempt + 1}: Hit max turns`);
              if (attempt < maxRetries - 1) continue;
              return { success: false, error: 'Max turns exceeded' };

            case 'error_max_budget_usd':
              return { success: false, error: 'Budget exceeded' };

            case 'error_during_execution':
              console.error(`Execution error:`, message.errors);
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
              }
              return { success: false, error: message.errors?.join(', ') };

            case 'error_max_structured_output_retries':
              return { success: false, error: 'Could not produce structured output' };
          }
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) {
        return { success: false, error: String(error) };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// Usage
const result = await robustQuery("Analyze this complex codebase");
if (result.success) {
  console.log("Success:", result.result);
} else {
  console.error("Failed:", result.error);
}
```

### Example 7: Data Pipeline with Multiple Agents

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Define data structures
const DataSource = z.object({
  name: z.string(),
  type: z.enum(['api', 'database', 'file']),
  endpoint: z.string(),
  schema: z.record(z.string())
});

const TransformStep = z.object({
  step_name: z.string(),
  operation: z.string(),
  parameters: z.record(z.any())
});

const PipelineConfig = z.object({
  sources: z.array(DataSource),
  transforms: z.array(TransformStep),
  destination: z.object({
    type: z.enum(['database', 'file', 'api']),
    config: z.record(z.string())
  })
});

type PipelineConfig = z.infer<typeof PipelineConfig>;

for await (const message of query({
  prompt: `Analyze the data sources in /data directory and design an ETL pipeline
          that extracts customer data, transforms it to match our schema,
          and loads it into the warehouse`,
  options: {
    allowedTools: ['Read', 'Grep', 'Glob', 'Task', 'WebSearch'],
    agents: {
      'data-analyst': {
        description: 'Analyzes data sources and schemas',
        prompt: 'Examine data sources, identify schemas, and document structure',
        tools: ['Read', 'Grep', 'Glob']
      },
      'pipeline-designer': {
        description: 'Designs ETL pipelines',
        prompt: 'Create efficient data transformation pipelines',
        tools: ['Read', 'WebSearch']
      },
      'validator': {
        description: 'Validates pipeline configurations',
        prompt: 'Check pipeline configs for errors and optimize performance',
        tools: ['Read']
      }
    },
    outputFormat: {
      type: 'json_schema',
      schema: z.toJSONSchema(PipelineConfig)
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const parsed = PipelineConfig.safeParse(message.structured_output);
    if (parsed.success) {
      const config = parsed.data;
      console.log("Pipeline Configuration:");
      console.log(`Sources: ${config.sources.length}`);
      console.log(`Transform steps: ${config.transforms.length}`);
      console.log(`Destination: ${config.destination.type}`);

      // Save configuration
      // await fs.writeFile('pipeline-config.json', JSON.stringify(config, null, 2));
    }
  }
}
```

---

## Additional Resources

- **GitHub TypeScript SDK:** https://github.com/anthropics/claude-agent-sdk-typescript
- **Example Agents:** https://github.com/anthropics/claude-agent-sdk-demos
- **MCP Server Directory:** https://github.com/modelcontextprotocol/servers
- **API Documentation:** https://platform.claude.com/docs
- **Claude Code Documentation:** https://code.claude.com/docs

---

**Document Version:** 2026-01-28
**SDK Version:** Latest (as of documentation date)
