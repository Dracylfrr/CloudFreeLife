/**
 * Timelapse. While you paint, a light log of what you did is kept next to the artwork
 * (`timelapse.json`: strokes, fills and so on, never pictures). Later it can be replayed on a
 * fresh canvas and recorded as a short video you can save. It is recorded only for pictures that
 * start empty, so the replay always starts from a blank page, and it stops growing at a fixed
 * size so it can never fill up your disk.
 */
import type { PaintEngine } from './engine';
import { TOOLS } from './tools';
import { sanitizeCommand, type LayerCommand } from './layers';
import { isStamp } from './stamps';

export const MAX_EVENTS = 40000;
export const MAX_NUMBERS = 400000;
/** Points closer together than this (in canvas pixels) are not worth keeping. */
const MIN_GAP = 1.5;

export type Ev =
  | ['b', number, number, string, string, number, 0 | 1] // begin stroke: x, y, tool, color, size, stay inside lines
  | ['m', number[]] // more points of the stroke: x, y, x, y ...
  | ['e'] // end of stroke
  | ['f', number, number, string, 0 | 1] // fill: x, y, color, stay inside
  | ['c', number, number] // clear a region
  | ['p', number, number, string, string, 0 | 1] // paintball: x, y, color, size, stay inside
  | ['s', number, number, string, string, number, number, 0 | 1] // stamp: x, y, color, shape, size, rotation, stay inside
  | ['u'] // undo
  | ['r'] // redo
  | ['x'] // reset page
  | ['y', LayerCommand]; // a layer action (Free Draw layers, from 1.6)

export interface TimelapseLog {
  /** 1 = before layers (1.5); 2 = with layer actions. */
  v: 1 | 2;
  w: number;
  h: number;
  /** True when the log stopped growing because it reached its limit. */
  truncated: boolean;
  events: Ev[];
}

const TOOL_IDS = new Set<string>(TOOLS.map((t) => t.id));
const HEX = /^#[0-9a-f]{6}$/i;
const BALL = new Set(['small', 'medium', 'large']);
const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const q = (v: number) => Math.round(v);

/** Collects events while painting. */
export class Recorder {
  events: Ev[] = [];
  truncated = false;
  dirty = false;
  private numbers = 0;
  private last: { x: number; y: number } | null = null;

  constructor(
    readonly w: number,
    readonly h: number
  ) {}

  get count() {
    return this.events.length;
  }

  private push(ev: Ev, nums: number): boolean {
    if (this.truncated) return false;
    if (this.events.length >= MAX_EVENTS || this.numbers + nums > MAX_NUMBERS) {
      this.truncated = true;
      return false;
    }
    this.events.push(ev);
    this.numbers += nums;
    this.dirty = true;
    return true;
  }

  begin(x: number, y: number, s: { tool: string; color: string; size: number; stayInside: boolean }) {
    this.last = { x, y };
    this.push(['b', q(x), q(y), s.tool, s.color, Math.round(s.size * 10) / 10, s.stayInside ? 1 : 0], 4);
  }
  move(points: { x: number; y: number }[]) {
    const flat: number[] = [];
    for (const p of points) {
      if (this.last && Math.hypot(p.x - this.last.x, p.y - this.last.y) < MIN_GAP) continue;
      flat.push(q(p.x), q(p.y));
      this.last = { x: p.x, y: p.y };
    }
    if (flat.length) this.push(['m', flat], flat.length);
  }
  end() {
    this.last = null;
    this.push(['e'], 0);
  }
  fill(x: number, y: number, color: string, stay: boolean) {
    this.push(['f', q(x), q(y), color, stay ? 1 : 0], 3);
  }
  clear(x: number, y: number) {
    this.push(['c', q(x), q(y)], 2);
  }
  paintball(x: number, y: number, color: string, size: string, stay: boolean) {
    this.push(['p', q(x), q(y), color, size, stay ? 1 : 0], 3);
  }
  undo() {
    this.push(['u'], 0);
  }
  redo() {
    this.push(['r'], 0);
  }
  reset() {
    this.push(['x'], 0);
  }
  stamp(x: number, y: number, color: string, shape: string, size: number, rot: number, stay: boolean) {
    this.push(['s', q(x), q(y), color, shape, Math.round(size * 10) / 10, Math.round(rot * 100) / 100, stay ? 1 : 0], 5);
  }
  layer(cmd: LayerCommand) {
    this.push(['y', cmd], 3);
  }

