/**
 * The Story Adventure engine: a tiny, pure state machine.
 *
 * A "run" is just the list of passages the reader has been through, ending at
 * the one they are reading now. Everything else (choices, whether the story is
 * over, going back) is derived from that list, which also makes it trivial to
 * save and restore.
 */
import type { AdventureManifest, AdventureNode } from '../../core/manifests';

export interface AdventureRun {
  /** Passage ids in the order they were read. The last one is the current passage. */
  path: string[];
}

export function startRun(adv: Pick<AdventureManifest, 'start'>): AdventureRun {
  return { path: [adv.start] };
}

export const currentId = (run: AdventureRun) => run.path[run.path.length - 1];

export function currentNode(adv: Pick<AdventureManifest, 'nodes'>, run: AdventureRun): AdventureNode | undefined {
  return adv.nodes[currentId(run)];
}

export const isEnding = (adv: Pick<AdventureManifest, 'nodes'>, run: AdventureRun) => !!currentNode(adv, run)?.ending;

/** Follows choice number `index`. Returns the same run if the choice does not exist. */
export function choose(adv: Pick<AdventureManifest, 'nodes'>, run: AdventureRun, index: number): AdventureRun {
  const choice = currentNode(adv, run)?.choices?.[index];
  if (!choice || !(choice.to in adv.nodes)) return run;
  return { path: [...run.path, choice.to] };
}

export const canGoBack = (run: AdventureRun) => run.path.length > 1;

/** One step back (undo the last choice). */
export function back(run: AdventureRun): AdventureRun {
  return canGoBack(run) ? { path: run.path.slice(0, -1) } : run;
}

/**
 * Turns saved data back into a usable run: unknown passages are dropped and the
 * path is cut at the first break, so content that changed between versions can
 * never leave the reader stranded.
 */
export function restoreRun(adv: Pick<AdventureManifest, 'start' | 'nodes'>, saved: unknown): AdventureRun {
  if (!Array.isArray(saved) || saved.length === 0 || saved[0] !== adv.start) return startRun(adv);
  const path: string[] = [adv.start];
  for (const id of saved.slice(1)) {
    const prev = adv.nodes[path[path.length - 1]];
    if (typeof id !== 'string' || !prev?.choices?.some((c) => c.to === id)) break;
    path.push(id);
  }
  return { path };
}

export interface EndingInfo {
  id: string;
  title: string;
  mood: string;
}

/** Every ending an adventure has, in the order they appear in the file. */
export function listEndings(adv: Pick<AdventureManifest, 'nodes'>): EndingInfo[] {
  return Object.entries(adv.nodes)
    .filter(([, n]) => n.ending)
    .map(([id, n]) => ({ id, title: n.ending!.title, mood: n.ending!.mood }));
}
