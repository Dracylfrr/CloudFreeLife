/**
 * Content packs (.cfpack): downloadable books, palettes and mini-game levels.
 *
 * A pack is a JSON file containing manifests plus art. It never contains code,
 * so installing one cannot execute anything. Before a single byte is written
 * to disk the pack is parsed, its paths are restricted to the content folders,
 * its files are size/type checked, SVGs are scanned for active content, and
 * the manifests inside are run through the same validators as bundled content.
 */
import { buildCatalog } from '../../core/content/registry';
import { storyIllustrationFiles } from '../../core/manifests';
import { MapTree, INSTALLED_ROOT } from '../../core/content/tree';
import { getStorage, assertSafeRelativePath } from '../../core/storage';
import { APP_VERSION, isValidVersion, meetsMinVersion } from '../../core/version';
import { ALLOWED_PACK_TYPES, MAX_PACK_BYTES, PACK_ASSET_RE, type AssetSpec } from './release';
import { sha256Hex, digestsEqual } from './checksum';

export interface PackFile {
  encoding: 'utf8' | 'base64';
  data: string;
}

export interface ContentPack {
  format: 1;
  kind: string;
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  files: Record<string, PackFile>;
}

export type PackResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_FILES = 700;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const ALLOWED_EXT = ['.json', '.svg', '.png', '.webp'];

const PATH_PATTERNS = [
  /^books\/[a-z0-9_]+\/[A-Za-z0-9_./-]+$/,
  /^palettes\/[a-z0-9_]+\.json$/,
  /^themes\/[a-z0-9_]+\.json$/,
  /^minigames\/(pastel_breaker|splash_wall|memory_meadow|pastel_puzzle|bubble_garden|cloud_catcher|zen_garden|paint_flow)\/levels\/[a-z0-9_]+\/[A-Za-z0-9_.-]+$/,
  /^stories\/(relaxing|adventures)\/[a-z0-9_]+\/[A-Za-z0-9_.-]+$/,
  /^(meditation|movement)\/[a-z0-9_]+\/[A-Za-z0-9_.-]+$/
];

