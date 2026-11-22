import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Autosaver } from '../src/core/autosave';
import { History } from '../src/core/undo';
import { MemoryStorage, assertSafeRelativePath, setStorage } from '../src/core/storage';
import {
  artworks,
  clearArtworkPaint,
  createArtwork,
  deleteArtwork,
  duplicateArtwork,
  loadArtwork,
  metaPath,
  paintPath,
  refreshArtworks,
  renameArtwork,
  saveArtwork
} from '../src/features/gallery/artwork';
import { DEFAULT_SETTINGS, __resetSettingsForTests, loadSettings, resetSettings, sanitizeSettings, saveSettingsNow, settings, updateSettings } from '../src/core/settings';
import { get } from 'svelte/store';

let mem: MemoryStorage;
beforeEach(() => {
  mem = new MemoryStorage();
  setStorage(mem);
  artworks.set([]);
});
afterEach(() => {
  setStorage(null);
  vi.useRealTimers();
});

const png = (n: number) => new Uint8Array(Array.from({ length: 64 }, (_, i) => (i * n) % 251));

describe('artwork save / load', () => {
  it('creates, saves and reloads an artwork with its paint', async () => {
    const meta = await createArtwork({ title: 'Cloud Castle', bookId: 'cloud_dreams', pageId: 'cloud_castle', width: 1280, height: 960 });
    expect(meta.id).toMatch(/^cloud-castle-[a-z0-9]{4}$/);
    const saved = await saveArtwork(meta, png(3), png(5));
    expect(saved.hasPaint).toBe(true);
    const back = await loadArtwork(meta.id);
    expect(back!.meta.title).toBe('Cloud Castle');
    expect(Array.from(back!.paint!)).toEqual(Array.from(png(3)));
  });

  it('survives an app restart (a fresh list read from storage)', async () => {
    const m = await createArtwork({ title: 'Persist me', bookId: 'free_canvas', pageId: null, background: 'mint', width: 1280, height: 960 });
    await saveArtwork(m, png(2), png(2));
    artworks.set([]); // simulate a new session
    const list = await refreshArtworks();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: 'Persist me', background: 'mint', hasPaint: true });
  });

  it('stores art in the data root, never in an install folder, and rejects unsafe paths', async () => {
    const m = await createArtwork({ title: 'x', bookId: 'b', pageId: null, width: 1, height: 1 });
    expect(metaPath(m.id)).toBe(`artworks/${m.id}/artwork.json`);
    expect(() => assertSafeRelativePath('../outside.png')).toThrow();
    expect(() => assertSafeRelativePath('C:/Windows/x')).toThrow();
    expect(() => assertSafeRelativePath('/abs')).toThrow();
    expect(await loadArtwork('../../etc')).toBeNull();
  });

  it('duplicate, rename, clear and delete', async () => {
    const m = await createArtwork({ title: 'Original', bookId: 'b', pageId: 'p', width: 1, height: 1 });
    await saveArtwork(m, png(7), png(7));
    const copy = (await duplicateArtwork(m.id))!;
    expect(copy.id).not.toBe(m.id);
    expect(Array.from((await loadArtwork(copy.id))!.paint!)).toEqual(Array.from(png(7)));
    await renameArtwork(copy.id, '  New name  ');
    expect((await loadArtwork(copy.id))!.meta.title).toBe('New name');
    await clearArtworkPaint(copy.id);
    const cleared = (await loadArtwork(copy.id))!;
    expect(cleared.paint).toBeNull();
    expect(cleared.meta.hasPaint).toBe(false);
    await deleteArtwork(m.id);
    expect(await mem.exists(`artworks/${m.id}`)).toBe(false);
    expect(await mem.exists(`artworks/${copy.id}`)).toBe(true);
  });

  it('ignores corrupt artwork folders instead of crashing', async () => {
    await mem.writeText('artworks/broken/artwork.json', '{not json');
    await mem.writeText('artworks/mismatch/artwork.json', JSON.stringify({ id: 'other', title: 'x' }));
    expect(await refreshArtworks()).toEqual([]);
  });

  it('an update never touches artwork (content and artwork live in separate folders)', async () => {
    const m = await createArtwork({ title: 'Safe', bookId: 'b', pageId: null, width: 1, height: 1 });
    await saveArtwork(m, png(1), null);
    await mem.writeText('content/books/new_book/book_manifest.json', '{}');
    await mem.remove('content');
    expect(await mem.exists(paintPath(m.id))).toBe(true);
  });
});

