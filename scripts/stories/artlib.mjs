// A small library of soft, rounded SVG pieces for Cloud-Freelife story illustrations (800 x 480).
// Same look as the book covers: pastel fills, one warm-grey outline, no gradients except the sky.
// Everything is plain shapes, so each finished picture is only a few kilobytes.
export const LINE = '#6e6a8e';
export const S = `stroke="${LINE}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const n = (v) => +v.toFixed(1);

// Some shapes override the default stroke width; keep only the last declaration per tag.
const fixDup = (svg) =>
  svg.replace(/<[^>]+>/g, (tag) => {
    const all = tag.match(/ stroke-width="[^"]*"/g);
    if (!all || all.length < 2) return tag;
    const last = all[all.length - 1];
    let seen = 0;
    return tag.replace(/ stroke-width="[^"]*"/g, () => (++seen === all.length ? last : ''));
  });

/** Wraps a scene in an svg with a vertical sky gradient. */
export const scene = (top, bottom, body, extraDefs = '') =>
  fixDup(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>${extraDefs}</defs><rect width="800" height="480" fill="url(#sky)"/>${body}</svg>`);

/** Union-outlined blob made of circles: outline all, then fill all without outline. */
export const blob = (circles, fill, extra = '') =>
  `<g>${circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${S}/>`).join('')}${circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.4}" fill="${fill}"/>`).join('')}${extra}</g>`;

