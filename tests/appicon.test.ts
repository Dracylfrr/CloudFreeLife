import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_ICONS, DEFAULT_APP_ICON, appIconById, applyWindowIcon, iconSvg, isAppIcon } from '../src/core/appIcon';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';

describe('App icon choices', () => {
  it('offers several cute icons with unique ids and names, and the original is the default', () => {
    expect(APP_ICONS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(APP_ICONS.map((i) => i.id)).size).toBe(APP_ICONS.length);
    expect(new Set(APP_ICONS.map((i) => i.name)).size).toBe(APP_ICONS.length);
    expect(DEFAULT_APP_ICON).toBe('cloud');
    expect(DEFAULT_SETTINGS.appIcon).toBe('cloud');
  });

  it('recognises only known ids', () => {
    for (const i of APP_ICONS) expect(isAppIcon(i.id)).toBe(true);
    for (const bad of ['', 'Cloud', 'rocket', 7, null, undefined, {}]) expect(isAppIcon(bad)).toBe(false);
    expect(appIconById('nope').id).toBe('cloud');
  });

  it('builds a well-formed, self-contained SVG for every icon', () => {
    for (const i of APP_ICONS) {
      const svg = iconSvg(i.id, 128, 'test');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
      expect(svg).toContain(i.bg[0]);
      expect(svg).toContain('width="128"');
      expect(svg).not.toMatch(/<script|href=|onload|<image|<foreignObject/i);
      // every gradient it uses is defined, and under this icon's own prefix
      for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) expect(svg).toContain(`id="${m[1]}"`);
    }
  });

  it('uses the given prefix for gradient ids so icons shown together never clash', () => {
    expect(iconSvg('mint', 64, 'a')).toContain('id="a-bg"');
    expect(iconSvg('mint', 64, 'b')).toContain('id="b-bg"');
    expect(iconSvg('mint', 64, 'b')).not.toContain('id="a-bg"');
  });

  it('is saved in settings, and anything unknown falls back to the original', () => {
    expect(sanitizeSettings({ appIcon: 'night' }).appIcon).toBe('night');
    expect(sanitizeSettings({ appIcon: 'rocket' }).appIcon).toBe('cloud');
    expect(sanitizeSettings({ appIcon: 42 }).appIcon).toBe('cloud');
    expect(sanitizeSettings({}).appIcon).toBe('cloud');
    expect(sanitizeSettings(null).appIcon).toBe('cloud');
  });

  it('does nothing in the browser (only the desktop app has a window icon)', async () => {
    expect(await applyWindowIcon('night')).toBe(false);
  });

  it('is allowed by the window permissions and the Tauri PNG feature is on', () => {
    const caps = readFileSync('src-tauri/capabilities/default.json', 'utf8');
    expect(caps).toContain('core:window:allow-set-icon');
    expect(readFileSync('src-tauri/Cargo.toml', 'utf8')).toMatch(/tauri = \{[^}]*image-png/);
  });
});

describe('Start-up wiring for small local progress files', () => {
  it('loads and flushes every progress store from main.ts', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    for (const name of ['loadStoryProgress', 'loadMeditationProgress', 'loadMovementProgress', 'loadGamesProgress']) expect(main, name).toContain(name);
    for (const name of ['flushStoryProgress', 'meditationProgress.flush', 'movementProgress.flush', 'gamesProgress.flush']) expect(main, name).toContain(name);
  });
});
