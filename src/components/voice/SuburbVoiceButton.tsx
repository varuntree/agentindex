'use client';

import { Mic } from 'lucide-react';
import { useVoice } from './VoiceProvider';
import { Button } from '@/components/ui/button';

interface SuburbVoiceButtonProps {
  suburbName: string;
}

export function SuburbVoiceButton({ suburbName }: SuburbVoiceButtonProps) {
  const { startSession, status } = useVoice();

  const handleClick = () => {
    if (status === 'idle') {
      startSession('assistant');
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={status !== 'idle'}
      variant="secondary"
      className="inline-flex items-center gap-2"
    >
      <Mic className="w-4 h-4" />
      <span>Help me find an agent in {suburbName}</span>
    </Button>
  );
}