describe('autosave', () => {
  it('debounces: no disk write while strokes keep arriving, one write after quiet', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const status: string[] = [];
    const a = new Autosaver(save, { delay: 1000, onStatus: (s) => status.push(s) });
    for (let i = 0; i < 50; i++) {
      a.markDirty();
      await vi.advanceTimersByTimeAsync(100); // mouse still moving: 5 seconds in total
    }
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1100);
    expect(save).toHaveBeenCalledTimes(1);
    expect(status).toContain('saving');
    expect(status).toContain('saved');
    await vi.advanceTimersByTimeAsync(3000);
    expect(status.at(-1)).toBe('idle');
  });

  it('flush() saves immediately (changing pages, returning home, closing) and is a no-op when clean', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const a = new Autosaver(save, { delay: 60000, onStatus: () => {} });
    await a.flush();
    expect(save).not.toHaveBeenCalled();
    a.markDirty();
    await a.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await a.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('writes again when edits arrive during a save', async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise<void>((r) => (release = r))).mockResolvedValue(undefined);
    const a = new Autosaver(save, { delay: 10, onStatus: () => {} });
    a.markDirty();
    const first = a.flush();
    a.markDirty();
    release();
    await first;
    await a.flush();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('reports errors and retries instead of losing changes', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined);
    const status: string[] = [];
    const a = new Autosaver(save, { delay: 10, retryDelay: 500, onStatus: (s) => status.push(s) });
    a.markDirty();
    await vi.advanceTimersByTimeAsync(20);
    expect(status).toContain('error');
    expect(a.isDirty).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(2);
    expect(status).toContain('saved');
  });

  it('persists a real artwork through the autosaver', async () => {
    vi.useFakeTimers();
    const meta = await createArtwork({ title: 'Auto', bookId: 'b', pageId: null, width: 1, height: 1 });
    let current = meta;
    const a = new Autosaver(async () => {
      current = await saveArtwork(current, png(9), png(9));
    }, { delay: 200, onStatus: () => {} });
    a.markDirty();
    await vi.advanceTimersByTimeAsync(300);
    expect((await loadArtwork(meta.id))!.meta.hasPaint).toBe(true);
  });
});

describe('undo / redo history', () => {
  type E = { n: number; bytes: number };
  // the "canvas" is just a number; patches swap it
  const make = (max = 60, bytes = 1e9) => {
    let state = 0;
    const h = new History<E>(max, bytes);
    const swap = (e: E): E => {
      const inverse = { n: state, bytes: e.bytes };
      state = e.n;
      return inverse;
    };
    const act = (to: number) => {
      h.push({ n: state, bytes: 10 });
      state = to;
    };
    return { h, swap, act, get: () => state };
  };

  it('undoes and redoes in order', () => {
    const t = make();
    t.act(1);
    t.act(2);
    t.act(3);
    expect(t.h.undo(t.swap)).toBe(true);
    expect(t.get()).toBe(2);
    t.h.undo(t.swap);
    expect(t.get()).toBe(1);
    t.h.redo(t.swap);
    expect(t.get()).toBe(2);
    t.h.redo(t.swap);
    expect(t.get()).toBe(3);
    expect(t.h.redo(t.swap)).toBe(false);
  });

  it('a new action discards the redo stack', () => {
    const t = make();
    t.act(1);
    t.act(2);
    t.h.undo(t.swap);
    t.act(9);
    expect(t.h.canRedo).toBe(false);
    t.h.undo(t.swap);
    expect(t.get()).toBe(1);
  });

  it('trims the oldest entries past the entry and memory budgets', () => {
    const t = make(3);
    for (let i = 1; i <= 6; i++) t.act(i);
    expect(t.h.undoCount).toBe(3);
    const m = make(100, 35);
    for (let i = 1; i <= 6; i++) m.act(i);
    expect(m.h.memoryBytes).toBeLessThanOrEqual(35);
    expect(m.h.undoCount).toBe(3);
  });

  it('cannot undo past the beginning', () => {
    const t = make();
    expect(t.h.undo(t.swap)).toBe(false);
    expect(t.h.canUndo).toBe(false);
  });
});

describe('settings persistence', () => {
  beforeEach(() => __resetSettingsForTests());

  it('saves to storage and loads back in a new session', async () => {
    await loadSettings();
    updateSettings({ reducedMotion: true, uiScale: 1.2, volumeMusic: 0.1, muted: true, lowPowerMode: true });
    await saveSettingsNow();
    __resetSettingsForTests();
    expect(get(settings).reducedMotion).toBe(false);
    const loaded = await loadSettings();
    expect(loaded).toMatchObject({ reducedMotion: true, uiScale: 1.2, volumeMusic: 0.1, muted: true, lowPowerMode: true });
  });

  it('debounces writes triggered by updateSettings', async () => {
    vi.useFakeTimers();
    await loadSettings();
    updateSettings({ volumeMaster: 0.2 });
    updateSettings({ volumeMaster: 0.3 });
    expect(await mem.readText('settings.json')).toBeNull();
    await vi.advanceTimersByTimeAsync(600);
    expect(JSON.parse((await mem.readText('settings.json'))!).volumeMaster).toBe(0.3);
  });

  it('survives garbage: unknown keys dropped, bad values replaced, reset confirmation stays on', () => {
    const s = sanitizeSettings({ uiScale: 99, volumeMaster: -4, reducedMotion: 'yes', lastColor: 'red', confirmBeforeReset: false, evil: 1, dismissedUpdates: [1, 'app:1.1.0'] });
    expect(s.uiScale).toBe(1.4);
    expect(s.volumeMaster).toBe(0);
    expect(s.reducedMotion).toBe(DEFAULT_SETTINGS.reducedMotion);
    expect(s.lastColor).toBe(DEFAULT_SETTINGS.lastColor);
    expect(s.confirmBeforeReset).toBe(true);
    expect('evil' in s).toBe(false);
    expect(s.dismissedUpdates).toEqual(['app:1.1.0']);
  });

  it('a corrupt settings file falls back to defaults', async () => {
    await mem.writeText('settings.json', '{{{');
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('resetSettings restores defaults', async () => {
    await loadSettings();
    updateSettings({ muted: true });
    resetSettings();
    expect(get(settings).muted).toBe(false);
  });
});
