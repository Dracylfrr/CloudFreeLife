/**
 * A short sample of every voice that comes with the app, so a voice can be heard before anything is downloaded.
 * They are small files made once; no speech is made on this computer.
 */
import { get, writable } from 'svelte/store';
import { getSettings } from '../../core/settings';
import type { Voice } from './casts';
import { stopListening } from './player';

/** What each sample says (kept in step with the recordings in public/voices/samples). */
export const sampleUrl = (v: Pick<Voice, 'pack'>) => `${import.meta.env.BASE_URL}voices/samples/${v.pack}.opus`;

/** The voice being heard right now, or null. */
export const samplePlaying = writable<string | null>(null);
let audio: HTMLAudioElement | null = null;

export function stopSample() {
  if (audio) {
    audio.onended = audio.onerror = null;
    audio.pause();
    audio = null;
  }
  samplePlaying.set(null);
}

/** Plays a voice's sample. Resolves when it has finished (or false if it could not be played). */
export async function playSample(v: Voice): Promise<boolean> {
  stopListening();
  if (get(samplePlaying) === v.id) {
    stopSample();
    return true;
  }
  stopSample();
  const a = new Audio(sampleUrl(v));
  const s = getSettings();
  a.volume = s.muted ? 0 : Math.min(1, Math.max(0.05, s.volumeMaster + 0.2));
  audio = a;
  samplePlaying.set(v.id);
  return new Promise<boolean>((resolve) => {
    a.onended = () => {
      if (audio === a) stopSample();
      resolve(true);
    };
    a.onerror = () => {
      if (audio === a) stopSample();
      resolve(false);
    };
    a.play().catch(() => {
      if (audio === a) stopSample();
      resolve(false);
    });
  });
}
