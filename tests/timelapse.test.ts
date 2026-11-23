import { describe, expect, it } from 'vitest';
import { MAX_EVENTS, Recorder, applyEvent, framePlan, sanitizeLog, videoSeconds, type Ev, type ReplayTarget } from '../src/features/painting/timelapse';

const state = { tool: 'brush' as const, color: '#a9d4f5', size: 18, stayInside: true };

function fakeTarget() {
  const calls: string[] = [];
  const t = {
    state: { tool: 'brush', color: '#000000', size: 1, stayInside: false, paintballSize: 'medium', reduceMotion: true, particles: false },
    beginStroke: (x: number, y: number) => (calls.push(`begin ${x},${y} ${t.state.tool} ${t.state.color} ${t.state.size} ${t.state.stayInside}`), true),
    moveStroke: (p: { x: number; y: number }[]) => void calls.push(`move ${p.map((q) => `${q.x},${q.y}`).join(' ')}`),
    endStroke: () => void calls.push('end'),
    fillAt: (x: number, y: number) => (calls.push(`fill ${x},${y} ${t.state.color}`), true),
    clearRegionAt: (x: number, y: number) => (calls.push(`clear ${x},${y}`), true),
    paintball: (x: number, y: number) => void calls.push(`ball ${x},${y} ${t.state.color} ${t.state.paintballSize}`),
    undo: () => (calls.push('undo'), true),
    redo: () => (calls.push('redo'), true),
    resetAll: () => void calls.push('reset')
  };
  return { t: t as unknown as ReplayTarget, calls };
}

describe('timelapse recorder', () => {
  it('records strokes compactly and skips points that barely moved', () => {
    const r = new Recorder(1280, 960);
    r.begin(10.4, 20.6, state);
    r.move([{ x: 10.5, y: 20.7 }, { x: 30, y: 40 }, { x: 30.5, y: 40.2 }, { x: 60, y: 80 }]);
    r.end();
    expect(r.events).toEqual([['b', 10, 21, 'brush', '#a9d4f5', 18, 1], ['m', [30, 40, 60, 80]], ['e']]);
    expect(r.dirty).toBe(true);
  });
  it('records fills, clears, paintballs, undo, redo and reset', () => {
    const r = new Recorder(1280, 960);
    r.fill(5, 6, '#ffd3e2', false);
    r.clear(1, 2);
    r.paintball(7, 8, '#bfe4f7', 'large', true);
    r.undo();
    r.redo();
    r.reset();
    expect(r.events.map((e) => e[0])).toEqual(['f', 'c', 'p', 'u', 'r', 'x']);
  });
  it('stops at its size limit and says so, without throwing', () => {
    const r = new Recorder(100, 100);
    for (let i = 0; i < MAX_EVENTS + 50; i++) r.undo();
    expect(r.count).toBe(MAX_EVENTS);
    expect(r.truncated).toBe(true);
    r.fill(1, 1, '#ffffff', true);
    expect(r.count).toBe(MAX_EVENTS);
  });
  it('picks up where a saved log left off', () => {
    const r = new Recorder(1280, 960);
    r.fill(5, 6, '#ffd3e2', true);
    const again = Recorder.from(r.toLog());
    again.clear(1, 1);
    expect(again.count).toBe(2);
    expect(again.dirty).toBe(true);
  });
});

describe('reading a saved log', () => {
  const good = { v: 1, w: 1280, h: 960, truncated: false, events: [['b', 1, 2, 'brush', '#a9d4f5', 18, 1], ['m', [3, 4]], ['e'], ['f', 5, 6, '#ffd3e2', 1]] };
  it('accepts a clean log', () => {
    const l = sanitizeLog(good);
    expect(l?.events).toHaveLength(4);
  });
  it('drops damaged events and keeps the rest', () => {
    const l = sanitizeLog({ ...good, events: [...good.events, ['b', 'x', 2, 'brush', '#fff', 18, 1], ['f', 1, 2, 'red', 1], ['p', 1, 2, '#ffffff', 'huge', 1], ['zzz'], null, 7, ['b', 1, 2, 'laser', '#ffffff', 5, 1]] });
    expect(l?.events).toHaveLength(4);
  });
  it('ignores points that are not inside a stroke, and closes a stroke left open', () => {
    const l = sanitizeLog({ ...good, events: [['m', [1, 2]], ['b', 1, 2, 'brush', '#a9d4f5', 18, 1], ['m', [3, 4]]] });
    expect(l?.events.map((e) => e[0])).toEqual(['b', 'm', 'e']);
  });
  it('refuses things that are not a log', () => {
    for (const bad of [null, 'x', 3, {}, { v: 2, w: 10, h: 10, events: [] }, { ...good, w: 'wide' }, { ...good, w: 99999 }, { ...good, events: [] }, { ...good, events: 'no' }]) expect(sanitizeLog(bad), JSON.stringify(bad)).toBeNull();
  });
});

describe('replaying', () => {
  it('sets the tool, color and size from the log, then does what was done', () => {
    const { t, calls } = fakeTarget();
    const events: Ev[] = [['b', 10, 20, 'marker', '#ffd3e2', 12, 0], ['m', [30, 40, 50, 60]], ['e'], ['f', 7, 8, '#bfe4f7', 1], ['p', 9, 9, '#c6ecda', 'small', 1], ['c', 3, 4], ['u'], ['r'], ['x']];
    for (const e of events) applyEvent(t, e);
    expect(calls).toEqual(['begin 10,20 marker #ffd3e2 12 false', 'move 30,40 50,60', 'end', 'fill 7,8 #bfe4f7', 'ball 9,9 #c6ecda small', 'clear 3,4', 'undo', 'redo', 'reset']);
  });
  it('plans frames so every event is played exactly once, in order', () => {
    const plan = framePlan(1000, 180);
    expect(plan).toHaveLength(180);
    expect(plan[plan.length - 1]).toBe(1000);
    for (let i = 1; i < plan.length; i++) expect(plan[i]).toBeGreaterThanOrEqual(plan[i - 1]);
    expect(framePlan(3, 10).slice(-1)[0]).toBe(3);
    expect(framePlan(0, 5).every((n) => n === 0)).toBe(true);
  });
  it('makes short videos: 6 to 20 seconds', () => {
    expect(videoSeconds(10)).toBe(6);
    expect(videoSeconds(900)).toBe(10);
    expect(videoSeconds(40000)).toBe(20);
  });
});
