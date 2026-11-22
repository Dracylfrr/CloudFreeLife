// Book covers (400 x 300). Soft, simple and original.
const LINE = '#6e6a8e';
const head = (id, stops) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
const star = (x, y, r, fill = '#fff6cf') => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const rad = i % 2 ? r * 0.46 : r;
    pts.push(`${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>`;
};
const cloud = (x, y, s = 1, face = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"><path d="M-70 24a26 26 0 0 1 8-50a34 34 0 0 1 62-14a30 30 0 0 1 46 22a24 24 0 0 1-6 42z"/>${face ? `<g stroke="none" fill="${LINE}"><circle cx="-14" cy="6" r="4.5"/><circle cx="22" cy="6" r="4.5"/></g><path d="M-4 16q8 9 16 0" fill="none"/>` : ''}</g>`;

export const covers = {
  cloud_dreams:
    head('cd', [[0, '#bfe4f7'], [1, '#e8dcfa']]) +
    `<rect width="400" height="300" fill="url(#cd)"/>
<g fill="none" stroke-width="13"><path d="M60 250a140 140 0 0 1 280 0" stroke="#f6b8cf"/><path d="M76 250a124 124 0 0 1 248 0" stroke="#ffdcc8"/><path d="M92 250a108 108 0 0 1 216 0" stroke="#fff2bd"/><path d="M108 250a92 92 0 0 1 184 0" stroke="#c6ecda"/></g>
<circle cx="330" cy="62" r="26" fill="#ffe9a8" stroke="${LINE}" stroke-width="2.6"/>
${cloud(110, 76, 0.55)}${cloud(300, 150, 0.5)}${cloud(200, 232, 1.1, true)}${star(60, 160, 9)}${star(350, 215, 8)}
</svg>`,
  cosmic_colors:
    head('cc', [[0, '#6f74b8'], [1, '#b59ad8']]) +
    `<rect width="400" height="300" fill="url(#cc)"/>
${star(50, 50, 10)}${star(340, 40, 12)}${star(360, 250, 9)}${star(40, 240, 8)}${star(210, 40, 7)}
<g transform="rotate(-16 200 150)"><ellipse cx="200" cy="150" rx="150" ry="34" fill="#e6d8f8" stroke="${LINE}" stroke-width="2.6"/></g>
<circle cx="200" cy="150" r="76" fill="#ffdcc8" stroke="${LINE}" stroke-width="2.6"/>
<path d="M126 134h148M130 172h140" stroke="#ffc3b0" stroke-width="16" stroke-linecap="round" opacity="0.9"/>
<g transform="rotate(-16 200 150)"><path d="M50 150a150 34 0 0 0 300 0h-30a120 22 0 0 1-240 0z" fill="#e6d8f8" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"/></g>
<path d="M300 78a34 34 0 1 0 0 70a40 40 0 0 1 0-70z" fill="#fff3c4" stroke="${LINE}" stroke-width="2.6" transform="translate(0 -4)"/>
<circle cx="70" cy="120" r="16" fill="#c6ecda" stroke="${LINE}" stroke-width="2.6"/>
</svg>`,
  peaceful_places:
    head('pp', [[0, '#dff0fb'], [1, '#fde6ef']]) +
    `<rect width="400" height="300" fill="url(#pp)"/>
<circle cx="70" cy="62" r="26" fill="#ffe9a8" stroke="${LINE}" stroke-width="2.6"/>
${cloud(250, 60, 0.5)}
<path d="M-10 190L100 90L200 190zM120 190L250 70L380 190z" fill="#d9cdf6" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M-10 210Q100 160 200 205T410 190V310H-10z" fill="#a9dcb4" stroke="${LINE}" stroke-width="2.6"/>
<path d="M-10 250Q120 215 240 252T410 240V310H-10z" fill="#c2e8c4" stroke="${LINE}" stroke-width="2.6"/>
<g stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"><rect x="150" y="190" width="80" height="56" rx="3" fill="#ffdcc8"/><path d="M140 194L190 152L240 194z" fill="#f6b8cf"/><rect x="178" y="214" width="22" height="32" rx="10" fill="#e9c7a3"/></g>
<g stroke="${LINE}" stroke-width="2.6"><rect x="300" y="196" width="12" height="46" rx="4" fill="#e9c7a3"/><circle cx="306" cy="180" r="32" fill="#c2e8c4"/></g>
</svg>`,
  free_canvas:
    head('fc', [[0, '#fff6e6'], [1, '#fdeaf1']]) +
    `<rect width="400" height="300" fill="url(#fc)"/>
<g fill="none" stroke-linecap="round"><path d="M40 210C90 120 130 260 190 170S290 90 360 160" stroke="#b7a8ec" stroke-width="22"/><path d="M40 238C100 190 140 280 200 220S300 150 360 200" stroke="#ffb7d1" stroke-width="16"/><path d="M50 98C110 50 150 140 210 92S300 40 350 80" stroke="#8fd3b4" stroke-width="14"/><path d="M60 268C120 250 170 290 240 262" stroke="#fff2bd" stroke-width="12"/></g>
<g transform="translate(262 40) rotate(38)" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"><rect x="-9" y="0" width="18" height="86" rx="9" fill="#ffd3b8"/><rect x="-11" y="80" width="22" height="22" rx="4" fill="#dfe6f3"/><path d="M-10 102C-11 124 -2 136 0 146C2 136 11 124 10 102z" fill="#ffa6c9"/></g>
<circle cx="76" cy="62" r="9" fill="#c6ecda" stroke="${LINE}" stroke-width="2"/><circle cx="112" cy="40" r="6" fill="#fff2bd" stroke="${LINE}" stroke-width="2"/>
</svg>`
};
