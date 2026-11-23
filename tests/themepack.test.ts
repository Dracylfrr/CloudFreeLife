// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../src/core/content/registry';
import { MapTree } from '../src/core/content/tree';
import { validateThemePack, themeFromPack } from '../src/core/themePack';
import { THEMES, allThemes, applyTheme, contrastRatio, installedThemes, isThemeChoice, registerThemes, themeById, __resetThemeForTests } from '../src/core/themes';
import { parsePack, validatePackContents } from '../src/features/updates/packs';

const sample = () => JSON.parse(readFileSync('docs/templates/theme.json', 'utf8')) as Record<string, unknown>;
const errors = (r: ReturnType<typeof validateThemePack>) => (r.ok ? [] : r.errors);

describe('installable themes', () => {
  it('the template in docs is a valid theme', () => {
    const r = validateThemePack(sample());
    expect(errors(r)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('turns the few colors into a full theme that is as readable as the built-in ones', () => {
    const r = validateThemePack(sample());
    if (!r.ok) throw new Error('invalid');
    const t = themeFromPack(r.value);
    expect(t.id).toBe('rose_tea');
    expect(t.dark).toBe(false);
    for (const k of ['--bg-a', '--panel-solid', '--ink', '--g1', '--nav-a', '--focus', '--shadow-m', '--c-green']) expect(t.vars[k], k).toBeTruthy();
    expect(contrastRatio(t.vars['--ink'], t.vars['--panel-solid'])).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(t.vars['--ink-soft'], t.vars['--panel-solid'])).toBeGreaterThanOrEqual(4.5);
  });

  it('refuses colors that are not colors, and missing pieces', () => {
    expect(validateThemePack({ ...sample(), ink: 'red' }).ok).toBe(false);
    expect(validateThemePack({ ...sample(), bg: ['#ffffff'] }).ok).toBe(false);
    expect(validateThemePack({ ...sample(), g: undefined }).ok).toBe(false);
    expect(validateThemePack('nope').ok).toBe(false);
    expect(validateThemePack({}).ok).toBe(false);
  });

  it('refuses text that is hard to read', () => {
    const faint = validateThemePack({ ...sample(), ink: '#e8c8d0' });
    expect(faint.ok).toBe(false);
    expect(errors(faint).join(' ')).toMatch(/hard to read/);
    expect(validateThemePack({ ...sample(), inkSoft: '#f0d8e0' }).ok).toBe(false);
    expect(validateThemePack({ ...sample(), gInk: '#f9d9b0' }).ok).toBe(false);
  });

  it('makes "dark" tell the truth', () => {
    expect(errors(validateThemePack({ ...sample(), dark: true })).join(' ')).toMatch(/dark/);
  });

  it('cannot take the place of a built-in theme, or the word "system"', () => {
    for (const t of THEMES) expect(validateThemePack({ ...sample(), id: t.id }).ok, t.id).toBe(false);
    expect(validateThemePack({ ...sample(), id: 'system' }).ok).toBe(false);
  });

  it('is found in a content tree, validated, and skipped (not fatal) when broken', async () => {
    const good = JSON.stringify(sample());
    const bad = JSON.stringify({ ...sample(), id: 'bad_one', ink: 'nope' });
    const cat = await buildCatalog([new MapTree('installed', { 'themes/rose_tea.json': good, 'themes/bad_one.json': bad })], '1.5.0');
    expect(cat.themes.map((t) => t.manifest.id)).toEqual(['rose_tea']);
    expect(cat.skipped.some((s) => s.where.includes('bad_one'))).toBe(true);
  });

  it('is skipped when it needs a newer app', async () => {
    const cat = await buildCatalog([new MapTree('installed', { 'themes/rose_tea.json': JSON.stringify({ ...sample(), minAppVersion: '9.0.0' }) })], '1.5.0');
    expect(cat.themes).toHaveLength(0);
  });

  it('appears after the built-in themes, can be chosen and applied, and falls back to the default when gone', () => {
    const r = validateThemePack(sample());
    if (!r.ok) throw new Error('invalid');
    registerThemes([themeFromPack(r.value)]);
    expect(get(installedThemes).map((t) => t.id)).toEqual(['rose_tea']);
    expect(allThemes().map((t) => t.id).slice(-1)).toEqual(['rose_tea']);
    expect(themeById('rose_tea').name).toBe('Rose Tea');
    expect(isThemeChoice('rose_tea')).toBe(true);
    __resetThemeForTests();
    applyTheme('rose_tea', false, false);
    expect(document.documentElement.dataset.theme).toBe('rose_tea');
    registerThemes([]);
    __resetThemeForTests();
    applyTheme('rose_tea', false, false);
    expect(document.documentElement.dataset.theme).toBe('cloud_morning');
  });

  it('can be shipped in a content pack, and only at themes/<id>.json', async () => {
    const files = (path: string) => ({ [path]: { encoding: 'utf8', data: JSON.stringify(sample()) } });
    const pack = (path: string) => ({
      format: 1,
      id: 'rose_tea_pack',
      name: 'Rose Tea',
      version: '1.0.0',
      kind: 'themes',
      minAppVersion: '1.5.0',
      files: files(path)
    });
    const ok = parsePack(new TextEncoder().encode(JSON.stringify(pack('themes/rose_tea.json'))));
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const v = await validatePackContents(ok.value, '1.5.0');
      expect(v.ok).toBe(true);
    }
    expect(parsePack(new TextEncoder().encode(JSON.stringify(pack('themes/sub/rose_tea.json')))).ok).toBe(false);
    expect(parsePack(new TextEncoder().encode(JSON.stringify(pack('themes/Rose Tea.json')))).ok).toBe(false);
  });
});
