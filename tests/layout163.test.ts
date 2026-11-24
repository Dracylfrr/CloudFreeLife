import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Shelves show five cards across', () => {
  for (const f of ['src/features/books/Books.svelte', 'src/features/books/BookView.svelte', 'src/features/meditation/Meditation.svelte', 'src/features/movement/Movement.svelte', 'src/features/stories/Stories.svelte']) {
    it(`${f.split('/').pop()} has five columns, with fewer only on narrow windows`, () => {
      const css = readFileSync(f, 'utf8');
      expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
      expect(css).toContain('max-width: 1180px');
      expect(css).toContain('repeat(4, minmax(0, 1fr))');
      expect(css).toContain('repeat(2, minmax(0, 1fr))');
      // the old open-ended layout is gone
      expect(css).not.toMatch(/\.shelf \{[^}]*auto-fill/);
    });
  }
});

describe('The App icon reaches the taskbar', () => {
  const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
  const page = readFileSync('src/core/appIcon.ts', 'utf8');
  it('is set from the native side, large icon first and then the small one', () => {
    expect(rust).toContain('fn set_taskbar_icon');
    expect(rust.indexOf('ICON_BIG as usize')).toBeGreaterThan(-1);
    expect(rust.indexOf('ICON_SMALL as usize')).toBeGreaterThan(rust.indexOf('ICON_BIG as usize'));
  });
  it('is asked for by the page when an icon is chosen', () => {
    expect(page).toContain("invoke('set_taskbar_icon', png)");
  });
});