export const cloud = (x, y, s = 1, fill = '#ffffff', face = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${blob([[-44, 8, 26], [-6, -10, 36], [38, 0, 30], [66, 14, 20], [-70, 18, 18]], fill)}<rect x="-80" y="14" width="160" height="28" rx="14" fill="${fill}"/><path d="M-80 28a14 14 0 0 0 14 14h132a14 14 0 0 0 14-14" fill="none" ${S}/>${
    face ? `<g fill="${LINE}"><circle cx="-14" cy="14" r="4.6"/><circle cx="20" cy="14" r="4.6"/></g><path d="M-4 24q7 8 14 0" fill="none" ${S} stroke-width="2.6"/><g fill="#ffb7cc" opacity=".8"><ellipse cx="-30" cy="24" rx="7" ry="4.5"/><ellipse cx="36" cy="24" rx="7" ry="4.5"/></g>` : ''
  }</g>`;

export const sun = (x, y, r = 34) =>
  `<g><circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="#fff7d0" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffe9a8" ${S}/></g>`;

export const moon = (x, y, r = 34) =>
  `<g><circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="#fff7d0" opacity=".3"/><path d="M${x} ${y - r}a${r} ${r} 0 1 0 ${r} ${r * 1.55}a${r * 1.2} ${r * 1.2} 0 0 1-${r}-${r * 1.55}z" fill="#fff3c4" ${S}/></g>`;

export const star = (x, y, r = 9, fill = '#fff6cf') => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const rad = i % 2 ? r * 0.46 : r;
    pts.push(`${n(x + Math.cos(a) * rad)},${n(y + Math.sin(a) * rad)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${S} stroke-width="2"/>`;
};
export const stars = (list) => list.map(([x, y, r]) => star(x, y, r)).join('');
export const sparkles = (list, fill = '#fffbe0') => `<g fill="${fill}" opacity=".9">${list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;

/** Rolling hill band: color, baseline y, wave height, phase offset (flips the wave). */
export const hills = (color, y, amp = 26, flip = false) => {
  const a = flip ? -amp : amp;
  return `<path d="M-20 ${y}Q110 ${y - a} 240 ${y}T500 ${y}T760 ${y}T1000 ${y}V500H-20z" fill="${color}" ${S}/>`;
};
export const ground = (color, y) => `<path d="M-10 ${y}H810V490H-10z" fill="${color}" ${S}/>`;

export const tree = (x, y, s = 1, fill = '#a9dcb4', trunk = '#d4b194') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 0L-6 -58H6L9 0z" fill="${trunk}" ${S}/>${blob([[0, -92, 42], [-30, -66, 30], [30, -66, 30]], fill)}</g>`;

export const pine = (x, y, s = 1, fill = '#8ccaa0') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-22" width="12" height="24" fill="#d4b194" ${S}/><path d="M0 -150L-40 -70H40z" fill="${fill}" ${S}/><path d="M0 -112L-52 -28H52z" fill="${fill}" ${S}/><path d="M0 -72L-62 -14H62z" fill="${fill}" ${S}/></g>`;

export const bush = (x, y, s = 1, fill = '#a9dcb4') => `<g transform="translate(${x} ${y}) scale(${s})">${blob([[-26, -16, 22], [0, -26, 28], [28, -16, 22]], fill)}</g>`;

export const flower = (x, y, s = 1, petal = '#ffd3e2', center = '#fff2bd', stem = '#8ccaa0') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-40" stroke="${stem}" stroke-width="4" stroke-linecap="round" fill="none"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-60" rx="8" ry="12" transform="rotate(${a} 0 -48)" fill="${petal}" ${S} stroke-width="2.2"/>`).join('')}<circle cx="0" cy="-48" r="7" fill="${center}" ${S} stroke-width="2.2"/></g>`;

export const daisy = (x, y, s = 1) => flower(x, y, s, '#ffffff', '#ffe27a');

export const mushroom = (x, y, s = 1, cap = '#ff9fb8', spot = '#fff') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 0C-14 -16 -12 -30 -10 -34H10C12 -30 14 -16 12 0z" fill="#fff5e3" ${S}/><path d="M-44 -32A44 40 0 0 1 44 -32z" fill="${cap}" ${S}/><g fill="${spot}"><circle cx="-18" cy="-52" r="7"/><circle cx="8" cy="-60" r="6"/><circle cx="24" cy="-46" r="5"/></g></g>`;

export const house = (x, y, s = 1, wall = '#fff1dc', roof = '#f4a6a6', lit = true) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-55" y="-70" width="110" height="70" rx="6" fill="${wall}" ${S}/><path d="M-70 -66L0 -122L70 -66z" fill="${roof}" ${S}/><rect x="-14" y="-40" width="28" height="40" rx="14" fill="#b98a6a" ${S}/><rect x="26" y="-56" width="20" height="20" rx="4" fill="${lit ? '#ffe9a8' : '#cfe3f5'}" ${S} stroke-width="2.4"/><rect x="-46" y="-56" width="20" height="20" rx="4" fill="${lit ? '#ffe9a8' : '#cfe3f5'}" ${S} stroke-width="2.4"/><rect x="30" y="-118" width="14" height="28" fill="#e7cdb8" ${S} stroke-width="2.4"/></g>`;

export const lantern = (x, y, s = 1, glow = '#ffe08a') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="22" r="46" fill="${glow}" opacity=".28"/><path d="M0 -30V-14" ${S}/><path d="M-10 -14h20l4 8h-28z" fill="#c7b5ec" ${S}/><rect x="-16" y="-6" width="32" height="40" rx="9" fill="${glow}" ${S}/><path d="M-12 34h24l-4 8h-16z" fill="#c7b5ec" ${S}/></g>`;

export const glowdot = (x, y, r = 6) => `<g><circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="#fff59d" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="#fff59d" opacity=".45"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fffbd0"/></g>`;

export const owl = (x, y, s = 1, body = '#d9c3f0', belly = '#fff1fa') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="54" fill="${body}" ${S}/><path d="M-34 -42L-42 -66L-18 -52zM34 -42L42 -66L18 -52z" fill="${body}" ${S}/><ellipse cx="0" cy="18" rx="28" ry="30" fill="${belly}"/><circle cx="-18" cy="-14" r="17" fill="#fff" ${S}/><circle cx="18" cy="-14" r="17" fill="#fff" ${S}/><circle cx="-17" cy="-13" r="9" fill="${LINE}"/><circle cx="19" cy="-13" r="9" fill="${LINE}"/><circle cx="-14" cy="-16" r="3" fill="#fff"/><circle cx="22" cy="-16" r="3" fill="#fff"/><path d="M-6 0L0 10L6 0z" fill="#ffcf8a" ${S} stroke-width="2.4"/><path d="M-30 24q-8 12 0 24M30 24q8 12 0 24" fill="none" ${S} stroke-width="2.6"/></g>`;

export const teacup = (x, y, s = 1, tea = '#e8b88a') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="26" rx="46" ry="9" fill="#fff" ${S}/><path d="M-30 -10h60a2 2 0 0 1 2 2c0 22-12 34-32 34s-32-12-32-34a2 2 0 0 1 2-2z" fill="#fff" ${S}/><ellipse cx="0" cy="-9" rx="29" ry="6" fill="${tea}" ${S} stroke-width="2.4"/><path d="M30 0q18 0 14 14t-24 12" fill="none" ${S}/><path d="M-8 -26q-6 -12 2 -20M6 -26q-6 -12 2 -20" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".85"/></g>`;

export const rain = (x0, x1, y0, y1, count = 24, color = '#8fc7ec') => {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + ((i * 97) % (x1 - x0));
    const y = y0 + ((i * 53) % Math.max(1, y1 - y0));
    out += `M${x} ${y}l-6 16`;
  }
  return `<path d="${out}" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
};

export const whale = (x, y, s = 1, body = '#9fd2ee', flip = false) =>
  `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M-130 20C-130 -40 -60 -70 10 -62C80 -54 130 -20 150 -50C160 -30 150 -2 126 14C140 24 150 38 160 50C130 48 110 36 96 32C60 56 -20 70 -80 62C-114 56 -130 44 -130 20z" fill="${body}" ${S}/><path d="M-120 34C-60 56 40 58 100 34" fill="none" ${S} stroke-width="2.6"/><path d="M-96 30C-60 48 20 50 82 32C60 56-20 66-76 58C-98 52-110 44-96 30z" fill="#e9f6fd"/><circle cx="-86" cy="-6" r="6" fill="${LINE}"/><path d="M-100 12q12 8 26 0" fill="none" ${S} stroke-width="2.4"/><g fill="#ffb7cc" opacity=".8"><ellipse cx="-70" cy="14" rx="9" ry="6"/></g><path d="M-30 -62q-4 -26 -20 -36M-30 -62q4 -26 20 -36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;

export const wave = (color, y, amp = 14, w = 800) => {
  let d = `M-20 ${y}`;
  for (let x = -20; x < w + 60; x += 80) d += `q20 ${-amp} 40 0t40 0`;
  return `<path d="${d}V500H-20z" fill="${color}" ${S}/>`;
};

export const snail = (x, y, s = 1, shell = '#f7c9a8') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-50 0C-54 -14 -42 -20 -30 -18H40C54 -18 62 -4 52 0z" fill="#e9dcc7" ${S}/><path d="M-44 -18q-6 -22 -16 -26M-34 -20q-2 -22 -10 -28" fill="none" ${S} stroke-width="2.6"/><circle cx="-60" cy="-45" r="3" fill="${LINE}"/><circle cx="-44" cy="-49" r="3" fill="${LINE}"/><circle cx="16" cy="-24" r="26" fill="${shell}" ${S}/><path d="M16 -24m-4 0a4 4 0 1 1 8 0a10 10 0 1 1-18 0a16 16 0 1 1 30 0" fill="none" ${S} stroke-width="2.4"/></g>`;

export const frog = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-16" rx="34" ry="24" fill="#b9e3a8" ${S}/><circle cx="-18" cy="-40" r="12" fill="#b9e3a8" ${S}/><circle cx="18" cy="-40" r="12" fill="#b9e3a8" ${S}/><circle cx="-18" cy="-41" r="5" fill="${LINE}"/><circle cx="18" cy="-41" r="5" fill="${LINE}"/><path d="M-14 -12q14 10 28 0" fill="none" ${S} stroke-width="2.6"/><g fill="#ffb7cc" opacity=".8"><ellipse cx="-24" cy="-14" rx="6" ry="4"/><ellipse cx="24" cy="-14" rx="6" ry="4"/></g></g>`;

export const lilypad = (x, y, w = 90) => `<g><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${w / 7}" fill="#93d3a2" ${S}/><path d="M${x} ${y}l${w / 2 - 6} -2" stroke="${LINE}" stroke-width="2" fill="none"/></g>`;

export const mouse = (x, y, s = 1, body = '#cfcbe0') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M44 -6C80 -6 86 -40 70 -52" fill="none" ${S}/><ellipse cx="0" cy="-22" rx="40" ry="30" fill="${body}" ${S}/><circle cx="-26" cy="-48" r="15" fill="${body}" ${S}/><circle cx="-26" cy="-48" r="8" fill="#ffd3e2"/><circle cx="10" cy="-52" r="15" fill="${body}" ${S}/><circle cx="10" cy="-52" r="8" fill="#ffd3e2"/><circle cx="-18" cy="-30" r="3.6" fill="${LINE}"/><circle cx="2" cy="-31" r="3.6" fill="${LINE}"/><circle cx="-6" cy="-20" r="4" fill="#ffb7cc" ${S} stroke-width="2"/><path d="M-6 -16q-6 6 -12 3M-6 -16q6 6 12 3" fill="none" ${S} stroke-width="2"/><path d="M-30 -2v10M10 -2v10" ${S}/></g>`;

export const badger = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-4" rx="46" ry="56" fill="#b9b4c9" ${S}/><path d="M-30 4q30 40 60 0v32h-60z" fill="#fff3e6" ${S}/><path d="M-30 4q30 40 60 0" fill="none" ${S}/><ellipse cx="0" cy="-62" rx="34" ry="30" fill="#f6f4fb" ${S}/><path d="M-22 -86v34M22 -86v34" stroke="#6e6a8e" stroke-width="12" stroke-linecap="round"/><circle cx="-34" cy="-86" r="9" fill="#b9b4c9" ${S}/><circle cx="34" cy="-86" r="9" fill="#b9b4c9" ${S}/><g fill="none" ${S} stroke-width="2.6"><circle cx="-12" cy="-60" r="9"/><circle cx="12" cy="-60" r="9"/><path d="M-3 -60h6"/></g><circle cx="-12" cy="-60" r="2.8" fill="${LINE}"/><circle cx="12" cy="-60" r="2.8" fill="${LINE}"/><ellipse cx="0" cy="-48" rx="6" ry="4.5" fill="${LINE}"/></g>`;

export const fence = (x0, x1, y, color = '#fff6e6') => {
  let out = '';
  for (let x = x0; x <= x1; x += 40) out += `<path d="M${x} ${y}v-44q0-8 8-8t8 8v44z" fill="${color}" ${S} stroke-width="2.6"/>`;
  return `${out}<path d="M${x0} ${y - 30}H${x1 + 16}M${x0} ${y - 12}H${x1 + 16}" ${S} stroke-width="3"/>`;
};

export const snowman = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-30" r="32" fill="#fff" ${S}/><circle cx="0" cy="-78" r="24" fill="#fff" ${S}/><circle cx="-8" cy="-84" r="3" fill="${LINE}"/><circle cx="8" cy="-84" r="3" fill="${LINE}"/><path d="M0 -76l16 4l-16 4z" fill="#ffcf8a" ${S} stroke-width="2.2"/><circle cx="0" cy="-36" r="3.4" fill="${LINE}"/><circle cx="0" cy="-22" r="3.4" fill="${LINE}"/><path d="M-22 -62q22 10 44 0" fill="none" stroke="#ff9fb8" stroke-width="8" stroke-linecap="round"/></g>`;

export const snowfall = (count = 30) => {
  let out = '';
  for (let i = 0; i < count; i++) out += `<circle cx="${(i * 131) % 800}" cy="${(i * 79) % 380}" r="${2 + (i % 3)}"/>`;
  return `<g fill="#fff" opacity=".9">${out}</g>`;
};

export const mug = (x, y, s = 1, fill = '#ffb7cc') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 -26h44v34a14 14 0 0 1-14 14h-16a14 14 0 0 1-14-14z" fill="${fill}" ${S}/><path d="M22 -16q20 0 16 14t-22 12" fill="none" ${S}/><path d="M-8 -34q-6 -10 2 -18M6 -34q-6 -10 2 -18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/></g>`;

export const rainbow = (cx, cy, r) => {
  const cols = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'];
  return `<g fill="none" stroke-linecap="round">${cols.map((c, i) => `<path d="M${cx - r + i * 12} ${cy}A${r - i * 12} ${r - i * 12} 0 0 1 ${cx + r - i * 12} ${cy}" stroke="${c}" stroke-width="13"/>`).join('')}</g>`;
};

export const train = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-150" y="-60" width="90" height="60" rx="10" fill="#bfe4f7" ${S}/><rect x="-140" y="-50" width="30" height="24" rx="5" fill="#fff6cf" ${S} stroke-width="2.4"/><rect x="-102" y="-50" width="30" height="24" rx="5" fill="#fff6cf" ${S} stroke-width="2.4"/><rect x="-46" y="-60" width="90" height="60" rx="10" fill="#ffd3e2" ${S}/><rect x="-36" y="-50" width="30" height="24" rx="5" fill="#fff6cf" ${S} stroke-width="2.4"/><rect x="2" y="-50" width="30" height="24" rx="5" fill="#fff6cf" ${S} stroke-width="2.4"/><path d="M60 0V-52H104V-80H140V0z" fill="#c6ecda" ${S}/><rect x="110" y="-74" width="24" height="26" rx="5" fill="#fff6cf" ${S} stroke-width="2.4"/><rect x="66" y="-92" width="18" height="40" rx="4" fill="#e6d8f8" ${S}/>${[-120, -84, -24, 24, 82, 118].map((cx) => `<circle cx="${cx}" cy="6" r="13" fill="#fff" ${S}/>`).join('')}<path d="M-60 -22h14M44 -22h16" ${S}/></g>`;

export const tracks = (y) => `<path d="M-10 ${y}H810" ${S} stroke-width="4"/><path d="M-10 ${y + 14}H810" ${S} stroke-width="3"/>${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 40 - 6} ${y - 4}v22" stroke="#d4b194" stroke-width="5" stroke-linecap="round"/>`).join('')}`;

export const book = (x, y, s = 1, cover = '#bfa8f0') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-26" y="-36" width="52" height="36" rx="4" fill="${cover}" ${S}/><path d="M-20 -30h40M-20 -22h28" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>`;

