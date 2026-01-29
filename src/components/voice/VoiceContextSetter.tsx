'use client';

import { useEffect } from 'react';
import { useVoice } from './VoiceProvider';
import type { VoiceEntityInfo } from '@/lib/voice/types';

interface VoiceContextSetterProps {
  /** Entity name (agent name, agency name, suburb name) */
  name: string;
  /** Optional custom label for the assistant button */
  assistantLabel?: string;
}

/**
 * Sets voice context for the current page.
 * Include this component on agent/agency/suburb pages to personalize the voice button label.
 *
 * @example
 * // In agent page:
 * <VoiceContextSetter name={agent.fullName} />
 *
 * // In agency page:
 * <VoiceContextSetter name={agency.name} />
 *
 * // In suburb page:
 * <VoiceContextSetter name={suburb.name} />
 */
export function VoiceContextSetter({ name, assistantLabel }: VoiceContextSetterProps) {
  const { setEntityInfo } = useVoice();

  useEffect(() => {
    const info: VoiceEntityInfo = { name };
    if (assistantLabel) {
      info.assistant_label = assistantLabel;
    }
    setEntityInfo(info);

    // Clear on unmount (when navigating away)
    return () => {
      setEntityInfo(null);
    };
  }, [name, assistantLabel, setEntityInfo]);

  // This component renders nothing
  return null;
}
