'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';
import { VoicePanel } from './VoicePanel';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { safeStringify } from '@/lib/voice/sanitize';
import type {
  VoiceMode,
  VoiceStatus,
  PageType,
  AgentVoiceContext,
  AgencyVoiceContext,
  SuburbVoiceContext,
  VoiceEntityInfo,
} from '@/lib/voice/types';

interface VoiceContextValue {
  status: VoiceStatus;
  voiceMode: VoiceMode;
  pageType: PageType;
  setVoiceMode: (mode: VoiceMode) => void;
  startSession: (mode?: VoiceMode) => Promise<void>;
  endSession: () => Promise<void>;
  entityInfo: VoiceEntityInfo | null;
  setEntityInfo: (info: VoiceEntityInfo | null) => void;
  audioLevel: number;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

interface VoiceProviderProps {
  children: ReactNode;
  pageType: PageType;
  agentSlug?: string;
  agencySlug?: string;
  suburbSlug?: string;
  agentData?: AgentVoiceContext;
  agencyData?: AgencyVoiceContext;
  suburbData?: SuburbVoiceContext;
  defaultMode?: VoiceMode;
}

// Max session duration: 5 minutes
const MAX_SESSION_DURATION = 5 * 60 * 1000;

export function VoiceProvider({
  children,
  pageType,
  agentSlug,
  agencySlug,
  suburbSlug,
  agentData,
  agencyData,
  suburbData,
  defaultMode = 'navigator',
}: VoiceProviderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(defaultMode);
  const [entityInfo, setEntityInfo] = useState<VoiceEntityInfo | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const lastContextKeyRef = useRef<string | null>(null);

  // Get real-time audio level from microphone
  const audioLevel = useAudioLevel(mediaStream);

  // Track session end/error/timeout
  const trackSessionEnd = useCallback(
    async (endStatus: 'completed' | 'error' | 'timeout', errorMsg?: string) => {
      if (!sessionIdRef.current) return;
      const durationMs = Date.now() - sessionStartTimeRef.current;
      try {
        await fetch('/api/voice/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'end',
            sessionId: sessionIdRef.current,
            status: endStatus,
            durationMs,
            errorMessage: errorMsg,
          }),
        });
      } catch {
        // Silent fail - tracking shouldn't break UX
      }
      sessionIdRef.current = null;
    },
    []
  );

  /**
   * Initialize conversation with clientTools at hook level
   * 
   * We use onUnhandledClientToolCall to handle tools dynamically,
   * avoiding circular reference issues that occur when the SDK
   * tries to serialize tool functions containing window references.
   */
  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice] Connected');
      setStatus('listening');
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
      setStatus('idle');
      trackSessionEnd('completed');
    },
    onMessage: (message) => {
      console.log('[Voice] Message:', message);
    },
    onError: (err: unknown) => {
      console.error('[Voice] Error:', err);
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'An error occurred';
      }
      setError(errorMessage);
      setStatus('error');
      trackSessionEnd('error', errorMessage);
    },
    onUnhandledClientToolCall: async (toolCall) => {
      console.log('[Voice] Tool call:', toolCall);
      // Dynamically import tools to avoid circular reference issues
      const { safeTools } = await import('@/lib/voice/tools');
      const toolFn = safeTools[toolCall.tool_name];
      if (toolFn) {
        try {
          const result = await toolFn(toolCall.parameters);
          return JSON.stringify(result);
        } catch (e) {
          console.error('[Voice] Tool error:', e);
          return JSON.stringify({ error: e instanceof Error ? e.message : 'Tool error' });
        }
      }
      return JSON.stringify({ error: `Unknown tool: ${toolCall.tool_name}` });
    },
  });

  const sendContextUpdate = useCallback(
    async (reason: 'session-start' | 'page-change' | 'mode-change', nextMode?: VoiceMode) => {
      if (status !== 'listening' && status !== 'speaking') return;

      const effectiveVoiceMode = nextMode ?? voiceMode;
      const effectiveEntitySlug = agentSlug || agencySlug || suburbSlug || '';

      const contextKey = JSON.stringify({
        reason,
        voiceMode: effectiveVoiceMode,
        pageType,
        agentSlug,
        agencySlug,
        suburbSlug,
      });
      if (lastContextKeyRef.current === contextKey) return;
      lastContextKeyRef.current = contextKey;

      const update = [
        `Context update (${reason}):`,
        `- voice_mode: ${effectiveVoiceMode}`,
        `- page_type: ${pageType}`,
        effectiveEntitySlug ? `- entity_slug: ${effectiveEntitySlug}` : undefined,
        '',
        'Guidance:',
        '- Use tools to look up facts about agents/agencies/suburbs; do not guess.',
        '- If voice_mode=assistant, focus on the current page entity unless user asks otherwise.',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await conversation.sendContextualUpdate(update);
      } catch (e) {
        console.warn('[Voice] Failed to send contextual update:', e);
      }
    },
    [
      status,
      voiceMode,
      pageType,
      agentSlug,
      agencySlug,
      suburbSlug,
      conversation,
    ]
  );

  // Navigation listener for voice tools.
  // Tools must NOT use `window.location.*` for internal navigation or it will tear down the voice session.
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        href: string;
        replace?: boolean;
        scroll?: boolean;
      }>;

      const href = customEvent.detail?.href;
      if (!href || typeof href !== 'string') return;

      const replace = Boolean(customEvent.detail?.replace);
      const scroll = customEvent.detail?.scroll ?? true;

      if (replace) {
        router.replace(href, { scroll });
      } else {
        router.push(href, { scroll });
      }
    };

    window.addEventListener('voice-navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('voice-navigate', handleNavigate as EventListener);
    };
  }, [router]);

  // Keep an active voice session coherent as the user navigates (SPA routing keeps the WebSocket alive).
  useEffect(() => {
    sendContextUpdate('page-change').catch(() => {
      /* handled */
    });
  }, [pageType, agentSlug, agencySlug, suburbSlug, sendContextUpdate]);

  // Update status based on isSpeaking
  useEffect(() => {
    if (status === 'listening' || status === 'speaking') {
      setStatus(conversation.isSpeaking ? 'speaking' : 'listening');
    }
  }, [conversation.isSpeaking, status]);

  // Session timeout
  useEffect(() => {
    if (status === 'listening' || status === 'speaking') {
      const timeout = setTimeout(async () => {
        await trackSessionEnd('timeout');
        conversation.endSession();
        setStatus('idle');
      }, MAX_SESSION_DURATION);

      return () => clearTimeout(timeout);
    }
  }, [status, conversation, trackSessionEnd]);

  // Cleanup media stream when session ends (covers disconnect case)
  useEffect(() => {
    if (status === 'idle' && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [status, mediaStream]);

  const startSessionInternal = useCallback(
    async (mode: VoiceMode) => {
      try {
        setStatus('connecting');
        setError(null);

        // Request microphone permission and store stream for audio level
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);

        // Get signed URL and session config from server
        // Use safeStringify to avoid circular reference errors from context_data
        const payload = {
          page_type: pageType,
          agent_slug: agentSlug,
          agency_slug: agencySlug,
          suburb_slug: suburbSlug,
          voice_mode: mode,
          context_data: {
            agent: agentData,
            agency: agencyData,
            suburb: suburbData,
          },
        };
        console.log('[Voice] Signed URL payload:', payload);
        const body = safeStringify(payload);
        console.log('[Voice] Signed URL body:', body);
        
        const res = await fetch('/api/voice/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const errMsg =
            typeof data.error === 'string'
              ? data.error
              : data.error?.message || 'Failed to get signed URL';
          throw new Error(errMsg);
        }

        const { signedUrl, sessionId, dynamicVariables, overrides } = data;

        if (!signedUrl) {
          throw new Error('Voice service not configured');
        }

        // Store session info for tracking
        sessionIdRef.current = sessionId;
        sessionStartTimeRef.current = Date.now();

        // Track session start
        const entitySlug = agentSlug || agencySlug || suburbSlug;
        fetch('/api/voice/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'start',
            sessionId,
            pageType,
            voiceMode: mode,
            entitySlug,
          }),
        }).catch(() => {
          /* Silent fail */
        });

        console.log('[Voice] Starting session with:', {
          signedUrl: signedUrl?.slice(0, 50) + '...',
          dynamicVariables,
          overrides,
        });

        // Start conversation with signed URL
        // Overrides and dynamicVariables from server
        await conversation.startSession({
          signedUrl,
          overrides,
          dynamicVariables,
        });

        console.log('[Voice] Session started successfully');
        sendContextUpdate('session-start', mode).catch(() => {
          /* handled */
        });
      } catch (err) {
        console.error('[Voice] Failed to start session:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to start session'
        );
        setStatus('error');
      }
    },
    [
      pageType,
      agentSlug,
      agencySlug,
      suburbSlug,
      agentData,
      agencyData,
      suburbData,
      conversation,
      sendContextUpdate,
    ]
  );

  // Mode change listener
  useEffect(() => {
    const handleModeChange = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        mode: VoiceMode;
        slug?: string;
        entityType?: 'agent' | 'agency' | 'suburb';
      }>;
      const { mode, slug, entityType } = customEvent.detail ?? {};
      if (!mode) return;
      console.log('[Voice] Mode change requested:', mode);

      setVoiceMode(mode);

      // If no active session, switching modes implies starting a new session.
      if (status === 'idle') {
        startSessionInternal(mode);
        return;
      }

      // Optional: assistant activation can target a specific entity.
      if (mode === 'assistant' && slug) {
        if (entityType === 'agency') {
          router.push(`/agency/${slug}`, { scroll: true });
        } else if (entityType === 'agent' || !entityType) {
          router.push(`/agent/${slug}`, { scroll: true });
        }
      }

      await sendContextUpdate('mode-change', mode);
    };

    window.addEventListener('voice-mode-change', handleModeChange);
    return () => {
      window.removeEventListener('voice-mode-change', handleModeChange);
    };
  }, [router, sendContextUpdate, startSessionInternal, status]);

  const startSession = useCallback(
    async (mode?: VoiceMode) => {
      const nextMode = mode ?? voiceMode;
      if (mode && mode !== voiceMode) {
        setVoiceMode(mode);
      }
      await startSessionInternal(nextMode);
    },
    [startSessionInternal, voiceMode]
  );

  const endSession = useCallback(async () => {
    await conversation.endSession();
    // Cleanup media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setStatus('idle');
  }, [conversation, mediaStream]);

  const contextValue: VoiceContextValue = useMemo(
    () => ({
      status,
      voiceMode,
      pageType,
      setVoiceMode,
      startSession,
      endSession,
      entityInfo,
      setEntityInfo,
      audioLevel,
    }),
    [status, voiceMode, pageType, startSession, endSession, entityInfo, audioLevel]
  );

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}

      {/* Floating voice UI */}
      <div className="fixed bottom-6 right-6 z-50">
        <VoicePanel
          status={status}
          error={error}
          voiceMode={voiceMode}
          pageType={pageType}
          entityInfo={entityInfo}
          audioLevel={audioLevel}
          onStart={startSession}
          onEnd={endSession}
        />
      </div>
    </VoiceContext.Provider>
  );
}
