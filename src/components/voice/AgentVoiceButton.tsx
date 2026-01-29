'use client';

import { MessageCircle } from 'lucide-react';
import { useVoice } from './VoiceProvider';
import { Button } from '@/components/ui/button';

interface AgentVoiceButtonProps {
  agentFirstName: string;
}

export function AgentVoiceButton({ agentFirstName }: AgentVoiceButtonProps) {
  const { startSession, status } = useVoice();

  const handleClick = () => {
    if (status === 'idle') {
      startSession('assistant');
    }
  };

  return (
    <Button onClick={handleClick} disabled={status !== 'idle'} variant="primary" size="sm">
      <MessageCircle className="w-4 h-4 mr-1.5" />
      Talk to {agentFirstName}&apos;s Assistant
    </Button>
  );
}

