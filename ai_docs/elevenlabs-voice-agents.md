# ElevenLabs Conversational AI / Voice Agents - Comprehensive Documentation

**Target Audience:** AI coding agents implementing web-based voice agent integration
**Scope:** Web-only voice via React SDK widget (NOT phone numbers)
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [React SDK (@elevenlabs/react)](#2-react-sdk-elevenlabsreact)
3. [Next.js Integration](#3-nextjs-integration)
4. [Dynamic Variables](#4-dynamic-variables)
5. [Overrides](#5-overrides)
6. [Client Tools](#6-client-tools)
7. [Contextual Updates](#7-contextual-updates)
8. [Agent Configuration API](#8-agent-configuration-api)
9. [Signed URL Generation](#9-signed-url-generation)
10. [Widget Embed (Alternative)](#10-widget-embed-alternative)
11. [Knowledge Base](#11-knowledge-base)
12. [Pricing](#12-pricing)
13. [Limitations & Constraints](#13-limitations--constraints)
14. [Complete Implementation Examples](#14-complete-implementation-examples)

---

## 1. Overview & Architecture

**Reference:** https://elevenlabs.io/docs/conversational-ai/overview

### Core Components

ElevenLabs Conversational AI is a complete voice agent system that orchestrates three core technologies:

1. **ASR (Automatic Speech Recognition)** — Converts user voice input to text
2. **LLM (Large Language Model)** — Processes text and generates responses
3. **TTS (Text-to-Speech)** — Converts agent responses to natural voice

### Architecture Flow

```
User speaks → ASR (transcription) → LLM (reasoning) → TTS (synthesis) → Agent speaks
              ↑                                                            ↓
              └─────────────── Turn Management ──────────────────────────┘
```

### Turn Management

The system manages conversation flow through:
- **Turn timeout** — Time before re-engaging silent user (default: 7 seconds)
- **Turn eagerness** — Response readiness (patient/normal/eager)
- **Interruption handling** — User can interrupt agent speech
- **Voice Activity Detection (VAD)** — Detects when user starts/stops speaking

### Connection Types

- **WebSocket** — Default connection for web-based conversations
- **WebRTC** — Alternative for lower latency audio (pcm_48000 format hardcoded)

---

## 2. React SDK (@elevenlabs/react)

**Reference:** https://elevenlabs.io/docs/agents-platform/libraries/react

### Installation

```bash
npm install @elevenlabs/react
```

### useConversation Hook

The primary hook for managing voice conversations.

```tsx
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation(options?);
```

### Hook Options

| Option | Type | Description |
|--------|------|-------------|
| `clientTools` | object | Functions agents can invoke client-side |
| `overrides` | object | Dynamic conversation settings overrides |
| `textOnly` | boolean | Runs without audio (lighter version) |
| `serverLocation` | string | `"us"` (default), `"eu-residency"`, `"in-residency"`, `"global"` |
| `micMuted` | boolean | Controlled microphone mute state |
| `volume` | number | Controlled output volume (0-1) |

### Client Tools Configuration

```typescript
const conversation = useConversation({
  clientTools: {
    displayMessage: (parameters: { text: string }) => {
      alert(parameters.text);
      return 'Message displayed';
    },
    getCustomerDetails: async () => {
      return {
        id: 123,
        name: "Alice",
        subscription: "Pro"
      };
    }
  }
});
```

**Important:** Tool names are **case-sensitive** and must match agent configuration exactly.

### Conversation Overrides

```typescript
const conversation = useConversation({
  overrides: {
    agent: {
      prompt: { prompt: 'Custom prompt' },
      firstMessage: 'Custom greeting',
      language: 'en',
    },
    tts: {
      voiceId: 'custom-voice-id',
    },
    conversation: {
      textOnly: true,
    },
  },
});
```

### Callbacks

| Callback | Triggered When |
|----------|----------------|
| `onConnect` | WebSocket connection established |
| `onDisconnect` | WebSocket connection ended |
| `onMessage` | Transcriptions, agent replies, debug messages received |
| `onError` | Error encounters |
| `onAudio` | Audio data received |
| `onModeChange` | Conversation mode changes (speaking/listening) |
| `onStatusChange` | Connection status changes |
| `onCanSendFeedbackChange` | Feedback capability changes |
| `onDebug` | Debug information available |
| `onUnhandledClientToolCall` | Unhandled client tool invocation |
| `onVadScore` | Voice activity detection score updates |

### Core Methods

#### startSession()

Initiates connection to agent. Returns Promise with globally unique `conversationId`.

```typescript
const conversationId = await conversation.startSession({
  agentId: '<agent-id>',              // Required for public agents
  signedUrl?: '<signed-url>',         // For authorized WebSocket
  conversationToken?: '<token>',      // For authorized WebRTC
  connectionType: 'webrtc' | 'websocket',
  userId?: '<user-id>',               // Optional: map to your users
});
```

**Authentication:**
- **Public agents:** Use `agentId` directly
- **Private agents:** Use `signedUrl` (WebSocket) or `conversationToken` (WebRTC)
  - WebSocket: POST to `/v1/convai/conversation/get-signed-url?agent_id=<id>`
  - WebRTC: POST to `/v1/convai/conversation/token?agent_id=<id>`

#### endSession()

```typescript
await conversation.endSession();
```

Manually terminates conversation and disconnects.

#### sendUserMessage()

Sends text message that prompts agent response:

```typescript
await conversation.sendUserMessage('User message text');
```

#### sendContextualUpdate()

Sends information **without** triggering agent response (non-interrupting background info):

```typescript
await conversation.sendContextualUpdate('Context info for consideration');
```

**Use cases:**
- Sending background data
- Updating agent knowledge mid-conversation
- Providing system state changes

#### sendUserActivity()

Notifies agent of user activity; pauses agent speech for ~2 seconds:

```typescript
await conversation.sendUserActivity();
```

#### sendFeedback()

Submits conversation quality feedback:

```typescript
await conversation.sendFeedback(true);   // Positive
await conversation.sendFeedback(false);  // Negative
```

#### setVolume()

Adjusts output volume (0-1 range):

```typescript
await conversation.setVolume({ volume: 0.5 });
```

#### changeInputDevice()

Switches audio input during active conversation:

```typescript
await conversation.changeInputDevice({
  sampleRate: 16000,
  format: 'pcm',
  preferHeadphonesForIosDevices?: true,
  inputDeviceId?: 'device-id', // Optional specific device
});
```

#### changeOutputDevice()

Switches audio output during active conversation:

```typescript
await conversation.changeOutputDevice({
  sampleRate: 16000,
  format: 'pcm',
  outputDeviceId?: 'device-id',
});
```

**Note:** Device switching only works for voice conversations. WebRTC audio hardcoded to `pcm_48000` format.

#### sendMCPToolApprovalResult()

Sends approval/rejection for Model Context Protocol tool calls:

```typescript
await conversation.sendMCPToolApprovalResult('tool_call_id_123', true);  // Approve
await conversation.sendMCPToolApprovalResult('tool_call_id_123', false); // Reject
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | string | `"connected"` or `"disconnected"` |
| `isSpeaking` | boolean | Agent speech status |
| `canSendFeedback` | boolean | Feedback submission availability |
| `getId()` | function | Returns current conversation ID |
| `getInputVolume()` | function | Returns input level (0-1) |
| `getOutputVolume()` | function | Returns output level (0-1) |
| `getInputByteFrequencyData()` | function | Returns `Uint8Array` frequency data |
| `getOutputByteFrequencyData()` | function | Returns `Uint8Array` frequency data |

### Important Notes

- **Microphone permission required:** Request before starting conversation
  ```typescript
  await navigator.mediaDevices.getUserMedia({ audio: true });
  ```
- Enumerate devices: `MediaDevices.enumerateDevices()` API

---

## 3. Next.js Integration

**Reference:** https://elevenlabs.io/docs/agents-platform/guides/quickstarts/next-js

### Client Component Setup

Create `app/components/conversation.tsx`:

```tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useState } from 'react';

export default function ConversationComponent() {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  // Request microphone permission
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log('Microphone access granted'))
      .catch((err) => console.error('Microphone access denied:', err));
  }, []);

  const startConversation = async () => {
    // Fetch signed URL from server
    const response = await fetch('/api/get-signed-url');
    const data = await response.json();
    setSignedUrl(data.signedUrl);

    // Start session
    await conversation.startSession({
      signedUrl: data.signedUrl,
    });
  };

  const stopConversation = async () => {
    await conversation.endSession();
  };

  return (
    <div>
      <div>Status: {conversation.status}</div>
      <div>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</div>

      <button onClick={startConversation}>Start</button>
      <button onClick={stopConversation}>Stop</button>
    </div>
  );
}
```

### Server-Side Signed URL Generation

Create `app/api/get-signed-url/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!AGENT_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'Missing configuration' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
```

### Environment Variables

Create `.env.local`:

```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

**CRITICAL:** Add `.env.local` to `.gitignore`. Never expose API key client-side.

### Integration Flow

1. Client requests signed URL from server endpoint
2. Server validates request and generates secure URL using API key
3. Client initiates session using signed URL
4. **Signed URLs expire after 15 minutes**, but active connections continue uninterrupted

---

## 4. Dynamic Variables

**Reference:** https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables

### Syntax

Use double curly braces in prompts, messages, and tool parameters:

```
{{variable_name}}
```

### Passing Dynamic Variables

#### JavaScript/React

```javascript
const conversationId = await conversation.startSession({
  agentId: 'agent-id',
  dynamicVariables: {
    user_name: 'Angelo',
    account_balance: 5000.50,
    is_premium: true
  }
});
```

#### Python

```python
dynamic_vars = {
    "user_name": "Angelo",
    "account_balance": 5000.50,
    "is_premium": True
}
config = ConversationInitiationData(
    dynamic_variables=dynamic_vars
)
```

### System Variables

Automatically available (prefixed with `system__`):

| Variable | Description |
|----------|-------------|
| `system__agent_id` | Agent initiating the conversation |
| `system__current_agent_id` | Currently active agent (updates after transfers) |
| `system__caller_id` | Caller's phone number (voice only) |
| `system__called_number` | Destination phone number (voice only) |
| `system__call_duration_secs` | Call duration in seconds |
| `system__time_utc` | Current UTC time (ISO format) |
| `system__time` | Human-readable time in specified timezone |
| `system__timezone` | User-provided timezone |
| `system__conversation_id` | ElevenLabs unique conversation identifier |
| `system__call_sid` | Call SID (Twilio calls only) |

**Behavior:**
- In **system prompts:** Values static at conversation start
- In **tool calls:** Values update at execution time

### Secret Variables

Prefix with `secret__` for header-only variables (never sent to LLM):

```javascript
dynamicVariables: {
  secret__auth_token: 'Bearer token123',
  secret__api_key: 'sk-...'
}
```

**Recommended for:** Authentication tokens, private IDs, sensitive credentials.

### Updating Variables from Tools

Tool responses can extract and update variables using dot notation:

- `response.status` — Direct property
- `response.users.0.email` — Array element access

Tools must return valid JSON objects with configured assignments.

### Public Talk-to Page URLs

#### Method 1: Base64-encoded JSON

```
https://elevenlabs.io/app/talk-to?agent_id=ID&vars=base64EncodedJSON
```

#### Method 2: Individual parameters

```
https://elevenlabs.io/app/talk-to?agent_id=ID&var_user_name=John&var_account_type=premium
```

Individual `var_` parameters take precedence when both methods used.

### Supported Data Types

- **String** — Text values
- **Number** — Numeric values
- **Boolean** — True/false values

---

## 5. Overrides

**Reference:** https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides

### Overview

Overrides enable **real-time personalization** without creating multiple agents. As stated: "pass custom data and settings at the start of each conversation, allowing the assistant to personalize its responses."

### Security Configuration

**IMPORTANT:** Overrides disabled by default for security.

To enable:
1. Navigate to agent settings
2. Select **Security** tab
3. Enable desired override fields

### Overrideable Parameters

- System prompt
- First message
- Language
- Voice ID
- LLM (Large Language Model)
- Text-only mode
- Stability (0.0-1.0)
- Speed (0.7-1.2)
- Similarity boost (0.0-1.0)

### Usage

```typescript
const conversation = useConversation({
  overrides: {
    agent: {
      prompt: {
        prompt: 'You are a helpful assistant specializing in {{user_industry}}.'
      },
      firstMessage: 'Hi {{user_name}}, how can I help you today?',
      language: 'es',
    },
    tts: {
      voiceId: 'axXgspJ2msm3clMCkdW3',
      stability: 0.7,
      speed: 1.1,
      similarity_boost: 0.9,
    },
    conversation: {
      textOnly: false,
    },
  },
});
```

**Critical Rule:** "When using overrides, **omit any fields you don't want to override** rather than setting them to empty strings or null values."

### Common Use Cases

- Personalizing greetings with customer names
- Including account-specific data (balances, order status)
- Adjusting tone and language based on preferences
- Injecting real-time contextual information

---

## 6. Client Tools

**Reference:** https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools

### Overview

Client tools allow agents to **invoke client-side JavaScript functions**. Tools execute in the browser, enabling access to local data, DOM manipulation, and client-side APIs.

### Tool Definition

```typescript
const conversation = useConversation({
  clientTools: {
    toolName: async ({ param1, param2 }) => {
      // implementation
      return resultValue;
    }
  }
});
```

### Parameter Schema

Define in agent dashboard:
- **Data Type** (String, Number, Boolean, etc.)
- **Identifier** (parameter name)
- **Required** (true/false)
- **Description** (usage guidance)

**CRITICAL:** Tool and parameter names are **case-sensitive** and must match agent configuration exactly.

### Complete Example

```typescript
const conversation = await Conversation.startSession({
  clientTools: {
    logMessage: async ({ message }) => {
      console.log(message);
    },

    getCustomerDetails: async () => {
      const customerData = {
        id: 123,
        name: "Alice",
        subscription: "Pro"
      };
      return customerData;
    },

    updateUIElement: async ({ elementId, content }) => {
      document.getElementById(elementId).textContent = content;
      return 'UI updated successfully';
    },

    fetchLocalData: async ({ dataType }) => {
      const data = localStorage.getItem(dataType);
      return JSON.parse(data);
    }
  }
});
```

### Return Values

- Tools can return any serializable data
- Enable **"Wait for response"** in agent configuration for blocking calls
- Return value passed back to agent as tool response
- Agent can incorporate results into subsequent responses

### Tool Configuration Options

In agent dashboard:
- **response_timeout_secs** (default: 20) — Max wait time
- **disable_interruptions** — Prevents user interruption during execution
- **force_pre_tool_speech** — Agent speaks before calling tool
- **tool_call_sound** — Audio feedback (typing, elevator1-4)
- **execution_mode** — immediate/post_tool_speech/async

---

## 7. Contextual Updates

### sendContextualUpdate()

Sends information **without** triggering agent response. Non-interrupting background info.

```typescript
await conversation.sendContextualUpdate(
  'User just opened checkout page. Cart total: $149.99'
);
```

### Use Cases

- **Background data updates:** Send system state changes
- **Context enrichment:** Provide additional information without conversation interruption
- **Event notifications:** Inform agent of user actions (page navigation, button clicks)
- **Real-time data sync:** Update agent knowledge mid-conversation

### vs sendUserMessage()

| Method | Triggers Response | Use Case |
|--------|-------------------|----------|
| `sendUserMessage()` | Yes | User explicitly asking questions |
| `sendContextualUpdate()` | No | Background information, system events |

---

## 8. Agent Configuration API

**Reference:** https://elevenlabs.io/docs/agents-platform/api-reference/agents/create

### Endpoint

**URL:** `https://api.elevenlabs.io/v1/convai/agents/create`
**Method:** POST
**Authentication:** Required (`xi-api-key` header)

### Request Headers

```http
xi-api-key: your_api_key_here
Content-Type: application/json
```

### Minimal Example

```json
{
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "You are a helpful customer service assistant.",
        "llm": "gpt-4o"
      }
    },
    "tts": {
      "model_id": "eleven_turbo_v2"
    }
  }
}
```

### Configuration Sections

#### 1. Agent Configuration

```json
{
  "agent": {
    "first_message": "Hello! How can I help you today?",
    "language": "en",
    "hinglish_mode": false,
    "disable_first_message_interruptions": false,
    "dynamic_variables": {
      "dynamic_variable_placeholders": {
        "variable_name": "value"
      }
    }
  }
}
```

#### 2. Prompt Configuration

```json
{
  "prompt": {
    "prompt": "You are a helpful assistant. User name: {{user_name}}",
    "llm": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000,
    "reasoning_effort": "medium",
    "timezone": "America/New_York"
  }
}
```

**Supported LLMs:**
- `gpt-4o`
- `gpt-4o-mini`
- `claude-3-5-sonnet-20241022`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- Custom LLM endpoints

**Reasoning Effort:** `none`, `minimal`, `low`, `medium`, `high`

#### 3. Voice Settings (TTS)

```json
{
  "tts": {
    "model_id": "eleven_turbo_v2",
    "voice_id": "cjVigY5qzO86Huf0OWal",
    "stability": 0.5,
    "speed": 1.0,
    "similarity_boost": 0.8,
    "optimize_streaming_latency": 3,
    "agent_output_audio_format": "pcm_16000"
  }
}
```

**TTS Models:**
- `eleven_turbo_v2` — Fastest, best for real-time
- `eleven_flash_v2.5` — High quality, low latency
- `eleven_multilingual_v2` — Multi-language support

**Audio Formats:** `pcm_8000`, `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100`, `pcm_48000`

#### 4. Speech Recognition (ASR)

```json
{
  "asr": {
    "quality": "high",
    "provider": "elevenlabs",
    "user_input_audio_format": "pcm_16000",
    "keywords": ["product_name", "company_name"]
  }
}
```

**Providers:** `elevenlabs`, `scribe_realtime`

#### 5. Turn Management

```json
{
  "turn": {
    "turn_timeout": 7,
    "initial_wait_time": 2,
    "silence_end_call_timeout": -1,
    "turn_eagerness": "normal",
    "spelling_patience": "auto"
  }
}
```

**Turn Eagerness:** `patient`, `normal`, `eager`
**Spelling Patience:** `auto`, `off`

#### 6. Tools Configuration

```json
{
  "tools": [
    {
      "type": "webhook",
      "name": "get_order_status",
      "description": "Fetches order status by order ID",
      "url": "https://api.example.com/orders",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer {{secret__api_key}}"
      },
      "body": {
        "order_id": "{{order_id}}"
      },
      "response_timeout_secs": 20,
      "disable_interruptions": false,
      "force_pre_tool_speech": false,
      "execution_mode": "immediate"
    },
    {
      "type": "client",
      "name": "display_product",
      "description": "Shows product details in UI",
      "parameters": [
        {
          "name": "product_id",
          "type": "string",
          "required": true,
          "description": "Product identifier"
        }
      ]
    }
  ]
}
```

**Built-in System Tools:**
- `end_call` — Terminates conversation
- `language_detection` — Detects user language
- `transfer_to_agent` — Routes to another agent
- `skip_turn` — Skips agent response
- `play_keypad_touch_tone` — Sends DTMF tones

#### 7. Knowledge Base

```json
{
  "knowledge_base": [
    {
      "type": "file",
      "name": "Product Documentation",
      "id": "kb_123",
      "usage_mode": "auto"
    }
  ]
}
```

**Types:** `file`, `url`, `text`, `folder`
**Usage Modes:** `prompt`, `auto`

#### 8. Platform Settings

```json
{
  "platform_settings": {
    "auth": {
      "enable_auth": true,
      "allowlist": ["example.com"],
      "shareable_token": null
    },
    "widget": {
      "variant": "expandable",
      "placement": "bottom-right",
      "avatar": {
        "type": "orb",
        "orb_color_1": "#6DB035",
        "orb_color_2": "#1E90FF"
      }
    },
    "privacy": {
      "record_voice": true,
      "retention_days": 30,
      "zero_retention_mode": false
    },
    "call_limits": {
      "agent_concurrency_limit": 10,
      "daily_limit": 1000,
      "bursting_enabled": true
    }
  }
}
```

### Response Schema

**Success (HTTP 200):**

```json
{
  "agent_id": "agent_abc123",
  "status": "created",
  "configuration": { /* full config */ }
}
```

**Error (HTTP 422):**

```json
{
  "detail": [
    {
      "loc": ["body", "conversation_config", "prompt"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 9. Signed URL Generation

**Reference:** https://elevenlabs.io/docs/api-reference/get-signed-url
**Search Results:** https://elevenlabs.io/docs/conversational-ai/api-reference/conversations/get-signed-url

### Purpose

Signed URLs enable secure authentication for **private agents** requiring authorization. Never expose API key client-side.

### API Endpoint

**URL:** `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url`
**Method:** POST
**Query Parameters:** `agent_id=<agent_id>`

### Request

```http
POST /v1/convai/conversation/get-signed-url?agent_id=<agent_id> HTTP/1.1
Host: api.elevenlabs.io
xi-api-key: your_api_key_here
Content-Type: application/json
```

### Response

```json
{
  "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?signature=..."
}
```

### Server-Side Implementation

```typescript
// Next.js API route
export async function GET() {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
      },
    }
  );

  const data = await response.json();
  return NextResponse.json({ signedUrl: data.signed_url });
}
```

### Client-Side Usage

```typescript
const response = await fetch('/api/get-signed-url');
const { signedUrl } = await response.json();

await conversation.startSession({
  signedUrl: signedUrl,
});
```

### Important Constraints

- **Signed URLs expire after 15 minutes**
- Active WebSocket connections continue uninterrupted after expiration
- Cannot create new connections with expired URLs
- `conversation_signature` cannot be reused

### WebRTC Alternative

For WebRTC connections, use token endpoint:

**URL:** `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=<agent_id>`
**Method:** POST

Returns `conversationToken` for WebRTC initiation.

---

## 10. Widget Embed (Alternative)

**Reference:** https://elevenlabs.io/docs/agents-platform/customization/widget

### Basic Embed

```html
<elevenlabs-convai agent-id="<your-agent-id>"></elevenlabs-convai>
<script
  src="https://unpkg.com/@elevenlabs/convai-widget-embed"
  async
  type="text/javascript"
></script>
```

### Core Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `agent-id` | string | Required: Agent identifier |
| `signed-url` | string | Alternative to agent-id for auth |
| `server-location` | string | "us" or other region |
| `variant` | string | "expanded" for display mode |
| `dismissible` | boolean | Allow widget minimization |

### Visual Customization

```html
<elevenlabs-convai
  agent-id="agent-id"
  avatar-image-url="https://example.com/avatar.png"
  avatar-orb-color-1="#6DB035"
  avatar-orb-color-2="#1E90FF"
></elevenlabs-convai>
```

### Text Customization

```html
<elevenlabs-convai
  agent-id="agent-id"
  action-text="Talk to us"
  start-call-text="Start conversation"
  end-call-text="End call"
  listening-text="Listening..."
  speaking-text="Speaking..."
></elevenlabs-convai>
```

### Dynamic Variables

```html
<elevenlabs-convai
  agent-id="agent-id"
  dynamic-variables='{"user_name": "John", "account_type": "premium"}'
></elevenlabs-convai>
```

### Overrides

```html
<elevenlabs-convai
  agent-id="agent-id"
  override-language="es"
  override-prompt="Custom system prompt"
  override-first-message="Hi! How can I help?"
  override-voice-id="axXgspJ2msm3clMCkdW3"
></elevenlabs-convai>
```

### Markdown & Link Configuration

```html
<elevenlabs-convai
  agent-id="agent-id"
  markdown-link-allowed-hosts="*"
  markdown-link-include-www="true"
  markdown-link-allow-http="true"
  syntax-highlight-theme="dark"
></elevenlabs-convai>
```

### Dashboard Configuration

Additional customization via agent dashboard:
- Appearance (colors, shapes)
- Feedback collection modes
- Avatar configuration
- Display text
- Terms and conditions
- Language selection
- Audio muting
- Shareable landing pages

---

## 11. Knowledge Base

**Reference:** https://elevenlabs.io/docs/agents-platform/customization/knowledge-base

### File Limits

| Account Type | Limit |
|--------------|-------|
| **Standard** | 20MB or 300,000 characters per file |
| **Enterprise** | Higher limits available |

Dashboard enforces 21MB size limit for uploads.

### Supported Formats

- PDF
- TXT
- DOCX
- HTML
- EPUB

### Adding Content

Three methods available:

1. **Files** — Direct upload through dashboard
2. **URLs** — Import from documentation and product pages
3. **Text** — Manual input via dashboard

### API Integration

Programmatic creation available:

```python
# Create from text
elevenlabs.conversational_ai.knowledge_base.documents.create_from_text()

# Create from URL
elevenlabs.conversational_ai.knowledge_base.documents.create_from_url()

# Create from file
elevenlabs.conversational_ai.knowledge_base.documents.create_from_file()

# Attach to agent
elevenlabs.conversational_ai.agents.update()
```

### Usage Modes

- **`prompt`** — Explicitly reference in system prompt
- **`auto`** — Automatic retrieval based on relevance

### Key Limitations

- **No automatic link scraping:** "When creating a knowledge base item from a URL, we do not currently support scraping all pages linked to from the initial URL"
- **No continuous updates:** Knowledge base doesn't auto-refresh from URLs
- **No dynamic per-conversation switching:** Cannot change knowledge base per session
- **Permission required:** Must have rights to use content from URLs

---

## 12. Pricing

**References:**
- https://elevenlabs.io/pricing
- https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenLabs-Agents-formerly-Conversational-AI-cost
- https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai

### Per-Minute Costs

**Base Pricing (as of Feb 2025):** Starting at **$0.10/minute**

**Note:** This does **NOT** include LLM costs.

### Plan Tiers

| Plan | Minutes Included | Overage Rate |
|------|------------------|--------------|
| **Business** | 22,000 min/month ($1,320/mo) | $0.06/min |
| **Other Plans** | Varies | $0.06-$0.15/min |

### Concurrent Sessions

| Metric | Limit |
|--------|-------|
| **Concurrent sessions** | 4-30 (plan-dependent) |
| **Additional concurrency** | Extra costs apply |

### Credit System

- 10,000 credits ≈ 10 min high-quality audio
- 10,000 credits ≈ 15 min AI agent time
- Agents billed by minute, not character

### Cost Optimizations

- **Silence discount:** 95% discount for silence periods >10 seconds (voice calls)
- **Testing calls:** 50% cost during setup and prompt testing
- **No agent creation cost:** Free to create agents

### LLM Cost Considerations

LLM costs are **separate** from per-minute pricing:

| LLM | Relative Cost |
|-----|---------------|
| **GPT-4o** | High |
| **GPT-4o-mini** | Medium |
| **Claude 3.5 Sonnet** | High |
| **Gemini 1.5 Flash** | Low |

**Optimization strategies:**
- Use cheaper models (GPT-4o-mini, Gemini Flash)
- Limit `max_tokens`
- Reduce temperature for deterministic responses
- Use RAG to minimize context size

### Burst Pricing

Optimize call capacity with burst concurrency to handle traffic spikes. Bursting enabled by default.

```json
{
  "platform_settings": {
    "call_limits": {
      "bursting_enabled": true
    }
  }
}
```

---

## 13. Limitations & Constraints

### Concurrent Session Limits

- **4-30 concurrent sessions** (plan-dependent)
- Additional concurrency requires higher-tier plans
- Burst capacity available (extra cost)

### Rate Limits

- API rate limits apply (not explicitly documented)
- Recommended to implement exponential backoff for failures

### Latency Characteristics

- **ASR latency:** ~100-300ms (depends on provider)
- **LLM latency:** Varies by model (GPT-4o: 500-2000ms, GPT-4o-mini: 300-800ms)
- **TTS latency:** ~200-500ms (depends on model and optimization)
- **Total turn latency:** ~800-3000ms typical

**Optimization:**
- Use `eleven_turbo_v2` for fastest TTS
- Set `optimize_streaming_latency` to higher values (0-4)
- Use WebRTC instead of WebSocket for lower audio latency
- Select faster LLMs (GPT-4o-mini, Gemini Flash)

### File & Content Limits

| Resource | Limit |
|----------|-------|
| **Knowledge base file size** | 20MB or 300K chars (standard) |
| **Knowledge base total** | No documented limit |
| **Agent concurrency** | Plan-dependent (4-30) |
| **Daily conversation limit** | Default: 100,000 |
| **Retention days** | Default: -1 (unlimited) |

### Known Constraints

1. **No dynamic knowledge base switching:** Cannot change KB per conversation
2. **No URL scraping:** KB from URLs doesn't follow links or auto-update
3. **WebRTC audio format:** Hardcoded to `pcm_48000`
4. **Signed URL expiration:** 15 minutes (connections persist after)
5. **Device switching:** Only works for voice conversations
6. **Microphone permission:** Required before starting conversation

### Platform Limitations

- **No conversation history API:** Cannot retrieve past conversations programmatically (yet)
- **Limited callback options:** Not all events exposed via callbacks
- **No mid-conversation voice change:** Cannot switch voice during active session (must use overrides at start)
- **Tool name sensitivity:** Case-sensitive, must match exactly
- **Override security:** Must explicitly enable in dashboard

---

## 14. Complete Implementation Examples

### Example 1: Basic Next.js Integration

**File: `app/components/VoiceAgent.tsx`**

```tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useState } from 'react';

export default function VoiceAgent() {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to agent');
      setMessages(prev => [...prev, 'Connected']);
    },
    onDisconnect: () => {
      console.log('Disconnected from agent');
      setMessages(prev => [...prev, 'Disconnected']);
    },
    onMessage: (message) => {
      console.log('Message:', message);
      setMessages(prev => [...prev, JSON.stringify(message)]);
    },
    onError: (error) => {
      console.error('Error:', error);
      setMessages(prev => [...prev, `Error: ${error}`]);
    },
  });

  useEffect(() => {
    // Request microphone permission on mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log('Microphone access granted'))
      .catch((err) => console.error('Microphone access denied:', err));
  }, []);

  const startConversation = async () => {
    try {
      // Fetch signed URL from server
      const response = await fetch('/api/get-signed-url');
      const data = await response.json();
      setSignedUrl(data.signedUrl);

      // Start session
      const conversationId = await conversation.startSession({
        signedUrl: data.signedUrl,
      });

      console.log('Conversation ID:', conversationId);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const stopConversation = async () => {
    await conversation.endSession();
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div>Status: {conversation.status}</div>
        <div>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</div>
      </div>

      <div className="space-x-2 mb-4">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status === 'disconnected'}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Stop Conversation
        </button>
      </div>

      <div className="border p-4 h-64 overflow-y-auto">
        <h3 className="font-bold mb-2">Messages:</h3>
        {messages.map((msg, idx) => (
          <div key={idx} className="text-sm mb-1">{msg}</div>
        ))}
      </div>
    </div>
  );
}
```

**File: `app/api/get-signed-url/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!AGENT_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'Missing ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
```

---

### Example 2: Advanced Integration with Client Tools & Dynamic Variables

**File: `app/components/AdvancedVoiceAgent.tsx`**

```tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useState } from 'react';

interface CustomerData {
  id: string;
  name: string;
  accountBalance: number;
  recentOrders: string[];
}

export default function AdvancedVoiceAgent() {
  const [customerData, setCustomerData] = useState<CustomerData>({
    id: '12345',
    name: 'John Doe',
    accountBalance: 1250.50,
    recentOrders: ['ORDER-001', 'ORDER-002']
  });

  const conversation = useConversation({
    // Define client tools
    clientTools: {
      getAccountBalance: async () => {
        console.log('Tool called: getAccountBalance');
        return {
          balance: customerData.accountBalance,
          currency: 'USD'
        };
      },

      getRecentOrders: async ({ limit }: { limit: number }) => {
        console.log('Tool called: getRecentOrders', { limit });
        return {
          orders: customerData.recentOrders.slice(0, limit),
          total: customerData.recentOrders.length
        };
      },

      displayNotification: async ({ message, type }: { message: string, type: string }) => {
        console.log('Tool called: displayNotification', { message, type });
        alert(`[${type}] ${message}`);
        return 'Notification displayed';
      }
    },

    // Callbacks
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .catch((err) => console.error('Microphone access denied:', err));
  }, []);

  const startConversation = async () => {
    try {
      const response = await fetch('/api/get-signed-url');
      const { signedUrl } = await response.json();

      const conversationId = await conversation.startSession({
        signedUrl: signedUrl,
        // Pass dynamic variables
        dynamicVariables: {
          user_name: customerData.name,
          user_id: customerData.id,
          account_balance: customerData.accountBalance,
          has_recent_orders: customerData.recentOrders.length > 0
        }
      });

      console.log('Started conversation:', conversationId);

      // Send contextual update (non-interrupting)
      await conversation.sendContextualUpdate(
        `Customer ${customerData.name} (ID: ${customerData.id}) has ${customerData.recentOrders.length} recent orders.`
      );
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const sendMessage = async () => {
    await conversation.sendUserMessage('What is my account balance?');
  };

  const updateContext = async () => {
    await conversation.sendContextualUpdate(
      'User just viewed their order history page.'
    );
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Customer: {customerData.name}</h2>
        <div>Status: {conversation.status}</div>
        <div>Speaking: {conversation.isSpeaking ? 'Yes' : 'No'}</div>
      </div>

      <div className="space-x-2 mb-4">
        <button onClick={startConversation} className="px-4 py-2 bg-blue-500 text-white rounded">
          Start
        </button>
        <button onClick={() => conversation.endSession()} className="px-4 py-2 bg-red-500 text-white rounded">
          Stop
        </button>
        <button onClick={sendMessage} className="px-4 py-2 bg-green-500 text-white rounded">
          Send Test Message
        </button>
        <button onClick={updateContext} className="px-4 py-2 bg-yellow-500 text-white rounded">
          Update Context
        </button>
      </div>
    </div>
  );
}
```

---

### Example 3: Agent Creation via API

**File: `scripts/create-agent.ts`**

```typescript
async function createAgent() {
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  const agentConfig = {
    conversation_config: {
      agent: {
        first_message: "Hi {{user_name}}! I'm your personal assistant. How can I help you today?",
        language: "en",
        prompt: {
          prompt: `You are a helpful customer service assistant for our e-commerce platform.

User Information:
- Name: {{user_name}}
- Account Balance: {{account_balance}}
- Recent Orders: {{recent_orders}}

Your responsibilities:
1. Answer questions about orders
2. Help with account issues
3. Provide product recommendations
4. Process returns and refunds

Always be polite and professional. Use the customer's name when appropriate.`,
          llm: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 500,
          timezone: "America/New_York"
        },
        dynamic_variables: {
          dynamic_variable_placeholders: {
            user_name: "Customer",
            account_balance: "0.00",
            recent_orders: "None"
          }
        }
      },
      tts: {
        model_id: "eleven_turbo_v2",
        voice_id: "cjVigY5qzO86Huf0OWal",
        stability: 0.5,
        speed: 1.0,
        similarity_boost: 0.8,
        optimize_streaming_latency: 3
      },
      asr: {
        quality: "high",
        provider: "elevenlabs",
        user_input_audio_format: "pcm_16000"
      },
      turn: {
        turn_timeout: 7,
        turn_eagerness: "normal",
        silence_end_call_timeout: 60
      },
      tools: [
        {
          type: "client",
          name: "getAccountBalance",
          description: "Retrieves the customer's current account balance",
          parameters: []
        },
        {
          type: "client",
          name: "getRecentOrders",
          description: "Fetches recent order history",
          parameters: [
            {
              name: "limit",
              type: "number",
              required: false,
              description: "Number of orders to retrieve (default: 5)"
            }
          ]
        },
        {
          type: "webhook",
          name: "processRefund",
          description: "Processes a refund for an order",
          url: "https://api.example.com/refunds",
          method: "POST",
          headers: {
            "Authorization": "Bearer {{secret__api_key}}",
            "Content-Type": "application/json"
          },
          body: {
            "order_id": "{{order_id}}",
            "customer_id": "{{user_id}}"
          },
          response_timeout_secs: 30
        }
      ],
      platform_settings: {
        auth: {
          enable_auth: true
        },
        privacy: {
          record_voice: true,
          retention_days: 30
        },
        call_limits: {
          agent_concurrency_limit: 10,
          daily_limit: 1000
        }
      }
    }
  };

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentConfig)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create agent:', error);
      throw new Error('Agent creation failed');
    }

    const data = await response.json();
    console.log('Agent created successfully!');
    console.log('Agent ID:', data.agent_id);

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run
createAgent();
```

---

### Example 4: Widget Embed with Full Customization

**File: `public/agent-widget.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Agent Widget</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>Customer Support Voice Agent</h1>
  <p>Click the button in the bottom-right corner to start talking to our AI assistant.</p>

  <!-- ElevenLabs Widget -->
  <elevenlabs-convai
    agent-id="your-agent-id-here"

    <!-- Appearance -->
    variant="expandable"
    placement="bottom-right"
    dismissible="true"

    <!-- Avatar -->
    avatar-orb-color-1="#6DB035"
    avatar-orb-color-2="#1E90FF"

    <!-- Text customization -->
    action-text="Chat with us"
    start-call-text="Start conversation"
    end-call-text="End conversation"
    listening-text="I'm listening..."
    speaking-text="Speaking..."

    <!-- Dynamic variables -->
    dynamic-variables='{"user_name": "Guest", "support_tier": "standard"}'

    <!-- Overrides -->
    override-language="en"
    override-first-message="Hello! Welcome to our support. How can I help you today?"

    <!-- Markdown settings -->
    markdown-link-allowed-hosts="*.example.com,example.com"
    markdown-link-include-www="true"
    syntax-highlight-theme="dark"
  ></elevenlabs-convai>

  <!-- Widget script -->
  <script
    src="https://unpkg.com/@elevenlabs/convai-widget-embed"
    async
    type="text/javascript"
  ></script>

  <!-- Custom JavaScript -->
  <script>
    // Get user data from your system
    const userData = {
      name: 'John Doe',
      userId: '12345',
      accountType: 'premium'
    };

    // Dynamically update widget with user data
    window.addEventListener('DOMContentLoaded', () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.setAttribute('dynamic-variables', JSON.stringify({
          user_name: userData.name,
          user_id: userData.userId,
          account_type: userData.accountType
        }));
      }
    });
  </script>
</body>
</html>
```

---

## Quick Reference Cheat Sheet

### Essential URLs

| Resource | URL |
|----------|-----|
| **React SDK Docs** | https://elevenlabs.io/docs/agents-platform/libraries/react |
| **Next.js Guide** | https://elevenlabs.io/docs/agents-platform/guides/quickstarts/next-js |
| **Agent API Reference** | https://elevenlabs.io/docs/agents-platform/api-reference/agents/create |
| **Dynamic Variables** | https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables |
| **Overrides** | https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides |
| **Client Tools** | https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools |
| **Widget Embed** | https://elevenlabs.io/docs/agents-platform/customization/widget |
| **Knowledge Base** | https://elevenlabs.io/docs/agents-platform/customization/knowledge-base |
| **Signed URL (search result)** | https://elevenlabs.io/docs/conversational-ai/api-reference/conversations/get-signed-url |

### Key Methods

```typescript
// Start conversation
await conversation.startSession({ signedUrl, dynamicVariables });

// End conversation
await conversation.endSession();

// Send user message (triggers response)
await conversation.sendUserMessage('text');

// Send context (no response)
await conversation.sendContextualUpdate('info');

// Volume control
await conversation.setVolume({ volume: 0.5 });

// Feedback
await conversation.sendFeedback(true);
```

### Common Patterns

**Check status before actions:**
```typescript
if (conversation.status === 'connected') {
  await conversation.sendUserMessage('Hello');
}
```

**Handle microphone permission:**
```typescript
try {
  await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  console.error('Microphone access denied');
}
```

**Pass dynamic data:**
```typescript
await conversation.startSession({
  signedUrl,
  dynamicVariables: {
    user_name: userName,
    account_id: accountId
  }
});
```

---

## Additional Resources

- **ElevenLabs API Docs:** https://elevenlabs.io/docs/api-reference/introduction
- **Pricing Information:** https://elevenlabs.io/pricing
- **Blog (Pricing Updates):** https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai
- **Support Articles:** https://help.elevenlabs.io/hc/en-us/sections/14163158308369-API

---

**Document Version:** 1.0
**Created:** 2026-01-28
**Target Implementation:** Web-based Conversational AI (React SDK)
**Excludes:** Phone number integration, mobile SDKs
