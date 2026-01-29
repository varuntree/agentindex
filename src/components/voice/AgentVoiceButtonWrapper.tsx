'use client';

import dynamic from 'next/dynamic';

const AgentVoiceButton = dynamic(
  () => import('./AgentVoiceButton').then((mod) => mod.AgentVoiceButton),
  { ssr: false }
);

interface AgentVoiceButtonWrapperProps {
  agentFirstName: string;
}

export function AgentVoiceButtonWrapper({ agentFirstName }: AgentVoiceButtonWrapperProps) {
  return <AgentVoiceButton agentFirstName={agentFirstName} />;
}

