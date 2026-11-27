import { describe, expect, it, vi } from 'vitest';
import { onBeforeLeave, runLeaveGuards } from '../src/core/router';

describe('Leaving a screen or closing the window never waits for ever', () => {
  it('runs every saving step, one after another', async () => {
    const order: string[] = [];
    const a = onBeforeLeave(async () => void order.push('a'));
    const b = onBeforeLeave(() => void order.push('b'));
    await runLeaveGuards();
    a();
    b();
    expect(order).toEqual(['a', 'b']);
  });
  it('moves on when a saving step takes far too long, and when one fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stuck = onBeforeLeave(() => new Promise<void>(() => {}));
    const broken = onBeforeLeave(() => {
      throw new Error('disk full');
    });
    const t0 = Date.now();
    await runLeaveGuards(60);
    stuck();
    broken();
    expect(Date.now() - t0).toBeLessThan(2000);
    warn.mockRestore();
  });
});
