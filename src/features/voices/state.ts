import { writable } from 'svelte/store';
import { getSettings, updateSettings } from '../../core/settings';
import { resolveSpeakers, type CastMember, type SavedVoice, type Speaker } from './casts';
import { modelStatus } from './model';

/** Whether the voices can be used at all: the shared files and at least one speech model (null until looked at). */
export const modelReady = writable<boolean | null>(null);
/** Which of the two speech models are on this computer. */
export const modelTiers = writable<{ standard: boolean; fast: boolean }>({ standard: false, fast: false });

export async function refreshModel(): Promise<boolean> {
  let ok = false;
  try {
    const s = await modelStatus();
    ok = s.installed;
    modelTiers.set({ standard: s.standard, fast: s.fast });
  } catch {
    ok = false;
    modelTiers.set({ standard: false, fast: false });
  }
  modelReady.set(ok);
  return ok;
}

/** The window for choosing voices for one story. Mounted once, in the app shell. */
export interface VoicesTarget {
  storyId: string;
  title: string;
  cast: CastMember[] | undefined;
}
export const voicesPanel = writable<VoicesTarget | null>(null);
export const openVoices = (t: VoicesTarget) => voicesPanel.set(t);
export const closeVoices = () => voicesPanel.set(null);

/** Everyone who speaks in a story, with the voice and speed they have right now. */
export function speakersFor(storyId: string, cast: CastMember[] | undefined): Speaker[] {
  const s = getSettings();
  return resolveSpeakers(cast, s.voiceCasts[storyId], { voice: s.voiceNarrator, speed: s.voiceNarratorSpeed });
}

/** Remembers a choice for one character of one story. Saved at once; nothing to press. */
export function saveVoice(storyId: string, speakerId: string, v: SavedVoice) {
  const all = getSettings().voiceCasts;
  updateSettings({ voiceCasts: { ...all, [storyId]: { ...(all[storyId] ?? {}), [speakerId]: v } } });
}

/** Forgets the choices made for one story, so the suggested voices come back. */
export function resetVoices(storyId: string) {
  const { [storyId]: _gone, ...rest } = getSettings().voiceCasts;
  updateSettings({ voiceCasts: rest });
}
