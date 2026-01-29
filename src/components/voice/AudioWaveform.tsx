'use client';

interface AudioWaveformProps {
  isSpeaking: boolean;
}

/**
 * Audio waveform visualization for voice conversations
 * Uses CSS animations defined in globals.css
 */
export function AudioWaveform({ isSpeaking }: AudioWaveformProps) {
  return (
    <div className="flex items-center gap-1 h-6" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${
            isSpeaking ? 'bg-blue-500 animate-wave' : 'bg-green-500 h-2'
          }`}
        />
      ))}
    </div>
  );
}
