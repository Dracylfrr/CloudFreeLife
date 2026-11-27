import { readFileSync } from 'node:fs';
import { get } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import { BACKGROUNDS, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, PRESETS, SKIN_TONES, sameAvatar, sanitizeAvatar, shade } from '../src/features/avatar/avatar';
import { avatarSvg } from '../src/features/avatar/render';
import { BRAND_FULL, BRAND_NAME, BRAND_SUBTITLE, DREAM_WORDS } from '../src/core/brand';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';
import { brushKindFor } from '../src/core/audio';
import { SAVED_TOAST_MS, toast, toasts } from '../src/core/feedback';
import { ENDLESS_MAX_CARDS, MemoryGame, endlessColumns, endlessPairs, endlessSymbols } from '../src/features/minigames/memory/logic';
import { MEMORY_ICON_IDS } from '../src/core/manifests';
import { SORTS, sortSessions } from '../src/features/meditation/sort';
import { baseName } from '../src/features/painting/export';

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe('The name', () => {
  it('is Project D.R.E.A.M: Cloud Sonata with five action words', () => {
    expect(BRAND_NAME).toBe('Project D.R.E.A.M');
    expect(BRAND_SUBTITLE).toBe('Cloud Sonata');
    expect(BRAND_FULL).toBe('Project D.R.E.A.M: Cloud Sonata');
    expect([...DREAM_WORDS]).toEqual(['Draw', 'Relax', 'Explore', 'Adventure', 'Meditate']);
    expect(DREAM_WORDS.map((w) => w[0]).join('')).toBe('DREAM');
  });
  it('is shown in the window, the installer, the program and the data folder', () => {
    const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    expect(conf.app.windows[0].title).toBe(BRAND_FULL);
    expect(conf.productName).toBe(BRAND_NAME);
    expect(conf.mainBinaryName).toBe(BRAND_NAME);
    expect(conf.bundle.publisher).toBe(BRAND_NAME);
    expect(conf.identifier).toBe('app.cloudfreelife.desktop'); // never changes: the window and shortcut identity depend on it
    expect(readFileSync('src/core/config.ts', 'utf8')).toContain("DATA_DIR_NAME = 'Project D.R.E.A.M'");
    expect(readFileSync('src/core/config.ts', 'utf8')).toContain("LEGACY_DATA_DIR_NAME = 'Cloud-Freelife'");
    expect(readFileSync('index.html', 'utf8')).toContain(`<title>${BRAND_FULL}</title>`);
  });
});

