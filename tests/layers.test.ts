import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { BLEND_IDS, BLEND_MODES, MAX_LAYERS, blendOf, cleanName, cleanOpacity, defaultLayerName, isLayerId, layerFile, nextLayerId, sanitizeCommand, sanitizeLayerMeta, sanitizeLayersFile, type LayerMeta } from '../src/features/painting/layers';
import { KEEP_BACKUP_SAVES, backupPath, copyLayerData, layerPath, layersPath, loadLayerData, saveLayerData } from '../src/features/gallery/layerStore';
import { Recorder, applyEvent, sanitizeLog, type ReplayTarget } from '../src/features/painting/timelapse';

const meta = (id: string, over: Partial<LayerMeta> = {}): LayerMeta => ({ id, name: `Layer ${id.slice(1)}`, visible: true, locked: false, opacity: 1, blend: 'normal', ...over });
const png = (n: number) => new Uint8Array([137, 80, 78, 71, n]);

describe('layer rules', () => {
  it('offers six blend modes with real canvas operations and a plain explanation', () => {
    expect(BLEND_MODES.map((b) => b.id)).toEqual(['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'color']);
    for (const b of BLEND_MODES) {
      expect(b.hint.length).toBeGreaterThan(15);
      expect(b.label).toBeTruthy();
    }
    expect(blendOf('multiply').op).toBe('multiply');
    expect(blendOf('normal').op).toBe('source-over');
    expect(blendOf('nonsense').id).toBe('normal');
  });
  it('allows four layers', () => expect(MAX_LAYERS).toBe(4));
  it('chooses unused ids and names', () => {
    expect(nextLayerId([])).toBe('l1');
    expect(nextLayerId(['l1', 'l3'])).toBe('l2');
    expect(nextLayerId(['l1', 'l2', 'l3'])).toBe('l4');
    expect(defaultLayerName([])).toBe('Layer 1');
    expect(defaultLayerName(['Layer 1', 'Sky'])).toBe('Layer 2');
    expect(isLayerId('l2')).toBe(true);
    for (const bad of ['', 'L1', 'l', 'layer1', 'l123', 5, null]) expect(isLayerId(bad)).toBe(false);
    expect(layerFile('l2')).toBe('layer-l2.png');
  });
  it('cleans names and opacity', () => {
    expect(cleanName('  Sky   and sea  ', 'x')).toBe('Sky and sea');
    expect(cleanName('', 'Layer 3')).toBe('Layer 3');
    expect(cleanName('x'.repeat(100), 'y').length).toBe(24);
    expect(cleanName(7, 'Layer 9')).toBe('Layer 9');
    expect(cleanOpacity(0.456)).toBe(0.46);
    expect(cleanOpacity(7)).toBe(1);
    expect(cleanOpacity(-1)).toBe(0);
    expect(cleanOpacity('no', 0.5)).toBe(0.5);
  });
  it('reads a layer, with defaults for what is missing and nothing for what is not a layer', () => {
    expect(sanitizeLayerMeta({ id: 'l2' }, 'Layer 2')).toEqual({ id: 'l2', name: 'Layer 2', visible: true, locked: false, opacity: 1, blend: 'normal' });
    expect(sanitizeLayerMeta({ id: 'l2', blend: 'plaid', opacity: 5, visible: false, locked: true, name: 'Hi' }, 'x')).toEqual({ id: 'l2', name: 'Hi', visible: false, locked: true, opacity: 1, blend: 'normal' });
    expect(sanitizeLayerMeta({ id: '../x' }, 'x')).toBeNull();
    expect(sanitizeLayerMeta(null, 'x')).toBeNull();
  });
  it('reads layers.json safely', () => {
    const ok = sanitizeLayersFile({ v: 1, layers: [meta('l1'), meta('l2', { blend: 'multiply' })], active: 'l1', saves: 2 });
    expect(ok?.layers.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(ok?.active).toBe('l1');
    expect(ok?.saves).toBe(2);
    // unknown active falls back to the top layer; duplicates and extras are dropped; at most four
    const messy = sanitizeLayersFile({ v: 1, layers: [meta('l1'), meta('l1'), meta('l2'), meta('l3'), meta('l4'), meta('l5'), { id: 'bad' }], active: 'zzz', saves: 'many' });
    expect(messy?.layers.map((l) => l.id)).toEqual(['l1', 'l2', 'l3']);
    expect(messy?.active).toBe('l3');
    expect(messy?.saves).toBe(0);
    for (const bad of [null, 'x', {}, { v: 2, layers: [meta('l1')] }, { v: 1, layers: [] }, { v: 1, layers: 'no' }, { v: 1, layers: [{ id: 'x' }] }]) expect(sanitizeLayersFile(bad), JSON.stringify(bad)).toBeNull();
  });
  it('reads layer commands from a log', () => {
    expect(sanitizeCommand({ c: 'add', id: 'l2', name: 'Sky' })).toEqual({ c: 'add', id: 'l2', name: 'Sky' });
    expect(sanitizeCommand({ c: 'dup', id: 'l3', from: 'l2', name: 'x' })).toMatchObject({ c: 'dup', from: 'l2' });
    expect(sanitizeCommand({ c: 'mv', id: 'l2', by: 1 })).toEqual({ c: 'mv', id: 'l2', by: 1 });
    expect(sanitizeCommand({ c: 'mv', id: 'l2', by: 2 })).toBeNull();
    expect(sanitizeCommand({ c: 'set', id: 'l2', p: { opacity: 0.4, blend: 'screen', junk: 1 } })).toEqual({ c: 'set', id: 'l2', p: { opacity: 0.4, blend: 'screen' } });
    expect(sanitizeCommand({ c: 'set', id: 'l2', p: { blend: 'plaid' } })).toBeNull();
    expect(sanitizeCommand({ c: 'explode', id: 'l2' })).toBeNull();
    expect(sanitizeCommand({ c: 'del', id: 'nope' })).toBeNull();
    expect(BLEND_IDS).toContain('soft-light');
  });
});

describe('saving layers', () => {
  let st: MemoryStorage;
  beforeEach(() => {
    st = new MemoryStorage();
    setStorage(st);
  });
  const id = 'free-drawing-abcd';

  it('writes the pictures and then the list, and reads them back', async () => {
    const metas = [meta('l1'), meta('l2', { opacity: 0.5, blend: 'multiply' })];
    expect(await saveLayerData(id, metas, 'l2', { l1: png(1), l2: png(2) })).toBe(true);
    const back = await loadLayerData(id);
    expect(back?.file.layers).toEqual(metas);
    expect(back?.file.active).toBe('l2');
    expect(Array.from(back!.pngs.l2!)).toEqual(Array.from(png(2)));
  });
  it('only needs the layers that changed', async () => {
    await saveLayerData(id, [meta('l1'), meta('l2')], 'l1', { l1: png(1), l2: png(2) });
    await saveLayerData(id, [meta('l1'), meta('l2', { opacity: 0.3 })], 'l1', { l2: png(9) });
    const back = await loadLayerData(id);
    expect(Array.from(back!.pngs.l1!)).toEqual(Array.from(png(1)));
    expect(Array.from(back!.pngs.l2!)).toEqual(Array.from(png(9)));
    expect(back?.file.layers[1].opacity).toBe(0.3);
  });
  it('keeps the old single-layer picture as a backup, then lets it go after a few good saves', async () => {
    await st.writeBytes(`artworks/${id}/paint.png`, png(7));
    await saveLayerData(id, [meta('l1')], 'l1', { l1: png(1) });
    expect(await st.exists(backupPath(id))).toBe(true);
    expect(Array.from((await st.readBytes(backupPath(id)))!)).toEqual(Array.from(png(7)));
    for (let i = 1; i < KEEP_BACKUP_SAVES; i++) {
      expect(await st.exists(backupPath(id))).toBe(true);
      await saveLayerData(id, [meta('l1')], 'l1', {});
    }
    expect(await st.exists(backupPath(id))).toBe(false);
  });
  it('removes the pictures of layers that were deleted', async () => {
    await saveLayerData(id, [meta('l1'), meta('l2')], 'l1', { l1: png(1), l2: png(2) });
    await saveLayerData(id, [meta('l1')], 'l1', {});
    expect(await st.exists(layerPath(id, 'l2'))).toBe(false);
    expect(await st.exists(layerPath(id, 'l1'))).toBe(true);
  });
  it('refuses to write a list that points at a picture that is not there', async () => {
    expect(await saveLayerData(id, [meta('l1'), meta('l2')], 'l1', { l1: png(1) })).toBe(false);
    expect(await st.exists(layersPath(id))).toBe(false);
  });
  it('opens from paint.png instead when a layer picture is missing or the list is damaged', async () => {
    await saveLayerData(id, [meta('l1'), meta('l2')], 'l1', { l1: png(1), l2: png(2) });
    await st.remove(layerPath(id, 'l2'));
    expect(await loadLayerData(id)).toBeNull();
    await st.writeText(layersPath(id), '{ not json');
    expect(await loadLayerData(id)).toBeNull();
    expect(await loadLayerData('free-drawing-none')).toBeNull();
  });
  it('copies layers for Duplicate', async () => {
    await saveLayerData(id, [meta('l1'), meta('l2')], 'l2', { l1: png(1), l2: png(2) });
    await copyLayerData(id, 'free-drawing-copy');
    const copy = await loadLayerData('free-drawing-copy');
    expect(copy?.file.layers.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(Array.from(copy!.pngs.l1!)).toEqual(Array.from(png(1)));
    await copyLayerData('free-drawing-nothing', 'free-drawing-other'); // nothing to copy is fine
    expect(await loadLayerData('free-drawing-other')).toBeNull();
  });
});

describe('timelapse with layers', () => {
  const base = { w: 1280, h: 960, truncated: false };
  it('keeps layer actions in version 2 logs and ignores them in older ones', () => {
    const ev = [['b', 1, 2, 'brush', '#a9d4f5', 18, 1], ['e'], ['y', { c: 'add', id: 'l2', name: 'Sky' }], ['y', { c: 'bogus', id: 'l2' }]];
    const v2 = sanitizeLog({ v: 2, ...base, events: ev });
    expect(v2?.v).toBe(2);
    expect(v2?.events.map((e) => e[0])).toEqual(['b', 'e', 'y']);
    const v1 = sanitizeLog({ v: 1, ...base, events: ev });
    expect(v1?.v).toBe(1);
    expect(v1?.events.map((e) => e[0])).toEqual(['b', 'e']);
    expect(sanitizeLog({ v: 3, ...base, events: ev })).toBeNull();
  });
  it('records layer actions and replays them', () => {
    const r = new Recorder(1280, 960);
    r.layer({ c: 'add', id: 'l2', name: 'Sky' });
    r.layer({ c: 'sel', id: 'l1' });
    expect(r.toLog().v).toBe(2);
    expect(r.events.map((e) => e[0])).toEqual(['y', 'y']);
    const seen: unknown[] = [];
    const t = { state: {} as never, layerCommand: (c: unknown) => (seen.push(c), true) } as unknown as ReplayTarget;
    for (const e of r.events) applyEvent(t, e);
    expect(seen).toEqual([{ c: 'add', id: 'l2', name: 'Sky' }, { c: 'sel', id: 'l1' }]);
  });
});