export const shelf = (x, y, w, colors) => {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="4" fill="#d4b194" ${S}/>`;
  let cx = x + 10;
  let i = 0;
  while (cx < x + w - 24) {
    const h = 44 + ((i * 13) % 24);
    const bw = 16 + ((i * 7) % 10);
    out += `<rect x="${cx}" y="${y - h}" width="${bw}" height="${h}" rx="3" fill="${colors[i % colors.length]}" ${S} stroke-width="2.4"/>`;
    cx += bw + 2;
    i++;
  }
  return out;
};

export const arch = (x, y, w, h, fill = '#ffe9a8') => `<path d="M${x} ${y}V${y - h + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y}z" fill="${fill}" ${S}/>`;

export const bridge = (x, y, w, color = '#e7cdb8') =>
  `<path d="M${x} ${y}q${w / 2} -${w / 3} ${w} 0v14q-${w / 2} -${w / 3} -${w} 0z" fill="${color}" ${S}/>`;

export const bird = (x, y, s = 1, fill = '#ffd6a5') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="22" ry="17" fill="${fill}" ${S}/><circle cx="14" cy="-6" r="2.8" fill="${LINE}"/><path d="M22 -2l12 3l-12 4z" fill="#ffb38a" ${S} stroke-width="2.2"/><path d="M-6 -2q-14 -10 -22 6q12 6 22 -2z" fill="${fill}" ${S} stroke-width="2.4"/></g>`;

export const bench = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-44 -34h88M-44 -22h88" ${S}/><rect x="-46" y="-12" width="92" height="12" rx="4" fill="#e7cdb8" ${S}/><path d="M-36 0v16M36 0v16" ${S}/><path d="M-40 -34v22M40 -34v22" ${S}/></g>`;

export const lamppost = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-124" r="40" fill="#fff59d" opacity=".25"/><path d="M-8 0H8L5 -110H-5z" fill="#b8a9d8" ${S}/><rect x="-14" y="-142" width="28" height="34" rx="9" fill="#ffe9a8" ${S}/><path d="M-18 -142h36l-18 -14z" fill="#b8a9d8" ${S}/></g>`;

export const bigstar = (x, y, r = 22) => star(x, y, r, '#ffe9a8');

export const blanket = (x, y, w, h, a = '#ffd3e2', b = '#fff') => {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${a}" ${S}/>`;
  for (let i = 1; i < 6; i++) out += `<path d="M${x + (w / 6) * i} ${y}v${h}" stroke="${b}" stroke-width="5" opacity=".6"/>`;
  return out;
};

export const pond = (cx, cy, rx, ry, color = '#a9d8f0') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" ${S}/><path d="M${cx - rx * 0.5} ${cy}q${rx * 0.25} -${ry * 0.3} ${rx * 0.5} 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;

export const reeds = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-70M12 0V-56M-12 0V-60" stroke="#8ccaa0" stroke-width="4" stroke-linecap="round"/><ellipse cx="0" cy="-78" rx="6" ry="14" fill="#c9a48a" ${S} stroke-width="2.2"/><ellipse cx="12" cy="-62" rx="5" ry="12" fill="#c9a48a" ${S} stroke-width="2.2"/></g>`;

export const dragonfly = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 0H22" stroke="#7fcfe0" stroke-width="6" stroke-linecap="round"/><ellipse cx="-4" cy="-10" rx="16" ry="6" fill="#fff" opacity=".85" ${S} stroke-width="2"/><ellipse cx="8" cy="-10" rx="14" ry="5" fill="#fff" opacity=".85" ${S} stroke-width="2"/><circle cx="24" cy="0" r="5" fill="#7fcfe0" ${S} stroke-width="2"/></g>`;

export const bee = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="14" ry="10" fill="#ffe27a" ${S} stroke-width="2.4"/><path d="M-4 -9v18M4 -9v18" stroke="${LINE}" stroke-width="3"/><ellipse cx="-2" cy="-14" rx="8" ry="6" fill="#fff" opacity=".9" ${S} stroke-width="2"/></g>`;

export const moth = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C-16 -16 -30 -8 -24 8C-18 18 -4 12 0 4C4 12 18 18 24 8C30 -8 16 -16 0 0z" fill="#f5e6ff" ${S} stroke-width="2.4"/><path d="M0 -4V10" ${S} stroke-width="2.4"/></g>`;

export const glowflower = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-56" r="74" fill="#f6f1ff" opacity=".35"/><circle cx="0" cy="-56" r="48" fill="#fff" opacity=".4"/><path d="M0 0V-44" stroke="#8ccaa0" stroke-width="5" stroke-linecap="round"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-76" rx="9" ry="22" transform="rotate(${a} 0 -56)" fill="#f2ecff" ${S} stroke-width="2.4"/>`).join('')}<circle cx="0" cy="-56" r="12" fill="#fff3c4" ${S} stroke-width="2.4"/></g>`;

export const pip = (x, y, s = 1, scarf = '#ff9fb8') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-26" rx="26" ry="30" fill="#ffe7d4" ${S}/><path d="M-30 -42Q0 -76 30 -42z" fill="#ff9fb8" ${S}/><circle cx="0" cy="-74" r="8" fill="#fff" ${S} stroke-width="2.4"/><circle cx="-9" cy="-30" r="3.4" fill="${LINE}"/><circle cx="9" cy="-30" r="3.4" fill="${LINE}"/><path d="M-5 -20q5 5 10 0" fill="none" ${S} stroke-width="2.4"/><g fill="#ffb7cc" opacity=".8"><ellipse cx="-17" cy="-22" rx="5" ry="3.5"/><ellipse cx="17" cy="-22" rx="5" ry="3.5"/></g><path d="M-24 -2q24 10 48 0v10q-24 10 -48 0z" fill="${scarf}" ${S} stroke-width="2.6"/></g>`;

export const sled = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="-14" width="68" height="12" rx="5" fill="#ffd6a5" ${S}/><path d="M-40 6q30 8 80 0q8 -2 4 -8" fill="none" ${S}/></g>`;

export const stringLights = (y, colors) => {
  let out = `<path d="M-10 ${y}Q200 ${y + 50} 400 ${y}T810 ${y}" fill="none" ${S} stroke-width="2.4"/>`;
  colors.forEach((c, i) => {
    const x = 40 + i * 70;
    out += `<circle cx="${x}" cy="${y + 20 + Math.sin(i) * 12}" r="9" fill="${c}" ${S} stroke-width="2"/>`;
  });
  return out;
};

export const hotAirBalloon = (x, y, s = 1, a = '#ffb7cc', b = '#fff3c4') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -120C-60 -120 -64 -40 -20 -4H20C64 -40 60 -120 0 -120z" fill="${a}" ${S}/><path d="M0 -120C-26 -90 -24 -40 -6 -4H6C24 -40 26 -90 0 -120z" fill="${b}" ${S}/><path d="M-14 0L-12 26M14 0L12 26" ${S}/><rect x="-16" y="26" width="32" height="22" rx="5" fill="#e7cdb8" ${S}/></g>`;

export const window = (x, y, w, h, view) =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#cfe9fa" ${S}/>${view}<path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" ${S} stroke-width="3"/></g>`;
