/**
 * ElevenLabs API helpers (server-side only)
 */

import { randomUUID } from 'crypto';

interface SignedUrlOptions {
  systemPrompt: string;
  variables: Record<string, unknown>;
  firstMessage: string;
}

interface ElevenLabsSignedUrlResponse {
  signed_url: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  sessionId: string;
  expiresAt: string;
  overrides: {
    prompt: { prompt: string };
    first_message: string;
    variables: Record<string, unknown>;
  };
}

/**
 * Create a signed URL for ElevenLabs conversation
 * This should only be called server-side to protect the API key
 */
export async function createSignedUrl(
  options: SignedUrlOptions
): Promise<SignedUrlResult> {
  const { systemPrompt, variables, firstMessage } = options;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  if (!agentId) {
    throw new Error('ELEVENLABS_AGENT_ID is not configured');
  }

  // POST to ElevenLabs signed URL endpoint (hyphenated path)
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
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
  // Signed URLs expire in 5 minutes per ElevenLabs docs
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Build overrides for client-side session start
  const overrides = {
    prompt: {
      prompt: systemPrompt,
    },
    first_message: firstMessage,
    variables,
  };

  return {
    signedUrl: data.signed_url,
    sessionId,
    expiresAt,
    overrides,
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
