// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings, applySettingsToDocument } from '../src/core/settings';
import {
  THEMES,
  __resetThemeForTests,
  applyTheme,
  contrastRatio,
  highContrastVars,
  isThemeChoice,
  resolveTheme,
  themeVars
} from '../src/core/themes';

const hex = (v: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);

describe('themes', () => {
  it('ships the eight requested presets with unique ids', () => {
    expect(THEMES.map((t) => t.name)).toEqual([
      'Cloud Morning',
      'Lavender Dream',
      'Peach Sunset',
      'Mint Breeze',
      'Blossom Rain',
      'Candle Glow',
      'Moonlight',
      'Ocean Mist'
    ]);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(8);
  });

  it('defines the same variables in every theme (no theme is missing a token)', () => {
    const keys = Object.keys(THEMES[0].vars).sort();
    for (const t of THEMES) expect(Object.keys(t.vars).sort()).toEqual(keys);
  });

  it('keeps body text readable on every theme surface', () => {
    for (const t of THEMES) {
      const surface = t.vars['--panel-solid'];
      expect(contrastRatio(t.vars['--ink'], surface), `${t.id} ink`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(t.vars['--ink-soft'], surface), `${t.id} ink-soft`).toBeGreaterThanOrEqual(4.5);
      // text on the primary gradient buttons
      for (const g of [t.vars['--g1'], t.vars['--g2']]) {
        expect(contrastRatio(t.vars['--g-ink'], g), `${t.id} button text`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(t.vars['--nav-ink'], hex(t.vars['--nav-a'])!), `${t.id} nav`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.vars['--nav-ink'], hex(t.vars['--nav-b'])!), `${t.id} nav b`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('Moonlight is dark but not black', () => {
    const m = THEMES.find((t) => t.id === 'moonlight')!;
    expect(m.dark).toBe(true);
    for (const k of ['--bg-a', '--bg-b', '--panel-solid']) {
      const hexv = hex(m.vars[k])!;
      const n = parseInt(hexv.slice(1), 16);
      expect(Math.max(n >> 16, (n >> 8) & 255, n & 255)).toBeGreaterThan(0x30);
    }
  });

  it('Higher Contrast strengthens text in every theme', () => {
    for (const t of THEMES) {
      const hc = themeVars(t, true);
      expect(contrastRatio(hc['--ink'], t.vars['--panel-solid'])).toBeGreaterThanOrEqual(contrastRatio(t.vars['--ink'], t.vars['--panel-solid']));
      expect(contrastRatio(hc['--ink-soft'], t.vars['--panel-solid']), `${t.id} hc soft`).toBeGreaterThanOrEqual(7);
      expect(Object.keys(highContrastVars(t)).length).toBeGreaterThan(3);
    }
  });

  it('resolves Follow System to Cloud Morning or Moonlight', () => {
    expect(resolveTheme('system', false).id).toBe('cloud_morning');
    expect(resolveTheme('system', true).id).toBe('moonlight');
    expect(resolveTheme('blossom_rain', true).id).toBe('blossom_rain');
  });
});

describe('theme persistence and migration', () => {
  beforeEach(() => {
    __resetThemeForTests();
    document.documentElement.removeAttribute('style');
  });

  it('a v1.2 settings file (no theme keys) opens in Cloud Morning with everything else intact', () => {
    const v12 = { schema: 1, uiScale: 1.2, reducedMotion: true, volumeMaster: 0.5, paletteId: 'cosmic_colors', lastColor: '#a9d4f5', storyFontScale: 1.3 };
    const s = sanitizeSettings(v12);
    expect(s.theme).toBe('cloud_morning');
    expect(s.mood).toBe('default');
    expect(s.uiScale).toBe(1.2);
    expect(s.reducedMotion).toBe(true);
    expect(s.volumeMaster).toBe(0.5);
    expect(s.paletteId).toBe('cosmic_colors');
    expect(s.storyFontScale).toBe(1.3);
    expect(s.ttsRate).toBe(1);
    expect(s.ttsHighlight).toBe(true);
  });

  it('saves and restores the selected theme, and rejects unknown ones', () => {
    for (const t of THEMES) expect(sanitizeSettings({ theme: t.id }).theme).toBe(t.id);
    expect(sanitizeSettings({ theme: 'system' }).theme).toBe('system');
    expect(sanitizeSettings({ theme: 'neon_arcade' }).theme).toBe(DEFAULT_SETTINGS.theme);
    expect(isThemeChoice('moonlight')).toBe(true);
    expect(isThemeChoice(42)).toBe(false);
  });

  it('clamps Read Aloud speed and keeps the voice id', () => {
    expect(sanitizeSettings({ ttsRate: 9 }).ttsRate).toBe(1.5);
    expect(sanitizeSettings({ ttsRate: 0.1 }).ttsRate).toBe(0.75);
    expect(sanitizeSettings({ ttsVoice: 'Microsoft Aria' }).ttsVoice).toBe('Microsoft Aria');
    expect(sanitizeSettings({ ttsVoice: 42 }).ttsVoice).toBe('');
  });

  it('applies tokens to the document and switches cleanly between themes', () => {
    applyTheme('moonlight', false, false);
    const root = document.documentElement;
    expect(root.dataset.theme).toBe('moonlight');
    expect(root.dataset.tone).toBe('dark');
    expect(root.style.getPropertyValue('--ink')).toBe('#ebe9fb');
    applyTheme('mint_breeze', false, false);
    expect(root.dataset.tone).toBe('light');
    expect(root.style.getPropertyValue('--ink')).toBe('#34504a');
  });

  it('applies Higher Contrast on top of any theme through the settings entry point', () => {
    applySettingsToDocument({ ...DEFAULT_SETTINGS, theme: 'moonlight', highContrast: true });
    expect(document.documentElement.style.getPropertyValue('--ink')).toBe('#ffffff');
    applySettingsToDocument({ ...DEFAULT_SETTINGS, theme: 'candle_glow', highContrast: true });
    expect(document.documentElement.style.getPropertyValue('--ink')).toBe('#241f3d');
    expect(document.documentElement.dataset.contrast).toBe('high');
  });
});
