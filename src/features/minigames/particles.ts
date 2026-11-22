/**
 * Small, capped particle system for soft effects: bubbles, stars, paint dots
 * and little clouds. Particles are skipped entirely when the player disables
 * them (Accessibility / Low Power), and the pool never exceeds `max`.
 */
export type ParticleKind = 'bubble' | 'star' | 'dot' | 'cloud' | 'spark';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  gravity: number;
}

export class ParticleSystem {
  private items: Particle[] = [];
  enabled = true;
  constructor(private max = 220) {}

  get count() {
    return this.items.length;
  }

  clear() {
    this.items.length = 0;
  }

  private push(p: Particle) {
    if (!this.enabled) return;
    if (this.items.length >= this.max) this.items.shift();
    this.items.push(p);
  }

  /** A burst of mixed particles in a pastel colour. */
  burst(x: number, y: number, color: string, amount = 8) {
    if (!this.enabled) return;
    const kinds: ParticleKind[] = ['bubble', 'star', 'dot', 'cloud'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 150;
      const k: ParticleKind = i % 3 === 0 ? 'spark' : kind;
      this.push({
        kind: k,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (k === 'bubble' || k === 'cloud' ? 50 : 0),
        life: 0,
        max: 0.7 + Math.random() * 0.7,
        size: k === 'cloud' ? 12 + Math.random() * 10 : k === 'spark' ? 5 + Math.random() * 4 : 6 + Math.random() * 7,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 6,
        color,
        gravity: k === 'bubble' || k === 'cloud' ? -30 : k === 'dot' ? 260 : 120
      });
    }
  }

  /** Rising bubbles / sparkles for ambient celebration. */
  confetti(x: number, y: number, w: number, color: string) {
    this.burst(x + (Math.random() - 0.5) * w, y, color, 3);
  }

  update(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.items.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= 1 - 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.items) {
      const t = p.life / p.max;
      const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.translate(p.x, p.y);
      switch (p.kind) {
        case 'bubble':
          ctx.fillStyle = p.color;
          ctx.globalAlpha *= 0.55;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = Math.max(0, a) * 0.9;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.22, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
        case 'spark': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.kind === 'spark' ? '#fffbe0' : p.color;
          ctx.beginPath();
          const pts = p.kind === 'spark' ? 4 : 5;
          for (let i = 0; i < pts * 2; i++) {
            const r = i % 2 === 0 ? p.size : p.size * (p.kind === 'spark' ? 0.28 : 0.45);
            const ang = (i * Math.PI) / pts - Math.PI / 2;
            ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          }
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'dot':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'cloud':
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha *= 0.9;
          ctx.beginPath();
          ctx.arc(-p.size * 0.5, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.arc(p.size * 0.1, -p.size * 0.25, p.size * 0.7, 0, Math.PI * 2);
          ctx.arc(p.size * 0.6, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }
}
