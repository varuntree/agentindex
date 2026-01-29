'use client';

interface AudioWaveformProps {
  isSpeaking: boolean;
  audioLevel?: number; // 0-1 normalized audio level from mic
}

// Bar height multipliers for visual variation
const BAR_MULTIPLIERS = [0.6, 0.8, 1.0, 0.8, 0.6];
const MIN_HEIGHT = 4; // Minimum bar height in px
const MAX_HEIGHT = 24; // Maximum bar height in px

/**
 * Audio waveform visualization for voice conversations
 * - Listening: Bars react to real microphone audio level
 * - Speaking: CSS animation (agent responding)
 */
export function AudioWaveform({ isSpeaking, audioLevel = 0 }: AudioWaveformProps) {
  return (
    <div className="flex items-center gap-1 h-6" aria-hidden="true">
      {BAR_MULTIPLIERS.map((multiplier, i) => {
        if (isSpeaking) {
          // AI speaking: use CSS animation
          return (
            <div
              key={i}
              className="w-1 rounded-full bg-blue-500 animate-wave"
            />
          );
        }
        // User listening: react to real audio level
        const height = MIN_HEIGHT + audioLevel * (MAX_HEIGHT - MIN_HEIGHT) * multiplier;
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-green-500 transition-all duration-75"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
