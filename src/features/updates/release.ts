/**
 * Pure parsing / validation of GitHub release data and release manifests.
 * No network, no UI: everything here is unit-tested.
 */
import { ALLOWED_DOWNLOAD_HOSTS, GITHUB_REPO, RELEASE_MANIFEST_ASSET } from '../../core/config';
import { APP_VERSION, compareVersions, isNewer, isValidVersion, meetsMinVersion, parseVersion } from '../../core/version';

export type ContentKind = 'book' | 'palettes' | 'breaker_levels' | 'splash_levels' | 'memory_levels' | 'puzzle_levels' | 'bubble_levels' | 'catcher_levels' | 'zen_levels' | 'flow_levels' | 'stories' | 'adventures' | 'meditation' | 'movement' | 'minigame';

export interface AssetSpec {
  name: string;
  sha256: string;
  size: number;
  contentType: string;
}

export interface ReleaseAsset {
  name: string;
  size: number;
  contentType: string;
  downloadUrl: string;
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  body: string;
  htmlUrl: string;
  prerelease: boolean;
  publishedAt: string;
  assets: ReleaseAsset[];
}

export interface AppUpdate {
  kind: 'app';
  version: string;
  notes: string;
  releaseUrl: string;
  asset?: AssetSpec;
  downloadUrl?: string;
  minAppVersion?: string;
  /** One friendly line about what is new, e.g. "2 new books and a new mini-game". */
  headline?: string;
  /** Names of the content shipped with this release (shown in the Update Center). */
  includes: string[];
}

export interface ContentUpdate {
  kind: 'content';
  contentKind: ContentKind;
  id: string;
  name: string;
  description: string;
  version: string;
  minAppVersion: string;
  releaseUrl: string;
  asset: AssetSpec;
  downloadUrl: string;
}

export type UpdateItem = AppUpdate | ContentUpdate;

export interface ReleaseManifest {
  schema: 1;
  release: string;
  notes?: string;
  headline?: string;
  app?: { version: string; minAppVersion?: string; asset: AssetSpec };
  content: {
    type: ContentKind;
    id: string;
    name: string;
    description?: string;
    version: string;
    minAppVersion: string;
    asset: AssetSpec;
  }[];
}

const SHA256_RE = /^[a-f0-9]{64}$/;
const CONTENT_ID_RE = /^[a-z0-9][a-z0-9_]{0,63}$/;
export const PACK_ASSET_RE = /^([a-z0-9][a-z0-9_]{0,63})_v(\d+\.\d+\.\d+)\.cfpack$/;
export const APP_ASSET_RE = /^Cloud-Freelife_(\d+\.\d+\.\d+)_x64-setup\.exe$/;
export const ALLOWED_PACK_TYPES = ['application/json', 'application/octet-stream', 'application/x-cfpack'];
export const ALLOWED_APP_TYPES = ['application/octet-stream', 'application/x-msdownload', 'application/vnd.microsoft.portable-executable', 'application/x-msdos-program'];
export const MAX_PACK_BYTES = 40 * 1024 * 1024;
export const MAX_APP_BYTES = 400 * 1024 * 1024;

const CONTENT_KINDS: ContentKind[] = ['book', 'palettes', 'breaker_levels', 'splash_levels', 'memory_levels', 'puzzle_levels', 'bubble_levels', 'catcher_levels', 'zen_levels', 'flow_levels', 'stories', 'adventures', 'meditation', 'movement', 'minigame'];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// ------------------------------------------------------------ release list

/** Normalises the GitHub "list releases" response. Malformed entries are dropped. */
export function parseReleases(json: unknown): ReleaseInfo[] {
  const list = Array.isArray(json) ? json : isObj(json) ? [json] : [];
  const out: ReleaseInfo[] = [];
  for (const r of list) {
    if (!isObj(r) || typeof r.tag_name !== 'string' || r.draft === true) continue;
    const assets: ReleaseAsset[] = [];
    if (Array.isArray(r.assets)) {
      for (const a of r.assets) {
        if (!isObj(a) || typeof a.name !== 'string' || typeof a.browser_download_url !== 'string') continue;
        assets.push({
          name: a.name,
          size: typeof a.size === 'number' ? a.size : 0,
          contentType: typeof a.content_type === 'string' ? a.content_type : '',
          downloadUrl: a.browser_download_url
        });
      }
    }
    out.push({
      tag: r.tag_name,
      name: typeof r.name === 'string' && r.name ? r.name : r.tag_name,
      body: typeof r.body === 'string' ? r.body : '',
      htmlUrl: typeof r.html_url === 'string' ? r.html_url : `https://github.com/${GITHUB_REPO}/releases`,
      prerelease: r.prerelease === true,
      publishedAt: typeof r.published_at === 'string' ? r.published_at : '',
      assets
    });
  }
  return out;
}

export type TagInfo = { type: 'app'; version: string } | { type: 'content'; id: string; version: string } | null;

