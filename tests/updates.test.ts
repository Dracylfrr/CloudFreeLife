// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GITHUB_REPO, RELEASE_MANIFEST_ASSET } from '../src/core/config';
import { buildCatalog } from '../src/core/content/registry';
import { InstalledTree, MapTree } from '../src/core/content/tree';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { digestsEqual, sha256Hex, verifyChecksum } from '../src/features/updates/checksum';
import { NetworkError, setHttpGet, type HttpGet } from '../src/features/updates/http';
import { installPack, listInstalledPacks, parsePack, svgIsPassive, uninstallPack, validatePackContents, verifyDownloadedAsset } from '../src/features/updates/packs';
import {
  describeUpdate,
  noticeText,
  isTrustedDownloadUrl,
  parseReleaseManifest,
  parseReleases,
  parseTag,
  planFromManifest,
  releaseMayMatter,
  type ReleaseInfo
} from '../src/features/updates/release';
import { hideForNow, installContentUpdate, runUpdateCheck, toastCandidate, updateState, type UpdateState } from '../src/features/updates/updater';
import { get } from 'svelte/store';
import { readAllText } from './helpers/diskTree';

const enc = (s: string) => new TextEncoder().encode(s);
const dl = (tag: string, name: string) => `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${name}`;

/** Builds a small, valid "Castle Dreams" book pack by cloning a bundled page. */
async function castlePack(version = '1.0.0', minAppVersion = '1.0.0') {
  const files = await readAllText();
  const src = 'books/cloud_dreams/pages/01_cloud_castle';
  const dst = 'books/castle_dreams/pages/01_castle';
  const out: Record<string, { encoding: 'utf8'; data: string }> = {};
  for (const f of ['lineart.svg', 'thumbnail.svg', 'regions.json']) out[`${dst}/${f}`] = { encoding: 'utf8', data: files[`${src}/${f}`] };
  out[`${dst}/page_manifest.json`] = { encoding: 'utf8', data: JSON.stringify({ id: 'castle', name: 'Castle', description: 'x', version, minAppVersion, thumbnail: 'thumbnail.svg', lineArt: 'lineart.svg', regions: 'regions.json' }) };
  out['books/castle_dreams/cover.svg'] = { encoding: 'utf8', data: files['books/cloud_dreams/cover.svg'] };
  out['books/castle_dreams/book_manifest.json'] = { encoding: 'utf8', data: JSON.stringify({ id: 'castle_dreams', name: 'Castle Dreams', description: 'Castles!', cover: 'cover.svg', version, minAppVersion, kind: 'coloring', pages: ['01_castle'] }) };
  return { format: 1, kind: 'book', id: 'castle_dreams', name: 'Castle Dreams', version, minAppVersion, files: out };
}

const releaseJson = (tag: string, assets: { name: string; size?: number }[], extra: object = {}) => ({
  tag_name: tag,
  name: tag,
  body: 'Notes',
  html_url: `https://github.com/${GITHUB_REPO}/releases/tag/${tag}`,
  draft: false,
  prerelease: false,
  published_at: '2026-12-01T00:00:00Z',
  assets: assets.map((a) => ({ name: a.name, size: a.size ?? 100, content_type: 'application/octet-stream', browser_download_url: dl(tag, a.name) })),
  ...extra
});

