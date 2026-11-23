/**
 * The small, pure rules behind a meditation session: which part of the breath we are in,
 * which gentle prompt is showing, and how to say the time. No timers and no UI in here,
 * so every rule can be tested.
 */
import type { MeditationBreath, MeditationCue } from '../../core/manifests14';

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export interface BreathState {
  phase: BreathPhase;
  /** 0..1 through the current phase. */
  progress: number;
  /** Seconds left in the current phase. */
  phaseLeft: number;
  /** Length of the current phase in seconds. */
  phaseLength: number;
  /** Which breath we are on, starting at 0. */
  cycle: number;
  /** Size of the breathing cloud: 0 (small) to 1 (large). */
  size: number;
}

export const cycleLength = (b: MeditationBreath) => b.inhale + b.hold + b.exhale + b.rest;

/** Where in the breath are we after `t` seconds? */
export function breathAt(t: number, b: MeditationBreath): BreathState {
  const total = cycleLength(b);
  const time = Math.max(0, t);
  const cycle = Math.floor(time / total);
  let x = time - cycle * total;
  const parts: [BreathPhase, number][] = [
    ['inhale', b.inhale],
    ['hold', b.hold],
    ['exhale', b.exhale],
    ['rest', b.rest]
  ];
  for (const [phase, len] of parts) {
    if (len <= 0) continue;
    if (x < len) {
      const progress = x / len;
      const ease = (p: number) => p * p * (3 - 2 * p); // smoothstep: soft at both ends
      const size = phase === 'inhale' ? ease(progress) : phase === 'hold' ? 1 : phase === 'exhale' ? 1 - ease(progress) : 0;
      return { phase, progress, phaseLeft: len - x, phaseLength: len, cycle, size };
    }
    x -= len;
  }
  return { phase: 'rest', progress: 1, phaseLeft: 0, phaseLength: 0, cycle, size: 0 };
}

export const PHASE_WORDS: Record<BreathPhase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold gently',
  exhale: 'Breathe out',
  rest: 'Rest'
};

/** The prompt to show at time `t`: the latest cue that has started and is still fresh (or null). */
export function cueAt(t: number, cues: MeditationCue[], showSeconds = 9): string | null {
  let current: MeditationCue | null = null;
  for (const c of cues) if (c.at <= t) current = c;
  if (!current) return null;
  return t - current.at <= showSeconds ? current.text : null;
}

/** "3:05" style time; never negative. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Plain-language label for a timer length. */
export function minutesLabel(m: number): string {
  return m === 1 ? '1 minute' : `${m} minutes`;
}
