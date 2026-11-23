// Mood presets: one tap that changes how the app *feels* without changing how it looks.
// Pure data, so the audio engine and the ambient scenery can both read it (and tests can check it).
import type { Mood, MusicMood } from './settings';

export interface MoodProfile {
  id: Mood;
  label: string;
  hint: string;
  /** Music track this mood plays, or null to use the track chosen in Audio settings. */
  music: MusicMood | null;
  /** Multiplies the loudness of sound effects (lower = softer). */
  softness: number;
  /** Multiplies the low-pass cut-off of effects (lower = rounder, warmer). */
  warmth: number;
  /** Multiplies how much room echo sounds get. */
  reverb: number;
  /** Speed of drifting clouds and bubbles (1 = as before). */
  ambientSpeed: number;
}

export const MOOD_PROFILES: Record<Mood, MoodProfile> = {
  default: { id: 'default', label: 'Default', hint: 'The app as it has always been.', music: null, softness: 1, warmth: 1, reverb: 1, ambientSpeed: 1 },
  relaxed: { id: 'relaxed', label: 'Relaxed', hint: 'Slower drifting clouds, softer sounds and gentle morning music.', music: 'morning', softness: 0.85, warmth: 0.9, reverb: 1.1, ambientSpeed: 0.7 },
  chill: { id: 'chill', label: 'Chill', hint: 'Even softer sounds, calm rain-like music and very slow motion.', music: 'rain', softness: 0.7, warmth: 0.8, reverb: 1.2, ambientSpeed: 0.5 },
  cozy: { id: 'cozy', label: 'Cozy', hint: 'Warm, rounded sounds and a quiet garden melody.', music: 'garden', softness: 0.85, warmth: 0.75, reverb: 1, ambientSpeed: 0.8 },
  dreamy: { id: 'dreamy', label: 'Dreamy', hint: 'Floaty, shimmering music and the slowest clouds.', music: 'night', softness: 0.8, warmth: 0.85, reverb: 1.5, ambientSpeed: 0.4 }
};

export const moodProfile = (m: Mood): MoodProfile => MOOD_PROFILES[m] ?? MOOD_PROFILES.default;

/** Which music track plays: the mood's own, or the one picked in Settings. */
export function effectiveMusic(mood: Mood, chosen: MusicMood): MusicMood {
  return moodProfile(mood).music ?? chosen;
}
