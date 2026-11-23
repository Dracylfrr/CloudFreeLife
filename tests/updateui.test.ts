// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GITHUB_REPO, RELEASE_MANIFEST_ASSET } from '../src/core/config';
import { NetworkError, setHttpGet, type HttpGet } from '../src/features/updates/http';
import { cleanNotes, isTrustedDownloadUrl, noticeText, planFromManifest, type ReleaseInfo, type ReleaseManifest } from '../src/features/updates/release';
import { runUpdateCheck } from '../src/features/updates/updater';
import { verifyDownloadedAsset } from '../src/features/updates/packs';
import { sha256Hex } from '../src/features/updates/checksum';

const enc = (s: string) => new TextEncoder().encode(s);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('the interface never shows GitHub', () => {
  const ui = walk(resolve('src')).filter((f) => f.endsWith('.svelte'));

  it('no screen, dialog or notice contains the word GitHub, a repository address or the owner name', () => {
    expect(ui.length).toBeGreaterThan(20);
    for (const f of ui) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/github/i);
      expect(text, f).not.toMatch(/Dracylfrr|CloudFreeLife/);
    }
  });

  it('the app has no code path that opens a web page', () => {
    const caps = readFileSync(resolve('src-tauri/capabilities/default.json'), 'utf8');
    expect(caps).not.toContain('opener:allow-open-url');
    const updater = readFileSync(resolve('src/features/updates/updater.ts'), 'utf8');
    expect(updater).not.toMatch(/openUrl|window\.open|openOfficialLink/);
  });

  it('user-facing update messages do not name the host', async () => {
    setHttpGet((async () => {
      throw new NetworkError('Could not reach the update service');
    }) as HttpGet);
    const offline = await runUpdateCheck('1.3.0');
    expect(offline.outcome).toBe('offline');
    expect(offline.message).not.toMatch(/github/i);
    for (const status of [403, 429, 500]) {
      setHttpGet((async () => ({ status, contentType: 'text/plain', bytes: new Uint8Array() })) as HttpGet);
      expect((await runUpdateCheck('1.3.0')).message).not.toMatch(/github/i);
    }
    setHttpGet((async () => ({ status: 200, contentType: 'application/json', bytes: enc('<html>') })) as HttpGet);
    expect((await runUpdateCheck('1.3.0')).message).not.toMatch(/github/i);
  });
  afterEach(() => setHttpGet(null as unknown as HttpGet));
});

