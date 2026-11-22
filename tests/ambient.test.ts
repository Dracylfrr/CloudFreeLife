// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetSettingsForTests, updateSettings } from '../src/core/settings';
import { __setMinimizedForTests } from '../src/core/visibility';
import { ambientTimerRunning, onAmbientTick } from '../src/ui/ticker';

beforeEach(() => {
  vi.useFakeTimers();
  __resetSettingsForTests();
});
afterEach(() => vi.useRealTimers());

describe('ambient clock (decorative motion)', () => {
  it('runs about ten times a second while someone is subscribed, and not at all otherwise', () => {
    expect(ambientTimerRunning()).toBe(false);
    const fn = vi.fn();
    const off = onAmbientTick(fn);
    expect(fn).toHaveBeenCalledTimes(1); // immediate first placement
    expect(ambientTimerRunning()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(10);
    expect(fn.mock.calls.length).toBeLessThanOrEqual(12);
    off();
    expect(ambientTimerRunning()).toBe(false); // no idle timer is left behind
  });

  it('stops completely for Reduced Motion and Low Power, and resumes when they are turned off', () => {
    const off = onAmbientTick(() => {});
    updateSettings({ reducedMotion: true });
    expect(ambientTimerRunning()).toBe(false);
    updateSettings({ reducedMotion: false, lowPowerMode: true });
    expect(ambientTimerRunning()).toBe(false);
    updateSettings({ lowPowerMode: false });
    expect(ambientTimerRunning()).toBe(true);
    off();
  });

  it('stops while the window is hidden (minimised) and resumes when visible', () => {
    const off = onAmbientTick(() => {});
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ambientTimerRunning()).toBe(false);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ambientTimerRunning()).toBe(true);
    off();
  });

  it('stops when the desktop window is minimised (the webview itself still reports "visible")', () => {
    const off = onAmbientTick(() => {});
    expect(ambientTimerRunning()).toBe(true);
    __setMinimizedForTests(true);
    expect(ambientTimerRunning()).toBe(false);
    __setMinimizedForTests(false);
    expect(ambientTimerRunning()).toBe(true);
    off();
  });
});
