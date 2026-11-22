/**
 * Content registry: discovers books, pages, palettes and mini-game levels
 * from the bundled content and from installed content packs, validates every
 * manifest, and exposes the result as a Svelte store.
 *
 * Nothing in the UI hard-codes a book or a level: if a valid manifest exists
 * in the right folder, it shows up in the right section.
 */
import { get, writable } from 'svelte/store';
import {
  checkCompatibility,
  validateBook,
  validateBreakerLevel,
  validateMemoryLevel,
  validatePuzzleLevel,
  validatePage,
  validatePalette,
  validateRegions,
  validateSplashLevel,
  type BookManifest,
  type BreakerLevel,
  type MemoryLevel,
  type PuzzleLevel,
  type PageManifest,
  type PaletteManifest,
  type RegionsFile,
  type SplashLevel
} from '../manifests';
import { compareVersions } from '../version';
import { BundledTree, InstalledTree, type ContentTree } from './tree';

export interface Located {
  source: 'bundled' | 'installed';
  tree: ContentTree;
  /** Path of the item's folder, relative to content/. */
  dir: string;
}

export interface LoadedPage extends Located {
  bookId: string;
  folder: string;
  manifest: PageManifest;
  regions: RegionsFile;
  index: number;
}

export interface LoadedBook extends Located {
  manifest: BookManifest;
  pages: LoadedPage[];
}

export interface LoadedPalette extends Located {
  manifest: PaletteManifest;
}

export interface LoadedBreakerLevel extends Located {
  folder: string;
  manifest: BreakerLevel;
}
export interface LoadedSplashLevel extends Located {
  folder: string;
  manifest: SplashLevel;
}
export interface LoadedMemoryLevel extends Located {
  folder: string;
  manifest: MemoryLevel;
}
export interface LoadedPuzzleLevel extends Located {
  folder: string;
  manifest: PuzzleLevel;
}

export interface Skipped {
  where: string;
  reason: string;
}

export interface Catalog {
  ready: boolean;
  books: LoadedBook[];
  palettes: LoadedPalette[];
  breakerLevels: LoadedBreakerLevel[];
  splashLevels: LoadedSplashLevel[];
  memoryLevels: LoadedMemoryLevel[];
  puzzleLevels: LoadedPuzzleLevel[];
  /** Content that exists but was not usable (invalid or needs a newer app). */
  skipped: Skipped[];
}

const empty = (): Catalog => ({ ready: false, books: [], palettes: [], breakerLevels: [], splashLevels: [], memoryLevels: [], puzzleLevels: [], skipped: [] });

const store = writable<Catalog>(empty());
export const catalog = { subscribe: store.subscribe };

export function asset(tree: ContentTree, dir: string, file: string) {
  return {
    url: () => tree.url(`${dir}/${file}`),
    text: () => tree.readText(`${dir}/${file}`)
  };
}

// ----------------------------------------------------------------- loading

async function loadBooks(tree: ContentTree, skipped: Skipped[], appVersion?: string): Promise<LoadedBook[]> {
  const out: LoadedBook[] = [];
  for (const folder of await tree.listDirs('books')) {
    const dir = `books/${folder}`;
    const raw = await tree.readJson(`${dir}/book_manifest.json`);
    if (raw === null) continue;
    const v = validateBook(raw, `${dir}/book_manifest.json`);
    if (!v.ok) {
      skipped.push({ where: dir, reason: v.errors.join('; ') });
      continue;
    }
    const compat = checkCompatibility(v.value, appVersion);
    if (!compat.ok) {
      skipped.push({ where: dir, reason: compat.reason ?? 'Incompatible' });
      continue;
    }
    const book: LoadedBook = { source: tree.source, tree, dir, manifest: v.value, pages: [] };
    for (const [index, pageFolder] of v.value.pages.entries()) {
      const pdir = `${dir}/pages/${pageFolder}`;
      const praw = await tree.readJson(`${pdir}/page_manifest.json`);
      const rraw = praw ? await tree.readJson(`${pdir}/${(praw as { regions?: string }).regions ?? 'regions.json'}`) : null;
      if (!praw || !rraw) {
        skipped.push({ where: pdir, reason: 'Missing page manifest or regions file' });
        continue;
      }
      const pv = validatePage(praw, `${pdir}/page_manifest.json`);
      const rv = validateRegions(rraw, `${pdir}/regions.json`);
      if (!pv.ok || !rv.ok) {
        skipped.push({ where: pdir, reason: [...(pv.ok ? [] : pv.errors), ...(rv.ok ? [] : rv.errors)].join('; ') });
        continue;
      }
      if (!checkCompatibility(pv.value, appVersion).ok) {
        skipped.push({ where: pdir, reason: `Requires Cloud-Freelife ${pv.value.minAppVersion}` });
        continue;
      }
      book.pages.push({
        source: tree.source,
        tree,
        dir: pdir,
        bookId: v.value.id,
        folder: pageFolder,
        manifest: pv.value,
        regions: rv.value,
        index
      });
    }
    out.push(book);
  }
  return out;
}

async function loadPalettes(tree: ContentTree, skipped: Skipped[], appVersion?: string): Promise<LoadedPalette[]> {
  const out: LoadedPalette[] = [];
  for (const file of await tree.listFiles('palettes')) {
    if (!file.endsWith('.json')) continue;
    const raw = await tree.readJson(`palettes/${file}`);
    const v = validatePalette(raw, `palettes/${file}`);
    if (!v.ok) {
      skipped.push({ where: `palettes/${file}`, reason: v.errors.join('; ') });
      continue;
    }
    if (!checkCompatibility(v.value, appVersion).ok) {
      skipped.push({ where: `palettes/${file}`, reason: `Requires Cloud-Freelife ${v.value.minAppVersion}` });
      continue;
    }
    out.push({ source: tree.source, tree, dir: 'palettes', manifest: v.value });
  }
  return out;
}

