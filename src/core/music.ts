// Background music is composed from data: each track is a gentle chord progression, a soft pad
// that glides between the chords, a few bell notes and little "bloops" (soft bubbles that
// rise a touch in pitch) picked from a pentatonic scale.
// It never repeats exactly, uses no audio files (zero download size), and is deliberately quiet.
import type { MusicMood } from './settings';

export interface MusicDef {
  id: MusicMood;
  label: string;
  blurb: string;
  /** Root note of the key, in Hz. */
  root: number;
  /** Chords as semitone offsets from the root; the pad plays them one octave up. */
  chords: number[][];
  /** Seconds each chord lasts. */
  chordSeconds: number;
  /** Notes (semitones from root) the bells may play. */
  scale: number[];
  /** Average bell notes per chord. */
  bells: number;
  /** Pad low-pass cut-off in Hz: lower is softer. */
  padCutoff: number;
  /** Pad level (0..1, before the music volume). */
  pad: number;
  /** Bell level. */
  bell: number;
  /** 0..1: how much room echo the bells get. */
  wet: number;
  /** Average soft bubble notes per chord (they come in little runs of two to four). */
  bubbles: number;
  /** Bubble level. */
  bubble: number;
  /** Gentle rain layer under the music. */
  rain?: boolean;
}

export const MUSIC: Record<MusicMood, MusicDef> = {
  morning: {
    id: 'morning',
    label: 'Soft Morning',
    blurb: 'Soft, bright and bubbly.',
    root: 130.81, // C3
    chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 16]],
    chordSeconds: 10,
    scale: [12, 14, 16, 19, 21, 24, 26],
    bells: 2.4,
    padCutoff: 900,
    pad: 0.05,
    bell: 0.05,
    wet: 0.55,
    bubbles: 9,
    bubble: 0.042
  },
  garden: {
    id: 'garden',
    label: 'Quiet Garden',
    blurb: 'Warm and rounded, with a few little bubbles.',
    root: 146.83, // D3
    chords: [[0, 4, 7, 11], [-5, -1, 2, 6], [-3, 0, 4, 7], [2, 5, 9, 12]],
    chordSeconds: 11,
    scale: [12, 14, 16, 19, 21, 24],
    bells: 2.2,
    padCutoff: 760,
    pad: 0.052,
    bell: 0.046,
    wet: 0.5,
    bubbles: 6,
    bubble: 0.038
  },
  rain: {
    id: 'rain',
    label: 'Rain Pause',
    blurb: 'Slow chords under soft rain, with drip-like bubbles.',
    root: 110, // A2
    chords: [[0, 3, 7, 10, 14], [-4, 0, 3, 7], [3, 7, 10, 14], [-5, -2, 2, 5]],
    chordSeconds: 12,
    scale: [12, 15, 17, 19, 22, 24],
    bells: 1.6,
    padCutoff: 640,
    pad: 0.048,
    bell: 0.04,
    wet: 0.65,
    bubbles: 4,
    bubble: 0.034,
    rain: true
  },
  night: {
    id: 'night',
    label: 'Starry Night',
    blurb: 'Spacious and low, with distant bells and a few quiet bubbles.',
    root: 146.83, // D3
    chords: [[0, 3, 7, 10, 14], [-4, 0, 3, 7], [-7, -4, 0, 3, 7], [-5, -2, 2, 5]],
    chordSeconds: 14,
    scale: [12, 15, 19, 22, 24],
    bells: 1.2,
    padCutoff: 560,
    pad: 0.05,
    bell: 0.036,
    wet: 0.75,
    bubbles: 3,
    bubble: 0.03
  }
};

export const musicDef = (m: MusicMood): MusicDef => MUSIC[m] ?? MUSIC.morning;

/** Frequency of a note `semis` semitones above `root`. */
/** A bubble note starts at its pitch and rises by this factor in a split second. */
export const BUBBLE_RISE = 1.16;

export const noteHz = (root: number, semis: number) => root * Math.pow(2, semis / 12);

/** Every pitch a track can ever play, for tests and safety checks. */
export function allPitches(def: MusicDef): number[] {
  const out: number[] = [];
  for (const chord of def.chords) for (const s of chord) out.push(noteHz(def.root, s + 12), noteHz(def.root, s));
  for (const s of def.scale) out.push(noteHz(def.root, s), noteHz(def.root, s + 12) * BUBBLE_RISE);
  return out;
}
