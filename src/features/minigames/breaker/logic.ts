/**
 * Pastel Breaker game logic. Pure and deterministic enough to unit-test:
 * no DOM, no canvas - only numbers and callbacks.
 */
import type { BreakerLevel } from '../../../core/manifests';

export type BreakerMode = 'relax' | 'classic' | 'endless';

export const FIELD_W = 900;
export const FIELD_H = 640;
const MARGIN = 36;
const GAP = 7;
const BLOCK_H = 30;
const TOP = 78;

export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  hp: number;
  maxHp: number;
  alive: boolean;
  /** flash timer when hit but not broken */
  flash: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
}

export interface ModeConfig {
  lives: number | null; // null = unlimited
  speed: number;
  paddle: number;
  autoReturn: boolean;
  speedUp: number;
}

export const MODES: Record<BreakerMode, ModeConfig> = {
  relax: { lives: null, speed: 330, paddle: 170, autoReturn: true, speedUp: 0 },
  classic: { lives: 3, speed: 440, paddle: 132, autoReturn: false, speedUp: 0 },
  endless: { lives: 3, speed: 410, paddle: 140, autoReturn: false, speedUp: 22 }
};

export function levelToBlocks(level: Pick<BreakerLevel, 'grid' | 'legend' | 'tough'>): Block[] {
  const cols = level.grid[0].length;
  const w = (FIELD_W - MARGIN * 2 - GAP * (cols - 1)) / cols;
  const blocks: Block[] = [];
  level.grid.forEach((row, ry) => {
    [...row].forEach((ch, cx) => {
      const color = level.legend[ch];
      if (!color) return;
      const hp = level.tough?.includes(ch) ? 2 : 1;
      blocks.push({ x: MARGIN + cx * (w + GAP), y: TOP + ry * (BLOCK_H + GAP), w, h: BLOCK_H, color, hp, maxHp: hp, alive: true, flash: 0 });
    });
  });
  return blocks;
}

/** A pleasant random layout for Endless mode. */
export function randomLevel(rng: () => number, palette: string[], depth: number): Pick<BreakerLevel, 'grid' | 'legend' | 'tough'> {
  const cols = 12;
  const rows = Math.min(8, 4 + Math.floor(depth / 2));
  const letters = 'abcdef';
  const legend: Record<string, string> = {};
  palette.slice(0, 6).forEach((c, i) => (legend[letters[i]] = c));
  const used = Object.keys(legend);
  const pattern = Math.floor(rng() * 4);
  const grid: string[] = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      let on = true;
      if (pattern === 1) on = (r + c) % 2 === 0;
      else if (pattern === 2) on = Math.abs(c - 5.5) + r * 0.9 < 7;
      else if (pattern === 3) on = c % 3 !== 2;
      row += on ? used[(r + Math.floor(c / 2) + pattern) % used.length] : '.';
    }
    grid.push(row);
  }
  const tough = depth >= 3 ? [used[0]] : undefined;
  return { grid, legend, tough };
}

export interface GameEvents {
  onBreak?: (b: Block) => void;
  onHit?: (b: Block) => void;
  onPaddle?: () => void;
  onWall?: () => void;
  onLost?: () => void;
  onWin?: () => void;
  onGameOver?: () => void;
}

export class BreakerGame {
  blocks: Block[] = [];
  ball: Ball = { x: FIELD_W / 2, y: FIELD_H - 70, vx: 0, vy: 0, r: 10, stuck: true, trail: [] };
  paddle = { x: FIELD_W / 2, w: 140, h: 16, y: FIELD_H - 44 };
  lives: number | null = 3;
  popped = 0;
  level = 1;
  status: 'ready' | 'playing' | 'won' | 'over' = 'ready';
  cfg: ModeConfig;
  speed: number;
  /** seconds until an auto-returned ball re-launches */
  private returnTimer = 0;
  private targetX = FIELD_W / 2;

  constructor(
    readonly mode: BreakerMode,
    private events: GameEvents = {}
  ) {
    this.cfg = MODES[mode];
    this.lives = this.cfg.lives;
    this.speed = this.cfg.speed;
    this.paddle.w = this.cfg.paddle;
  }

  loadBlocks(blocks: Block[]) {
    this.blocks = blocks;
    this.status = 'ready';
    this.resetBall();
  }

  get remaining(): number {
    return this.blocks.filter((b) => b.alive).length;
  }

  nextLevel(blocks: Block[]) {
    this.level++;
    this.speed = Math.min(720, this.speed + this.cfg.speedUp);
    this.loadBlocks(blocks);
  }

  setPaddleTarget(x: number) {
    this.targetX = Math.max(this.paddle.w / 2, Math.min(FIELD_W - this.paddle.w / 2, x));
  }

