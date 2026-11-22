import { mix } from '../../../core/util';
import { FIELD_H, FIELD_W, type BreakerGame } from './logic';
import type { ParticleSystem } from '../particles';

const LINE = 'rgba(110,106,142,0.55)';

let bgCache: HTMLCanvasElement | null = null;

function background(): HTMLCanvasElement {
  if (bgCache) return bgCache;
  const c = document.createElement('canvas');
  c.width = FIELD_W;
  c.height = FIELD_H;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, FIELD_W * 0.4, FIELD_H);
  grad.addColorStop(0, '#e4f2fc');
  grad.addColorStop(0.55, '#ece6fb');
  grad.addColorStop(1, '#fdeaf1');
  g.fillStyle = grad;
  g.fillRect(0, 0, FIELD_W, FIELD_H);
  // a few very faint clouds
  g.fillStyle = 'rgba(255,255,255,0.55)';
  for (const [x, y, s] of [[150, 250, 1], [700, 340, 1.3], [430, 470, 0.8]] as const) {
    g.beginPath();
    g.arc(x, y, 34 * s, 0, 7);
    g.arc(x + 46 * s, y - 20 * s, 46 * s, 0, 7);
    g.arc(x + 100 * s, y, 36 * s, 0, 7);
    g.fill();
  }
  bgCache = c;
  return c;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function renderBreaker(g: CanvasRenderingContext2D, game: BreakerGame, particles: ParticleSystem) {
  g.drawImage(background(), 0, 0);

  for (const b of game.blocks) {
    if (!b.alive) continue;
    const flash = b.flash > 0 ? b.flash / 0.2 : 0;
    const fill = flash ? mix(b.color, '#ffffff', flash * 0.7) : b.color;
    roundRect(g, b.x, b.y, b.w, b.h, 9);
    g.fillStyle = fill;
    g.fill();
    // soft highlight
    g.fillStyle = 'rgba(255,255,255,0.4)';
    roundRect(g, b.x + 4, b.y + 4, b.w - 8, b.h * 0.36, 6);
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = LINE;
    roundRect(g, b.x, b.y, b.w, b.h, 9);
    g.stroke();
    if (b.maxHp > 1) {
      // two-hit blocks get a little cloud badge; cracked when hit once
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.arc(b.x + b.w / 2 - 5, b.y + b.h / 2 + 1, 4.5, 0, 7);
      g.arc(b.x + b.w / 2 + 1, b.y + b.h / 2 - 2, 5.5, 0, 7);
      g.arc(b.x + b.w / 2 + 7, b.y + b.h / 2 + 1, 4.5, 0, 7);
      g.fill();
      if (b.hp < b.maxHp) {
        g.strokeStyle = LINE;
        g.lineWidth = 1.8;
        g.beginPath();
        g.moveTo(b.x + b.w * 0.3, b.y + 3);
        g.lineTo(b.x + b.w * 0.42, b.y + b.h * 0.5);
        g.lineTo(b.x + b.w * 0.34, b.y + b.h - 3);
        g.stroke();
      }
    }
  }

  // ball trail
  const t = game.ball.trail;
  for (let i = 0; i < t.length; i++) {
    g.fillStyle = `rgba(247,168,200,${(i / t.length) * 0.22})`;
    g.beginPath();
    g.arc(t[i].x, t[i].y, game.ball.r * (0.4 + 0.5 * (i / t.length)), 0, 7);
    g.fill();
  }

  // paddle
  const p = game.paddle;
  const pg = g.createLinearGradient(0, p.y, 0, p.y + p.h);
  pg.addColorStop(0, '#c9bdf2');
  pg.addColorStop(1, '#9fd3f2');
  roundRect(g, p.x - p.w / 2, p.y, p.w, p.h, 8);
  g.fillStyle = pg;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = LINE;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  roundRect(g, p.x - p.w / 2 + 8, p.y + 3, p.w - 16, 4, 2);
  g.fill();

  // ball
  const b = game.ball;
  const bg = g.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.r);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.4, '#ffd3e2');
  bg.addColorStop(1, '#f49bbd');
  g.fillStyle = bg;
  g.beginPath();
  g.arc(b.x, b.y, b.r, 0, 7);
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = LINE;
  g.stroke();

  particles.draw(g);
}
