'use client';

import { Mic } from 'lucide-react';
import type { VoiceMode } from '@/lib/voice/types';

interface VoiceButtonProps {
  voiceMode: VoiceMode;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Floating voice button with pulse animation
 */
export function VoiceButton({ voiceMode, onClick, disabled }: VoiceButtonProps) {
  const label = voiceMode === 'navigator' ? 'Talk to Navigator' : 'Talk to Assistant';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      aria-label={label}
    >
      {/* Pulse animation ring */}
      <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-25" />
      <Mic className="w-6 h-6 relative z-10" />
      <span className="font-medium relative z-10">{label}</span>
    </button>
  );
}
