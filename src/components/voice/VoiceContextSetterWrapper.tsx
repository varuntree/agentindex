'use client';

import dynamic from 'next/dynamic';

const VoiceContextSetter = dynamic(
  () => import('./VoiceContextSetter').then((mod) => mod.VoiceContextSetter),
  { ssr: false }
);

interface VoiceContextSetterWrapperProps {
  name: string;
  assistantLabel?: string;
}

export function VoiceContextSetterWrapper({ name, assistantLabel }: VoiceContextSetterWrapperProps) {
  return <VoiceContextSetter name={name} assistantLabel={assistantLabel} />;
}
