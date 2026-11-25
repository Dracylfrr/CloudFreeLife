// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { GITHUB_REPO, RELEASE_MANIFEST_ASSET } from '../src/core/config';
import { buildCatalog } from '../src/core/content/registry';
import { InstalledTree } from '../src/core/content/tree';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { sha256Hex } from '../src/features/updates/checksum';
import { setHttpGet, type HttpGet } from '../src/features/updates/http';
import { listInstalledPacks } from '../src/features/updates/packs';
import { lockedFromManifest, parseReleaseManifest, parseReleases, planFromManifest } from '../src/features/updates/release';
import { installContentUpdate, runUpdateCheck } from '../src/features/updates/updater';
import { addLicense, licenseState, licensedIds, loadLicense, openEncryptedPack, removeLicense, setPremiumBackend, type LicenseInfo } from '../src/features/premium/license';
// the author's tool is plain JavaScript, so it has no type declarations
// @ts-ignore
import { decryptPack, encryptPack, makeLicense, newKey, verifyLicense } from '../scripts/dlc/lib.mjs';
import { readAllText } from './helpers/diskTree';

const enc = (s: string) => new TextEncoder().encode(s);
const dl = (tag: string, name: string) => `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${name}`;
const LIST = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`;

// A throwaway signing key for these tests, and a stand-in for the native side that follows the same rules.
const pair = generateKeyPairSync('ed25519');
const privatePem = pair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const publicPem = pair.publicKey.export({ type: 'spki', format: 'pem' }) as string;
const today = () => new Date().toISOString().slice(0, 10);

const fakeNative = {
  async checkLicense(text: string): Promise<LicenseInfo> {
    const l = JSON.parse(text);
    if (!verifyLicense(l, publicPem)) throw 'That file is not a valid license.';
    if (l.expires && today() > l.expires) throw 'This license has expired.';
    return { id: l.id, issued: l.issued, expires: l.expires, packs: l.packs.map((p: { id: string }) => p.id) };
  },
  async openPack(license: string, packId: string, packText: string): Promise<string> {
    const l = JSON.parse(license);
    if (!verifyLicense(l, publicPem)) throw 'That file is not a valid license.';
    const entry = l.packs.find((p: { id: string }) => p.id === packId);
    if (!entry) throw 'Your license does not include this content.';
    try {
      return decryptPack(packText, Buffer.from(entry.key, 'base64')).toString('base64');
    } catch {
      throw 'That content could not be opened.';
    }
  }
};

async function castlePack(version = '1.0.0') {
  const files = await readAllText();
  const src = 'books/cloud_dreams/pages/01_cloud_castle';
  const dst = 'books/castle_dreams/pages/01_castle';
  const out: Record<string, { encoding: 'utf8'; data: string }> = {};
  for (const f of ['lineart.svg', 'thumbnail.svg', 'regions.json']) out[`${dst}/${f}`] = { encoding: 'utf8', data: files[`${src}/${f}`] };
  out[`${dst}/page_manifest.json`] = { encoding: 'utf8', data: JSON.stringify({ id: 'castle', name: 'Castle', description: 'x', version, minAppVersion: '1.0.0', thumbnail: 'thumbnail.svg', lineArt: 'lineart.svg', regions: 'regions.json' }) };
  out['books/castle_dreams/cover.svg'] = { encoding: 'utf8', data: files['books/cloud_dreams/cover.svg'] };
  out['books/castle_dreams/book_manifest.json'] = { encoding: 'utf8', data: JSON.stringify({ id: 'castle_dreams', name: 'Castle Dreams', description: 'Castles!', cover: 'cover.svg', version, minAppVersion: '1.0.0', kind: 'coloring', pages: ['01_castle'] }) };
  return { format: 1, kind: 'book', id: 'castle_dreams', name: 'Castle Dreams', version, minAppVersion: '1.0.0', files: out };
}

const packKey = newKey();
const licenseFor = (packs: { id: string; key: Buffer }[], extra: { expires?: string | null } = {}) =>
  JSON.stringify(makeLicense({ id: 'test-license', issued: '2026-01-01', packs: packs.map((p) => ({ id: p.id, key: p.key.toString('base64') })), ...extra }, privatePem));

let mem: MemoryStorage;
beforeEach(() => {
  mem = new MemoryStorage();
  setStorage(mem);
  setPremiumBackend(fakeNative);
  licenseState.set({ status: 'unknown' });
});
afterEach(() => {
  setStorage(null);
  setPremiumBackend(null);
  setHttpGet(null);
});

async function premiumManifest() {
  const plain = Buffer.from(JSON.stringify(await castlePack()), 'utf8');
  const text = encryptPack(plain, { id: 'castle_dreams', name: 'Castle Dreams', kind: 'book', version: '1.0.0', minAppVersion: '1.0.0', description: 'Castles!' }, packKey);
  const bytes = enc(text);
  const manifest = {
    schema: 1,
    release: '1.0.0',
    content: [{ type: 'book', id: 'castle_dreams', name: 'Castle Dreams', description: 'Castles!', version: '1.0.0', minAppVersion: '1.0.0', premium: true, asset: { name: 'castle_dreams_v1.0.0.dreampack', sha256: await sha256Hex(bytes), size: bytes.length, contentType: 'application/octet-stream' } }]
  };
  const m = parseReleaseManifest(manifest);
  if (!m.ok) throw new Error(m.errors.join());
  const rel = parseReleases([{ tag_name: 'castle_dreams_v1.0.0', name: 'x', draft: false, prerelease: false, assets: [RELEASE_MANIFEST_ASSET, 'castle_dreams_v1.0.0.dreampack'].map((name) => ({ name, size: 1, content_type: 'application/octet-stream', browser_download_url: dl('castle_dreams_v1.0.0', name) })) }])[0];
  return { manifest, parsed: m.value, rel, bytes };
}

const respond = (routes: Record<string, unknown>): HttpGet => async (url) => {
  if (!(url in routes)) throw new Error(`unexpected request ${url}`);
  const body = routes[url];
  const bytes = ArrayBuffer.isView(body) ? (body as Uint8Array) : enc(JSON.stringify(body));
  return { status: 200, bytes, contentType: 'application/octet-stream' } as never;
};

describe('The version says whether it is Premium or Base', () => {
  it('is Base until a license has been applied, and Premium after', async () => {
    const { edition } = await import('../src/features/premium/license');
    expect(get(edition)).toBe('Base'); // nothing known yet
    await loadLicense();
    expect(get(edition)).toBe('Base');
    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    expect(get(edition)).toBe('Premium');
    await removeLicense();
    expect(get(edition)).toBe('Base');
  });
  it('is shown after the version number in the sidebar, About, Settings and Updates', () => {
    for (const f of ['src/ui/Sidebar.svelte', 'src/features/about/About.svelte', 'src/features/settings/Settings.svelte', 'src/features/updates/Updates.svelte']) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).toContain('$edition');
      expect(src, f).toMatch(/\{APP_VERSION\}[^\n]*\{\$edition\}/);
    }
  });
});

describe('Premium packs in a release manifest', () => {
  it('a premium pack is a .dreampack and a free pack is a .cfpack', async () => {
    const { manifest } = await premiumManifest();
    expect(parseReleaseManifest(manifest).ok).toBe(true);
    const wrongName = structuredClone(manifest);
    wrongName.content[0].asset.name = 'castle_dreams_v1.0.0.cfpack';
    expect(parseReleaseManifest(wrongName).ok).toBe(false);
    const freeButEncrypted = structuredClone(manifest) as { content: { premium?: boolean }[] };
    delete freeButEncrypted.content[0].premium;
    expect(parseReleaseManifest(freeButEncrypted).ok).toBe(false);
  });

  it('a premium pack is never offered as an update until a license opens it', async () => {
    const { parsed, rel } = await premiumManifest();
    expect(planFromManifest(parsed, rel, '1.8.0', {})).toEqual([]);
    const items = planFromManifest(parsed, rel, '1.8.0', {}, new Set(['castle_dreams']));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'content', id: 'castle_dreams', premium: true });
  });

  it('a locked pack is listed as locked, but not once it is licensed or installed', async () => {
    const { parsed, rel } = await premiumManifest();
    expect(lockedFromManifest(parsed, rel, '1.8.0', {}).map((l) => l.id)).toEqual(['castle_dreams']);
    expect(lockedFromManifest(parsed, rel, '1.8.0', {}, new Set(['castle_dreams']))).toEqual([]);
    expect(lockedFromManifest(parsed, rel, '1.8.0', { castle_dreams: '1.0.0' })).toEqual([]);
    // a pack that needs a newer app is not listed either
    expect(lockedFromManifest(parsed, rel, '1.0.0', {}, new Set())).toHaveLength(1);
  });
});

describe('A license file put in the folder applies itself, then removes itself', () => {
  const lic = (id: string, packs: { id: string; key: Buffer }[], extra: { expires?: string | null } = {}) => JSON.stringify(makeLicense({ id, issued: '2026-01-01', packs: packs.map((p) => ({ id: p.id, key: p.key.toString('base64') })), ...extra }, privatePem));
  const dropped = async () => (await mem.list('')).filter((n) => n.toLowerCase().endsWith('.dreamlicense'));
  const kept = async () => (await mem.list('premium')).sort();

  it('applies a file dropped into the folder, whatever it is called, and deletes that file', async () => {
    await mem.writeText('from-a-friend.dreamlicense', lic('friend-1', [{ id: 'castle_dreams', key: packKey }]));
    expect(get(licenseState).status).toBe('unknown');
    const s = await loadLicense();
    expect(s.status).toBe('ok');
    expect([...licensedIds()]).toEqual(['castle_dreams']);
    expect(await dropped()).toEqual([]); // the file has done its job
    expect(await kept()).toEqual(['friend-1.lic']); // what the app needs is kept inside its own premium folder
  });
  it('keeps working after the file is gone, and after a restart, including for later pack updates', async () => {
    await mem.writeText('license.dreamlicense', lic('keep-1', [{ id: 'castle_dreams', key: packKey }]));
    await loadLicense();
    licenseState.set({ status: 'unknown' });
    expect((await loadLicense()).status).toBe('ok');
    expect([...licensedIds()]).toEqual(['castle_dreams']);
    const { bytes } = await premiumManifest();
    expect((await openEncryptedPack('castle_dreams', new TextDecoder().decode(bytes))).ok).toBe(true);
  });
  it('leaves a file that is not a valid license exactly where it is, and says so plainly', async () => {
    await mem.writeText('notes.txt', 'not a license');
    await mem.writeText('settings.json', '{}');
    expect((await loadLicense()).status).toBe('none');
    await mem.writeText('broken.dreamlicense', '{"format":1}');
    const s = await loadLicense();
    expect(s).toEqual({ status: 'bad', message: 'That file is not a valid license.' });
    expect(await dropped()).toEqual(['broken.dreamlicense']);
    expect(await mem.exists('notes.txt')).toBe(true);
    expect(licensedIds().size).toBe(0);
  });
  it('an expired or forged license file is not applied and not deleted', async () => {
    const other = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    await mem.writeText('old.dreamlicense', lic('old-1', [{ id: 'castle_dreams', key: packKey }], { expires: '2020-01-01' }));
    await mem.writeText('forged.dreamlicense', JSON.stringify(makeLicense({ id: 'forged-1', issued: '2026-01-01', packs: [{ id: 'castle_dreams', key: packKey.toString('base64') }] }, other)));
    expect((await loadLicense()).status).toBe('bad');
    expect((await dropped()).sort()).toEqual(['forged.dreamlicense', 'old.dreamlicense']);
    expect(await kept()).toEqual([]);
  });
  it('a bad file beside a good one does not matter: the good one applies, the bad one stays', async () => {
    await mem.writeText('broken.dreamlicense', 'junk');
    await mem.writeText('good.dreamlicense', lic('ok-1', [{ id: 'castle_dreams', key: packKey }]));
    expect((await loadLicense()).status).toBe('ok');
    expect(await dropped()).toEqual(['broken.dreamlicense']);
  });
  it('applies several files together, and opens each pack with the license that covers it', async () => {
    await mem.writeText('a.dreamlicense', lic('one-1', [{ id: 'castle_dreams', key: packKey }]));
    await mem.writeText('b.DreamLicense', lic('two-2', [{ id: 'sky_post', key: newKey() }]));
    const s = await loadLicense();
    expect(s.status === 'ok' && s.info.packs.sort()).toEqual(['castle_dreams', 'sky_post']);
    expect(s.status === 'ok' && s.found).toHaveLength(2);
    expect(await dropped()).toEqual([]);
    const { bytes } = await premiumManifest();
    expect((await openEncryptedPack('castle_dreams', new TextDecoder().decode(bytes))).ok).toBe(true);
    expect((await openEncryptedPack('sky_post', new TextDecoder().decode(bytes))).ok).toBe(false); // right license, wrong pack contents
  });
  it('the same license dropped in again is applied once, and its file is removed again', async () => {
    const text = lic('same-1', [{ id: 'castle_dreams', key: packKey }]);
    await mem.writeText('x.dreamlicense', text);
    await loadLicense();
    await mem.writeText('x-again.dreamlicense', text);
    await loadLicense();
    expect(await kept()).toEqual(['same-1.lic']);
    expect(await dropped()).toEqual([]);
  });
  it('choosing a file on the Updates page applies it the same way, with no copy left in the folder', async () => {
    const a = lic('first-1', [{ id: 'castle_dreams', key: packKey }]);
    const b = lic('second-2', [{ id: 'sky_post', key: newKey() }]);
    expect((await addLicense(a)).ok).toBe(true);
    expect((await addLicense(b)).ok).toBe(true);
    expect(await dropped()).toEqual([]);
    expect(await kept()).toEqual(['first-1.lic', 'second-2.lic']);
    const s = get(licenseState);
    expect(s.status === 'ok' && s.info.packs.sort()).toEqual(['castle_dreams', 'sky_post']);
  });
  it('removing forgets every license, applied or waiting', async () => {
    await mem.writeText('a.dreamlicense', lic('one-1', [{ id: 'castle_dreams', key: packKey }]));
    await loadLicense();
    await mem.writeText('waiting.dreamlicense', 'junk');
    await removeLicense();
    expect(await kept()).toEqual([]);
    expect(await dropped()).toEqual([]);
    expect(get(licenseState)).toEqual({ status: 'none' });
  });
});

describe('The license the person adds', () => {
  it('keeps a good license, shows what it covers and survives a restart', async () => {
    const text = licenseFor([{ id: 'castle_dreams', key: packKey }]);
    const r = await addLicense(text);
    expect(r.ok).toBe(true);
    expect(await mem.list('premium')).toHaveLength(1);
    expect((await mem.list('')).filter((n) => n.endsWith('.dreamlicense'))).toEqual([]);
    expect([...licensedIds()]).toEqual(['castle_dreams']);
    licenseState.set({ status: 'unknown' });
    expect((await loadLicense()).status).toBe('ok');
    expect([...licensedIds()]).toEqual(['castle_dreams']);
  });

  it('refuses a license that was not signed by the author, and keeps nothing', async () => {
    const other = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const forged = JSON.stringify(makeLicense({ id: 'forged-1', issued: '2026-01-01', packs: [{ id: 'castle_dreams', key: packKey.toString('base64') }] }, other));
    const r = await addLicense(forged);
    expect(r).toEqual({ ok: false, error: 'That file is not a valid license.' });
    expect(await mem.list('premium')).toEqual([]);
    expect(licensedIds().size).toBe(0);
    // junk and oversized input are refused without a crash
    for (const bad of ['', 'not json', '{}', 'x'.repeat(70000)]) expect((await addLicense(bad)).ok).toBe(false);
  });

  it('refuses an expired license and an edited one', async () => {
    expect((await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }], { expires: '2020-01-01' }))).ok).toBe(false);
    const edited = JSON.parse(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    edited.packs.push({ id: 'other_pack', key: newKey().toString('base64') });
    expect((await addLicense(JSON.stringify(edited))).ok).toBe(false);
  });

  it('can be removed, and without one nothing is licensed', async () => {
    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    await removeLicense();
    expect(await mem.list('premium')).toEqual([]);
    expect(get(licenseState)).toEqual({ status: 'none' });
    expect(licensedIds().size).toBe(0);
  });

  it('outside the desktop app there is no way to check a license, and that is said plainly', async () => {
    setPremiumBackend(null);
    const r = await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.error).toMatch(/desktop app/);
  });
});

describe('Checking for updates with premium packs', () => {
  it('lists a premium pack as locked without a license, and as an update with one', async () => {
    const { manifest, bytes } = await premiumManifest();
    const routes = {
      [LIST]: [{ tag_name: 'castle_dreams_v1.0.0', name: 'x', draft: false, prerelease: false, assets: [RELEASE_MANIFEST_ASSET, 'castle_dreams_v1.0.0.dreampack'].map((name) => ({ name, size: 1, content_type: 'application/octet-stream', browser_download_url: dl('castle_dreams_v1.0.0', name) })) }],
      [dl('castle_dreams_v1.0.0', RELEASE_MANIFEST_ASSET)]: manifest,
      [dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.dreampack')]: bytes
    };
    setHttpGet(respond(routes));
    const locked = await runUpdateCheck('1.8.0');
    expect(locked.items).toEqual([]);
    expect(locked.locked.map((l) => l.id)).toEqual(['castle_dreams']);
    expect(locked.outcome).toBe('up_to_date');

    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    const open = await runUpdateCheck('1.8.0');
    expect(open.locked).toEqual([]);
    expect(open.items.map((i) => i.kind === 'content' && i.id)).toEqual(['castle_dreams']);
  });
});

describe('Installing a premium pack', () => {
  async function item() {
    const { parsed, rel, bytes } = await premiumManifest();
    const planned = planFromManifest(parsed, rel, '1.8.0', {}, new Set(['castle_dreams']))[0];
    setHttpGet(respond({ [dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.dreampack')]: bytes }));
    return planned;
  }

  it('downloads the encrypted pack, opens it with the license and installs it', async () => {
    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    const r = await installContentUpdate(await item());
    expect(r).toMatchObject({ ok: true });
    expect((await buildCatalog([new InstalledTree()])).books.map((b) => b.manifest.name)).toEqual(['Castle Dreams']);
    expect((await listInstalledPacks())[0]).toMatchObject({ id: 'castle_dreams' });
  });

  it('installs nothing without a license', async () => {
    const r = await installContentUpdate(await item());
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/license/i);
    expect(await listInstalledPacks()).toEqual([]);
  });

  it('installs nothing with a license for a different pack or the wrong key', async () => {
    const planned = await item();
    await addLicense(licenseFor([{ id: 'something_else', key: packKey }]));
    expect((await installContentUpdate(planned)).ok).toBe(false);
    await addLicense(licenseFor([{ id: 'castle_dreams', key: newKey() }]));
    const wrong = await installContentUpdate(planned);
    expect(wrong.ok).toBe(false);
    expect(wrong.message).toBe('That content could not be opened.');
    expect(await listInstalledPacks()).toEqual([]);
  });

  it('refuses a download that was altered on the way (checksum first, then encryption)', async () => {
    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    const planned = await item();
    const altered = enc(new TextDecoder().decode((await premiumManifest()).bytes).replace('"data":"', '"data":"AAAA'));
    setHttpGet(respond({ [dl('castle_dreams_v1.0.0', 'castle_dreams_v1.0.0.dreampack')]: altered }));
    const r = await installContentUpdate(planned);
    expect(r.ok).toBe(false);
    expect(await listInstalledPacks()).toEqual([]);
  });

  it('opening needs a saved license and the right pack id', async () => {
    const { bytes } = await premiumManifest();
    expect((await openEncryptedPack('castle_dreams', new TextDecoder().decode(bytes))).ok).toBe(false);
    await addLicense(licenseFor([{ id: 'castle_dreams', key: packKey }]));
    expect((await openEncryptedPack('castle_dreams', new TextDecoder().decode(bytes))).ok).toBe(true);
    expect((await openEncryptedPack('other_pack', new TextDecoder().decode(bytes))).ok).toBe(false);
  });
});

describe('The author tool and the app agree, and nothing secret is in the app', () => {
  it('the tool signs licenses that verify, and a change to any field breaks the signature', () => {
    const l = JSON.parse(licenseFor([{ id: 'a_pack', key: packKey }], { expires: '2999-01-01' }));
    expect(verifyLicense(l, publicPem)).toBe(true);
    for (const edit of [(x: typeof l) => (x.id = 'other-id'), (x: typeof l) => (x.expires = null), (x: typeof l) => (x.issued = '2025-01-01'), (x: typeof l) => (x.packs[0].id = 'b_pack')]) {
      const copy = structuredClone(l);
      edit(copy);
      expect(verifyLicense(copy, publicPem)).toBe(false);
    }
  });

  it('an encrypted pack is tied to its id and version', () => {
    const plain = Buffer.from('{"hello":"world"}');
    const meta = { id: 'a_pack', name: 'A', kind: 'stories', version: '1.0.0', minAppVersion: '1.8.0' };
    const text = encryptPack(plain, meta, packKey);
    expect(decryptPack(text, packKey)).toEqual(plain);
    expect(() => decryptPack(text.replace('"version":"1.0.0"', '"version":"1.0.1"'), packKey)).toThrow();
    expect(() => decryptPack(text.replace('"id":"a_pack"', '"id":"b_pack"'), packKey)).toThrow();
    expect(() => decryptPack(text, newKey())).toThrow();
    // the same text never encrypts twice the same way
    expect(encryptPack(plain, meta, packKey)).not.toBe(text);
  });

  it('the app contains no private key and no pack key, only the public half', () => {
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const files = [...walk('src'), ...walk('src-tauri/src'), ...walk('content')].filter((f) => /\.(ts|svelte|rs|json)$/.test(f));
    for (const f of files) {
      const t = readFileSync(f, 'utf8');
      expect(t, f).not.toContain('BEGIN PRIVATE KEY');
      expect(t, f).not.toMatch(/license-private/);
    }
    const rust = readFileSync('src-tauri/src/premium.rs', 'utf8');
    expect(rust).toContain('LICENSE_PUBLIC_KEY');
    expect(rust).toContain('verify_strict');
  });

  it('the author tool keeps its secrets in the home folder, not in the project', () => {
    const tool = readFileSync('scripts/dlc.mjs', 'utf8');
    expect(tool).toContain("join(homedir(), '.dream-dlc')");
    expect(tool).not.toMatch(/writeFileSync\(['"`]\.?\/?(license|pack-keys)/);
  });

  it('the Updates page has a place to add a license and shows locked packs', () => {
    const page = readFileSync('src/features/updates/Updates.svelte', 'utf8');
    expect(page).toContain('Premium content');
    expect(page).toContain('Choose license file');
    expect(page).toContain('$updateState.locked');
    expect(page).toContain('type="file"');
    // and it stays silent until a premium pack is actually on offer
    expect(page).toContain('{#if showPremium}');
    expect(page).toContain("u.kind === 'content' && u.premium === true");
  });
});
