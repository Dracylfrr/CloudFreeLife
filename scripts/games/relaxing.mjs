// Levels for the four relaxing mini-games added in 1.4. Thumbnails are small soft SVGs generated here.
// Paint Flow boards are built from a winding path that visits every square, so each has a real solution.
const LINE = '#6e6a8e';
const head = (id, a, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const hills = (c) => `<path d="M-10 250Q100 215 200 245T410 232V310H-10z" fill="${c}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>`;

// ---------------------------------------------------------------- Bubble Garden
const bubbleThumb = (id, sky, palette, ground) => {
  const spots = [[90, 190, 46], [200, 120, 34], [300, 200, 52], [150, 70, 24], [330, 90, 28], [60, 90, 20], [240, 235, 22]];
  return (
    head(id, sky[0], sky[1]) +
    (ground ? hills(ground) : '') +
    spots.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${palette[i % palette.length]}" fill-opacity=".72" stroke="#fff" stroke-width="3"/><path d="M${x - r * 0.45} ${y - r * 0.35}a${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.55} -${r * 0.25}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`).join('') +
    '</svg>'
  );
};
export const bubbleLevels = [
  { folder: '01_morning_sky', id: 'bubbles_morning_sky', name: 'Morning Sky', description: 'Pastel bubbles drifting through a clear blue morning.', objective: 'Pop them, merge matching colors, or simply watch.', palette: ['#bfe4f7', '#ffd3e2', '#c6ecda', '#fff2bd', '#e6d8f8'], sky: ['#d6ecfb', '#f2f9ff'], scenery: 'morning', spawn: 0.8, speed: 26, size: [26, 50], rounds: 3, ground: '#cfeccd' },
  { folder: '02_lavender_evening', id: 'bubbles_lavender_evening', name: 'Lavender Evening', description: 'Dusky purples and pinks as the day settles down.', objective: 'Merge two of the same color to make one big, glowing bubble.', palette: ['#d9cdf6', '#f6b8cf', '#bfd0f5', '#e6d8f8', '#ffd3e2'], sky: ['#b9a8e8', '#f0d5ee'], scenery: 'evening', spawn: 0.7, speed: 24, size: [28, 54], rounds: 3, ground: '#9d8cd0' },
  { folder: '03_garden_bubbles', id: 'bubbles_garden', name: 'Garden Bubbles', description: 'Soft greens and blossom pinks above a quiet garden.', objective: 'Pop the colors you are asked for, as gently as you like.', palette: ['#c6ecda', '#ffd3e2', '#fff2bd', '#bfe4f7', '#d7efb6'], sky: ['#d8f0e0', '#f7f6dc'], scenery: 'garden', spawn: 1.0, speed: 28, size: [24, 46], rounds: 4, ground: '#a9dcb4' },
  { folder: '04_ocean_mist', id: 'bubbles_ocean_mist', name: 'Ocean Mist', description: 'Sea-glass bubbles rising through a misty blue sea.', objective: 'A cool, slow one. Pop a few or merge them all.', palette: ['#bdeeea', '#a9d4f5', '#d3e9f9', '#c6ecda', '#e6d8f8'], sky: ['#bde7f3', '#e3f5f1'], scenery: 'ocean', spawn: 0.9, speed: 30, size: [26, 52], rounds: 3, ground: '#7fc3d9' },
  { folder: '05_peach_sunset', id: 'bubbles_peach_sunset', name: 'Peach Sunset', description: 'Warm peach and rose bubbles in the last of the sun.', objective: 'Pop what is asked, or let them float by.', palette: ['#ffdcc8', '#ffb8a6', '#ffd3e2', '#fff0a8', '#f3c2d9'], sky: ['#ffd9bf', '#ffeedd'], scenery: 'sunset', spawn: 0.8, speed: 26, size: [28, 56], rounds: 4, ground: '#e7a98f' },
  { folder: '06_moonlight', id: 'bubbles_moonlight', name: 'Moonlight', description: 'Silvery bubbles drifting under a quiet moon.', objective: 'Slow and soft. Take all the time you like.', palette: ['#c6cdea', '#a2aadc', '#fff1bf', '#d4c8ee', '#b8d4ee'], sky: ['#3a3f86', '#7a72b4'], scenery: 'night', spawn: 0.6, speed: 20, size: [30, 58], rounds: 3, ground: '#5b5c9f' }
].map((l) => ({ ...l, thumbnail: bubbleThumb('b' + l.folder.slice(0, 2), l.sky, l.palette, l.ground) }));

// ---------------------------------------------------------------- Cloud Catcher
const SHAPES = {
  cloud: (x, y, c) => `<g fill="${c}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"><circle cx="${x - 14}" cy="${y + 4}" r="14"/><circle cx="${x + 2}" cy="${y - 8}" r="18"/><circle cx="${x + 20}" cy="${y + 4}" r="13"/><rect x="${x - 24}" y="${y + 2}" width="56" height="16" rx="8" stroke="none"/></g>`,
  star: (x, y, c) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 ? 9 : 20;
      pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${c}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>`;
  },
  moon: (x, y, c) => `<path d="M${x} ${y - 20}a20 20 0 1 0 14 34a15 15 0 0 1-14-34z" fill="${c}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>`,
  drop: (x, y, c) => `<path d="M${x} ${y - 20}q18 22 0 38q-18-16 0-38z" fill="${c}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>`,
  petal: (x, y, c) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="19" transform="rotate(30 ${x} ${y})" fill="${c}" stroke="${LINE}" stroke-width="2.4"/>`
};
const catcherThumb = (id, sky, kinds, colors, zones) => {
  const xs = [70, 170, 280, 120, 330];
  const ys = [70, 120, 60, 170, 130];
  return (
    head(id, sky[0], sky[1]) +
    xs.map((x, i) => SHAPES[kinds[i % kinds.length]](x, ys[i], colors[i % colors.length])).join('') +
    zones.map((z, i) => `<rect x="${24 + i * (352 / zones.length)}" y="226" width="${352 / zones.length - 14}" height="52" rx="16" fill="${z}" fill-opacity=".5" stroke="${z}" stroke-width="3"/>`).join('') +
    '</svg>'
  );
};
const Z = (list) => list.map(([label, color], i) => ({ id: `zone_${i + 1}`, label, color }));
export const catcherLevels = [
  { folder: '01_blue_morning', id: 'catcher_blue_morning', name: 'Blue Morning', description: 'Soft clouds and raindrops drifting across a pale blue sky.', objective: 'Drag each one into the zone of its color.', kinds: ['cloud', 'drop'], colors: ['#bfe4f7', '#ffd3e2', '#fff2bd'], zones: Z([['Sky blue', '#bfe4f7'], ['Rose', '#ffd3e2'], ['Sunshine', '#fff2bd']]), spawn: 0.7, speed: 28, sky: ['#d6ecfb', '#f2f9ff'], scenery: 'morning', pattern: ['cloud', 'drop', 'cloud'] },
  { folder: '02_rainbow_drift', id: 'catcher_rainbow_drift', name: 'Rainbow Drift', description: 'Little rainbow-colored clouds and stars floating by.', objective: 'Four zones, four colors. Sort them as they float past.', kinds: ['cloud', 'star'], colors: ['#ffadad', '#ffd6a5', '#caffbf', '#9bf6ff'], zones: Z([['Rose', '#ffadad'], ['Peach', '#ffd6a5'], ['Mint', '#caffbf'], ['Aqua', '#9bf6ff']]), spawn: 0.8, speed: 30, sky: ['#e6dcfa', '#fdf3f8'], scenery: 'morning', pattern: ['cloud', 'star', 'star', 'cloud'] },
  { folder: '03_star_night', id: 'catcher_star_night', name: 'Star Night', description: 'Stars and moons drifting across a deep, calm night.', objective: 'Catch the stars and moons into their matching colors.', kinds: ['star', 'moon'], colors: ['#fff2bd', '#d9cdf6', '#bfe4f7'], zones: Z([['Gold', '#fff2bd'], ['Lilac', '#d9cdf6'], ['Moonblue', '#bfe4f7']]), spawn: 0.6, speed: 24, sky: ['#3a3f86', '#8478bd'], scenery: 'night', pattern: ['star', 'moon', 'star'] },
  { folder: '04_sunset_clouds', id: 'catcher_sunset_clouds', name: 'Sunset Clouds', description: 'Peach and rose clouds melting into the evening.', objective: 'Guide each cloud into the zone that matches its glow.', kinds: ['cloud'], colors: ['#ffdcc8', '#ffb8a6', '#f3c2d9'], zones: Z([['Peach', '#ffdcc8'], ['Coral', '#ffb8a6'], ['Blush', '#f3c2d9']]), spawn: 0.7, speed: 26, sky: ['#ffd1b3', '#ffeedd'], scenery: 'sunset', pattern: ['cloud', 'cloud'] },
  { folder: '05_moon_garden', id: 'catcher_moon_garden', name: 'Moon Garden', description: 'Moons, stars and petals drifting over a night garden.', objective: 'Catch petals, moons and stars in the order shown (Pattern mode) or by color.', kinds: ['moon', 'petal', 'star'], colors: ['#fff2bd', '#ffd3e2', '#d9cdf6', '#c6ecda'], zones: Z([['Gold', '#fff2bd'], ['Rose', '#ffd3e2'], ['Lilac', '#d9cdf6'], ['Mint', '#c6ecda']]), spawn: 0.8, speed: 26, sky: ['#4b4f94', '#9a8fc8'], scenery: 'night', pattern: ['moon', 'petal', 'star', 'petal'] },
  { folder: '06_floating_islands', id: 'catcher_floating_islands', name: 'Floating Islands', description: 'Clouds, petals and drops drifting between little islands.', objective: 'A busier sky, still with nothing to lose.', kinds: ['cloud', 'petal', 'drop'], colors: ['#c6ecda', '#bfe4f7', '#ffd3e2'], zones: Z([['Mint', '#c6ecda'], ['Sky', '#bfe4f7'], ['Rose', '#ffd3e2']]), spawn: 1.0, speed: 30, sky: ['#cfeaf6', '#eef8e8'], scenery: 'garden', pattern: ['cloud', 'petal', 'drop'] }
].map((l) => ({ ...l, thumbnail: catcherThumb('c' + l.folder.slice(0, 2), l.sky, l.kinds, l.colors, l.zones.map((z) => z.color)) }));

// ---------------------------------------------------------------- Zen Garden (backgrounds)
const zenThumb = (id, g, groove, light, objects) =>
  head(id, g[0], g[1]) +
  [0, 1, 2].map((k) => `<path d="M30 ${90 + k * 8}q90 -40 170 10t170 -10" fill="none" stroke="${groove}" stroke-width="4" stroke-linecap="round"/><path d="M30 ${94 + k * 8}q90 -40 170 10t170 -10" fill="none" stroke="${light}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`).join('') +
  `<g stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"><path d="M70 220q-6-22 20-26t34 10q4 18-18 22t-36-6z" fill="${objects[0]}"/><path d="M270 214q-4-18 18-20t28 8q2 14-16 18t-30-6z" fill="${objects[1]}"/></g><g fill="${objects[2]}" stroke="${LINE}" stroke-width="2.4"><circle cx="196" cy="210" r="11"/><circle cx="210" cy="198" r="9"/><circle cx="182" cy="198" r="9"/></g></svg>`;
export const zenLevels = [
  { folder: '01_warm_sand', id: 'warm_sand', name: 'Warm Sand', description: 'Warm, golden sand for raking slow lines.', objective: 'Rake, place, and relax.', ground: ['#f4e4c0', '#e9d3a4'], groove: '#cdb07c', light: '#fff6df', scenery: 'sand', objects: ['#c9c4dc', '#d4cdc0', '#b5deb0'] },
  { folder: '02_lavender_sand', id: 'lavender_sand', name: 'Lavender Sand', description: 'Soft lavender sand with a dreamy glow.', objective: 'Rake, place, and relax.', ground: ['#e8def6', '#d7c9ee'], groove: '#b9a6d8', light: '#fbf7ff', scenery: 'lavender', objects: ['#d8c6cf', '#c9c4dc', '#c6ecda'] },
  { folder: '03_moonlight', id: 'moonlight_sand', name: 'Moonlight', description: 'Cool blue sand under a pale moon.', objective: 'A quiet one for the evening.', ground: ['#5a5f9e', '#454a85'], groove: '#363a70', light: '#9aa0d8', scenery: 'moon', objects: ['#bdc9d8', '#c9c4dc', '#a8d8c0'] },
  { folder: '04_garden', id: 'garden_sand', name: 'Garden', description: 'Mossy green ground with a soft grassy border.', objective: 'Rake, place, and relax.', ground: ['#cfe6c4', '#b9d8ad'], groove: '#9fc294', light: '#f2fbe9', scenery: 'garden', objects: ['#d4cdc0', '#bdc9d8', '#ffd3e2'] },
  { folder: '05_seaside', id: 'seaside_sand', name: 'Seaside', description: 'Pale beach sand with gentle waves at the top.', objective: 'Rake, place, and relax.', ground: ['#f7e8cc', '#ecd6ae'], groove: '#d2b88a', light: '#fffaf0', scenery: 'sea', objects: ['#d8c6cf', '#bdc9d8', '#fff2bd'] }
].map((l) => ({ ...l, thumbnail: zenThumb('z' + l.folder.slice(0, 2), l.ground, l.groove, l.light, l.objects) }));

// ---------------------------------------------------------------- Paint Flow boards
const PASTELS = ['#f49bbd', '#7fb8f0', '#7fd2a8', '#f6c36a', '#b49af0', '#ff9f80', '#6fd0d8', '#e0a0d8'];
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const k = (c) => `${c[0]},${c[1]}`;
function buildBoard(size, pairCount, seed) {
  const rng = mulberry(seed);
  const n = size * size;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let attempt = 0; attempt < 2000; attempt++) {
    const visited = new Set();
    const order = [];
    let cur = [Math.floor(rng() * size), Math.floor(rng() * size)];
    visited.add(k(cur));
    order.push(cur);
    const free = (c) => dirs.map((d) => [c[0] + d[0], c[1] + d[1]]).filter((q) => q[0] >= 0 && q[1] >= 0 && q[0] < size && q[1] < size && !visited.has(k(q)));
    while (order.length < n) {
      const opts = free(cur);
      if (!opts.length) break;
      cur = opts.map((q) => ({ q, s: free(q).length + rng() * 1.4 })).sort((a, b) => a.s - b.s)[0].q;
      visited.add(k(cur));
      order.push(cur);
    }
    if (order.length < n) continue;
    const cuts = new Set();
    let guard = 0;
    // spread the cuts out so no piece is tiny
    while (cuts.size < pairCount - 1 && guard++ < 800) {
      const c = 3 + Math.floor(rng() * (n - 5));
      if ([...cuts].every((x) => Math.abs(x - c) >= 3)) cuts.add(c);
    }
    if (cuts.size < pairCount - 1) continue;
    const points = [0, ...[...cuts].sort((a, b) => a - b), n];
    const pieces = [];
    for (let i = 0; i < points.length - 1; i++) pieces.push(order.slice(points[i], points[i + 1]));
    if (pieces.some((p) => p.length < 3)) continue;
    return { size, pairs: pieces.map((p, i) => ({ color: PASTELS[i % PASTELS.length], a: p[0], b: p[p.length - 1] })), solution: pieces };
  }
  throw new Error('no board for seed ' + seed);
}
function validate(b) {
  const seen = new Set();
  b.solution.forEach((path, i) => {
    const p = b.pairs[i];
    const ends = [k(path[0]), k(path[path.length - 1])];
    if (!ends.includes(k(p.a)) || !ends.includes(k(p.b))) throw new Error('bad ends');
    path.forEach((c, j) => {
      if (j && Math.abs(c[0] - path[j - 1][0]) + Math.abs(c[1] - path[j - 1][1]) !== 1) throw new Error('gap');
      if (seen.has(k(c))) throw new Error('overlap');
      seen.add(k(c));
    });
  });
  return true;
}
const flowThumb = (id, b) => {
  const s = 300 / b.size;
  const ox = 50;
  const oy = 0;
  void oy;
  let out = head(id, '#eef3fb', '#f6eefa') + `<rect x="${ox}" y="0" width="300" height="300" rx="24" fill="#ffffff" fill-opacity=".85"/>`;
  b.pairs.forEach((p, i) => {
    const pts = b.solution[i].map((c) => `${ox + c[1] * s + s / 2},${c[0] * s + s / 2}`).join(' ');
    out += `<polyline points="${pts}" fill="none" stroke="${p.color}" stroke-opacity=".38" stroke-width="${s * 0.4}" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
  b.pairs.forEach((p) => {
    for (const c of [p.a, p.b]) out += `<circle cx="${ox + c[1] * s + s / 2}" cy="${c[0] * s + s / 2}" r="${s * 0.28}" fill="${p.color}" stroke="#fff" stroke-width="3"/>`;
  });
  return out + '</svg>';
};
const SPECS = [
  ['First Drops', 4, 3, 101, 'Join three pairs on a tiny board.'],
  ['Little Rivers', 4, 4, 202, 'Four colors on a four-by-four board.'],
  ['Paintbox', 5, 4, 303, 'Four colors, a bit more room.'],
  ['Soft Stripes', 5, 4, 404, 'Take your time. Hints are always free.'],
  ['Pastel Ponds', 5, 5, 505, 'Five pairs on a five-by-five board.'],
  ['Cotton Trails', 5, 5, 606, 'Paths may need a gentle detour.'],
  ['Windy Ribbons', 6, 5, 707, 'A larger board with five colors.'],
  ['Garden Paths', 6, 5, 808, 'Wind each color home.'],
  ['Meadow Loops', 6, 6, 909, 'Six pairs on a six-by-six board.'],
  ['Rainbow Weave', 6, 6, 1010, 'A little tangled, never hard to undo.'],
  ['Evening Threads', 7, 6, 1111, 'The biggest boards are still gentle.'],
  ['Moonlit Ribbons', 7, 7, 1212, 'The last board: seven colors on a seven-by-seven grid.']
];
export const flowLevels = SPECS.map(([name, size, pairs, seed, objective], i) => {
  const b = buildBoard(size, pairs, seed);
  validate(b);
  const folder = `${String(i + 1).padStart(2, '0')}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  return { folder, id: `flow_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, name, description: `${size} × ${size} board with ${pairs} color pairs.`, objective, size, pairs: b.pairs, solution: b.solution, thumbnail: flowThumb('f' + String(i + 1).padStart(2, '0'), b) };
});
