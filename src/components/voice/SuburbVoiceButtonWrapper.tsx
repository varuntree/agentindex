'use client';

import dynamic from 'next/dynamic';

const SuburbVoiceButton = dynamic(
  () => import('./SuburbVoiceButton').then((mod) => mod.SuburbVoiceButton),
  { ssr: false }
);

interface SuburbVoiceButtonWrapperProps {
  suburbName: string;
}

export function SuburbVoiceButtonWrapper({ suburbName }: SuburbVoiceButtonWrapperProps) {
  return <SuburbVoiceButton suburbName={suburbName} />;
}
