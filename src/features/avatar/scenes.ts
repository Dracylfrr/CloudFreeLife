/**
 * Cinematic backgrounds for avatars, painted in a dark, dramatic mood: a storm of cyan slashes, a
 * crimson drape, a gothic castle under the moon, flying embers and a violet void. Each one is a
 * 120 x 120 picture with its own colors (the avatar's plain background color is not used with them).
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A tapered streak from (x0,y0) to the tip (x1,y1), `w` wide at the start and curved by `bend`. */
export function lock(x0: number, y0: number, x1: number, y1: number, w: number, bend = 0): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x0 + x1) / 2 + nx * bend;
  const my = (y0 + y1) / 2 + ny * bend;
  const t = w * 0.38;
  return `M${r1(x0 + (nx * w) / 2)} ${r1(y0 + (ny * w) / 2)}Q${r1(mx + nx * t)} ${r1(my + ny * t)} ${r1(x1)} ${r1(y1)}Q${r1(mx - nx * t)} ${r1(my - ny * t)} ${r1(x0 - (nx * w) / 2)} ${r1(y0 - (ny * w) / 2)}Z`;
}

import type { Scene } from './avatar';

const blades = (list: [number, number, number, number, number, string, number][], bend = 2.2) =>
  list.map(([x0, y0, x1, y1, w, c, o]) => `<path d="${lock(x0, y0, x1, y1, w, w * bend)}" fill="${c}" opacity="${o}"/>`).join('');
