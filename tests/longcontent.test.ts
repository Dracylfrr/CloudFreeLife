// @vitest-environment jsdom
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeAdventure, storyIllustrationFiles, storyWordCount, validateAdventure, validateStory } from '../src/core/manifests';
import { parsePack, svgIsPassive, validatePackContents } from '../src/features/updates/packs';

// The long reads ship as downloadable packs, so their sources live in content-packs/.
const PACKS = resolve(__dirname, '../content-packs');
const packIds = readdirSync(PACKS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

function sources(kind: 'relaxing' | 'adventures') {
  const out: { pack: string; dir: string; file: string }[] = [];
  for (const pack of packIds) {
    const base = join(PACKS, pack, 'content/stories', kind);
    if (!existsSync(base)) continue;
    for (const id of readdirSync(base)) out.push({ pack, dir: join(base, id), file: join(base, id, kind === 'relaxing' ? 'story.json' : 'adventure.json') });
  }
  return out;
}
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const words = (t: string[]) => t.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);

describe('downloadable pack sources', () => {
  it('every pack has a name, a description and a known kind', () => {
    expect(packIds.length).toBeGreaterThanOrEqual(2);
    for (const id of packIds) {
      const m = read(join(PACKS, id, 'pack.json'));
      expect(m.name, id).toBeTruthy();
      expect(m.description, id).toBeTruthy();
      expect(['stories', 'adventures', 'book', 'palettes', 'themes']).toContain(m.kind);
      expect(m.minAppVersion).toBe('1.5.0');
    }
  });
});

describe('pack sources build into packs the app accepts', () => {
  function walk(d: string): string[] {
    return readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
  }
  it('every SVG is well-formed XML', () => {
    const parser = new DOMParser();
    for (const f of walk(PACKS).filter((x) => x.endsWith('.svg'))) expect(parser.parseFromString(readFileSync(f, 'utf8'), 'image/svg+xml').getElementsByTagName('parsererror').length, f).toBe(0);
  });
  for (const id of packIds) {
    it(`${id} builds with pack-content and passes the same checks as an install`, async () => {
      const m = read(join(PACKS, id, 'pack.json'));
      const out = mkdtempSync(join(tmpdir(), 'cfpack-'));
      try {
        const r = spawnSync(process.execPath, [resolve(__dirname, '../scripts/pack-content.mjs'), join(PACKS, id, 'content'), '--id', id, '--version', '1.0.0', '--name', m.name, '--description', m.description, '--min-app', m.minAppVersion, '--kind', m.kind, '--out', out], { encoding: 'utf8' });
        expect(r.status, r.stderr).toBe(0);
        const bytes = new Uint8Array(readFileSync(join(out, `${id}_v1.0.0.cfpack`)));
        const parsed = parsePack(bytes);
        expect(parsed.ok, parsed.ok ? '' : parsed.error).toBe(true);
        if (!parsed.ok) return;
        const v = await validatePackContents(parsed.value, '1.5.0');
        expect(v.ok, v.ok ? '' : v.error).toBe(true);
      } finally {
        rmSync(out, { recursive: true, force: true });
      }
    });
  }
});

describe('long cozy stories', () => {
  const list = sources('relaxing');
  it('has at least two long stories forming a series', () => {
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
  for (const s of list) {
    const raw = read(s.file);
    describe(raw.name, () => {
      const v = validateStory(raw);
      it('is valid', () => {
        expect(v.ok, v.ok ? '' : v.errors.join('; ')).toBe(true);
      });
      it('is long enough to settle into (about half an hour or more) and says so honestly', () => {
        if (!v.ok) throw new Error('invalid');
        const w = storyWordCount(v.value);
        expect(w).toBeGreaterThanOrEqual(4800);
        const minutes = v.value.minutes ?? 0;
        expect(Math.abs(minutes - w / 190)).toBeLessThanOrEqual(w / 190 * 0.15 + 1);
        expect(v.value.chapters.length).toBeGreaterThanOrEqual(8);
      });
      it('is made of short paragraphs, with a good place to rest and part headings', () => {
        if (!v.ok) throw new Error('invalid');
        for (const [i, c] of v.value.chapters.entries()) for (const p of c.text) expect(words([p]), `chapter ${i + 1}`).toBeLessThanOrEqual(130);
        expect(v.value.chapters.some((c) => c.rest)).toBe(true);
        expect(v.value.chapters.some((c) => c.part)).toBe(true);
        expect(v.value.chapters[0].part).toBeTruthy();
      });
      it('belongs to a series with a sensible position', () => {
        if (!v.ok) throw new Error('invalid');
        expect(v.value.series?.id).toBe('slow_country');
        expect([1, 2]).toContain(v.value.series?.order);
      });
      it('has its cover and every picture, all passive SVGs', () => {
        if (!v.ok) throw new Error('invalid');
        for (const f of [v.value.cover, ...storyIllustrationFiles(v.value)]) {
          const p = join(s.dir, f);
          expect(existsSync(p), f).toBe(true);
          expect(svgIsPassive(readFileSync(p, 'utf8')), f).toBe(true);
        }
        // a picture at the start of every chapter
        expect(v.value.chapters.every((c) => c.illustration)).toBe(true);
      });
      it('uses no wording that pushes or scores the reader', () => {
        const text = JSON.stringify(raw.chapters.map((c: { text: string[] }) => c.text));
        expect(text).not.toMatch(/\b(streak|leaderboard|score|failed|hurry up)\b/i);
      });
    });
  }
});

describe('long adventure', () => {
  const list = sources('adventures');
  it('has at least one long adventure', () => expect(list.length).toBeGreaterThanOrEqual(1));
  for (const s of list) {
    const raw = read(s.file);
    describe(raw.name, () => {
      const v = validateAdventure(raw);
      it('is valid, with every passage reachable and every path able to finish', () => {
        expect(v.ok, v.ok ? '' : v.errors.join('; ')).toBe(true);
        if (!v.ok) return;
        const g = analyzeAdventure(v.value);
        expect(g.unreachable).toEqual([]);
        expect(g.stuck).toEqual([]);
        expect(g.endings).toBeGreaterThanOrEqual(6);
      });
      it('is long, with passages of sensible size', () => {
        if (!v.ok) throw new Error('invalid');
        const nodes = Object.values(v.value.nodes);
        const total = nodes.reduce((n, p) => n + words(p.text), 0);
        expect(nodes.length).toBeGreaterThanOrEqual(30);
        expect(total).toBeGreaterThanOrEqual(4500);
        for (const n of nodes) expect(words(n.text)).toBeLessThanOrEqual(520);
        for (const n of nodes) for (const t of n.text) expect(words([t])).toBeLessThanOrEqual(130);
      });
      it('has a cover that is a passive SVG', () => {
        if (!v.ok) throw new Error('invalid');
        const p = join(s.dir, v.value.cover);
        expect(existsSync(p)).toBe(true);
        expect(svgIsPassive(readFileSync(p, 'utf8'))).toBe(true);
      });
      it('has endings of more than one mood', () => {
        if (!v.ok) throw new Error('invalid');
        const moods = new Set(Object.values(v.value.nodes).filter((n) => n.ending).map((n) => n.ending!.mood));
        expect(moods.size).toBeGreaterThanOrEqual(4);
      });
    });
  }
});
