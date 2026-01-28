# Voice Agent Specification — AgentIndex

> **Pre-read required:** Before implementing, read [`../ai_docs/elevenlabs-voice-agents.md`](../ai_docs/elevenlabs-voice-agents.md) for complete ElevenLabs SDK reference, React hooks, client tools API, and code examples.

## Table of Contents
- [Overview](#overview)
- [Technical Architecture](#technical-architecture)
- [Voice Mode 1: Navigator](#voice-mode-1-navigator)
- [Voice Mode 2: Assistant](#voice-mode-2-assistant)
- [Server Implementation](#server-implementation)
- [Voice UI Component](#voice-ui-component)
- [Mode Switching](#mode-switching)
- [ElevenLabs Configuration](#elevenlabs-configuration)
- [Pricing & Usage](#pricing--usage)
- [Environment Variables](#environment-variables)
- [Testing Checklist](#testing-checklist)
- [Future Enhancements](#future-enhancements)
- [Implementation Priority](#implementation-priority)
- [Contact & Support](#contact--support)

---

## Overview

AgentIndex implements ElevenLabs Conversational AI with **two distinct voice agent modes**:

1. **Navigator** — Site-wide guide helping users find agents, agencies, suburbs
2. **Assistant** — Per-page agent/agency assistant with specific context

**Architecture:** One ElevenLabs agent template with dynamic overrides per session.

---

## Technical Architecture

### ElevenLabs SDK Integration

**Package:** `@elevenlabs/react`

```bash
npm install @elevenlabs/react
```

**Authentication:** Signed URLs generated server-side (API key never client-exposed)

**Security Requirements:**
- Enable "Allow overrides" in ElevenLabs agent settings
- Server-side signed URL generation only
- Environment variable: `ELEVENLABS_API_KEY`

### Session Flow

```
User clicks voice button
    ↓
Client: POST /api/voice/signed-url
  Body: { pageType, slug, voiceMode }
    ↓
Server:
  1. Read ELEVENLABS_API_KEY from env
  2. Build system prompt + dynamic variables (pageType + voiceMode)
  3. Generate signed URL via ElevenLabs API
  4. Return { signedUrl }
    ↓
Client: conversation.startSession({ signedUrl, clientTools })
    ↓
Voice session active
```

### React Hook Implementation

```typescript
'use client';

import { useConversation } from '@elevenlabs/react';
import { useState } from 'react';

interface VoiceAgentProps {
  pageType: 'agent' | 'agency' | 'suburb' | 'listing' | 'home';
  slug?: string;
  agentData?: any;
  agencyData?: any;
  suburbData?: any;
  voiceMode: 'navigator' | 'assistant';
}

export function VoiceAgent({
  pageType,
  slug,
  agentData,
  agencyData,
  suburbData,
  voiceMode
}: VoiceAgentProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice connected');
      setStatus('connected');
    },
    onDisconnect: () => {
      console.log('Voice disconnected');
      setStatus('idle');
    },
    onMessage: (message) => {
      console.log('Message:', message);
    },
    onError: (err) => {
      console.error('Voice error:', err);
      setError(err.message);
      setStatus('error');
    },
  });

  const startSession = async () => {
    try {
      setStatus('connecting');
      setError(null);

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from server
      const res = await fetch('/api/voice/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageType,
          slug,
          voiceMode,
          contextData: {
            agent: agentData,
            agency: agencyData,
            suburb: suburbData
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { signedUrl } = await res.json();

      // Start conversation with appropriate client tools
      const tools = voiceMode === 'navigator' ? navigatorTools : assistantTools;

      await conversation.startSession({
        signedUrl,
        clientTools: tools
      });

    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const endSession = async () => {
    await conversation.endSession();
    setStatus('idle');
  };

  return (
    <VoiceUI
      status={status}
      isSpeaking={conversation.isSpeaking}
      error={error}
      onStart={startSession}
      onEnd={endSession}
      voiceMode={voiceMode}
    />
  );
}
```

---

## Voice Mode 1: Navigator

### Purpose

Site-wide guide available on every page via floating button. Helps users:
- Find agents by name, location, specialty
- Navigate to agent profiles, suburbs, agencies
- Filter and sort listings
- Answer general directory questions

### System Prompt

```
You are AgentIndex Navigator, a helpful voice guide for Australia's real estate agent directory.

Your job is to help users find real estate agents, agencies, or suburbs. You can:
- Help them search for agents by name, location, or specialty
- Navigate them to agent profiles, suburb pages, or agency pages
- Filter and sort agent listings
- Answer general questions about choosing a real estate agent

When the user tells you what they're looking for, use your tools to navigate them to the right page.

Rules:
- Be concise and helpful — this is a voice conversation, not a chatbot
- If the user mentions a suburb, navigate to that suburb's page
- If they mention an agent name, navigate to that agent's profile
- If they mention an agency, navigate to that agency's page
- Always confirm before navigating: "I'll take you to [page]. Here we go."
- You are NOT a real estate agent. You are a directory guide.
- Keep responses under 30 seconds
- Use Australian English
- If asked to speak to an agent's assistant, use the activateAssistant tool
```

### Dynamic Variables

```
{{current_page}} — Current page type (agent/agency/suburb/listing/home)
{{current_slug}} — Current page slug
{{total_agents}} — Total agents in database
{{total_suburbs}} — Total suburbs indexed
{{total_agencies}} — Total agencies indexed
```

### Client Tools

```typescript
const navigatorTools = {
  navigateToPage: {
    description: "Navigate the user to a specific page on the website. Use this when the user wants to go to an agent profile, suburb page, or agency page.",
    parameters: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description: "The URL path to navigate to (e.g., /agent/john-smith-bondi)"
        }
      },
      required: ["path"]
    },
    handler: async ({ path }: { path: string }) => {
      window.location.href = path;
      return "Navigated successfully";
    }
  },

  searchAgents: {
    description: "Search for agents, agencies, or suburbs. Returns matching results.",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string" as const,
          description: "The search query"
        }
      },
      required: ["query"]
    },
    handler: async ({ query }: { query: string }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      return JSON.stringify({
        agents_found: data.agents.length,
        agencies_found: data.agencies.length,
        suburbs_found: data.suburbs.length,
        top_results: data.agents.slice(0, 3).map((a: any) => ({
          name: a.full_name,
          agency: a.agency_name,
          slug: a.slug,
          suburb: a.suburb
        }))
      });
    }
  },

  filterResults: {
    description: "Apply filters on the current agent listing page.",
    parameters: {
      type: "object" as const,
      properties: {
        sort: {
          type: "string" as const,
          enum: ["sales_count", "avg_price", "rating", "name"],
          description: "Sort order for results"
        },
        propertyType: {
          type: "string" as const,
          enum: ["house", "apartment", "townhouse", "land"],
          description: "Filter by property type"
        }
      }
    },
    handler: async ({ sort, propertyType }: { sort?: string; propertyType?: string }) => {
      const params = new URLSearchParams(window.location.search);
      if (sort) params.set('sort', sort);
      if (propertyType) params.set('type', propertyType);
      window.location.search = params.toString();
      return "Filters applied";
    }
  },

  scrollToSection: {
    description: "Scroll to a section on the current page.",
    parameters: {
      type: "object" as const,
      properties: {
        section: {
          type: "string" as const,
          description: "Section ID (e.g., reviews, sales-history, stats)"
        }
      },
      required: ["section"]
    },
    handler: async ({ section }: { section: string }) => {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return `Scrolled to ${section}`;
      }
      return `Section ${section} not found`;
    }
  },

  activateAssistant: {
    description: "Switch from Navigator to Assistant mode for the current agent or agency. Use when user wants to talk to the agent's assistant.",
    parameters: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string" as const,
          description: "Agent or agency slug"
        }
      },
      required: ["slug"]
    },
    handler: async ({ slug }: { slug: string }) => {
      window.dispatchEvent(
        new CustomEvent('voice-mode-change', {
          detail: { mode: 'assistant', slug }
        })
      );
      return "Switching to assistant mode";
    }
  },

  highlightAgent: {
    description: "Highlight a specific agent's card on a listing page to draw the user's attention.",
    parameters: {
      type: "object" as const,
      properties: {
        agentSlug: {
          type: "string" as const,
          description: "The agent's slug identifier"
        }
      },
      required: ["agentSlug"]
    },
    handler: async ({ agentSlug }: { agentSlug: string }) => {
      const card = document.querySelector(`[data-agent-slug="${agentSlug}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
        }, 5000);
        return "Agent highlighted";
      }
      return "Agent card not found on this page";
    }
  }
};
```

### First Message

```
"Hi! I'm the AgentIndex Navigator. I can help you find real estate agents, explore suburbs, or navigate the site. What are you looking for?"
```

---

## Voice Mode 2: Assistant

### Purpose

Page-specific assistant available on agent/agency/suburb pages. Acts AS the agent's or agency's assistant with full profile context.

### System Prompt: Agent Page

```
You are the virtual assistant for {{agent_name}}, a real estate agent at {{agency_name}}.

You have access to the following information about {{agent_name}}:

{{agent_context}}

Your role:
- Answer questions about {{agent_name}}'s experience, specialties, and track record
- Share details about their recent sales and performance
- Help potential clients understand if {{agent_name}} is the right fit
- If asked about booking an appraisal or consultation, let them know this is a demo assistant and encourage them to contact {{agent_name}} directly

Rules:
- Speak as a professional assistant representing this agent
- Only share information you have in context — don't make up sales or stats
- Be warm, professional, concise
- Use Australian English
- Keep responses under 30 seconds
- At the end of the conversation, mention: "This is a demo of AI-powered assistance by Voqo AI. Imagine having this for your own agency."
```

### System Prompt: Agency Page

```
You are the virtual receptionist for {{agency_name}}.

You have access to the following information:

{{agency_context}}

Your role:
- Welcome callers and help them find the right agent at {{agency_name}}
- Share information about the agency's team, specialties, and coverage areas
- If they need a specific agent, describe who might be the best fit
- Help with general inquiries about the agency

Rules:
- Speak as a professional receptionist for this agency
- Only share information you have in context
- Be warm, professional, concise
- Use Australian English
- Keep responses under 30 seconds
- At the end, mention: "This is a demo of AI-powered reception by Voqo AI."
```

### System Prompt: Suburb Page

```
You are a local area expert for {{suburb_name}}, {{state}}.

You have access to the following information about agents in this area:

{{suburb_context}}

Your role:
- Help users find the right agent for their needs in {{suburb_name}}
- Ask qualifying questions: buying or selling? Property type? Budget range?
- Recommend 2-3 agents from the available list based on their needs
- Share suburb market statistics

Rules:
- Be helpful and conversational
- Don't push any specific agent — recommend based on fit
- Only share information you have in context
- Use Australian English
- Keep responses under 30 seconds
```

### Dynamic Context Injection

#### Agent Context Format

```typescript
function buildAgentContext(agent: Agent): string {
  return `
Name: ${agent.full_name}
Agency: ${agent.agency_name}
Years experience: ${agent.years_experience}
Languages: ${agent.languages.join(', ')}
Specializations: ${agent.specializations.join(', ')}
Suburbs covered: ${agent.suburbs.join(', ')}

Performance (12 months):
- Total sales: ${agent.sales_count_12mo}
- Average sale price: $${agent.avg_sale_price_12mo.toLocaleString()}
- Median days on market: ${agent.median_dom_12mo}
- Rating: ${agent.rating}/5 (${agent.review_count} reviews)

Recent sales:
${agent.recent_sales.slice(0, 5).map(sale =>
  `- ${sale.address} — ${sale.property_type}, ${sale.bedrooms}bed/${sale.bathrooms}bath — $${sale.price.toLocaleString()} (${sale.sold_date})`
).join('\n')}

Bio: ${agent.bio}
`.trim();
}
```

#### Agency Context Format

```typescript
function buildAgencyContext(agency: Agency): string {
  return `
Agency: ${agency.name}
Locations: ${agency.locations.join(', ')}
Established: ${agency.established_year}
Total agents: ${agency.agent_count}
Specializations: ${agency.specializations.join(', ')}

Performance (12 months):
- Total sales: ${agency.sales_count_12mo}
- Average sale price: $${agency.avg_sale_price_12mo.toLocaleString()}
- Total transaction value: $${agency.total_volume_12mo.toLocaleString()}

Top agents:
${agency.top_agents.slice(0, 5).map(agent =>
  `- ${agent.full_name}: ${agent.sales_count_12mo} sales, $${agent.avg_sale_price_12mo.toLocaleString()} avg`
).join('\n')}

About: ${agency.description}
`.trim();
}
```

#### Suburb Context Format

```typescript
function buildSuburbContext(suburb: Suburb): string {
  return `
Suburb: ${suburb.name}, ${suburb.state}
Postcode: ${suburb.postcode}

Market statistics (12 months):
- Total sales: ${suburb.sales_count_12mo}
- Median house price: $${suburb.median_house_price_12mo.toLocaleString()}
- Median apartment price: $${suburb.median_apartment_price_12mo.toLocaleString()}
- Median days on market: ${suburb.median_dom_12mo}

Top agents in ${suburb.name}:
${suburb.top_agents.slice(0, 10).map(agent =>
  `- ${agent.full_name} (${agent.agency_name}): ${agent.sales_count_suburb} sales, ${agent.specializations.join(', ')}, ${agent.rating}/5 rating`
).join('\n')}

Demographics: ${suburb.demographics}
`.trim();
}
```

### Assistant Client Tools

Assistant mode has minimal tools — focus is conversation, not navigation.

```typescript
const assistantTools = {
  scrollToSection: {
    description: "Scroll to a section on the current page to show the user specific information.",
    parameters: {
      type: "object" as const,
      properties: {
        section: {
          type: "string" as const,
          description: "Section ID (e.g., reviews, sales-history, stats, contact)"
        }
      },
      required: ["section"]
    },
    handler: async ({ section }: { section: string }) => {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return `Scrolled to ${section}`;
      }
      return `Section ${section} not found`;
    }
  }
};
```

### First Messages

**Agent Assistant:**
```
"Hi! I'm {{agent_name}}'s virtual assistant. I can tell you about their experience, recent sales, and specialties. What would you like to know?"
```

**Agency Receptionist:**
```
"Hi! Welcome to {{agency_name}}. I can help you learn about our team and find the right agent for your needs. How can I help?"
```

**Suburb Expert:**
```
"Hi! I'm your local area expert for {{suburb_name}}. I can help you find the right agent for your property needs here. Are you buying or selling?"
```

---

## Server Implementation

### API Route: `/api/voice/signed-url`

```typescript
// app/api/voice/signed-url/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSignedUrl } from '@/lib/elevenlabs';
import { getAgent, getAgency, getSuburb } from '@/lib/db';
import { buildAgentContext, buildAgencyContext, buildSuburbContext } from '@/lib/voice-context';

export async function POST(req: NextRequest) {
  try {
    const { pageType, slug, voiceMode, contextData } = await req.json();

    // Build system prompt and variables based on mode
    let systemPrompt = '';
    let variables = {};
    let firstMessage = '';

    if (voiceMode === 'navigator') {
      // Navigator mode
      systemPrompt = `You are AgentIndex Navigator, a helpful voice guide for Australia's real estate agent directory.

Your job is to help users find real estate agents, agencies, or suburbs. You can:
- Help them search for agents by name, location, or specialty
- Navigate them to agent profiles, suburb pages, or agency pages
- Filter and sort agent listings
- Answer general questions about choosing a real estate agent

When the user tells you what they're looking for, use your tools to navigate them to the right page.

Rules:
- Be concise and helpful — this is a voice conversation, not a chatbot
- If the user mentions a suburb, navigate to that suburb's page
- If they mention an agent name, navigate to that agent's profile
- If they mention an agency, navigate to that agency's page
- Always confirm before navigating: "I'll take you to [page]. Here we go."
- You are NOT a real estate agent. You are a directory guide.
- Keep responses under 30 seconds
- Use Australian English
- If asked to speak to an agent's assistant, use the activateAssistant tool`;

      // Get site stats
      const stats = await getSiteStats();
      variables = {
        current_page: pageType,
        current_slug: slug || '',
        total_agents: stats.total_agents,
        total_suburbs: stats.total_suburbs,
        total_agencies: stats.total_agencies
      };

      firstMessage = "Hi! I'm the AgentIndex Navigator. I can help you find real estate agents, explore suburbs, or navigate the site. What are you looking for?";

    } else {
      // Assistant mode
      if (pageType === 'agent') {
        const agent = contextData?.agent || await getAgent(slug);
        const agentContext = buildAgentContext(agent);

        systemPrompt = `You are the virtual assistant for ${agent.full_name}, a real estate agent at ${agent.agency_name}.

You have access to the following information about ${agent.full_name}:

${agentContext}

Your role:
- Answer questions about ${agent.full_name}'s experience, specialties, and track record
- Share details about their recent sales and performance
- Help potential clients understand if ${agent.full_name} is the right fit
- If asked about booking an appraisal or consultation, let them know this is a demo assistant and encourage them to contact ${agent.full_name} directly

Rules:
- Speak as a professional assistant representing this agent
- Only share information you have in context — don't make up sales or stats
- Be warm, professional, concise
- Use Australian English
- Keep responses under 30 seconds
- At the end of the conversation, mention: "This is a demo of AI-powered assistance by Voqo AI. Imagine having this for your own agency."`;

        variables = {
          agent_name: agent.full_name,
          agency_name: agent.agency_name,
          agent_context: agentContext
        };

        firstMessage = `Hi! I'm ${agent.full_name}'s virtual assistant. I can tell you about their experience, recent sales, and specialties. What would you like to know?`;

      } else if (pageType === 'agency') {
        const agency = contextData?.agency || await getAgency(slug);
        const agencyContext = buildAgencyContext(agency);

        systemPrompt = `You are the virtual receptionist for ${agency.name}.

You have access to the following information:

${agencyContext}

Your role:
- Welcome callers and help them find the right agent at ${agency.name}
- Share information about the agency's team, specialties, and coverage areas
- If they need a specific agent, describe who might be the best fit
- Help with general inquiries about the agency

Rules:
- Speak as a professional receptionist for this agency
- Only share information you have in context
- Be warm, professional, concise
- Use Australian English
- Keep responses under 30 seconds
- At the end, mention: "This is a demo of AI-powered reception by Voqo AI."`;

        variables = {
          agency_name: agency.name,
          agency_context: agencyContext
        };

        firstMessage = `Hi! Welcome to ${agency.name}. I can help you learn about our team and find the right agent for your needs. How can I help?`;

      } else if (pageType === 'suburb') {
        const suburb = contextData?.suburb || await getSuburb(slug);
        const suburbContext = buildSuburbContext(suburb);

        systemPrompt = `You are a local area expert for ${suburb.name}, ${suburb.state}.

You have access to the following information about agents in this area:

${suburbContext}

Your role:
- Help users find the right agent for their needs in ${suburb.name}
- Ask qualifying questions: buying or selling? Property type? Budget range?
- Recommend 2-3 agents from the available list based on their needs
- Share suburb market statistics

Rules:
- Be helpful and conversational
- Don't push any specific agent — recommend based on fit
- Only share information you have in context
- Use Australian English
- Keep responses under 30 seconds`;

        variables = {
          suburb_name: suburb.name,
          state: suburb.state,
          suburb_context: suburbContext
        };

        firstMessage = `Hi! I'm your local area expert for ${suburb.name}. I can help you find the right agent for your property needs here. Are you buying or selling?`;
      }
    }

    // Generate signed URL from ElevenLabs
    const signedUrl = await createSignedUrl({
      systemPrompt,
      variables,
      firstMessage
    });

    return NextResponse.json({ signedUrl });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
```

### ElevenLabs Signed URL Helper

```typescript
// lib/elevenlabs.ts

interface SignedUrlOptions {
  systemPrompt: string;
  variables: Record<string, any>;
  firstMessage: string;
}

export async function createSignedUrl(options: SignedUrlOptions): Promise<string> {
  const { systemPrompt, variables, firstMessage } = options;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: process.env.ELEVENLABS_AGENT_ID!,
        overrides: {
          system: {
            prompt: systemPrompt,
            first_message: firstMessage
          },
          variables
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.signed_url;
}
```

---

## Voice UI Component

### State Management

```typescript
type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface VoiceUIProps {
  status: VoiceStatus;
  isSpeaking: boolean;
  error: string | null;
  onStart: () => void;
  onEnd: () => void;
  voiceMode: 'navigator' | 'assistant';
}
```

### UI States

| State | Visual | Button Label |
|-------|--------|--------------|
| Idle | Floating mic button with subtle pulse | "Talk to Navigator" / "Talk to Assistant" |
| Connecting | Loading spinner overlay | Disabled |
| Listening | Green ring, audio waveform, "Listening..." | Active |
| Speaking | Animated waveform, "Speaking..." | Active |
| Error | Red alert with message, retry button | "Try Again" |

### Example Component

```typescript
// components/VoiceUI.tsx

export function VoiceUI({
  status,
  isSpeaking,
  error,
  onStart,
  onEnd,
  voiceMode
}: VoiceUIProps) {
  const buttonLabel = voiceMode === 'navigator'
    ? 'Talk to Navigator'
    : 'Talk to Assistant';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {status === 'idle' && (
        <button
          onClick={onStart}
          className="relative flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-25" />
          <Mic className="w-6 h-6" />
          <span className="font-medium">{buttonLabel}</span>
        </button>
      )}

      {status === 'connecting' && (
        <div className="bg-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-primary" />
          <span>Connecting...</span>
        </div>
      )}

      {status === 'connected' && (
        <div className="bg-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center`}>
            {isSpeaking ? <Volume2 className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
          </div>
          <AudioWaveform isSpeaking={isSpeaking} />
          <span className="font-medium">{isSpeaking ? 'Speaking...' : 'Listening...'}</span>
          <button
            onClick={onEnd}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 mb-2">{error || 'Connection failed'}</p>
              <button
                onClick={onStart}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Audio Waveform Component

```typescript
function AudioWaveform({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="flex items-center gap-1 h-6">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary rounded-full transition-all ${
            isSpeaking ? 'animate-wave' : 'h-2'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isSpeaking ? undefined : '8px'
          }}
        />
      ))}
    </div>
  );
}
```

### CSS Animations

```css
@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 24px; }
}

.animate-wave {
  animation: wave 0.8s ease-in-out infinite;
}
```

---

## Mode Switching

### Navigator → Assistant

**Trigger:** User says "let me talk to the agent's assistant" OR clicks Assistant mode button

**Flow:**
1. Navigator tool `activateAssistant` called
2. Dispatch custom event with mode change
3. End current session
4. Start new session with Assistant config

```typescript
// Listen for mode change events
useEffect(() => {
  const handleModeChange = (e: CustomEvent) => {
    const { mode, slug } = e.detail;
    if (mode === 'assistant') {
      endSession().then(() => {
        setVoiceMode('assistant');
        startSession();
      });
    }
  };

  window.addEventListener('voice-mode-change', handleModeChange as EventListener);
  return () => {
    window.removeEventListener('voice-mode-change', handleModeChange as EventListener);
  };
}, []);
```

### Assistant → Navigator

**Trigger:** User says "go back to navigator" OR clicks Navigator button

**Implementation:** Same pattern, reverse direction

**Rule:** Only one mode active at a time — starting one ends the other

---

## ElevenLabs Configuration

### Agent Template Settings

**In ElevenLabs Dashboard:**

1. **Create Agent Template**
   - Name: "AgentIndex Voice Agent"
   - Type: Conversational AI

2. **Model Settings**
   - LLM: `gpt-4o` (or `claude-3-5-sonnet`)
   - Temperature: `0.7`
   - Max tokens: `150`

3. **Voice Settings**
   - Voice: Select warm, professional, Australian-accented voice
   - Stability: `0.5`
   - Similarity: `0.75`
   - Style: `0.3`

4. **Conversation Settings**
   - Turn detection: Default (automatic)
   - Interruption handling: Enabled
   - Background noise filtering: Enabled

5. **Security Settings**
   - ✅ Enable "Allow overrides" (CRITICAL)
   - ✅ Require signed URLs

6. **Default Prompts** (will be overridden per session)
   - System prompt: "You are a helpful assistant."
   - First message: "Hello!"

### Tool Registration Format

Each client tool must be registered in ElevenLabs dashboard:

```json
{
  "name": "navigateToPage",
  "type": "client",
  "description": "Navigate the user to a specific page on the website.",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "The URL path to navigate to"
      }
    },
    "required": ["path"]
  }
}
```

**Register all tools from both `navigatorTools` and `assistantTools`.**

---

## Pricing & Usage

### ElevenLabs Conversational AI Pricing

- **~$0.08-0.10 per minute** of conversation
- Charged per second of voice generation
- WebRTC data transfer included

### Usage Controls

**Implement session limits:**

```typescript
const MAX_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  if (status === 'connected') {
    const timeout = setTimeout(() => {
      endSession();
      alert('Session ended after 5 minutes. Click to start a new conversation.');
    }, MAX_SESSION_DURATION);

    return () => clearTimeout(timeout);
  }
}, [status]);
```

### Tracking

```typescript
// Track usage in database
async function logVoiceSession({
  userId,
  voiceMode,
  pageType,
  slug,
  duration,
  messageCount
}: VoiceSessionLog) {
  await db.voiceSessions.create({
    data: {
      userId,
      voiceMode,
      pageType,
      slug,
      duration,
      messageCount,
      timestamp: new Date()
    }
  });
}
```

---

## Environment Variables

```env
# .env.local

# ElevenLabs API key (secret)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Agent ID from ElevenLabs dashboard
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Testing Checklist

### Navigator Mode
- [ ] Voice button appears on all page types
- [ ] Can search for agents by name
- [ ] Can navigate to agent profile via voice
- [ ] Can navigate to suburb page via voice
- [ ] Can filter listing page via voice
- [ ] Can highlight specific agent card
- [ ] Can switch to Assistant mode via voice
- [ ] Responds under 30 seconds
- [ ] Australian accent and vocabulary

### Assistant Mode: Agent
- [ ] Voice button labeled correctly
- [ ] Context includes agent name, agency, stats
- [ ] Can answer questions about experience
- [ ] Can share recent sales
- [ ] Can describe specialties
- [ ] Mentions Voqo AI demo at end
- [ ] Responds under 30 seconds

### Assistant Mode: Agency
- [ ] Context includes agency stats, agent roster
- [ ] Can recommend agents based on needs
- [ ] Can share agency performance
- [ ] Acts as receptionist persona

### Assistant Mode: Suburb
- [ ] Context includes suburb stats, top agents
- [ ] Asks qualifying questions
- [ ] Recommends 2-3 agents based on needs
- [ ] Shares market statistics

### Error Handling
- [ ] Graceful failure if mic permission denied
- [ ] Retry button works after error
- [ ] Signed URL generation errors handled
- [ ] Network errors displayed clearly

### Performance
- [ ] Session starts within 2 seconds
- [ ] No lag between user speech and response
- [ ] Waveform animates smoothly
- [ ] Mode switching is seamless

---

## Future Enhancements

### V2 Features
- **Conversation history:** Save and display past conversations
- **Proactive suggestions:** Agent shows helpful next actions
- **Multi-language support:** Switch language mid-conversation
- **Voice cloning:** Custom voice per agent (premium feature)
- **SMS/Phone integration:** Continue conversation via phone

### Analytics
- Track common user queries
- Measure Navigator → Assistant conversion rate
- Identify pages with highest voice engagement
- A/B test different system prompts

### Premium Features for Agents
- Custom voice cloning (their actual voice)
- Extended context (full sales history, client testimonials)
- Calendar integration for bookings
- CRM integration for lead capture

---

## Implementation Priority

1. ✅ Set up ElevenLabs account + agent template
2. ✅ Implement Navigator mode on home page
3. ✅ Build voice UI component
4. ✅ Implement signed URL API route
5. ✅ Add Assistant mode to agent pages
6. ✅ Add Assistant mode to agency pages
7. ✅ Add Assistant mode to suburb pages
8. ✅ Implement mode switching
9. ✅ Add usage tracking
10. ✅ Test across devices (mobile/desktop)

---

## Contact & Support

**ElevenLabs Documentation:** https://elevenlabs.io/docs/conversational-ai
**React SDK:** https://github.com/elevenlabs/elevenlabs-react
**Voqo AI Team:** team@voqo.ai
