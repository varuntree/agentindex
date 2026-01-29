'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useConversation } from '@elevenlabs/react';
import { VoicePanel } from './VoicePanel';
import { navigatorTools, assistantTools } from '@/lib/voice/tools';
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
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  entityInfo: VoiceEntityInfo | null;
  setEntityInfo: (info: VoiceEntityInfo | null) => void;
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
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(defaultMode);
  const [entityInfo, setEntityInfo] = useState<VoiceEntityInfo | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Track session end/error/timeout
  const trackSessionEnd = useCallback(async (endStatus: 'completed' | 'error' | 'timeout', errorMsg?: string) => {
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
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      setStatus('listening');
    },
    onDisconnect: () => {
      setStatus('idle');
      trackSessionEnd('completed');
    },
    onMessage: () => {
      // Handle incoming messages (transcript, etc.)
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'An error occurred');
      setStatus('error');
      trackSessionEnd('error', errorMessage);
    },
  });

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

  const startSessionInternal = useCallback(
    async (mode: VoiceMode) => {
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
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to get signed URL');
        }

        // Response format: { signedUrl, sessionId, expiresAt, overrides }
        const { signedUrl, sessionId, overrides } = data;

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
        }).catch(() => {/* Silent fail */});

        // Select appropriate tools based on mode
        const toolsMap = mode === 'navigator' ? navigatorTools : assistantTools;

        // Convert our tools to the expected format
        // ElevenLabs expects: Record<string, (params) => Promise<string|number|void>|string|number|void>
        const clientTools: Record<string, (params: unknown) => Promise<string | number | void> | string | number | void> = {};
        for (const [name, tool] of Object.entries(toolsMap)) {
          clientTools[name] = (params: unknown) => tool.handler(params as Record<string, unknown>);
        }

        // Start conversation with signed URL and tools
        await conversation.startSession({
          signedUrl,
          clientTools,
          overrides,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to start session'
        );
        setStatus('error');
      }
    },
    [pageType, agentSlug, agencySlug, suburbSlug, agentData, agencyData, suburbData, conversation]
  );

  // Mode change listener (must be after startSessionInternal is defined)
  useEffect(() => {
    const handleModeChange = (e: CustomEvent<{ mode: VoiceMode; slug: string }>) => {
      const { mode } = e.detail;

      conversation.endSession().then(() => {
        setVoiceMode(mode);
        // Small delay to allow state update
        setTimeout(() => {
          startSessionInternal(mode);
        }, 100);
      });
    };

    window.addEventListener(
      'voice-mode-change',
      handleModeChange as EventListener
    );
    return () => {
      window.removeEventListener(
        'voice-mode-change',
        handleModeChange as EventListener
      );
    };
  }, [conversation, startSessionInternal]);

  const startSession = useCallback(async () => {
    await startSessionInternal(voiceMode);
  }, [startSessionInternal, voiceMode]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
    setStatus('idle');
  }, [conversation]);

  const contextValue: VoiceContextValue = {
    status,
    voiceMode,
    pageType,
    setVoiceMode,
    startSession,
    endSession,
    entityInfo,
    setEntityInfo,
  };

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
          onStart={startSession}
          onEnd={endSession}
        />
      </div>
    </VoiceContext.Provider>
  );
}
