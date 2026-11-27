import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { sha256Hex } from '../src/features/updates/checksum';
import type { HttpGet } from '../src/features/updates/http';
import { VOICES, voiceByPack } from '../src/features/voices/casts';
import { buildPack, paragraphAt, parsePack, startOf } from '../src/features/voices/packfile';
import { downloadPacks, fetchManifest, hasPack, installedPacks, loadPack, packTag, packUrl, parseManifest, removePacks, type PackManifest } from '../src/features/voices/packs';

const elodie = voiceByPack('elodie')!;
const audio = (n: number, fill: number) => new Uint8Array(n).fill(fill);
const lines = (): [number, number, number][] => [
  [0, 0, 2.5],
  [1, 2.9, 6],
  [2, 6.4, 9]
];

function pack(story: string) {
  return buildPack({ v: 1, story, voice: 'elodie' }, [
    { id: 'c1', audio: audio(300, 1), seconds: 9, lines: lines() },
    { id: 'c2', audio: audio(120, 2), seconds: 4, lines: [[0, 0, 4]] }
  ]);
}

describe('A recorded story file', () => {
  it('keeps every part and when each line is spoken, and reads them back exactly', () => {
    const p = parsePack(pack('the_story'))!;
    expect(p.header).toMatchObject({ v: 1, story: 'the_story', voice: 'elodie' });
    expect(Object.keys(p.header.units)).toEqual(['c1', 'c2']);
    expect([...p.audio('c1')!].every((b) => b === 1)).toBe(true);
    expect(p.audio('c1')!.length).toBe(300);
    expect([...p.audio('c2')!].every((b) => b === 2)).toBe(true);
    expect(p.audio('c3')).toBeNull();
    expect(p.header.units.c1.l).toEqual(lines());
  });
  it('is refused when it is damaged, cut short or not one of ours', () => {
    const good = pack('s');
    expect(parsePack(good.slice(0, good.length - 50))).toBeNull(); // the audio is cut short
    expect(parsePack(good.slice(0, 6))).toBeNull();
    expect(parsePack(new TextEncoder().encode('RIFF....not a pack'))).toBeNull();
    const bad = good.slice();
    bad[0] = 0x58;
    expect(parsePack(bad)).toBeNull();
    const huge = good.slice();
    new DataView(huge.buffer).setUint32(4, 0x7fffffff, true);
    expect(parsePack(huge)).toBeNull();
  });
  it('finds the paragraph being read and where to start from a paragraph', () => {
    expect(paragraphAt(lines(), 1)).toBe(0);
    expect(paragraphAt(lines(), 2.7)).toBe(0); // the small pause after a line still belongs to it
    expect(paragraphAt(lines(), 4)).toBe(1);
    expect(paragraphAt(lines(), 20)).toBe(-1);
    expect(startOf(lines(), 0)).toBe(0);
    expect(startOf(lines(), 2)).toBeCloseTo(6.25, 2);
    expect(startOf(lines(), 9)).toBe(0);
  });
});

describe('The list of recordings', () => {
  const sha = 'a'.repeat(64);
  it('keeps only entries that are properly formed', () => {
    const m = parseManifest({
      v: 1,
      stories: {
        good_story: { asset: 'elodie.good_story.dvp', sha256: sha, size: 1000, seconds: 60 },
        'Bad Id': { asset: 'x.dvp', sha256: sha, size: 10, seconds: 1 },
        no_sum: { asset: 'elodie.no_sum.dvp', sha256: 'zz', size: 10, seconds: 1 },
        wrong_name: { asset: '../../evil.exe', sha256: sha, size: 10, seconds: 1 },
        too_big: { asset: 'elodie.too_big.dvp', sha256: sha, size: 1e12, seconds: 1 }
      }
    })!;
    expect(Object.keys(m.stories)).toEqual(['good_story']);
    expect(parseManifest('junk')).toBeNull();
    expect(parseManifest({ v: 2, stories: {} })).toBeNull();
  });
  it('lives under a release named for the voice, and only there', () => {
    expect(packTag(elodie)).toBe('voices_elodie');
    expect(packUrl(elodie, 'voicepacks.json')).toBe('https://github.com/Dracylfrr/CloudFreeLife/releases/download/voices_elodie/voicepacks.json');
  });
});

