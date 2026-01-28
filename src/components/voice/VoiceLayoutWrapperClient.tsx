'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const VoiceLayoutWrapper = dynamic(
  () => import('./VoiceLayoutWrapper').then((mod) => mod.VoiceLayoutWrapper),
  { ssr: false }
);

interface VoiceLayoutWrapperClientProps {
  children: ReactNode;
}

/**
 * Dynamically imported VoiceLayoutWrapper to avoid SSR issues
 * with @elevenlabs/react which requires browser APIs.
 */
export function VoiceLayoutWrapperClient({ children }: VoiceLayoutWrapperClientProps) {
  return <VoiceLayoutWrapper>{children}</VoiceLayoutWrapper>;
}