  nudgePaddle(dx: number) {
    this.setPaddleTarget(this.targetX + dx);
  }

  resetBall() {
    this.ball.stuck = true;
    this.ball.vx = this.ball.vy = 0;
    this.ball.trail.length = 0;
    this.ball.x = this.paddle.x;
    this.ball.y = this.paddle.y - this.ball.r - 2;
  }

  launch() {
    if (this.status === 'won' || this.status === 'over') return;
    if (!this.ball.stuck) return;
    const ang = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6;
    this.ball.vx = Math.cos(ang) * this.speed;
    this.ball.vy = Math.sin(ang) * this.speed;
    this.ball.stuck = false;
    this.status = 'playing';
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05);
    // paddle eases toward the mouse so movement stays soft
    const k = 1 - Math.pow(0.0001, dt);
    this.paddle.x += (this.targetX - this.paddle.x) * k;
    for (const b of this.blocks) if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);

    if (this.status === 'won' || this.status === 'over') return;

    if (this.ball.stuck) {
      this.ball.x = this.paddle.x;
      this.ball.y = this.paddle.y - this.ball.r - 2;
      if (this.returnTimer > 0) {
        this.returnTimer -= dt;
        if (this.returnTimer <= 0) this.launch();
      }
      return;
    }
    // sub-step so a fast ball can never tunnel through a block
    const dist = Math.hypot(this.ball.vx, this.ball.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / (this.ball.r * 0.6)));
    for (let i = 0; i < steps; i++) {
      this.step(dt / steps);
      if (this.status !== 'playing') break;
    }
    const t = this.ball.trail;
    t.push({ x: this.ball.x, y: this.ball.y });
    if (t.length > 9) t.shift();
  }

  private step(dt: number) {
    const b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // walls
    if (b.x < b.r) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
      this.events.onWall?.();
    } else if (b.x > FIELD_W - b.r) {
      b.x = FIELD_W - b.r;
      b.vx = -Math.abs(b.vx);
      this.events.onWall?.();
    }
    if (b.y < b.r) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
      this.events.onWall?.();
    }
    // paddle
    const p = this.paddle;
    if (b.vy > 0 && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h && b.x >= p.x - p.w / 2 - b.r && b.x <= p.x + p.w / 2 + b.r) {
      const hit = Math.max(-1, Math.min(1, (b.x - p.x) / (p.w / 2)));
      const ang = -Math.PI / 2 + hit * (Math.PI / 3);
      b.vx = Math.cos(ang) * this.speed;
      b.vy = Math.sin(ang) * this.speed;
      b.y = p.y - b.r - 0.5;
      this.events.onPaddle?.();
    }
    // blocks
    for (const k of this.blocks) {
      if (!k.alive) continue;
      const nx = Math.max(k.x, Math.min(b.x, k.x + k.w));
      const ny = Math.max(k.y, Math.min(b.y, k.y + k.h));
      const dx = b.x - nx;
      const dy = b.y - ny;
      if (dx * dx + dy * dy > b.r * b.r) continue;
      // reflect on the axis of least penetration
      const left = b.x + b.r - k.x;
      const right = k.x + k.w - (b.x - b.r);
      const top = b.y + b.r - k.y;
      const bottom = k.y + k.h - (b.y - b.r);
      const min = Math.min(left, right, top, bottom);
      if (min === left) {
        b.vx = -Math.abs(b.vx);
        b.x = k.x - b.r;
      } else if (min === right) {
        b.vx = Math.abs(b.vx);
        b.x = k.x + k.w + b.r;
      } else if (min === top) {
        b.vy = -Math.abs(b.vy);
        b.y = k.y - b.r;
      } else {
        b.vy = Math.abs(b.vy);
        b.y = k.y + k.h + b.r;
      }
      k.hp--;
      if (k.hp <= 0) {
        k.alive = false;
        this.popped++;
        this.events.onBreak?.(k);
      } else {
        k.flash = 0.2;
        this.events.onHit?.(k);
      }
      break; // one block per sub-step keeps bounces predictable
    }
    if (this.remaining === 0) {
      this.status = 'won';
      this.events.onWin?.();
      return;
    }
    // lost the ball
    if (b.y - b.r > FIELD_H) {
      this.events.onLost?.();
      if (this.cfg.autoReturn) {
        this.resetBall();
        this.returnTimer = 0.9;
        this.status = 'ready';
      } else if (this.lives !== null) {
        this.lives--;
        if (this.lives <= 0) {
          this.status = 'over';
          this.events.onGameOver?.();
        } else {
          this.resetBall();
          this.status = 'ready';
        }
      }
    }
  }
}
