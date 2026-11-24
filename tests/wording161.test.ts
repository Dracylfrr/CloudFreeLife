import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { plainMessage } from '../src/features/updates/updater';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('Update messages', () => {
  it('never show a web address or the name of the release host', () => {
    expect(plainMessage(new Error('error sending request for url (https://api.github.com/repos/x/y/releases)'))).not.toMatch(/github|http/i);
    expect(plainMessage('Failed to fetch https://example.com/a', 'Plain words.')).toBe('Plain words.');
    expect(plainMessage('GitHub is down', 'Plain words.')).toBe('Plain words.');
    expect(plainMessage('', 'Plain words.')).toBe('Plain words.');
    expect(plainMessage(undefined, 'Plain words.')).toBe('Plain words.');
  });

  it('keeps ordinary messages', () => {
    expect(plainMessage(new Error('The request timed out'))).toBe('The request timed out');
    expect(plainMessage('Download failed (status 500).')).toBe('Download failed (status 500).');
  });

  it('no screen text says GitHub', () => {
    const files = walk('src').filter((f) => f.endsWith('.svelte'));
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/github/i);
  });
});

describe('Section names', () => {
  const sidebar = readFileSync('src/ui/Sidebar.svelte', 'utf8');
  it('calls the games "Games" and the movement cards "Exercise"', () => {
    expect(sidebar).toContain("label: 'Games'");
    expect(sidebar).toContain("label: 'Exercise'");
    for (const f of ['src/ui/Sidebar.svelte', 'src/features/home/Home.svelte', 'src/features/minigames/MiniGames.svelte', 'src/features/movement/Movement.svelte', 'src/features/movement/MoveCard.svelte']) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/Mini-?Games/);
      expect(text, f).not.toMatch(/Gentle Movement/);
    }
  });
});

describe('Exercise pictures', () => {
  const dirs = readdirSync('content/movement');
  it('have no background of their own, so the card shows the theme behind them', () => {
    expect(dirs.length).toBe(10);
    for (const d of dirs) {
      const svg = readFileSync(join('content/movement', d, 'cover.svg'), 'utf8');
      expect(svg, d).toContain('<svg');
      // no full-size rectangle painting a sky over the whole picture
      expect(svg, d).not.toMatch(/<rect width="800" height="480"/);
      // the soft glow that keeps the figure readable on any theme
      expect(svg, d).toContain('url(#glow)');
    }
  });
});