/** "v1.1.0" -> app release; "castle_dreams_v1.0.0" -> content release. */
export function parseTag(tag: string): TagInfo {
  if (/^v\d/.test(tag)) {
    const v = tag.slice(1);
    return isValidVersion(v) ? { type: 'app', version: v } : null;
  }
  const m = /^([a-z0-9][a-z0-9_]{0,63})_v(\d+\.\d+\.\d+)$/.exec(tag);
  return m ? { type: 'content', id: m[1], version: m[2] } : null;
}

// ------------------------------------------------------------ URL safety

/** Only HTTPS downloads from this project's own GitHub release assets are accepted. */
export function isTrustedDownloadUrl(url: string, tag?: string, assetName?: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  if (!ALLOWED_DOWNLOAD_HOSTS.includes(u.hostname)) return false;
  if (u.hostname === 'github.com') {
    const prefix = `/${GITHUB_REPO}/releases/download/`;
    if (!u.pathname.startsWith(prefix)) return false;
    const rest = u.pathname.slice(prefix.length).split('/');
    if (rest.length !== 2) return false;
    if (tag && decodeURIComponent(rest[0]) !== tag) return false;
    if (assetName && decodeURIComponent(rest[1]) !== assetName) return false;
  }
  return true;
}

// ------------------------------------------------------------ manifest

function parseAssetSpec(raw: unknown, where: string, errors: string[]): AssetSpec | null {
  if (!isObj(raw)) {
    errors.push(`${where}: "asset" must be an object`);
    return null;
  }
  const { name, sha256, size, contentType } = raw;
  if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,120}$/.test(name)) errors.push(`${where}: bad asset name`);
  if (typeof sha256 !== 'string' || !SHA256_RE.test(sha256.toLowerCase())) errors.push(`${where}: sha256 must be 64 hex characters`);
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) errors.push(`${where}: size must be a positive integer`);
  if (typeof contentType !== 'string' || contentType.length === 0) errors.push(`${where}: contentType is required`);
  if (errors.length) return null;
  return { name: name as string, sha256: (sha256 as string).toLowerCase(), size: size as number, contentType: contentType as string };
}

export type ManifestResult = { ok: true; value: ReleaseManifest } | { ok: false; errors: string[] };

export function parseReleaseManifest(raw: unknown): ManifestResult {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ['manifest must be a JSON object'] };
  if (raw.schema !== 1) errors.push('unsupported manifest schema');
  if (typeof raw.release !== 'string' || !isValidVersion(raw.release)) errors.push('"release" must be a version like 1.1.0');
  const manifest: ReleaseManifest = {
    schema: 1,
    release: typeof raw.release === 'string' ? raw.release : '',
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 4000) : undefined,
    headline: typeof raw.headline === 'string' && raw.headline.trim() ? raw.headline.trim().slice(0, 90) : undefined,
    content: []
  };
  if (raw.app !== undefined) {
    if (!isObj(raw.app) || typeof raw.app.version !== 'string' || !isValidVersion(raw.app.version)) errors.push('app.version is invalid');
    else {
      const asset = parseAssetSpec(raw.app.asset, 'app', errors);
      if (asset) {
        if (!APP_ASSET_RE.test(asset.name)) errors.push(`app asset name "${asset.name}" does not match Cloud-Freelife_<version>_x64-setup.exe`);
        else if (APP_ASSET_RE.exec(asset.name)![1] !== raw.app.version) errors.push('app asset name does not match app.version');
        if (asset.size > MAX_APP_BYTES) errors.push('app asset is unreasonably large');
        manifest.app = {
          version: raw.app.version,
          minAppVersion: typeof raw.app.minAppVersion === 'string' && isValidVersion(raw.app.minAppVersion) ? raw.app.minAppVersion : undefined,
          asset
        };
      }
    }
  }
  if (raw.content !== undefined) {
    if (!Array.isArray(raw.content)) errors.push('"content" must be an array');
    else {
      for (const [i, c] of raw.content.entries()) {
        const where = `content[${i}]`;
        if (!isObj(c)) {
          errors.push(`${where}: must be an object`);
          continue;
        }
        const before = errors.length;
        if (!CONTENT_KINDS.includes(c.type as ContentKind)) errors.push(`${where}: unknown type`);
        if (typeof c.id !== 'string' || !CONTENT_ID_RE.test(c.id)) errors.push(`${where}: bad id`);
        if (typeof c.name !== 'string' || !c.name.trim()) errors.push(`${where}: name required`);
        if (typeof c.version !== 'string' || !isValidVersion(c.version)) errors.push(`${where}: bad version`);
        if (typeof c.minAppVersion !== 'string' || !isValidVersion(c.minAppVersion)) errors.push(`${where}: bad minAppVersion`);
        const asset = parseAssetSpec(c.asset, where, errors);
        if (asset) {
          const m = PACK_ASSET_RE.exec(asset.name);
          if (!m) errors.push(`${where}: asset name must look like <id>_v<version>.cfpack`);
          else if (m[1] !== c.id || m[2] !== c.version) errors.push(`${where}: asset name must match id and version`);
          if (!ALLOWED_PACK_TYPES.includes(asset.contentType)) errors.push(`${where}: content type "${asset.contentType}" not allowed`);
          if (asset.size > MAX_PACK_BYTES) errors.push(`${where}: pack is unreasonably large`);
        }
        if (errors.length === before && asset) {
          manifest.content.push({
            type: c.type as ContentKind,
            id: c.id as string,
            name: (c.name as string).trim(),
            description: typeof c.description === 'string' ? c.description : undefined,
            version: c.version as string,
            minAppVersion: c.minAppVersion as string,
            asset
          });
        }
      }
    }
  }
  if (!manifest.app && manifest.content.length === 0 && errors.length === 0) errors.push('manifest lists nothing to install');
  return errors.length ? { ok: false, errors } : { ok: true, value: manifest };
}

