'use client';

import dynamic from 'next/dynamic';

const HeroVoiceButton = dynamic(
  () => import('./HeroVoiceButton').then((mod) => mod.HeroVoiceButton),
  { ssr: false }
);

export function HeroVoiceButtonWrapper() {
  return <HeroVoiceButton />;
}