  toLog(): TimelapseLog {
    return { v: 2, w: this.w, h: this.h, truncated: this.truncated, events: this.events };
  }

  /** Carries on from a saved log. */
  static from(log: TimelapseLog): Recorder {
    const r = new Recorder(log.w, log.h);
    r.events = [...log.events];
    r.truncated = log.truncated;
    r.numbers = log.events.reduce((n, e) => n + (e[0] === 'm' ? e[1].length : e.length), 0);
    return r;
  }
}

/** Reads a saved log. Anything damaged is dropped; a log with nothing usable is null. */
export function sanitizeLog(raw: unknown): TimelapseLog | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if ((r.v !== 1 && r.v !== 2) || !fin(r.w) || !fin(r.h) || r.w < 16 || r.h < 16 || r.w > 8192 || r.h > 8192 || !Array.isArray(r.events)) return null;
  const events: Ev[] = [];
  let numbers = 0;
  let inStroke = false;
  for (const e of r.events as unknown[]) {
    if (events.length >= MAX_EVENTS || numbers > MAX_NUMBERS) break;
    if (!Array.isArray(e) || typeof e[0] !== 'string') continue;
    switch (e[0]) {
      case 'b':
        if (fin(e[1]) && fin(e[2]) && typeof e[3] === 'string' && TOOL_IDS.has(e[3]) && typeof e[4] === 'string' && HEX.test(e[4]) && fin(e[5]) && e[5] > 0 && e[5] < 400) {
          events.push(['b', e[1], e[2], e[3], e[4], e[5], e[6] === 1 ? 1 : 0]);
          inStroke = true;
          numbers += 4;
        }
        break;
      case 'm':
        if (inStroke && Array.isArray(e[1]) && e[1].length % 2 === 0 && e[1].every(fin)) {
          events.push(['m', e[1] as number[]]);
          numbers += e[1].length;
        }
        break;
      case 'e':
        if (inStroke) {
          events.push(['e']);
          inStroke = false;
        }
        break;
      case 'f':
        if (fin(e[1]) && fin(e[2]) && typeof e[3] === 'string' && HEX.test(e[3])) events.push(['f', e[1], e[2], e[3], e[4] === 1 ? 1 : 0]), (numbers += 3);
        break;
      case 'c':
        if (fin(e[1]) && fin(e[2])) events.push(['c', e[1], e[2]]), (numbers += 2);
        break;
      case 'p':
        if (fin(e[1]) && fin(e[2]) && typeof e[3] === 'string' && HEX.test(e[3]) && typeof e[4] === 'string' && BALL.has(e[4])) events.push(['p', e[1], e[2], e[3], e[4], e[5] === 1 ? 1 : 0]), (numbers += 3);
        break;
      case 's':
        if (r.v === 2 && fin(e[1]) && fin(e[2]) && typeof e[3] === 'string' && HEX.test(e[3]) && isStamp(e[4]) && fin(e[5]) && e[5] >= 2 && e[5] <= 120 && fin(e[6]) && Math.abs(e[6]) <= 7) events.push(['s', e[1], e[2], e[3], e[4], e[5], e[6], e[7] === 1 ? 1 : 0]), (numbers += 5);
        break;
      case 'u':
      case 'r':
      case 'x':
        events.push([e[0]]);
        break;
      case 'y': {
        // layer actions only exist in version 2 logs
        const cmd = r.v === 2 ? sanitizeCommand(e[1]) : null;
        if (cmd) events.push(['y', cmd]), (numbers += 3);
        break;
      }
    }
  }
  if (inStroke) events.push(['e']);
  return events.length ? { v: r.v === 2 ? 2 : 1, w: r.w, h: r.h, truncated: r.truncated === true, events } : null;
}

/** The slice of events to play for each video frame, so the whole log fits the video's length. */
export function framePlan(total: number, frames: number): number[] {
  const out: number[] = [];
  for (let f = 1; f <= frames; f++) out.push(Math.min(total, Math.round((f * total) / frames)));
  if (out.length) out[out.length - 1] = total;
  return out;
}