const dot = (x: number, y: number, r: number, c: string, o = 0.9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;

/** The background for a scene (never called for "color"). */
export function sceneSvg(scene: Scene, uid: string): { defs: string; body: string } {
  const id = (n: string) => `${n}-${uid}`;
  const blur = `<filter id="${id('bl')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="${id('bl2')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter>`;
  switch (scene) {
    case 'storm':
      return {
        defs: `<linearGradient id="${id('sk')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceef2"/><stop offset="1" stop-color="#b9c0cb"/></linearGradient><radialGradient id="${id('gl')}" cx="0.5" cy="0.42" r="0.55"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` + blur,
        body:
          `<rect width="120" height="120" fill="url(#${id('sk')})"/><rect width="120" height="120" fill="url(#${id('gl')})"/>` +
          blades(
            [
              [0, 24, 54, 6, 4.2, '#2cc4ec', 0.9], [2, 52, 40, 36, 3, '#5fd6f4', 0.85], [70, 4, 120, 30, 4.4, '#2cc4ec', 0.9], [80, 56, 120, 38, 3.6, '#7fe0f8', 0.9],
              [6, 96, 56, 76, 3.2, '#2cc4ec', 0.7], [88, 100, 122, 84, 3, '#5fd6f4', 0.8], [22, 4, 60, -2, 2.2, '#9be8fa', 0.9], [96, 8, 122, 0, 2.2, '#9be8fa', 0.8]
            ],
            2.4
          ) +
          `<g filter="url(#${id('bl2')})">${dot(10, 20, 2.4, '#2a3038', 0.6)}${dot(108, 14, 3, '#2a3038', 0.55)}${dot(102, 96, 2.2, '#2a3038', 0.5)}</g>` +
          dot(16, 74, 1.4, '#2cc4ec') + dot(112, 66, 1.2, '#2cc4ec') + dot(96, 30, 1, '#7fe0f8')
      };
    case 'crimson':
      return {
        defs: `<linearGradient id="${id('sk')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0709"/><stop offset="0.55" stop-color="#7a1018"/><stop offset="1" stop-color="#3c070c"/></linearGradient><radialGradient id="${id('gl')}" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffb8a0" stop-opacity="0.45"/><stop offset="1" stop-color="#ffb8a0" stop-opacity="0"/></radialGradient>` + blur,
        body:
          `<rect width="120" height="120" fill="url(#${id('sk')})"/>` +
          `<path d="M-8 10C24 -4 34 40 22 70C14 92 28 112 44 126L-8 126Z" fill="#a1202c" opacity="0.8"/><path d="M96 -6C86 26 112 50 102 84C98 100 108 114 126 118L126 -6Z" fill="#8a1620" opacity="0.85"/>` +
          `<path d="M-4 -4L34 -4C20 12 8 22 -4 28Z" fill="#1d4a44" opacity="0.85"/><path d="M92 -4L124 -4L124 22C108 18 98 8 92 -4Z" fill="#1d4a44" opacity="0.5"/>` +
          `<path d="M30 20C40 40 36 80 24 110" fill="none" stroke="#e0505a" stroke-width="1.4" opacity="0.5" stroke-linecap="round"/><path d="M100 30C92 56 96 84 108 106" fill="none" stroke="#e0505a" stroke-width="1.2" opacity="0.45" stroke-linecap="round"/>` +
          `<rect width="120" height="120" fill="url(#${id('gl')})"/>` +
          blades([[2, 100, 40, 80, 2.2, '#ff6a72', 0.5], [86, 12, 120, 2, 2, '#ff9a8a', 0.45]], 2)
      };
    case 'castle': {
      // a gothic castle on a rock, a big moon, birds, pines, mist
      const spire = (x: number, base: number, w: number, top: number) => `<path d="M${x - w / 2} ${base}L${x - w / 2} ${top + 16}L${x} ${top}L${x + w / 2} ${top + 16}L${x + w / 2} ${base}Z" fill="#0b1322"/>`;
      const win = (x: number, y: number) => `<rect x="${x}" y="${y}" width="1.1" height="2.2" fill="#ffdca0" opacity="0.95"/>`;
      return {
        defs:
          `<linearGradient id="${id('sk')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1626"/><stop offset="0.55" stop-color="#27425f"/><stop offset="1" stop-color="#3a5f82"/></linearGradient>` +
          `<radialGradient id="${id('mo')}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.35" stop-color="#cfe6ff" stop-opacity="0.9"/><stop offset="1" stop-color="#9fc4f0" stop-opacity="0"/></radialGradient>` +
          `<linearGradient id="${id('fg')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb3d8" stop-opacity="0"/><stop offset="1" stop-color="#9fc0e0" stop-opacity="0.65"/></linearGradient>` +
          blur,
        body:
          `<rect width="120" height="120" fill="url(#${id('sk')})"/>` +
          `<g filter="url(#${id('bl')})"><ellipse cx="60" cy="30" rx="52" ry="7" fill="#5d7fa6" opacity="0.5"/><ellipse cx="86" cy="52" rx="34" ry="5" fill="#6d8fb6" opacity="0.4"/></g>` +
          `<circle cx="26" cy="28" r="22" fill="url(#${id('mo')})"/><circle cx="26" cy="28" r="10.5" fill="#f4faff"/><circle cx="23" cy="25" r="2.4" fill="#cfe0f2" opacity="0.7"/><circle cx="29" cy="31" r="1.6" fill="#cfe0f2" opacity="0.6"/>` +
          // the castle
          `<path d="M52 100L58 78L76 70L100 66L124 80L124 124L52 124Z" fill="#0a111e"/>` +
          spire(106, 82, 8, 6) + spire(95, 80, 9, 18) + spire(84, 82, 7, 30) + spire(114, 86, 7, 34) + spire(72, 84, 6, 44) + spire(63, 90, 5, 54) +
          `<path d="M78 82L120 82L120 90L78 90Z" fill="#0b1322"/>` +
          win(95, 62) + win(105, 70) + win(84, 74) + win(111, 74) + win(92, 72) + win(100, 78) + win(72, 76) +
          `<path d="M56 100L120 98L120 124L40 124Z" fill="#070c16"/>` +
          // pines
          [4, 14, 24].map((px, i) => `<path d="M${px} 118L${px + 5} ${86 - i * 5}L${px + 10} 118Z" fill="#060b14"/><path d="M${px + 1} 104L${px + 5} ${80 - i * 5}L${px + 9} 104Z" fill="#060b14"/>`).join('') +
          `<path d="M100 124L106 96L112 124Z" fill="#060b14"/>` +
          // birds
          [[54, 36], [60, 30], [66, 40], [50, 46], [72, 34]].map(([bx, by]) => `<path d="M${bx - 2} ${by}Q${bx - 1} ${by - 1.6} ${bx} ${by}Q${bx + 1} ${by - 1.6} ${bx + 2} ${by}" fill="none" stroke="#e8f0fa" stroke-width="0.7" stroke-linecap="round"/>`).join('') +
          `<rect y="84" width="120" height="36" fill="url(#${id('fg')})"/>`
      };
    }
    case 'ember':
      return {
        defs: `<radialGradient id="${id('sk')}" cx="0.5" cy="0.9" r="0.95"><stop offset="0" stop-color="#7a2a0e"/><stop offset="0.55" stop-color="#2a100a"/><stop offset="1" stop-color="#0e0706"/></radialGradient>` + blur,
        body:
          `<rect width="120" height="120" fill="url(#${id('sk')})"/>` +
          `<g filter="url(#${id('bl')})"><ellipse cx="60" cy="118" rx="60" ry="22" fill="#ff7a2a" opacity="0.5"/></g>` +
          blades([[4, 90, 44, 56, 3, '#ff9a3c', 0.85], [92, 100, 120, 64, 3.4, '#ffb85a', 0.8], [10, 40, 36, 14, 2.4, '#ff7a2a', 0.8], [96, 40, 118, 10, 2.2, '#ffd27a', 0.8], [60, 118, 70, 90, 2, '#ff9a3c', 0.5]], 2.6) +
          [[18, 66, 1.5], [26, 30, 1.1], [104, 50, 1.6], [112, 74, 1.2], [88, 20, 1], [10, 100, 1.2], [100, 100, 1.4], [40, 10, 1], [78, 8, 1.3]].map(([ex, ey, er]) => dot(ex, ey, er, '#ffd27a')).join('')
      };
    default:
      return {
        defs: `<linearGradient id="${id('sk')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0824"/><stop offset="0.6" stop-color="#2d1556"/><stop offset="1" stop-color="#150a34"/></linearGradient>` + blur,
        body:
          `<rect width="120" height="120" fill="url(#${id('sk')})"/>` +
          `<g filter="url(#${id('bl')})"><ellipse cx="22" cy="30" rx="24" ry="16" fill="#c04aa8" opacity="0.5"/><ellipse cx="100" cy="82" rx="26" ry="18" fill="#3a8ad8" opacity="0.45"/><ellipse cx="96" cy="16" rx="18" ry="10" fill="#8a5ae0" opacity="0.5"/></g>` +
          blades([[2, 62, 44, 40, 2.6, '#d28aff', 0.7], [84, 98, 122, 70, 3, '#7ac0ff', 0.7], [70, 6, 118, 24, 2.4, '#d28aff', 0.6]], 2.4) +
          [[14, 14, 1], [40, 8, 0.8], [70, 20, 1.1], [108, 40, 0.9], [8, 80, 1], [110, 108, 1.2], [30, 104, 0.8], [96, 62, 0.9], [60, 4, 1]].map(([sx, sy, sr]) => dot(sx, sy, sr, '#ffffff', 0.9)).join('')
      };
  }
}
