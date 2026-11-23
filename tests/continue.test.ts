import { describe, expect, it } from 'vitest';
import { pickContinue } from '../src/features/home/continue';

describe('Home Continue picker', () => {
  it('returns null when nothing has been touched', () => {
    expect(pickContinue([])).toBeNull();
    expect(pickContinue([null, undefined])).toBeNull();
  });
  it('picks the most recently touched thing', () => {
    expect(pickContinue([{ kind: 'painting', at: 100 }, { kind: 'reading', at: 300 }, { kind: 'meditation', at: 200 }])?.kind).toBe('reading');
    expect(pickContinue([{ kind: 'painting', at: 100 }, null, { kind: 'zen', at: 900 }])?.kind).toBe('zen');
    expect(pickContinue([{ kind: 'meditation', at: 5000 }, { kind: 'painting', at: 10 }])?.kind).toBe('meditation');
  });
  it('lets the earlier candidate win a tie', () => {
    expect(pickContinue([{ kind: 'painting', at: 50 }, { kind: 'reading', at: 50 }])?.kind).toBe('painting');
  });
  it('ignores bad timestamps', () => {
    expect(pickContinue([{ kind: 'reading', at: NaN }, { kind: 'painting', at: 0 }, { kind: 'zen', at: -3 }])).toBeNull();
  });
});