async function loadLevels<T extends BreakerLevel | SplashLevel | MemoryLevel | PuzzleLevel>(
  tree: ContentTree,
  game: 'pastel_breaker' | 'splash_wall' | 'memory_meadow' | 'pastel_puzzle',
  skipped: Skipped[],
  appVersion?: string
): Promise<(Located & { folder: string; manifest: T })[]> {
  const base = `minigames/${game}/levels`;
  const out: (Located & { folder: string; manifest: T })[] = [];
  for (const folder of await tree.listDirs(base)) {
    const dir = `${base}/${folder}`;
    const raw = await tree.readJson(`${dir}/level.json`);
    if (raw === null) continue;
    const v = game === 'pastel_breaker' ? validateBreakerLevel(raw, `${dir}/level.json`) : game === 'splash_wall' ? validateSplashLevel(raw, `${dir}/level.json`) : game === 'memory_meadow' ? validateMemoryLevel(raw, `${dir}/level.json`) : validatePuzzleLevel(raw, `${dir}/level.json`);
    if (!v.ok) {
      skipped.push({ where: dir, reason: v.errors.join('; ') });
      continue;
    }
    if (!checkCompatibility(v.value, appVersion).ok) {
      skipped.push({ where: dir, reason: `Requires Cloud-Freelife ${v.value.minAppVersion}` });
      continue;
    }
    out.push({ source: tree.source, tree, dir, folder, manifest: v.value as T });
  }
  return out;
}

/** When the same id exists in several sources the newest version wins; ties prefer bundled. */
function mergeById<T extends Located>(items: T[], idOf: (t: T) => string, versionOf: (t: T) => string): T[] {
  const best = new Map<string, T>();
  for (const it of items) {
    const id = idOf(it);
    const cur = best.get(id);
    if (!cur || compareVersions(versionOf(it), versionOf(cur)) > 0) best.set(id, it);
  }
  return [...best.values()];
}

export async function buildCatalog(trees: ContentTree[], appVersion?: string): Promise<Catalog> {
  const skipped: Skipped[] = [];
  const books: LoadedBook[] = [];
  const palettes: LoadedPalette[] = [];
  const breaker: LoadedBreakerLevel[] = [];
  const splash: LoadedSplashLevel[] = [];
  const memory: LoadedMemoryLevel[] = [];
  const puzzle: LoadedPuzzleLevel[] = [];
  for (const tree of trees) {
    try {
      books.push(...(await loadBooks(tree, skipped, appVersion)));
      palettes.push(...(await loadPalettes(tree, skipped, appVersion)));
      breaker.push(...(await loadLevels<BreakerLevel>(tree, 'pastel_breaker', skipped, appVersion)));
      splash.push(...(await loadLevels<SplashLevel>(tree, 'splash_wall', skipped, appVersion)));
      memory.push(...(await loadLevels<MemoryLevel>(tree, 'memory_meadow', skipped, appVersion)));
      puzzle.push(...(await loadLevels<PuzzleLevel>(tree, 'pastel_puzzle', skipped, appVersion)));
    } catch (err) {
      skipped.push({ where: `${tree.source} content`, reason: String(err) });
    }
  }
  const byFolder = (a: { folder: string }, b: { folder: string }) => a.folder.localeCompare(b.folder);
  return {
    ready: true,
    books: mergeById(books, (b) => b.manifest.id, (b) => b.manifest.version).sort((a, b) => a.manifest.name.localeCompare(b.manifest.name)),
    palettes: mergeById(palettes, (p) => p.manifest.id, (p) => p.manifest.version),
    breakerLevels: mergeById(breaker, (l) => l.manifest.id, (l) => l.manifest.version).sort(byFolder),
    splashLevels: mergeById(splash, (l) => l.manifest.id, (l) => l.manifest.version).sort(byFolder),
    memoryLevels: mergeById(memory, (l) => l.manifest.id, (l) => l.manifest.version).sort(byFolder),
    puzzleLevels: mergeById(puzzle, (l) => l.manifest.id, (l) => l.manifest.version).sort(byFolder),
    skipped
  };
}

/** Shelf order: each book's own `order` (default 1000), then alphabetically. */
export function shelfSort(books: LoadedBook[]): LoadedBook[] {
  const rank = (b: LoadedBook) => b.manifest.order ?? 1000;
  return [...books].sort((a, b) => rank(a) - rank(b) || a.manifest.name.localeCompare(b.manifest.name));
}

export async function loadCatalog(): Promise<Catalog> {
  const cat = await buildCatalog([new BundledTree(), new InstalledTree()]);
  store.set(cat);
  return cat;
}

export const getCatalog = () => get(store);

export function findBook(id: string): LoadedBook | undefined {
  return get(store).books.find((b) => b.manifest.id === id);
}
export function findPage(bookId: string, pageId: string): LoadedPage | undefined {
  return findBook(bookId)?.pages.find((p) => p.manifest.id === pageId);
}
export function findPalette(id: string): LoadedPalette | undefined {
  return get(store).palettes.find((p) => p.manifest.id === id);
}
