'use client';

import { Mic, Volume2, X, Loader, AlertCircle } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import type { VoiceStatus, VoiceMode, PageType, VoiceEntityInfo } from '@/lib/voice/types';

interface VoicePanelProps {
  status: VoiceStatus;
  isSpeaking: boolean;
  error: string | null;
  voiceMode: VoiceMode;
  pageType: PageType;
  entityInfo: VoiceEntityInfo | null;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * Build assistant button label based on page type and entity info
 */
function getAssistantLabel(pageType: PageType, entityInfo: VoiceEntityInfo | null): string {
  // Use custom label if provided
  if (entityInfo?.assistantLabel) {
    return entityInfo.assistantLabel;
  }

  // Build default label from entity name and page type
  if (entityInfo?.name) {
    switch (pageType) {
      case 'agent':
        return `Talk to ${entityInfo.name.split(' ')[0]}'s Assistant`;
      case 'agency':
        return `Talk to ${entityInfo.name} Receptionist`;
      case 'suburb':
        return `${entityInfo.name} Local Expert`;
      default:
        return 'Talk to Assistant';
    }
  }

  // Fallback labels when no entity info
  switch (pageType) {
    case 'agent':
      return "Talk to Agent's Assistant";
    case 'agency':
      return 'Talk to Receptionist';
    case 'suburb':
      return 'Talk to Local Expert';
    default:
      return 'Talk to Assistant';
  }
}

/**
 * Voice panel showing connection states and controls
 */
export function VoicePanel({
  status,
  isSpeaking,
  error,
  voiceMode,
  pageType,
  entityInfo,
  onStart,
  onEnd,
}: VoicePanelProps) {
  const buttonLabel =
    voiceMode === 'navigator'
      ? 'Talk to Navigator'
      : getAssistantLabel(pageType, entityInfo);

  // Idle state - show floating button
  if (status === 'idle') {
    return (
      <button
        onClick={onStart}
        className="relative flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        aria-label={buttonLabel}
      >
        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-25" />
        <Mic className="w-6 h-6 relative z-10" />
        <span className="font-medium relative z-10">{buttonLabel}</span>
      </button>
    );
  }

  // Connecting state
  if (status === 'connecting') {
    return (
      <div className="bg-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 border-2 border-black">
        <Loader className="w-6 h-6 animate-spin text-primary" />
        <span className="font-medium">Connecting...</span>
      </div>
    );
  }

  // Connected state
  if (status === 'connected') {
    return (
      <div className="bg-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 border-2 border-black">
        <div
          className={`w-8 h-8 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-primary'} flex items-center justify-center`}
        >
          {isSpeaking ? (
            <Volume2 className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </div>
        <AudioWaveform isSpeaking={isSpeaking} />
        <span className="font-medium min-w-[90px]">
          {isSpeaking ? 'Speaking...' : 'Listening...'}
        </span>
        <button
          onClick={onEnd}
          className="ml-2 p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="End conversation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="bg-red-50 border-2 border-red-200 px-6 py-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 mb-2">
              {error || 'Connection failed'}
            </p>
            <button
              onClick={onStart}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