describe('release notes are shown inside the app', () => {
  it('keeps the words, drops web addresses and changelog links', () => {
    const raw = [
      '## What\'s new',
      '- **Illustrated stories** with [Read Aloud](https://github.com/Someone/Repo/pull/12)',
      '- Calm music',
      '',
      '',
      '',
      '**Full Changelog**: https://github.com/Someone/Repo/compare/v1.2.0...v1.3.0',
      'See https://example.com/more for details'
    ].join('\n');
    const clean = cleanNotes(raw);
    expect(clean).toContain('Illustrated stories');
    expect(clean).toContain('Read Aloud');
    expect(clean).toContain('• Calm music');
    expect(clean).not.toMatch(/https?:|github|\]\(|\*\*|##/i);
    expect(clean).not.toMatch(/\n{3,}/);
  });

  it('handles empty and missing notes', () => {
    expect(cleanNotes(undefined)).toBe('');
    expect(cleanNotes('')).toBe('');
  });

  const rel: ReleaseInfo = {
    tag: 'v1.3.1',
    name: 'v1.3.1',
    body: 'Fixes. [PR](https://github.com/x/y/pull/1)',
    htmlUrl: `https://github.com/${GITHUB_REPO}/releases/tag/v1.3.1`,
    prerelease: false,
    publishedAt: '2026-12-01T00:00:00Z',
    assets: [
      { name: 'Cloud-Freelife_1.3.1_x64-setup.exe', size: 2_900_000, downloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/v1.3.1/Cloud-Freelife_1.3.1_x64-setup.exe` },
      { name: RELEASE_MANIFEST_ASSET, size: 900, downloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/v1.3.1/${RELEASE_MANIFEST_ASSET}` }
    ] as ReleaseInfo['assets']
  };
  const manifest: ReleaseManifest = {
    schema: 1,
    release: '1.3.1',
    headline: '2 new stories and a calmer rain track',
    notes: '- New stories\n- [Details](https://github.com/x/y)',
    app: { version: '1.3.1', asset: { name: 'Cloud-Freelife_1.3.1_x64-setup.exe', sha256: 'a'.repeat(64), size: 2_900_000, contentType: 'application/octet-stream' } },
    content: []
  };

  it('an app update carries clean notes, headline and download size, and no GitHub text', () => {
    const items = planFromManifest(manifest, rel, '1.3.0', {});
    const app = items.find((i) => i.kind === 'app');
    expect(app).toBeTruthy();
    if (!app || app.kind !== 'app') return;
    expect(app.version).toBe('1.3.1');
    expect(app.headline).toBe('2 new stories and a calmer rain track');
    expect(app.asset?.size).toBe(2_900_000);
    expect(app.notes).toBe('• New stories\n• Details'.replace('• Details', 'Details').replace('New stories\nDetails', 'New stories\n• Details').replace(/^/, ''));
    expect(app.notes).not.toMatch(/github|http/i);
    expect(app.includes).toEqual([]);
  });

  it('the notice reads "Cloud-Freelife 1.3.1 is available" and offers no link to a website', () => {
    const app = planFromManifest(manifest, rel, '1.3.0', {})[0];
    const text = noticeText(app);
    expect(text.title).toBe('Cloud-Freelife 1.3.1 is available');
    expect(text.detail).toBe('2 new stories and a calmer rain track');
    const notice = readFileSync(resolve('src/features/updates/UpdateNotice.svelte'), 'utf8');
    for (const label of ['Install', 'Details', 'Later']) expect(notice).toContain(`>${label}<`);
  });

  it('detects a simulated newer version from a release listing', async () => {
    const listUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`;
    const manifestUrl = rel.assets[1].downloadUrl;
    setHttpGet((async (url: string) => {
      if (url === listUrl) {
        return {
          status: 200,
          contentType: 'application/json',
          bytes: enc(JSON.stringify([{ tag_name: 'v1.3.1', name: 'v1.3.1', body: rel.body, html_url: rel.htmlUrl, prerelease: false, published_at: rel.publishedAt, assets: rel.assets.map((a) => ({ name: a.name, size: a.size, browser_download_url: a.downloadUrl })) }]))
        };
      }
      if (url === manifestUrl) return { status: 200, contentType: 'application/json', bytes: enc(JSON.stringify(manifest)) };
      return { status: 404, contentType: 'text/plain', bytes: new Uint8Array() };
    }) as HttpGet);
    const r = await runUpdateCheck('1.3.0');
    expect(r.outcome).toBe('available');
    expect(r.items[0]).toMatchObject({ kind: 'app', version: '1.3.1' });
    expect((await runUpdateCheck('1.3.1')).outcome).toBe('up_to_date');
  });
});

describe('the installer download is still locked down', () => {
  it('only the official release asset on the official hosts is accepted', () => {
    const good = `https://github.com/${GITHUB_REPO}/releases/download/v1.3.1/Cloud-Freelife_1.3.1_x64-setup.exe`;
    expect(isTrustedDownloadUrl(good, 'v1.3.1', 'Cloud-Freelife_1.3.1_x64-setup.exe')).toBe(true);
    expect(isTrustedDownloadUrl(good, 'v1.3.2', 'Cloud-Freelife_1.3.1_x64-setup.exe')).toBe(false); // wrong tag
    expect(isTrustedDownloadUrl(good, 'v1.3.1', 'other.exe')).toBe(false); // wrong asset
    expect(isTrustedDownloadUrl('https://evil.example.com/Cloud-Freelife_1.3.1_x64-setup.exe', 'v1.3.1', 'Cloud-Freelife_1.3.1_x64-setup.exe')).toBe(false);
    expect(isTrustedDownloadUrl(good.replace('https', 'http'))).toBe(false);
  });

  it('rejects a download whose size or SHA-256 is wrong, accepts the right one', async () => {
    const bytes = enc('MZ pretend installer');
    const asset = { name: 'Cloud-Freelife_1.3.1_x64-setup.exe', sha256: await sha256Hex(bytes), size: bytes.length, contentType: 'application/octet-stream' };
    const allowed = ['application/octet-stream', 'application/x-msdownload'];
    expect((await verifyDownloadedAsset(asset, bytes, 'application/octet-stream', allowed)).ok).toBe(true);
    expect((await verifyDownloadedAsset({ ...asset, size: bytes.length + 1 }, bytes, 'application/octet-stream', allowed)).ok).toBe(false);
    expect((await verifyDownloadedAsset({ ...asset, sha256: 'f'.repeat(64) }, bytes, 'application/octet-stream', allowed)).ok).toBe(false);
    const tampered = bytes.slice();
    tampered[0] ^= 1;
    expect((await verifyDownloadedAsset(asset, tampered, 'application/octet-stream', allowed)).ok).toBe(false);
  });
});
