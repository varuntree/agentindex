/**
 * ElevenLabs API helpers (server-side only)
 */

interface SignedUrlOptions {
  systemPrompt: string;
  variables: Record<string, unknown>;
  firstMessage: string;
}

interface SignedUrlResponse {
  signed_url: string;
}

/**
 * Create a signed URL for ElevenLabs conversation
 * This should only be called server-side to protect the API key
 */
export async function createSignedUrl(
  options: SignedUrlOptions
): Promise<string> {
  const { systemPrompt, variables, firstMessage } = options;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  if (!agentId) {
    throw new Error('ELEVENLABS_AGENT_ID is not configured');
  }

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

  const data = (await response.json()) as SignedUrlResponse;

  // The signed URL already contains the agent config
  // We need to add overrides via the session start on client side
  // Return the URL with override data encoded
  const overrideData = {
    prompt: {
      prompt: systemPrompt,
    },
    first_message: firstMessage,
    variables,
  };

  // Store override data in a way the client can use
  // The client will pass these when starting the session
  return JSON.stringify({
    signedUrl: data.signed_url,
    overrides: overrideData,
  });
}

/**
 * Validate ElevenLabs configuration
 */
export function isElevenLabsConfigured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID
  );
}