describe('The avatar', () => {
  it('has no avatar until one is chosen', () => {
    expect(DEFAULT_SETTINGS.avatar).toBeNull();
    expect(sanitizeSettings({}).avatar).toBeNull();
    expect(sanitizeSettings({ avatar: 'girl' }).avatar).toBeNull();
    expect(sanitizeSettings({ avatar: [] }).avatar).toBeNull();
  });
  it('keeps a saved avatar and repairs bad parts of it', () => {
    const a = sanitizeSettings({ avatar: PRESETS.boy }).avatar!;
    expect(sameAvatar(a, PRESETS.boy)).toBe(true);
    const broken = sanitizeAvatar({ base: 'boy', skin: 'red', hair: '#ABCDEF', hairStyle: 'mohawk', eyes: 5, outfit: 'armor', outfitColor: '#fff', background: null })!;
    expect(broken.hair).toBe('#abcdef');
    expect(broken.skin).toBe(PRESETS.boy.skin);
    expect(broken.hairStyle).toBe(PRESETS.boy.hairStyle);
    expect(broken.eyes).toBe(PRESETS.boy.eyes);
    expect(broken.outfit).toBe(PRESETS.boy.outfit);
    expect(broken.outfitColor).toBe(PRESETS.boy.outfitColor);
    expect(broken.background).toBe(PRESETS.boy.background);
    expect(sanitizeAvatar({ base: 'robot' })!.base).toBe('girl');
  });
  it('offers plenty to customize', () => {
    expect(HAIR_STYLES.length).toBeGreaterThanOrEqual(6);
    expect([...OUTFITS]).toEqual(['tee', 'hoodie', 'dress', 'jacket']);
    for (const list of [SKIN_TONES, HAIR_COLORS, EYE_COLORS, OUTFIT_COLORS, BACKGROUNDS]) {
      expect(list.length).toBeGreaterThanOrEqual(6);
      expect(new Set(list.map((s) => s.color)).size).toBe(list.length);
      for (const s of list) expect(s.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it('draws every combination as valid-looking SVG that shows the chosen colors', () => {
    for (const base of ['girl', 'boy'] as const) {
      for (const hairStyle of HAIR_STYLES) {
        for (const outfit of OUTFITS) {
          const svg = avatarSvg({ ...PRESETS[base], hairStyle, outfit }, 'x');
          expect(svg.startsWith('<svg')).toBe(true);
          expect(svg.endsWith('</svg>')).toBe(true);
          expect(svg).toContain(PRESETS[base].skin);
          expect(svg).toContain(PRESETS[base].hair);
          expect(svg).toContain(shade(PRESETS[base].eyes, -0.35));
          expect(svg).not.toContain('undefined');
          expect(svg).not.toContain('NaN');
        }
      }
    }
  });
  it('keeps ids unique per picture', () => {
    expect(avatarSvg(PRESETS.girl, 'one')).toContain('clip-one');
    expect(avatarSvg(PRESETS.girl, 'two')).not.toContain('clip-one');
  });
  it('mixes colors toward black or white', () => {
    expect(shade('#808080', 1)).toBe('#ffffff');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#808080', 0)).toBe('#808080');
  });
});

describe('Memory endless mode', () => {
  it('starts small, grows by two pairs a round and stops at the biggest board', () => {
    expect(endlessPairs(1)).toBe(4);
    expect(endlessPairs(2)).toBe(6);
    expect(endlessPairs(5)).toBe(12);
    expect(endlessPairs(0)).toBe(4);
    expect(endlessPairs(10_000)).toBe(ENDLESS_MAX_CARDS / 2);
    for (let r = 1; r < 40; r++) expect(endlessPairs(r + 1)).toBeGreaterThanOrEqual(endlessPairs(r));
  });
  it('lays the cards out in at most ten columns, and at least four', () => {
    for (let r = 1; r < 40; r++) {
      const cols = endlessColumns(endlessPairs(r));
      expect(cols).toBeGreaterThanOrEqual(4);
      expect(cols).toBeLessThanOrEqual(10);
      expect(Math.ceil((endlessPairs(r) * 2) / cols)).toBeLessThanOrEqual(10);
    }
    expect(endlessColumns(ENDLESS_MAX_CARDS / 2)).toBe(10);
  });
  it('uses every picture once before repeating one', () => {
    const ids = MEMORY_ICON_IDS;
    const small = endlessSymbols(8, ids, seeded(3));
    expect(small).toHaveLength(8);
    expect(new Set(small).size).toBe(8);
    const big = endlessSymbols(50, ids, seeded(4));
    expect(big).toHaveLength(50);
    const counts = new Map<string, number>();
    for (const s of big) counts.set(s, (counts.get(s) ?? 0) + 1);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
    expect(endlessSymbols(0, ids, seeded())).toEqual([]);
    expect(endlessSymbols(5, [], seeded())).toEqual([]);
  });
  it('can be played to the end even when pictures repeat on a big board', () => {
    const symbols = endlessSymbols(40, MEMORY_ICON_IDS, seeded(9));
    const game = new MemoryGame(symbols, seeded(10));
    expect(game.cards).toHaveLength(80);
    for (const sym of new Set(symbols)) {
      // pair up every card of this picture, two at a time
      const idx = game.cards.map((c, i) => (c.symbol === sym && !c.matched ? i : -1)).filter((i) => i >= 0);
      for (let k = 0; k + 1 < idx.length; k += 2) {
        game.flip(idx[k]);
        expect(game.flip(idx[k + 1])).toBe('match');
      }
    }
    expect(game.complete).toBe(true);
  });
});

describe('Meditation sorting', () => {
  const mk = (id: string, minutes: number, kind = 'guided') => ({ id, manifest: { minutes, kind, name: id } });
  const list = [mk('a', 5), mk('t', 0, 'timer'), mk('b', 1), mk('c', 8), mk('d', 5)];
  it('keeps the suggested order as it is', () => {
    expect(sortSessions(list, 'suggested').map((s) => s.id)).toEqual(['a', 't', 'b', 'c', 'd']);
  });
  it('puts the shortest first, the silent timer last, and keeps ties in order', () => {
    expect(sortSessions(list, 'shortest').map((s) => s.id)).toEqual(['b', 'a', 'd', 'c', 't']);
  });
  it('puts the longest first, the silent timer still last', () => {
    expect(sortSessions(list, 'longest').map((s) => s.id)).toEqual(['c', 'a', 'd', 'b', 't']);
  });
  it('does not change the list it was given', () => {
    const copy = [...list];
    for (const s of SORTS) sortSessions(list, s);
    expect(list).toEqual(copy);
  });
});

describe('Shelves, names and keys in the source', () => {
  it('Cozy Stories opens on all stories, with Continue next to it', () => {
    const src = readFileSync('src/features/stories/Stories.svelte', 'utf8');
    expect(src).toContain("initial ?? 'all'");
    expect(src.indexOf("id: 'all'")).toBeLessThan(src.indexOf("id: 'continue'"));
  });
  it('the Gallery is the last item under Explore', () => {
    const src = readFileSync('src/ui/Sidebar.svelte', 'utf8');
    const explore = src.slice(src.indexOf('const explore'), src.indexOf('const controls'));
    const ids = [...explore.matchAll(/id: '(\w+)'/g)].map((m) => m[1]);
    expect(ids[ids.length - 1]).toBe('gallery');
    expect(ids).toEqual(['books', 'stories', 'adventures', 'minigames', 'meditation', 'movement', 'gallery']);
  });
  it('Delete and Backspace on a layer delete it', () => {
    const src = readFileSync('src/features/painting/LayersPanel.svelte', 'utf8');
    expect(src).toContain("e.key === 'Delete' || e.key === 'Backspace'");
    expect(src).toContain('onDelete(l.id)');
  });
  it('every game finishes with the shared congratulations screen', () => {
    for (const f of ['breaker/BreakerScreen', 'bubbles/BubbleScreen', 'catcher/CatcherScreen', 'flow/FlowScreen', 'memory/MemoryScreen', 'puzzle/PuzzleScreen', 'splash/SplashScreen']) {
      expect(readFileSync(`src/features/minigames/${f}.svelte`, 'utf8'), f).toContain('<GameResult');
    }
    const result = readFileSync('src/features/minigames/GameResult.svelte', 'utf8');
    expect(result).toContain('Congratulations!');
    expect(result).toContain('You finished every {noun}!');
    // Play again sits before (left of) the next-level button
    expect(result.indexOf('{againLabel}')).toBeLessThan(result.indexOf('nextLabel ??'));
  });
});

describe('Painting sounds', () => {
  it('gives different tools different sounds', () => {
    expect(brushKindFor('brush')).toBe('soft');
    expect(brushKindFor('crayon')).toBe('grainy');
    expect(brushKindFor('pastel')).toBe('grainy');
    expect(brushKindFor('watercolor')).toBe('wet');
    expect(brushKindFor('marker')).toBe('marker');
    expect(brushKindFor('ink')).toBe('ink');
    expect(brushKindFor('glitter')).toBe('glitter');
    expect(brushKindFor('unknown')).toBe('soft');
  });
});

describe('Saved-file notice', () => {
  it('shows for five to ten seconds', () => {
    expect(SAVED_TOAST_MS).toBeGreaterThanOrEqual(5000);
    expect(SAVED_TOAST_MS).toBeLessThanOrEqual(10_000);
  });
  it('can carry a link-like action and goes away by itself', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    toast('PNG saved: x.png', 'success', SAVED_TOAST_MS, { label: 'Show in folder', run });
    const t = get(toasts).at(-1)!;
    expect(t.action?.label).toBe('Show in folder');
    t.action!.run();
    expect(run).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SAVED_TOAST_MS + 50);
    expect(get(toasts).find((x) => x.id === t.id)).toBeUndefined();
    vi.useRealTimers();
  });
  it('shows the file name, from either kind of path', () => {
    expect(baseName('C:\\Users\\me\\Pictures\\sky.png')).toBe('sky.png');
    expect(baseName('/home/me/sky.png')).toBe('sky.png');
    expect(baseName('sky.png')).toBe('sky.png');
  });
  it('every export goes through the notice', () => {
    const src = readFileSync('src/features/painting/export.ts', 'utf8');
    expect((src.match(/savedNotice\(/g) ?? []).length).toBeGreaterThanOrEqual(5);
  });
});