// ------------------------------------------------------------ planning

export function findManifestAsset(release: ReleaseInfo): ReleaseAsset | undefined {
  return release.assets.find((a) => a.name === RELEASE_MANIFEST_ASSET);
}

export interface InstalledVersions {
  /** content id -> installed version (bundled or downloaded) */
  [id: string]: string | undefined;
}

/** Decides whether a release could matter, based only on its tag. Saves needless downloads. */
export function releaseMayMatter(release: ReleaseInfo, appVersion: string, installed: InstalledVersions): boolean {
  if (release.prerelease) return false;
  if (!findManifestAsset(release)) return false;
  const tag = parseTag(release.tag);
  if (!tag) return false;
  if (tag.type === 'app') return isNewer(tag.version, appVersion);
  const have = installed[tag.id];
  return have === undefined || isNewer(tag.version, have);
}

/** Turns a validated manifest into concrete, trustworthy update items. */
export function planFromManifest(
  manifest: ReleaseManifest,
  release: ReleaseInfo,
  appVersion: string,
  installed: InstalledVersions
): UpdateItem[] {
  const items: UpdateItem[] = [];
  const dl = (name: string) => release.assets.find((a) => a.name === name);

  if (manifest.app && isNewer(manifest.app.version, appVersion)) {
    const a = dl(manifest.app.asset.name);
    const trusted = a && isTrustedDownloadUrl(a.downloadUrl, release.tag, a.name);
    items.push({
      kind: 'app',
      version: manifest.app.version,
      notes: cleanNotes(manifest.notes ?? release.body),
      includes: manifest.content.map((c) => c.name),
      releaseUrl: release.htmlUrl,
      asset: trusted ? manifest.app.asset : undefined,
      downloadUrl: trusted ? a!.downloadUrl : undefined,
      minAppVersion: manifest.app.minAppVersion,
      headline: manifest.headline
    });
  }

  for (const c of manifest.content) {
    const have = installed[c.id];
    if (have !== undefined && compareVersions(c.version, have) <= 0) continue;
    if (!meetsMinVersion(c.minAppVersion, appVersion)) continue; // needs a newer app: shown via the app update instead
    const a = dl(c.asset.name);
    if (!a || !isTrustedDownloadUrl(a.downloadUrl, release.tag, a.name)) continue;
    items.push({
      kind: 'content',
      contentKind: c.type,
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      version: c.version,
      minAppVersion: c.minAppVersion,
      releaseUrl: release.htmlUrl,
      asset: c.asset,
      downloadUrl: a.downloadUrl
    });
  }
  return items;
}

/**
 * Release notes are shown inside the app, so they are reduced to plain, friendly text:
 * links keep their words but lose their addresses, bare web addresses and
 * "full changelog" lines are dropped, and markdown marks become simple bullets.
 */
export function cleanNotes(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [words](address) -> words
    .replace(/^.*(?:full changelog|\/compare\/).*$/gim, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/[*_`]{1,3}/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000);
}

export function describeUpdate(u: UpdateItem): string {
  if (u.kind === 'app') return `Update available — v${u.version}`;
  const label: Record<ContentKind, string> = {
    book: 'New coloring book available',
    palettes: 'New palettes available',
    breaker_levels: 'New Pastel Breaker levels available',
    splash_levels: 'New Splash Wall levels available',
    memory_levels: 'New Memory Meadow levels available',
    puzzle_levels: 'New Pastel Puzzle levels available',
    bubble_levels: 'New Bubble Garden levels available',
    catcher_levels: 'New Cloud Catcher levels available',
    zen_levels: 'New Zen Garden backgrounds available',
    flow_levels: 'New Paint Flow boards available',
    meditation: 'New meditation sessions available',
    movement: 'New movement cards available',
    stories: 'New cozy stories available',
    adventures: 'New story adventures available',
    minigame: 'New mini-game available'
  };
  return `${label[u.contentKind]} — ${u.name}`;
}

/** Friendly wording for the top-right notice: a title and a softer second line. */
export function noticeText(u: UpdateItem): { title: string; detail: string } {
  if (u.kind === 'app') {
    return { title: `Cloud-Freelife ${u.version} is available`, detail: u.headline ?? 'A new version is ready to install' };
  }
  return { title: 'New content is ready', detail: describeUpdate(u) };
}

export function updateKey(u: UpdateItem): string {
  return u.kind === 'app' ? `app:${u.version}` : `content:${u.id}:${u.version}`;
}

export { APP_VERSION, parseVersion };
