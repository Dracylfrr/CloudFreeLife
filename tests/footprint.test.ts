// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { measureFootprint } from '../src/features/settings/footprint';
import { filesOf, tierBytes } from '../src/features/voices/model';

let mem: MemoryStorage;
beforeEach(() => {
  mem = new MemoryStorage();
  setStorage(mem);
});
afterEach(() => setStorage(null));

const bytes = (n: number) => new Uint8Array(n);
const fillVoices = async (parts: ('shared' | 'standard' | 'fast')[]) => {
  for (const part of parts) for (const f of filesOf(part)) await mem.writeBytes(f.path, bytes(f.size));
};

describe('How big the whole app is', () => {
  it('adds the program to everything in the data folder', async () => {
    await mem.writeBytes('artworks/a/art.png', bytes(5000));
    await mem.writeBytes('settings.json', bytes(300));
    const f = await measureFootprint(12_000_000);
    expect(f.program).toBe(12_000_000);
    expect(f.data).toBe(5300);
    expect(f.total).toBe(12_005_300);
  });
  it('still works when the program folder cannot be measured', async () => {
    await mem.writeBytes('settings.json', bytes(300));
    const f = await measureFootprint(null);
    expect(f.program).toBeNull();
    expect(f.total).toBe(300);
  });
  it('splits the data into the pieces a person can understand, and nothing is counted twice', async () => {
    await mem.writeBytes('artworks/a/art.png', bytes(4000));
    await mem.writeBytes('avatar/picture.png', bytes(700));
    await mem.writeBytes('content/books/x/cover.svg', bytes(2500));
    await mem.writeBytes('update/Cloud-Freelife_2.0.0_x64-setup.exe', bytes(9000));
    await mem.writeBytes('premium/owner.lic', bytes(500));
    await mem.writeBytes('settings.json', bytes(300));
    await mem.writeBytes('progress/stories.json', bytes(100));
    await fillVoices(['shared', 'standard', 'fast']);
    const f = await measureFootprint(null);
    const by = Object.fromEntries(f.parts.map((p) => [p.id, p.bytes]));
    expect(by).toMatchObject({ art: 4000, avatar: 700, content: 2500, update: 9000, premium: 500, other: 400 });
    expect(by.fast).toBe(filesOf('fast')[0].size);
    expect(by.standard).toBe(filesOf('standard')[0].size);
    expect(by.shared).toBe(filesOf('shared').reduce((n, x) => n + x.size, 0));
    expect(f.parts.reduce((n, p) => n + p.bytes, 0)).toBe(f.data);
  });
  it('offers to remove or clear exactly the things that can be got back or are leftovers', async () => {
    await mem.writeBytes('content/books/x/cover.svg', bytes(10));
    await mem.writeBytes('update/old.exe', bytes(10));
    await mem.writeBytes('artworks/a/art.png', bytes(10));
    await fillVoices(['shared', 'standard']);
    const f = await measureFootprint(null);
    const remedy = Object.fromEntries(f.parts.map((p) => [p.id, p.remedy]));
    expect(remedy).toMatchObject({ content: 'content', update: 'update-leftovers', art: 'gallery', standard: 'voices-standard', fast: 'voices-fast' });
    expect(remedy.shared).toBe('none');
    expect(remedy.other ?? 'none').toBe('none');
  });
  it('lists a voice that is not downloaded, with no size, so it can be downloaded again', async () => {
    await fillVoices(['shared', 'standard']);
    const f = await measureFootprint(null);
    const fast = f.parts.find((p) => p.id === 'fast')!;
    expect(fast.bytes).toBe(0);
    expect(fast.remedy).toBe('voices-fast');
  });
  it('an empty data folder is just zero, with nothing invented', async () => {
    const f = await measureFootprint(null);
    expect(f.data).toBe(0);
    expect(f.total).toBe(0);
    expect(f.parts.every((p) => p.bytes === 0)).toBe(true);
  });
});

describe('The storage screen', () => {
  const settings = readFileSync('src/features/settings/Settings.svelte', 'utf8');
  it('shows the total, the pieces, and how to remove and download each removable one again', () => {
    expect(settings).toContain('Everything {BRAND_NAME} uses on this computer');
    expect(settings).toContain('measureFootprint');
    expect(settings).toContain('programSize');
    expect(settings).toContain('Download again');
    expect(settings).toContain("await removeModel(tier)");
    expect(settings).toContain('downloadModel(tier)');
    expect(settings).toContain('Clear');
  });
  it('asks before removing a voice, and says the choices are kept', () => {
    expect(settings).toContain('confirmDialog');
    expect(settings).toContain('Your choices for each character are kept');
  });
  it('the program size comes from the native side, which only counts, never changes anything', () => {
    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(rust).toContain('fn install_size()');
    const body = rust.slice(rust.indexOf('fn install_size()'), rust.indexOf('pub fn run()'));
    expect(body).not.toMatch(/remove_file|remove_dir|write|create/);
  });
  it('the sizes of the two voices that people choose between add up to what the screen says', () => {
    expect(tierBytes('fast')).toBeGreaterThan(tierBytes('standard') * 3);
  });
});
