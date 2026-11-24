import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { DEFAULT_REF, MAX_REF_SIDE, copyReference, fitSize, loadReference, referencePath, removeReference, sanitizeRef, saveReference, saveReferenceSettings } from '../src/features/gallery/referenceStore';

describe('reference picture settings', () => {
  it('start beside the canvas, shown, at a gentle strength', () => {
    expect(DEFAULT_REF).toEqual({ mode: 'beside', opacity: 0.35, shown: true });
  });
  it('are read safely', () => {
    expect(sanitizeRef(null)).toEqual(DEFAULT_REF);
    expect(sanitizeRef({ mode: 'trace', opacity: 0.6, shown: false })).toEqual({ mode: 'trace', opacity: 0.6, shown: false });
    expect(sanitizeRef({ mode: 'sideways', opacity: 9, shown: 'yes' })).toEqual({ mode: 'beside', opacity: 0.9, shown: true });
    expect(sanitizeRef({ opacity: -3 }).opacity).toBe(0.1);
    expect(sanitizeRef({ opacity: 'strong' }).opacity).toBe(DEFAULT_REF.opacity);
  });
});

describe('reference picture size', () => {
  it('shrinks big pictures to the limit and keeps their shape', () => {
    expect(fitSize(3200, 1600)).toEqual({ w: MAX_REF_SIDE, h: 800 });
    expect(fitSize(1000, 4000)).toEqual({ w: 400, h: MAX_REF_SIDE });
  });
  it('never makes a picture bigger', () => {
    expect(fitSize(800, 600)).toEqual({ w: 800, h: 600 });
  });
  it('copes with nonsense', () => {
    expect(fitSize(0, 0)).toEqual({ w: 1, h: 1 });
    expect(fitSize(NaN, 5)).toEqual({ w: 1, h: 1 });
    expect(fitSize(1, 5000).w).toBeGreaterThanOrEqual(1);
  });
});

describe('keeping a reference picture with a painting', () => {
  const id = 'free-drawing-abcd';
  let st: MemoryStorage;
  beforeEach(() => {
    st = new MemoryStorage();
    setStorage(st);
  });
  it('saves, loads, changes its settings and removes it', async () => {
    expect(await loadReference(id)).toBeNull();
    await saveReference(id, new Uint8Array([1, 2, 3]), { ...DEFAULT_REF, mode: 'trace' });
    let r = await loadReference(id);
    expect(Array.from(r!.bytes)).toEqual([1, 2, 3]);
    expect(r!.settings.mode).toBe('trace');
    await saveReferenceSettings(id, { mode: 'beside', opacity: 0.5, shown: false });
    r = await loadReference(id);
    expect(r!.settings).toEqual({ mode: 'beside', opacity: 0.5, shown: false });
    await removeReference(id);
    expect(await loadReference(id)).toBeNull();
    expect(await st.exists(referencePath(id))).toBe(false);
  });
  it('falls back to the defaults when the settings file is damaged', async () => {
    await saveReference(id, new Uint8Array([9]), DEFAULT_REF);
    await st.writeText(`artworks/${id}/reference.json`, '{ nope');
    expect((await loadReference(id))!.settings).toEqual(DEFAULT_REF);
  });
  it('is copied with a Duplicate, and nothing happens when there is none', async () => {
    await saveReference(id, new Uint8Array([4, 5]), { ...DEFAULT_REF, opacity: 0.7 });
    await copyReference(id, 'free-drawing-copy');
    const c = await loadReference('free-drawing-copy');
    expect(Array.from(c!.bytes)).toEqual([4, 5]);
    expect(c!.settings.opacity).toBe(0.7);
    await copyReference('free-drawing-none', 'free-drawing-other');
    expect(await loadReference('free-drawing-other')).toBeNull();
  });
});
