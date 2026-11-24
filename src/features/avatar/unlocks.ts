/**
 * Earned avatar frames. Some frames unlock by doing things the app already remembers: finishing
 * cozy stories, finding story adventure endings, or completing game levels. Each frame shows a
 * counter ("2 of 3 stories") until it is unlocked. Nothing here is a score, a streak or a timer:
 * counts only ever go up, and a frame, once earned, is yours.
 */
import { derived, get } from 'svelte/store';
import { getSettings, updateSettings } from '../../core/settings';
import { toast } from '../../core/feedback';
import { gamesProgress, type GamesProgress } from '../minigames/progress';
import { storyProgress, type StoryProgress } from '../stories/progress';
import { FRAMES, type FrameDef, type UnlockKind } from './frames';
import { openAvatarEditor } from './state';

export interface Counts {
  /** Cozy stories read to the end. */
  stories: number;
  /** Different adventure endings found. */
  endings: number;
  /** Game levels completed (each level counts once, however often it is played). */
  levels: number;
}

export function countProgress(s: Pick<StoryProgress, 'stories' | 'adventures'>, g: Pick<GamesProgress, 'played'>): Counts {
  const stories = Object.values(s.stories ?? {}).filter((p) => p?.finished).length;
  const endings = Object.values(s.adventures ?? {}).reduce((n, a) => n + (Array.isArray(a?.endings) ? a.endings.length : 0), 0);
  let levels = 0;
  for (const game of Object.values(g.played ?? {})) levels += Object.values(game).filter((n) => n > 0).length;
  return { stories, endings, levels };
}

export const KIND_LABEL: Record<UnlockKind, { task: (n: number) => string; unit: string; total: string }> = {
  stories: { task: (n) => `Finish ${n} ${n === 1 ? 'story' : 'stories'}`, unit: 'stories', total: 'Stories finished' },
  endings: { task: (n) => `Find ${n} adventure ${n === 1 ? 'ending' : 'endings'}`, unit: 'endings', total: 'Adventure endings found' },
  levels: { task: (n) => `Complete ${n} game ${n === 1 ? 'level' : 'levels'}`, unit: 'levels', total: 'Game levels completed' }
};

export interface FrameStatus {
  id: string;
  unlocked: boolean;
  /** How many have been done, capped at what is needed. */
  have: number;
  need: number;
  /** "Finish 3 stories" */
  task: string;
  /** "1 of 3 stories" */
  counter: string;
  percent: number;
}

export function frameStatus(def: FrameDef, counts: Counts): FrameStatus {
  if (!def.unlock) return { id: def.id, unlocked: true, have: 0, need: 0, task: '', counter: '', percent: 100 };
  const { kind, need } = def.unlock;
  const have = Math.min(need, counts[kind]);
  return {
    id: def.id,
    unlocked: counts[kind] >= need,
    have,
    need,
    task: KIND_LABEL[kind].task(need),
    counter: `${have} of ${need} ${KIND_LABEL[kind].unit}`,
    percent: Math.round((have / need) * 100)
  };
}

export const unlockedFrameIds = (counts: Counts): string[] => FRAMES.filter((f) => frameStatus(f, counts).unlocked).map((f) => f.id);

/** The running counts, kept up to date as stories and games are finished. */
export const counts = derived([storyProgress, gamesProgress], ([s, g]) => countProgress(s, g));

/**
 * Starts watching for newly earned frames and says so, once each. The very first time it runs it
 * only notes what is already earned, so someone who has played for a long time is not greeted by a
 * pile of messages.
 */
export function startFrameUnlockWatcher(): () => void {
  return counts.subscribe((c) => {
    const ids = unlockedFrameIds(c);
    const seen = getSettings().avatarFramesSeen;
    if (seen === null) {
      updateSettings({ avatarFramesSeen: ids });
      return;
    }
    const fresh = ids.filter((id) => !seen.includes(id));
    if (!fresh.length) return;
    updateSettings({ avatarFramesSeen: [...seen, ...fresh] });
    const names = fresh.map((id) => FRAMES.find((f) => f.id === id)?.label ?? id);
    const text = names.length === 1 ? `New avatar frame unlocked: ${names[0]}` : `${names.length} new avatar frames unlocked: ${names.join(', ')}`;
    toast(text, 'success', 8000, { label: 'See frames', run: () => openAvatarEditor('frame') });
  });
}

/** For tests and for reading the counts once. */
export const currentCounts = (): Counts => get(counts);