describe('checksum verification', () => {
  it('matches the SHA-256 test vector for "abc"', async () => {
    expect(await sha256Hex(enc('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('accepts matching and rejects tampered data', async () => {
    const good = enc('hello pack');
    const sum = await sha256Hex(good);
    expect(await verifyChecksum(good, sum)).toBe(true);
    expect(await verifyChecksum(good, sum.toUpperCase())).toBe(true);
    expect(await verifyChecksum(enc('hello pack!'), sum)).toBe(false);
    expect(digestsEqual('', '')).toBe(false);
  });
  it('verifyDownloadedAsset checks size, content type and checksum', async () => {
    const bytes = enc('{"a":1}');
    const asset = { name: 'x_v1.0.0.cfpack', size: bytes.length, sha256: await sha256Hex(bytes), contentType: 'application/json' };
    expect((await verifyDownloadedAsset(asset, bytes, 'application/octet-stream')).ok).toBe(true);
    expect((await verifyDownloadedAsset({ ...asset, size: 3 }, bytes, 'application/json')).ok).toBe(false);
    expect((await verifyDownloadedAsset(asset, bytes, 'text/html')).ok).toBe(false);
    expect((await verifyDownloadedAsset({ ...asset, sha256: 'a'.repeat(64) }, bytes, 'application/json')).ok).toBe(false);
  });
});

describe('update parsing', () => {
  it('parses release lists and drops drafts / malformed entries', () => {
    const list = parseReleases([releaseJson('v1.1.0', [{ name: RELEASE_MANIFEST_ASSET }]), { tag_name: 'v9', draft: true }, 'junk', { nope: 1 }, releaseJson('castle_dreams_v1.0.0', [])]);
    expect(list.map((r) => r.tag)).toEqual(['v1.1.0', 'castle_dreams_v1.0.0']);
    expect(parseReleases(null)).toEqual([]);
  });

  it('understands app and content tags', () => {
    expect(parseTag('v1.1.0')).toEqual({ type: 'app', version: '1.1.0' });
    expect(parseTag('castle_dreams_v1.0.0')).toEqual({ type: 'content', id: 'castle_dreams', version: '1.0.0' });
    expect(parseTag('release-final')).toBeNull();
    expect(parseTag('vbanana')).toBeNull();
  });

  it('only trusts HTTPS asset downloads from this project\'s own releases', () => {
    expect(isTrustedDownloadUrl(dl('v1.1.0', 'a.exe'), 'v1.1.0', 'a.exe')).toBe(true);
    expect(isTrustedDownloadUrl(dl('v1.1.0', 'a.exe'), 'v1.2.0')).toBe(false);
    expect(isTrustedDownloadUrl(`http://github.com/${GITHUB_REPO}/releases/download/v1/a`)).toBe(false);
    expect(isTrustedDownloadUrl('https://github.com/someone-else/repo/releases/download/v1/a')).toBe(false);
    expect(isTrustedDownloadUrl('https://evil.example.com/a.exe')).toBe(false);
    expect(isTrustedDownloadUrl('https://user:pw@github.com/x')).toBe(false);
    expect(isTrustedDownloadUrl('not a url')).toBe(false);
    expect(isTrustedDownloadUrl('https://objects.githubusercontent.com/whatever')).toBe(true);
  });

  const sha = 'a'.repeat(64);
  const goodManifest = {
    schema: 1,
    release: '1.1.0',
    notes: 'Hello',
    app: { version: '1.1.0', asset: { name: 'Cloud-Freelife_1.1.0_x64-setup.exe', sha256: sha, size: 1000, contentType: 'application/octet-stream' } },
    content: [{ type: 'book', id: 'castle_dreams', name: 'Castle Dreams', version: '1.0.0', minAppVersion: '1.0.0', asset: { name: 'castle_dreams_v1.0.0.cfpack', sha256: sha, size: 500, contentType: 'application/json' } }]
  };

  it('validates release manifests', () => {
    expect(parseReleaseManifest(goodManifest).ok).toBe(true);
    const bad = (m: unknown) => parseReleaseManifest(m).ok;
    expect(bad({ ...goodManifest, schema: 2 })).toBe(false);
    expect(bad({ ...goodManifest, release: 'latest' })).toBe(false);
    expect(bad({ schema: 1, release: '1.0.0', content: [] })).toBe(false); // nothing to install
    const c = goodManifest.content[0];
    expect(bad({ ...goodManifest, content: [{ ...c, asset: { ...c.asset, sha256: 'xyz' } }] })).toBe(false);
    expect(bad({ ...goodManifest, content: [{ ...c, asset: { ...c.asset, name: 'other_v1.0.0.cfpack' } }] })).toBe(false); // name must match id
    expect(bad({ ...goodManifest, content: [{ ...c, asset: { ...c.asset, name: '../castle_dreams_v1.0.0.cfpack' } }] })).toBe(false);
    expect(bad({ ...goodManifest, content: [{ ...c, asset: { ...c.asset, contentType: 'text/html' } }] })).toBe(false);
    expect(bad({ ...goodManifest, content: [{ ...c, type: 'program' }] })).toBe(false);
    expect(bad({ ...goodManifest, app: { ...goodManifest.app, asset: { ...goodManifest.app.asset, name: 'evil.exe' } } })).toBe(false);
  });

  it('plans updates: newer app, new book, skips installed / incompatible', () => {
    const m = parseReleaseManifest(goodManifest);
    if (!m.ok) throw new Error('manifest');
    const rel: ReleaseInfo = parseReleases([releaseJson('v1.1.0', [{ name: RELEASE_MANIFEST_ASSET }, { name: 'Cloud-Freelife_1.1.0_x64-setup.exe' }, { name: 'castle_dreams_v1.0.0.cfpack' }])])[0];
    const items = planFromManifest(m.value, rel, '1.0.0', {});
    expect(items.map((i) => describeUpdate(i))).toEqual(['Update available — v1.1.0', 'New coloring book available — Castle Dreams']);
    expect(planFromManifest(m.value, rel, '1.1.0', { castle_dreams: '1.0.0' })).toEqual([]);
    expect(planFromManifest(m.value, rel, '1.0.0', { castle_dreams: '0.9.0' }).some((i) => i.kind === 'content')).toBe(true);
    const future = parseReleaseManifest({ ...goodManifest, content: [{ ...goodManifest.content[0], minAppVersion: '3.0.0' }] });
    if (!future.ok) throw new Error('manifest');
    expect(planFromManifest(future.value, rel, '1.0.0', {}).some((i) => i.kind === 'content')).toBe(false);
  });

  it('skips releases that cannot matter without downloading their manifests', () => {
    const rel = (tag: string, withManifest = true, pre = false) => parseReleases([releaseJson(tag, withManifest ? [{ name: RELEASE_MANIFEST_ASSET }] : [], { prerelease: pre })])[0];
    expect(releaseMayMatter(rel('v1.1.0'), '1.0.0', {})).toBe(true);
    expect(releaseMayMatter(rel('v1.0.0'), '1.0.0', {})).toBe(false);
    expect(releaseMayMatter(rel('v1.1.0', false), '1.0.0', {})).toBe(false);
    expect(releaseMayMatter(rel('v1.1.0', true, true), '1.0.0', {})).toBe(false);
    expect(releaseMayMatter(rel('castle_dreams_v1.0.0'), '1.0.0', {})).toBe(true);
    expect(releaseMayMatter(rel('castle_dreams_v1.0.0'), '1.0.0', { castle_dreams: '1.0.0' })).toBe(false);
  });

  it('words the top-right notice around new content, with the headline from the release manifest', () => {
    const withHeadline = parseReleaseManifest({ ...goodManifest, headline: '2 new books and a new mini-game' });
    if (!withHeadline.ok) throw new Error('manifest');
    expect(withHeadline.value.headline).toBe('2 new books and a new mini-game');
    const rel: ReleaseInfo = parseReleases([releaseJson('v1.1.0', [{ name: RELEASE_MANIFEST_ASSET }, { name: 'Cloud-Freelife_1.1.0_x64-setup.exe' }, { name: 'castle_dreams_v1.0.0.cfpack' }])])[0];
    const [app, book] = planFromManifest(withHeadline.value, rel, '1.0.0', {});
    expect(noticeText(app)).toEqual({ title: 'Cloud-Freelife 1.1.0 is available', detail: '2 new books and a new mini-game' });
    expect(noticeText(book)).toEqual({ title: 'New content is ready', detail: 'New coloring book available — Castle Dreams' });
    const plain = parseReleaseManifest(goodManifest);
    if (!plain.ok) throw new Error('manifest');
    expect(noticeText(planFromManifest(plain.value, rel, '1.0.0', {})[0])).toEqual({ title: 'Cloud-Freelife 1.1.0 is available', detail: 'A new version is ready to install' });
    // the Update Center list keeps the plain wording
    expect(describeUpdate(app)).toBe('Update available — v1.1.0');
  });

  it('shows the update toast only for updates not dismissed', () => {
    const item = { kind: 'app', version: '1.1.0', notes: '', includes: [] as string[], releaseUrl: '' } as const;
    const state: UpdateState = { outcome: 'available', available: [item], lastChecked: 1, message: '', busy: [], hidden: [], installers: {} };
    expect(toastCandidate(state, [])).toBe(item);
    expect(toastCandidate(state, ['app:1.1.0'])).toBeNull();
    expect(toastCandidate({ ...state, hidden: ['app:1.1.0'] }, [])).toBeNull();
  });

  it('"Later" hides every currently available update so a second notice never pops up', () => {
    const app = { kind: 'app', version: '1.1.0', notes: '', includes: [] as string[], releaseUrl: '' } as const;
    const book = { kind: 'content', contentKind: 'book', id: 'castle_dreams', name: 'Castle Dreams', description: '', version: '1.0.0', minAppVersion: '1.0.0', releaseUrl: '', downloadUrl: '', asset: { name: '', sha256: '', size: 1, contentType: '' } } as const;
    updateState.set({ outcome: 'available', available: [app, book], lastChecked: 1, message: '', busy: [], hidden: [], installers: {} });
    hideForNow(app);
    expect(toastCandidate(get(updateState), [])).toBeNull();
    expect(get(updateState).available).toHaveLength(2); // still listed in the Update Center
  });
});

describe('content packs', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => setStorage(null));

  it('installs a valid pack and the book appears in the catalog', async () => {
    const pack = await castlePack();
    const parsed = parsePack(enc(JSON.stringify(pack)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = await installPack(parsed.value);
    expect(res.ok).toBe(true);
    const cat = await buildCatalog([new InstalledTree()]);
    expect(cat.books.map((b) => b.manifest.name)).toEqual(['Castle Dreams']);
    expect(cat.books[0].pages).toHaveLength(1);
    expect((await listInstalledPacks())[0]).toMatchObject({ id: 'castle_dreams', version: '1.0.0' });
    await uninstallPack('castle_dreams');
    expect((await buildCatalog([new InstalledTree()])).books).toHaveLength(0);
    expect(await listInstalledPacks()).toEqual([]);
  });

  it('rejects malicious or malformed packs', async () => {
    const pack = await castlePack();
    const p = (mut: (x: typeof pack) => void) => {
      const c = structuredClone(pack);
      mut(c);
      return parsePack(enc(JSON.stringify(c)));
    };
    expect(p((x) => (x.files['../escape.json'] = { encoding: 'utf8', data: '{}' })).ok).toBe(false);
    expect(p((x) => (x.files['books/castle_dreams/run.exe'] = { encoding: 'utf8', data: 'MZ' })).ok).toBe(false);
    expect(p((x) => (x.files['settings.json'] = { encoding: 'utf8', data: '{}' })).ok).toBe(false); // outside content folders
    expect(p((x) => (x.files['books/castle_dreams/evil.svg'] = { encoding: 'utf8', data: '<svg><script>alert(1)</script></svg>' })).ok).toBe(false);
    expect(p((x) => (x.files['books/castle_dreams/evil.svg'] = { encoding: 'utf8', data: '<svg><image href="https://x.test/a.png"/></svg>' })).ok).toBe(false);
    expect(p((x) => (x.id = 'Bad Id')).ok).toBe(false);
    expect(parsePack(enc('not json')).ok).toBe(false);
    expect(parsePack(enc('{"format":2}')).ok).toBe(false);
    expect(svgIsPassive('<svg><path d="M0 0"/></svg>')).toBe(true);
    expect(svgIsPassive('<svg onload="x()"></svg>')).toBe(false);
  });

  it('refuses packs that need a newer app or contain invalid manifests, and writes nothing', async () => {
    const future = await castlePack('1.0.0', '5.0.0');
    const f = parsePack(enc(JSON.stringify(future)));
    if (!f.ok) throw new Error('parse');
    const r = await installPack(f.value);
    expect(r.ok).toBe(false);
    expect(await mem.list('')).toEqual([]);

    const broken = await castlePack();
    broken.files['books/castle_dreams/pages/01_castle/regions.json'] = { encoding: 'utf8', data: '{"viewBox":[1,1],"regions":[]}' };
    const b = parsePack(enc(JSON.stringify(broken)));
    if (!b.ok) throw new Error('parse');
    expect((await validatePackContents(b.value)).ok).toBe(false);
  });

  it('shows installed content next to bundled content', async () => {
    const files = await readAllText();
    const bundled = new MapTree('bundled', files);
    const pack = parsePack(enc(JSON.stringify(await castlePack())));
    if (!pack.ok) throw new Error('parse');
    await installPack(pack.value);
    const cat = await buildCatalog([bundled, new InstalledTree()]);
    expect(cat.books.map((b) => b.manifest.id)).toContain('castle_dreams');
    expect(cat.books.map((b) => b.manifest.id)).toContain('cloud_dreams');
  });
});

describe('update check and install flow', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => {
    setStorage(null);
    setHttpGet(null);
  });

  const respond = (routes: Record<string, { status?: number; body?: unknown | Uint8Array; type?: string } | Error>): HttpGet => async (url) => {
    const r = routes[url];
    if (!r) return { status: 404, contentType: 'text/plain', bytes: new Uint8Array() };
    if (r instanceof Error) throw r;
    const body = ArrayBuffer.isView(r.body) ? (r.body as Uint8Array) : enc(JSON.stringify(r.body ?? {}));
    return { status: r.status ?? 200, contentType: r.type ?? 'application/json', bytes: body };
  };
  const LIST = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`;

  it('is offline-safe: network failure returns a friendly state, never throws', async () => {
    setHttpGet(respond({ [LIST]: new NetworkError('Could not reach GitHub') }));
    const r = await runUpdateCheck('1.0.0');
    expect(r.outcome).toBe('offline');
    expect(r.items).toEqual([]);
    expect(r.message).toMatch(/offline/i);
  });

  it('handles 404, rate limits, server errors and garbage responses', async () => {
    for (const [status, outcome] of [[404, 'up_to_date'], [403, 'error'], [429, 'error'], [500, 'error']] as const) {
      setHttpGet(respond({ [LIST]: { status, body: {} } }));
      expect((await runUpdateCheck('1.0.0')).outcome).toBe(outcome);
    }
    setHttpGet(async () => ({ status: 200, contentType: 'application/json', bytes: enc('<html>') }));
    expect((await runUpdateCheck('1.0.0')).outcome).toBe('error');
  });

  it('reports up to date when nothing newer exists', async () => {
    setHttpGet(respond({ [LIST]: { body: [releaseJson('v1.0.0', [{ name: RELEASE_MANIFEST_ASSET }])] } }));
    const r = await runUpdateCheck('1.0.0');
    expect(r.outcome).toBe('up_to_date');
  });

  it('finds an app update and a new book from release manifests', async () => {
    const pack = enc(JSON.stringify(await castlePack()));
    const manifest = {
      schema: 1,
      release: '1.1.0',
      app: { version: '1.1.0', asset: { name: 'Cloud-Freelife_1.1.0_x64-setup.exe', sha256: 'b'.repeat(64), size: 1234, contentType: 'application/octet-stream' } },
      content: [{ type: 'book', id: 'castle_dreams', name: 'Castle Dreams', version: '1.0.0', minAppVersion: '1.0.0', asset: { name: 'castle_dreams_v1.0.0.cfpack', sha256: await sha256Hex(pack), size: pack.length, contentType: 'application/json' } }]
    };
    setHttpGet(
      respond({
        [LIST]: { body: [releaseJson('v1.1.0', [{ name: RELEASE_MANIFEST_ASSET }, { name: 'Cloud-Freelife_1.1.0_x64-setup.exe' }, { name: 'castle_dreams_v1.0.0.cfpack' }])] },
        [dl('v1.1.0', RELEASE_MANIFEST_ASSET)]: { body: manifest }
      })
    );
    const r = await runUpdateCheck('1.0.0');
    expect(r.outcome).toBe('available');
    expect(r.items.map(describeUpdate)).toEqual(['Update available — v1.1.0', 'New coloring book available — Castle Dreams']);
  });

  it('ignores a release whose manifest is invalid', async () => {
    setHttpGet(
      respond({
        [LIST]: { body: [releaseJson('v1.1.0', [{ name: RELEASE_MANIFEST_ASSET }])] },
        [dl('v1.1.0', RELEASE_MANIFEST_ASSET)]: { body: { schema: 1, release: 'x' } }
      })
    );
    expect((await runUpdateCheck('1.0.0')).outcome).toBe('up_to_date');
  });

  async function contentItem(packBytes: Uint8Array, over: { sha?: string; size?: number } = {}) {
    const manifest = {
      schema: 1,
      release: '1.0.0',
      content: [{ type: 'book', id: 'castle_dreams', name: 'Castle Dreams', version: '1.0.0', minAppVersion: '1.0.0', asset: { name: 'castle_dreams_v1.0.0.cfpack', sha256: over.sha ?? (await sha256Hex(packBytes)), size: over.size ?? packBytes.length, contentType: 'application/json' } }]
    };
    const m = parseReleaseManifest(manifest);
    if (!m.ok) throw new Error(m.errors.join());
    const rel = parseReleases([releaseJson('castle_dreams_v1.0.0', [{ name: RELEASE_MANIFEST_ASSET }, { name: 'castle_dreams_v1.0.0.cfpack' }])])[0];
    return planFromManifest(m.value, rel, '1.0.0', {})[0];
  }

  it('downloads, verifies and installs a content update', async () => {
    const bytes = enc(JSON.stringify(await castlePack()));
    const item = await contentItem(bytes);
    setHttpGet(respond({ [dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.cfpack')]: { body: bytes, type: 'application/octet-stream' } }));
    const r = await installContentUpdate(item);
    expect(r).toMatchObject({ ok: true });
    expect((await buildCatalog([new InstalledTree()])).books.map((b) => b.manifest.name)).toEqual(['Castle Dreams']);
  });

  it('rejects a download whose checksum does not match, installing nothing', async () => {
    const bytes = enc(JSON.stringify(await castlePack()));
    const item = await contentItem(bytes, { sha: 'c'.repeat(64) });
    setHttpGet(respond({ [dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.cfpack')]: { body: bytes } }));
    const r = await installContentUpdate(item);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/checksum/i);
    expect(await mem.list('')).toEqual([]);
  });

  it('rejects an unexpected content type and a failed download', async () => {
    const bytes = enc(JSON.stringify(await castlePack()));
    const item = await contentItem(bytes);
    const url = dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.cfpack');
    setHttpGet(respond({ [url]: { body: bytes, type: 'text/html' } }));
    expect((await installContentUpdate(item)).ok).toBe(false);
    setHttpGet(respond({ [url]: new NetworkError('Could not reach GitHub') }));
    expect((await installContentUpdate(item)).ok).toBe(false);
    setHttpGet(respond({ [url]: { status: 500, body: {} } }));
    expect((await installContentUpdate(item)).ok).toBe(false);
  });
});
