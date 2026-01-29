/**
 * ElevenLabs API helpers (server-side only)
 */

import { randomUUID } from 'crypto';

interface SignedUrlOptions {
  systemPrompt: string;
  firstMessage: string;
  dynamicVariables: Record<string, unknown>;
}

interface ElevenLabsSignedUrlResponse {
  signed_url: string;
}

/**
 * ElevenLabs overrides structure per their docs
 * @see https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides
 */
export interface ElevenLabsOverrides {
  agent?: {
    prompt?: {
      prompt: string;
    };
    firstMessage?: string;
    language?: string;
  };
  tts?: {
    voiceId?: string;
    stability?: number;
    speed?: number;
    similarity_boost?: number;
  };
  conversation?: {
    textOnly?: boolean;
  };
}

export interface SignedUrlResult {
  signedUrl: string;
  sessionId: string;
  expiresAt: string;
  overrides: ElevenLabsOverrides;
  dynamicVariables: Record<string, unknown>;
}

/**
 * Create a signed URL for ElevenLabs conversation
 * This should only be called server-side to protect the API key
 */
export async function createSignedUrl(
  options: SignedUrlOptions
): Promise<SignedUrlResult> {
  const { systemPrompt, firstMessage, dynamicVariables } = options;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  if (!agentId) {
    throw new Error('ELEVENLABS_AGENT_ID is not configured');
  }

  // GET to ElevenLabs signed URL endpoint
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as ElevenLabsSignedUrlResponse;

  // Generate session tracking info
  const sessionId = randomUUID();
  // Signed URLs are short-lived (keep for UI/debug only; active connections continue once established).
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  /**
   * Build overrides in CORRECT ElevenLabs format
   * Per docs: { agent: { prompt: { prompt: string }, firstMessage: string } }
   */
  const overrides: ElevenLabsOverrides = {
    agent: {
      prompt: {
        prompt: systemPrompt,
      },
      firstMessage: firstMessage,
    },
  };

  return {
    signedUrl: data.signed_url,
    sessionId,
    expiresAt,
    overrides,
    dynamicVariables,
  };
}

/**
 * Validate ElevenLabs configuration
 */
export function isElevenLabsConfigured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID
  );
}
