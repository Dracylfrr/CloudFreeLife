import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Updates feel calm', () => {
  it('the update dot in the sidebar is green, never pink or red', () => {
    const css = readFileSync('src/ui/Sidebar.svelte', 'utf8');
    const dot = css.slice(css.indexOf('  .dot {'), css.indexOf('  .quick {'));
    expect(dot).toContain('#5cc79a');
    expect(dot).not.toContain('pink');
    expect(css).not.toContain('rgba(244, 155, 189, 0.25)');
  });
  it('Settings has no Updates tab, and its start-up check switch lives on the Updates page', () => {
    const settings = readFileSync('src/features/settings/Settings.svelte', 'utf8');
    expect(settings).not.toContain("id: 'updates'");
    expect(settings).not.toContain("tab === 'updates'");
    expect(settings).not.toContain('checkForUpdates');
    const page = readFileSync('src/features/updates/Updates.svelte', 'utf8');
    expect(page).toContain('checkUpdatesOnStartup');
    expect(page).toContain('Check for updates when the app starts');
  });
});
