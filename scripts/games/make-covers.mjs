// Writes the four Mini-Games card covers into src/features/minigames/covers (run once by hand if you edit them).
import { writeFileSync } from 'node:fs';
const L = '#6e6a8e';
const head = (id, a, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const bub = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".75" stroke="#fff" stroke-width="4"/><path d="M${x - r * 0.45} ${y - r * 0.3}a${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.5} -${r * 0.3}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
const out = {
  bubbles:
    head('g', '#d6ecfb', '#efe4fa') +
    `<path d="M-10 262Q100 228 200 256T410 244V310H-10z" fill="#cfeccd" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/>` +
    [[90, 170, 56, '#ffd3e2'], [210, 110, 44, '#bfe4f7'], [300, 190, 62, '#c6ecda'], [150, 60, 28, '#fff2bd'], [340, 80, 30, '#e6d8f8'], [50, 80, 22, '#c6ecda'], [220, 230, 26, '#ffd3e2']].map((b) => bub(...b)).join('') +
    '</svg>',
  catcher:
    head('g', '#cfe6fa', '#f6e8f8') +
    `<g fill="#fff" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"><circle cx="110" cy="96" r="26"/><circle cx="146" cy="78" r="34"/><circle cx="186" cy="98" r="26"/><rect x="84" y="94" width="130" height="30" rx="15" stroke="none"/></g><circle cx="130" cy="108" r="4" fill="${L}"/><circle cx="168" cy="108" r="4" fill="${L}"/><polygon points="290,50 298,72 322,72 302,86 310,108 290,94 270,108 278,86 258,72 282,72" fill="#fff2bd" stroke="${L}" stroke-width="2.6" stroke-linejoin="round"/><path d="M320 160a24 24 0 1 0 16 40a18 18 0 0 1-16-40z" fill="#fff3c4" stroke="${L}" stroke-width="2.6"/>` +
    [[24, '#bfe4f7'], [146, '#ffd3e2'], [268, '#c6ecda']].map(([x, c]) => `<rect x="${x}" y="212" width="108" height="64" rx="22" fill="${c}" fill-opacity=".6" stroke="${c}" stroke-width="4"/>`).join('') +
    '</svg>',
  zen:
    head('g', '#f4e4c0', '#e9d3a4') +
    [0, 1, 2].map((k) => `<path d="M20 ${100 + k * 10}q90 -46 180 10t180 -10" fill="none" stroke="#cdb07c" stroke-width="5" stroke-linecap="round"/><path d="M20 ${105 + k * 10}q90 -46 180 10t180 -10" fill="none" stroke="#fff6df" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`).join('') +
    `<g stroke="${L}" stroke-width="2.6" stroke-linejoin="round"><path d="M70 236q-8-26 22-30t40 12q4 22-20 26t-42-8z" fill="#c9c4dc"/><path d="M270 226q-4-20 20-22t30 10q2 16-18 20t-32-8z" fill="#d4cdc0"/></g><g stroke="${L}" stroke-width="2.6" stroke-linejoin="round" fill="#9fd3a8"><path d="M190 240q-14-30-2-44q8 20 4 44zM196 240q4-34 22-40q-2 22-14 40zM190 240q-26-20-30-34q20 6 30 34z"/></g></svg>`,
  flow:
    head('g', '#eef3fb', '#f6eefa') +
    `<rect x="90" y="30" width="220" height="220" rx="26" fill="#fff" fill-opacity=".9" stroke="${L}" stroke-width="2.6"/>` +
    `<g fill="none" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><path d="M125 65H200V140" stroke="#f49bbd"/><path d="M125 100V210H200" stroke="#7fb8f0"/><path d="M235 65V135H275V215" stroke="#7fd2a8"/><path d="M165 175H235V215" stroke="#f6c36a" stroke-opacity=".7"/></g>` +
    [[125, 65, '#f49bbd'], [200, 140, '#f49bbd'], [125, 100, '#7fb8f0'], [200, 210, '#7fb8f0'], [235, 65, '#7fd2a8'], [275, 215, '#7fd2a8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="13" fill="${c}" stroke="#fff" stroke-width="3"/>`).join('') +
    '</svg>'
};
for (const [k, v] of Object.entries(out)) writeFileSync(new URL(`../../src/features/minigames/covers/${k}.svg`, import.meta.url), v);
console.log('covers written:', Object.keys(out).join(', '));
