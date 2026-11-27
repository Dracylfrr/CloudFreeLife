/**
 * The file one recorded story is kept in (`.dvp`, "dream voice pack"): every chapter (or adventure passage) of one story
 * read by one narrator, as small compressed audio, plus when each line starts and ends so the paragraph being read can be
 * highlighted. One file per story and voice keeps downloads simple: one small file, one checksum.
 *
 *   "DVP1" | header length (4 bytes, little endian) | header (JSON) | the audio of every part, one after another
 */

export const PACK_MAGIC = 'DVP1';
/** A recorded part: where its audio is inside the file, how long it lasts, and when each line is spoken. */
export interface PackUnit {
  /** Offset from the start of the audio area, and length in bytes. */
  o: number;
  n: number;
  /** Seconds of sound. */
  s: number;
  /** [paragraph, start second, end second] for every spoken line. */
  l: [number, number, number][];
}
export interface PackHeader {
  v: 1;
  story: string;
  /** The recording's name for the voice (never the speech model's). */
  voice: string;
  units: Record<string, PackUnit>;
}
export interface Pack {
  header: PackHeader;
  /** The part's audio, as it was saved. */
  audio(unit: string): Uint8Array | null;
}

const MAX_HEADER = 4 * 1024 * 1024;

export function buildPack(header: Omit<PackHeader, 'units'>, parts: { id: string; audio: Uint8Array; seconds: number; lines: [number, number, number][] }[]): Uint8Array {
  const units: Record<string, PackUnit> = {};
  let at = 0;
  for (const p of parts) {
    units[p.id] = { o: at, n: p.audio.length, s: +p.seconds.toFixed(2), l: p.lines };
    at += p.audio.length;
  }
  const head = new TextEncoder().encode(JSON.stringify({ ...header, units }));
  const out = new Uint8Array(8 + head.length + at);
  out.set(new TextEncoder().encode(PACK_MAGIC));
  new DataView(out.buffer).setUint32(4, head.length, true);
  out.set(head, 8);
  let o = 8 + head.length;
  for (const p of parts) {
    out.set(p.audio, o);
    o += p.audio.length;
  }
  return out;
}

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

/** Reads a pack, trusting nothing: anything out of place makes the whole file unusable (null). */
export function parsePack(bytes: Uint8Array): Pack | null {
  try {
    if (bytes.length < 8 || new TextDecoder().decode(bytes.subarray(0, 4)) !== PACK_MAGIC) return null;
    const hl = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true);
    if (hl <= 0 || hl > MAX_HEADER || 8 + hl > bytes.length) return null;
    const raw = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + hl))) as Record<string, unknown>;
    if (raw.v !== 1 || typeof raw.story !== 'string' || typeof raw.voice !== 'string' || !raw.units || typeof raw.units !== 'object') return null;
    const base = 8 + hl;
    const units: Record<string, PackUnit> = {};
    for (const [id, u] of Object.entries(raw.units as Record<string, Record<string, unknown>>)) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !u || !num(u.o) || !num(u.n) || !num(u.s) || !Array.isArray(u.l)) return null;
      const o = u.o as number;
      const n = u.n as number;
      if (o < 0 || n <= 0 || base + o + n > bytes.length) return null;
      const lines: [number, number, number][] = [];
      for (const l of u.l as unknown[]) {
        if (!Array.isArray(l) || l.length !== 3 || !l.every(num)) return null;
        lines.push([l[0] as number, l[1] as number, l[2] as number]);
      }
      units[id] = { o, n, s: u.s as number, l: lines };
    }
    const header: PackHeader = { v: 1, story: raw.story, voice: raw.voice, units };
    return { header, audio: (id) => (units[id] ? bytes.subarray(base + units[id].o, base + units[id].o + units[id].n) : null) };
  } catch {
    return null;
  }
}

/** The paragraph being read at a moment of a part, or -1 in a pause. */
export function paragraphAt(lines: readonly [number, number, number][], t: number): number {
  for (const [para, a, b] of lines) if (t >= a - 0.05 && t <= b + 0.25) return para;
  return -1;
}

/** Where to start so that reading begins at paragraph `from` (0 = the beginning). */
export function startOf(lines: readonly [number, number, number][], from: number): number {
  if (from <= 0) return 0;
  const hit = lines.find(([para]) => para >= from);
  return hit ? Math.max(0, hit[1] - 0.15) : 0;
}