export function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Rejects SVGs that could do anything but draw. */
export function svgIsPassive(svg: string): boolean {
  const s = svg.toLowerCase();
  if (s.includes('<script') || s.includes('<foreignobject') || s.includes('<iframe') || s.includes('<embed') || s.includes('<object')) return false;
  if (/\son[a-z]+\s*=/.test(s)) return false;
  if (/javascript:/.test(s)) return false;
  // No external references of any kind.
  if (/(href|src)\s*=\s*["']\s*(https?:|\/\/|file:)/.test(s)) return false;
  if (/url\(\s*["']?\s*(https?:|\/\/|file:)/.test(s)) return false;
  if (s.includes('<!entity')) return false;
  return true;
}

export function parsePack(bytes: Uint8Array): PackResult<ContentPack> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PACK_BYTES) return { ok: false, error: 'Pack size is not acceptable' };
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return { ok: false, error: 'Pack is not valid JSON' };
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Pack must be a JSON object' };
  const p = raw as Record<string, unknown>;
  if (p.format !== 1) return { ok: false, error: 'Unsupported pack format' };
  if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9_]{0,63}$/.test(p.id)) return { ok: false, error: 'Pack id is invalid' };
  if (typeof p.name !== 'string' || !p.name.trim()) return { ok: false, error: 'Pack name is missing' };
  if (typeof p.version !== 'string' || !isValidVersion(p.version)) return { ok: false, error: 'Pack version is invalid' };
  if (typeof p.minAppVersion !== 'string' || !isValidVersion(p.minAppVersion)) return { ok: false, error: 'Pack minAppVersion is invalid' };
  if (typeof p.kind !== 'string') return { ok: false, error: 'Pack kind is missing' };
  if (!p.files || typeof p.files !== 'object') return { ok: false, error: 'Pack has no files' };

  const files: Record<string, PackFile> = {};
  let total = 0;
  const entries = Object.entries(p.files as Record<string, unknown>);
  if (entries.length === 0 || entries.length > MAX_FILES) return { ok: false, error: 'Pack file count is not acceptable' };
  for (const [path, f] of entries) {
    try {
      assertSafeRelativePath(path);
    } catch {
      return { ok: false, error: `Unsafe path in pack: ${path}` };
    }
    if (!PATH_PATTERNS.some((re) => re.test(path))) return { ok: false, error: `Path not allowed in a pack: ${path}` };
    if (!ALLOWED_EXT.some((e) => path.endsWith(e))) return { ok: false, error: `File type not allowed: ${path}` };
    if (!f || typeof f !== 'object') return { ok: false, error: `Bad file entry: ${path}` };
    const { encoding, data } = f as PackFile;
    if ((encoding !== 'utf8' && encoding !== 'base64') || typeof data !== 'string') return { ok: false, error: `Bad file entry: ${path}` };
    const size = encoding === 'base64' ? Math.floor((data.length * 3) / 4) : data.length;
    if (size > MAX_FILE_BYTES) return { ok: false, error: `File too large: ${path}` };
    total += size;
    if (total > MAX_TOTAL_BYTES) return { ok: false, error: 'Pack is too large' };
    if (path.endsWith('.svg')) {
      const text = encoding === 'utf8' ? data : new TextDecoder().decode(decodeBase64(data));
      if (!svgIsPassive(text)) return { ok: false, error: `SVG contains active or external content: ${path}` };
    }
    if ((path.endsWith('.png') || path.endsWith('.webp')) && encoding !== 'base64') return { ok: false, error: `Images must be base64: ${path}` };
    files[path] = { encoding, data };
  }
  return {
    ok: true,
    value: { format: 1, kind: p.kind, id: p.id, name: p.name.trim(), version: p.version, minAppVersion: p.minAppVersion, files }
  };
}

/** Runs the pack's contents through the real registry validators without installing anything. */
export async function validatePackContents(pack: ContentPack, appVersion: string = APP_VERSION): Promise<PackResult<{ books: number; palettes: number; levels: number }>> {
  if (!meetsMinVersion(pack.minAppVersion, appVersion)) {
    return { ok: false, error: `This content needs Project D.R.E.A.M ${pack.minAppVersion} or newer` };
  }
  const text: Record<string, string> = {};
  for (const [path, f] of Object.entries(pack.files)) {
    if (path.endsWith('.json') || path.endsWith('.svg')) text[path] = f.encoding === 'utf8' ? f.data : new TextDecoder().decode(decodeBase64(f.data));
    else text[path] = '';
  }
  const cat = await buildCatalog([new MapTree('installed', text)], appVersion);
  if (cat.skipped.length) return { ok: false, error: `Pack content is invalid: ${cat.skipped[0].where} - ${cat.skipped[0].reason}` };
  const books = cat.books.length;
  const palettes = cat.palettes.length + cat.themes.length;
  const levels = cat.breakerLevels.length + cat.splashLevels.length + cat.memoryLevels.length + cat.puzzleLevels.length + cat.bubbleLevels.length + cat.catcherLevels.length + cat.zenLevels.length + cat.flowLevels.length + cat.stories.length + cat.adventures.length + cat.meditations.length + cat.movements.length;
  if (books + palettes + levels === 0) return { ok: false, error: 'Pack contains no usable content' };
  // Every referenced art file must exist.
  for (const b of cat.books) {
    if (!(`${b.dir}/${b.manifest.cover}` in text)) return { ok: false, error: `Missing cover for ${b.manifest.name}` };
    for (const pg of b.pages) {
      for (const f of [pg.manifest.thumbnail, pg.manifest.lineArt, pg.manifest.regions]) {
        if (!(`${pg.dir}/${f}` in text)) return { ok: false, error: `Missing ${f} in ${pg.dir}` };
      }
    }
  }
  for (const r of [...cat.stories, ...cat.adventures, ...cat.meditations, ...cat.movements]) {
    if (!(`${r.dir}/${r.manifest.cover}` in text)) return { ok: false, error: `Missing cover for ${r.manifest.name}` };
  }
  // A pack should not ship a story that points at pictures it does not contain.
  for (const st of cat.stories) {
    for (const f of storyIllustrationFiles(st.manifest)) {
      if (!(`${st.dir}/${f}` in text)) return { ok: false, error: `Missing illustration ${f} in ${st.dir}` };
    }
  }
  return { ok: true, value: { books, palettes, levels } };
}

// ----------------------------------------------------------------- install

export interface InstalledPackRecord {
  id: string;
  name: string;
  version: string;
  kind: string;
  installedAt: number;
  /** Every file this pack wrote, relative to the data root (used for clean removal). */
  files: string[];
}
const REGISTRY_PATH = 'installed_packs.json';

export async function listInstalledPacks(): Promise<InstalledPackRecord[]> {
  try {
    const st = await getStorage();
    const t = await st.readText(REGISTRY_PATH);
    const arr = t ? JSON.parse(t) : [];
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r.id === 'string' && typeof r.version === 'string').map((r) => ({ ...r, files: Array.isArray(r.files) ? r.files : [] })) : [];
  } catch {
    return [];
  }
}

