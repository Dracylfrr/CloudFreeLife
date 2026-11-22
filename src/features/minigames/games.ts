/**
 * The list of mini-games shown on the Mini-Games page. Adding a game means adding one
 * entry here (plus its screen); its levels come from the content manifests as usual.
 */
import type { Catalog, Located } from '../../core/content/registry';
import type { Route } from '../../core/router';
import breakerCover from './covers/breaker.svg';
import memoryCover from './covers/memory.svg';
import puzzleCover from './covers/puzzle.svg';
import splashCover from './covers/splash.svg';

export interface GameLevel extends Located {
  manifest: { id: string; name: string; description: string; objective: string; thumbnail: string };
}

export interface GameDef {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  cover: string;
  accent: string;
  /** what the player does, in a few words, for the card */
  tagline: string;
  levels: (c: Catalog) => GameLevel[];
  open: (levelId?: string) => Route;
  /** optional extra start buttons on the level page (e.g. Pastel Breaker's modes) */
  modes?: { label: string; variant: 'mint' | 'soft' | 'peach'; open: (c: Catalog) => Route }[];
}

export const GAMES: GameDef[] = [
  {
    id: 'breaker',
    title: 'Pastel Breaker',
    blurb: 'Bounce the ball and pop soft pastel blocks into bubbles and stars.',
    tagline: 'Pop the blocks',
    icon: 'grid',
    cover: breakerCover,
    accent: '#a698e0',
    levels: (c) => c.breakerLevels,
    open: (levelId) => ({ name: 'breaker', levelId, mode: 'relax' }),
    modes: [
      { label: 'Relax', variant: 'mint', open: (c) => ({ name: 'breaker', mode: 'relax', levelId: c.breakerLevels[0]?.manifest.id }) },
      { label: 'Classic', variant: 'soft', open: (c) => ({ name: 'breaker', mode: 'classic', levelId: c.breakerLevels[0]?.manifest.id }) },
      { label: 'Endless', variant: 'peach', open: () => ({ name: 'breaker', mode: 'endless' }) }
    ]
  },
  {
    id: 'splash',
    title: 'Splash Wall',
    blurb: 'Aim, charge and throw cartoon water balloons to splash color across illustrated walls.',
    tagline: 'Splash the walls',
    icon: 'paintball',
    cover: splashCover,
    accent: '#f49bbd',
    levels: (c) => c.splashLevels,
    open: (levelId) => ({ name: 'splash', levelId })
  },
  {
    id: 'memory',
    title: 'Memory Meadow',
    blurb: 'Flip soft pastel cards and find the pairs. No timer, no lives, and a hint whenever you like.',
    tagline: 'Find the pairs',
    icon: 'heart',
    cover: memoryCover,
    accent: '#8ed2b2',
    levels: (c) => c.memoryLevels,
    open: (levelId) => ({ name: 'memory', levelId })
  },
  {
    id: 'puzzle',
    title: 'Pastel Puzzle',
    blurb: 'A finished picture is scrambled into pieces. Swap them back, one pair at a time.',
    tagline: 'Rebuild the picture',
    icon: 'image',
    cover: puzzleCover,
    accent: '#86c3ea',
    levels: (c) => c.puzzleLevels,
    open: (levelId) => ({ name: 'puzzle', levelId })
  }
];

export const gameById = (id: string | undefined) => GAMES.find((g) => g.id === id);