describe('Downloading and keeping recordings', () => {
  let st: MemoryStorage;
  const files = new Map<string, Uint8Array>();
  const asked: string[] = [];
  const get: HttpGet = async (url) => {
    asked.push(url);
    const name = url.split('/').pop()!;
    const bytes = files.get(name);
    if (!bytes) return { status: 404, contentType: '', bytes: new Uint8Array(0) };
    return { status: 200, contentType: 'application/octet-stream', bytes };
  };
  let manifest: PackManifest;

  beforeEach(async () => {
    st = new MemoryStorage();
    setStorage(st);
    files.clear();
    asked.length = 0;
    const stories: PackManifest['stories'] = {};
    for (const id of ['one', 'two']) {
      const bytes = pack(id);
      files.set(`elodie.${id}.dvp`, bytes);
      stories[id] = { asset: `elodie.${id}.dvp`, sha256: await sha256Hex(bytes), size: bytes.length, seconds: 13 };
    }
    manifest = { v: 1, stories };
    files.set('voicepacks.json', new TextEncoder().encode(JSON.stringify(manifest)));
  });

  it('reads the list, and says so when there is none yet or no connection', async () => {
    const r = await fetchManifest(elodie, get);
    expect(r.ok && Object.keys(r.manifest.stories)).toEqual(['one', 'two']);
    files.clear();
    expect(await fetchManifest(elodie, get)).toEqual({ ok: false, reason: 'missing' });
    expect(await fetchManifest(elodie, async () => { throw new Error('offline'); })).toEqual({ ok: false, reason: 'offline' });
  });

  it('downloads one story or all of them, checks each file, and does not fetch what is already here', async () => {
    const one = await downloadPacks(elodie, manifest, ['one'], () => {}, get);
    expect(one).toEqual({ ok: true, count: 1 });
    expect(await hasPack(elodie, 'one')).toBe(true);
    expect(await hasPack(elodie, 'two')).toBe(false);
    const all = await downloadPacks(elodie, manifest, undefined, () => {}, get);
    expect(all).toEqual({ ok: true, count: 1 });
    expect(asked.filter((u) => u.endsWith('elodie.one.dvp'))).toHaveLength(1);
    expect(Object.keys(await installedPacks(elodie)).sort()).toEqual(['one', 'two']);
    const p = (await loadPack(elodie, 'two'))!;
    expect(p.header.story).toBe('two');
    expect(p.audio('c1')!.length).toBe(300);
  });

  it('throws away a file that does not match its checksum, and one that is the wrong size', async () => {
    const tampered = pack('one');
    tampered[tampered.length - 1] ^= 1;
    files.set('elodie.one.dvp', tampered);
    const r = await downloadPacks(elodie, manifest, ['one'], () => {}, get);
    expect(r.ok).toBe(false);
    expect(await hasPack(elodie, 'one')).toBe(false);
    files.set('elodie.one.dvp', pack('one').slice(0, 100));
    expect((await downloadPacks(elodie, manifest, ['one'], () => {}, get)).ok).toBe(false);
  });

  it('takes a story or every recording of a voice off again', async () => {
    await downloadPacks(elodie, manifest, undefined, () => {}, get);
    await removePacks(elodie, 'one');
    expect(Object.keys(await installedPacks(elodie))).toEqual(['two']);
    await removePacks(elodie);
    expect(await installedPacks(elodie)).toEqual({});
    expect(await loadPack(elodie, 'two')).toBeNull();
  });
});

describe('Where recordings show up in the app', () => {
  const read = (f: string) => readFileSync(f, 'utf8');
  it('every voice has a sample that comes with the app', () => {
    for (const v of VOICES) expect(() => readFileSync(`public/voices/samples/${v.pack}.opus`), v.name).not.toThrow();
  });
  it('the Listen bar plays a downloaded recording first, and both readers say which part they are on', () => {
    expect(read('src/features/voices/ListenBar.svelte')).toContain('listenRecorded');
    expect(read('src/features/stories/StoryReader.svelte')).toContain('unit={`c${page + 1}`}');
    expect(read('src/features/stories/AdventurePlayer.svelte')).toContain('unit={currentId(run)}');
  });
  it('Settings and each story offer the recordings', () => {
    expect(read('src/features/settings/Settings.svelte')).toContain('<RecordedVoices');
    expect(read('src/features/voices/VoicesPanel.svelte')).toContain('<StoryRecording');
  });
});