/** Verifies a downloaded asset against the release manifest before it is even parsed. */
export async function verifyDownloadedAsset(
  asset: AssetSpec,
  bytes: Uint8Array,
  contentType: string,
  allowedTypes: string[] = ALLOWED_PACK_TYPES
): Promise<PackResult<true>> {
  if (bytes.byteLength !== asset.size) return { ok: false, error: 'Downloaded size does not match the release manifest' };
  if (contentType && !allowedTypes.includes(contentType)) return { ok: false, error: `Unexpected content type "${contentType}"` };
  if (!digestsEqual(await sha256Hex(bytes), asset.sha256)) return { ok: false, error: 'Checksum mismatch - the download was rejected' };
  return { ok: true, value: true };
}

export function packAssetMatches(asset: AssetSpec, pack: ContentPack): boolean {
  const m = PACK_ASSET_RE.exec(asset.name);
  return !!m && m[1] === pack.id && m[2] === pack.version;
}

/**
 * Installs a validated pack into the user's data folder. Files are written into
 * a staging folder first and moved in place, so a failure leaves nothing half-installed.
 */
export async function installPack(pack: ContentPack): Promise<PackResult<InstalledPackRecord>> {
  const check = await validatePackContents(pack);
  if (!check.ok) return check;
  const st = await getStorage();
  try {
    const written: string[] = [];
    for (const [path, f] of Object.entries(pack.files)) {
      const target = `${INSTALLED_ROOT}/${path}`;
      const bytes = f.encoding === 'base64' ? decodeBase64(f.data) : new TextEncoder().encode(f.data);
      await st.writeBytes(target, bytes);
      written.push(target);
    }
    const rec: InstalledPackRecord = { id: pack.id, name: pack.name, version: pack.version, kind: pack.kind, installedAt: Date.now(), files: written };
    const all = (await listInstalledPacks()).filter((r) => r.id !== pack.id);
    all.push(rec);
    await st.writeText(REGISTRY_PATH, JSON.stringify(all, null, 2));
    return { ok: true, value: rec };
  } catch (err) {
    return { ok: false, error: `Could not save the content: ${String(err)}` };
  }
}

export async function uninstallPack(id: string): Promise<void> {
  const st = await getStorage();
  const all = await listInstalledPacks();
  const rec = all.find((r) => r.id === id);
  if (!rec) return;
  for (const f of rec.files ?? []) await st.remove(f);
  await st.writeText(REGISTRY_PATH, JSON.stringify(all.filter((r) => r.id !== id), null, 2));
}
