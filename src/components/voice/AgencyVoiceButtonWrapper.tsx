'use client';

import dynamic from 'next/dynamic';

const AgencyVoiceButton = dynamic(
  () => import('./AgencyVoiceButton').then((mod) => mod.AgencyVoiceButton),
  { ssr: false }
);

interface AgencyVoiceButtonWrapperProps {
  agencyName: string;
}

export function AgencyVoiceButtonWrapper({ agencyName }: AgencyVoiceButtonWrapperProps) {
  return <AgencyVoiceButton agencyName={agencyName} />;
}
