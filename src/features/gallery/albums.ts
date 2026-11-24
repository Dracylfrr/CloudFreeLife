/**
 * Gallery albums and search (added in 1.6). An album is just a named list of paintings, kept in one
 * small file (`albums.json`). A painting can be in several albums, and removing an album never
 * touches the paintings in it.
 */
import { persisted } from '../../core/persist';

export const MAX_ALBUMS = 30;
export const MAX_ALBUM_NAME = 30;
export const MAX_ART_PER_ALBUM = 500;

export interface Album {
  id: string;
  name: string;
  /** Artwork ids, in the order they were added. */
  art: string[];
}
export interface AlbumsFile {
  v: 1;
  albums: Album[];
}

const ALBUM_ID = /^a[0-9a-z]{3,10}$/;
const ART_ID = /^[a-z0-9][a-z0-9-]{0,80}$/;

const empty = (): AlbumsFile => ({ v: 1, albums: [] });

export function cleanAlbumName(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_ALBUM_NAME) : '';
}

export function sanitizeAlbums(raw: unknown): AlbumsFile {
  const out = empty();
  if (!raw || typeof raw !== 'object') return out;
  const list = (raw as Record<string, unknown>).albums;
  if (!Array.isArray(list)) return out;
  for (const a of list) {
    if (out.albums.length >= MAX_ALBUMS) break;
    if (!a || typeof a !== 'object') continue;
    const r = a as Record<string, unknown>;
    const name = cleanAlbumName(r.name);
    if (typeof r.id !== 'string' || !ALBUM_ID.test(r.id) || !name || out.albums.some((x) => x.id === r.id)) continue;
    const art = Array.isArray(r.art) ? [...new Set(r.art.filter((x): x is string => typeof x === 'string' && ART_ID.test(x)))].slice(0, MAX_ART_PER_ALBUM) : [];
    out.albums.push({ id: r.id, name, art });
  }
  return out;
}

export const albums = persisted<AlbumsFile>('albums.json', empty, sanitizeAlbums);
export const loadAlbums = () => albums.load();

const newId = (used: string[]) => {
  for (let i = 0; i < 50; i++) {
    const id = `a${Math.floor(Math.random() * 36 ** 5).toString(36).padStart(5, '0')}`;
    if (!used.includes(id)) return id;
  }
  return `a${Date.now().toString(36)}`;
};

/** Makes an album. Returns its id, or null when the name is empty or there are too many albums. */
export function createAlbum(name: string): string | null {
  const clean = cleanAlbumName(name);
  if (!clean || albums.value().albums.length >= MAX_ALBUMS) return null;
  const id = newId(albums.value().albums.map((a) => a.id));
  albums.update((f) => {
    f.albums.push({ id, name: clean, art: [] });
  });
  return id;
}

export function renameAlbum(id: string, name: string): boolean {
  const clean = cleanAlbumName(name);
  if (!clean || !albums.value().albums.some((a) => a.id === id)) return false;
  albums.update((f) => {
    const a = f.albums.find((x) => x.id === id);
    if (a) a.name = clean;
  });
  return true;
}

export function deleteAlbum(id: string) {
  albums.update((f) => {
    f.albums = f.albums.filter((a) => a.id !== id);
  });
}

/** Puts a painting in an album. Returns false when the album is full or does not exist. */
export function addToAlbum(albumId: string, artId: string): boolean {
  const a = albums.value().albums.find((x) => x.id === albumId);
  if (!a || !ART_ID.test(artId)) return false;
  if (a.art.includes(artId)) return true;
  if (a.art.length >= MAX_ART_PER_ALBUM) return false;
  albums.update((f) => {
    f.albums.find((x) => x.id === albumId)?.art.push(artId);
  });
  return true;
}

export function removeFromAlbum(albumId: string, artId: string) {
  albums.update((f) => {
    const a = f.albums.find((x) => x.id === albumId);
    if (a) a.art = a.art.filter((x) => x !== artId);
  });
}

/** Takes a deleted painting out of every album. */
export function forgetArtwork(artId: string) {
  if (!albums.value().albums.some((a) => a.art.includes(artId))) return;
  albums.update((f) => {
    for (const a of f.albums) a.art = a.art.filter((x) => x !== artId);
  });
}

export const albumsOf = (f: AlbumsFile, artId: string): Album[] => f.albums.filter((a) => a.art.includes(artId));

// ---------------------------------------------------------------- search and filters

/** Lower case with the accents taken off, so "Café" is found by "cafe". */
export const normalize = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** True when every word of the search is somewhere in the text. An empty search matches everything. */
export function matchesQuery(text: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalize(text);
  return words.every((w) => hay.includes(w));
}

export type ArtKind = 'coloring' | 'free' | 'splash';
export interface KindInfo {
  pageId: string | null;
  title: string;
}
/** What sort of painting this is: a coloring page, a Splash Wall saved from the game, or a free drawing. */
export function kindOf(a: KindInfo): ArtKind {
  if (a.pageId) return 'coloring';
  return /^splash wall\b/i.test(a.title) ? 'splash' : 'free';
}
