/**
 * The list of mini-games shown on the Games page. Adding a game means adding one
 * entry here (plus its screen); its levels come from the content manifests as usual.
 */
import type { Catalog, Located } from '../../core/content/registry';
import type { Route } from '../../core/router';
import breakerCover from './covers/breaker.svg';
import memoryCover from './covers/memory.svg';
import puzzleCover from './covers/puzzle.svg';
import splashCover from './covers/splash.svg';
import bubblesCover from './covers/bubbles.svg';
import catcherCover from './covers/catcher.svg';
import zenCover from './covers/zen.svg';
import flowCover from './covers/flow.svg';

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
  },
  {
    id: 'bubbles',
    title: 'Bubble Garden',
    blurb: 'Soft bubbles float by. Pop them, merge matching colors, or just watch. No timer, no score to reach.',
    tagline: 'Pop and drift',
    icon: 'sparkle',
    cover: bubblesCover,
    accent: '#7fcfe0',
    levels: (c) => c.bubbleLevels,
    open: (levelId) => ({ name: 'bubbles', levelId, mode: 'relax' }),
    modes: [
      { label: 'Relax', variant: 'mint', open: (c) => ({ name: 'bubbles', mode: 'relax', levelId: c.bubbleLevels[0]?.manifest.id }) },
      { label: 'Color Match', variant: 'soft', open: (c) => ({ name: 'bubbles', mode: 'match', levelId: c.bubbleLevels[0]?.manifest.id }) },
      { label: 'Endless', variant: 'peach', open: (c) => ({ name: 'bubbles', mode: 'endless', levelId: c.bubbleLevels[0]?.manifest.id }) }
    ]
  },
  {
    id: 'catcher',
    title: 'Cloud Catcher',
    blurb: 'Clouds, stars and moons drift across the sky. Guide them gently into their matching zones.',
    tagline: 'Catch the sky',
    icon: 'cloud',
    cover: catcherCover,
    accent: '#a9c8f0',
    levels: (c) => c.catcherLevels,
    open: (levelId) => ({ name: 'catcher', levelId, mode: 'relax' }),
    modes: [
      { label: 'Relax', variant: 'mint', open: (c) => ({ name: 'catcher', mode: 'relax', levelId: c.catcherLevels[0]?.manifest.id }) },
      { label: 'Color Match', variant: 'soft', open: (c) => ({ name: 'catcher', mode: 'match', levelId: c.catcherLevels[0]?.manifest.id }) },
      { label: 'Pattern', variant: 'soft', open: (c) => ({ name: 'catcher', mode: 'pattern', levelId: c.catcherLevels[0]?.manifest.id }) },
      { label: 'Endless', variant: 'peach', open: (c) => ({ name: 'catcher', mode: 'endless', levelId: c.catcherLevels[0]?.manifest.id }) }
    ]
  },
  {
    id: 'zen',
    title: 'Zen Garden',
    blurb: 'Rake patterns in the sand, place stones, plants and flowers, and relax. It saves itself.',
    tagline: 'Rake and place',
    icon: 'flower',
    cover: zenCover,
    accent: '#e0c48a',
    levels: (c) => c.zenLevels,
    open: (levelId) => ({ name: 'zen', levelId }),
    modes: [{ label: 'My gardens', variant: 'mint', open: () => ({ name: 'zen' }) }]
  },
  {
    id: 'flow',
    title: 'Paint Flow',
    blurb: 'Join matching dots with smooth paths of color. Gentle boards, free hints and unlimited undo.',
    tagline: 'Connect the colors',
    icon: 'brush',
    cover: flowCover,
    accent: '#f49bbd',
    levels: (c) => c.flowLevels,
    open: (levelId) => ({ name: 'flow', levelId, mode: 'puzzle' }),
    modes: [
      { label: 'Puzzle', variant: 'mint', open: (c) => ({ name: 'flow', mode: 'puzzle', levelId: c.flowLevels[0]?.manifest.id }) },
      { label: 'Relax', variant: 'soft', open: (c) => ({ name: 'flow', mode: 'relax', levelId: c.flowLevels[0]?.manifest.id }) },
      { label: 'Free Flow', variant: 'peach', open: (c) => ({ name: 'flow', mode: 'free', levelId: c.flowLevels[0]?.manifest.id }) }
    ]
  }
];

export const gameById = (id: string | undefined) => GAMES.find((g) => g.id === id);
