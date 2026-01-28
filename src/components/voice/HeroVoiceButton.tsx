'use client';

import { Mic } from 'lucide-react';
import { useVoice } from './VoiceProvider';
import { Button } from '@/components/ui/button';

export function HeroVoiceButton() {
  const { startSession, status } = useVoice();

  const handleClick = () => {
    if (status === 'idle') {
      startSession();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={status !== 'idle'}
      variant="secondary"
      className="mt-4 inline-flex items-center gap-2"
    >
      <Mic className="w-4 h-4" />
      <span>Ask me to find an agent</span>
    </Button>
  );
}