/** How long the video is: longer for bigger paintings, but always short. */
export function videoSeconds(events: number): number {
  return Math.min(20, Math.max(6, Math.round(events / 90)));
}

/** The few engine methods a replay needs (so a test can stand in for the real engine). */
export type ReplayTarget = Pick<PaintEngine, 'beginStroke' | 'moveStroke' | 'endStroke' | 'fillAt' | 'clearRegionAt' | 'paintball' | 'stampAt' | 'undo' | 'redo' | 'resetAll' | 'layerCommand'> & {
  state: PaintEngine['state'];
};

export function applyEvent(t: ReplayTarget, ev: Ev) {
  switch (ev[0]) {
    case 'b':
      t.state.tool = ev[3] as never;
      t.state.color = ev[4];
      t.state.size = ev[5];
      t.state.stayInside = ev[6] === 1;
      t.beginStroke(ev[1], ev[2]);
      break;
    case 'm': {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i + 1 < ev[1].length; i += 2) pts.push({ x: ev[1][i], y: ev[1][i + 1] });
      t.moveStroke(pts);
      break;
    }
    case 'e':
      t.endStroke();
      break;
    case 'f':
      t.state.color = ev[3];
      t.state.stayInside = ev[4] === 1;
      t.fillAt(ev[1], ev[2]);
      break;
    case 'c':
      t.clearRegionAt(ev[1], ev[2]);
      break;
    case 'p':
      t.state.color = ev[3];
      t.state.paintballSize = ev[4] as never;
      t.state.stayInside = ev[5] === 1;
      t.paintball(ev[1], ev[2]);
      break;
    case 's':
      t.state.color = ev[3];
      t.state.stampShape = ev[4] as never;
      t.state.size = ev[5];
      t.state.stayInside = ev[7] === 1;
      t.stampAt(ev[1], ev[2], ev[6]);
      break;
    case 'u':
      t.undo();
      break;
    case 'r':
      t.redo();
      break;
    case 'x':
      t.resetAll();
      break;
    case 'y':
      t.layerCommand(ev[1]);
      break;
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
}

function pickMime(): string {
  for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) if (MediaRecorder.isTypeSupported(m)) return m;
  return '';
}

export interface RenderOpts {
  engine: PaintEngine;
  log: TimelapseLog;
  /** Output width in pixels (height follows the picture). */
  width?: number;
  fps?: number;
  onProgress?: (fraction: number) => void;
  cancelled?: () => boolean;
}

/** Replays the log on `engine` (already set up with the page's lines or background) and records it. */
export async function renderTimelapse(o: RenderOpts): Promise<Blob | null> {
  if (!recordingSupported()) throw new Error('Making a video is not available on this computer.');
  const { engine, log } = o;
  const fps = o.fps ?? 30;
  const width = o.width ?? 960;
  const height = Math.round((width * log.h) / log.w);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const g = out.getContext('2d')!;
  const frames = videoSeconds(log.events.length) * fps;
  const plan = framePlan(log.events.length, frames);
  const draw = () => {
    g.fillStyle = '#fffdf8';
    g.fillRect(0, 0, width, height);
    g.drawImage(engine.compose(1), 0, 0, width, height);
  };
  draw();
  const stream = out.captureStream(fps);
  const mime = pickMime();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 3_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
  rec.start(500);
  let at = 0;
  const t0 = performance.now();
  try {
    for (let f = 0; f < plan.length; f++) {
      if (o.cancelled?.()) break;
      for (; at < plan[f]; at++) applyEvent(engine, log.events[at]);
      draw();
      o.onProgress?.((f + 1) / (plan.length + fps));
      const wait = t0 + ((f + 1) * 1000) / fps - performance.now();
      await sleep(Math.max(0, wait));
    }
    // hold the finished picture for a moment
    for (let h = 0; h < fps && !o.cancelled?.(); h++) {
      draw();
      o.onProgress?.((plan.length + h + 1) / (plan.length + fps));
      await sleep(1000 / fps);
    }
  } finally {
    rec.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
  }
  if (o.cancelled?.() || !chunks.length) return null;
  return new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' });
}
