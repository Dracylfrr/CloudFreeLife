// Memory Meadow levels: flip cards, find the pairs. No timer, no lives.
const LINE = '#6e6a8e';

const ICON_COLOR = {
  cloud: '#ffffff', star: '#fff2bd', moon: '#fff3c4', sun: '#ffe9a8', heart: '#ffd3e2', drop: '#bfe4f7', flower: '#f6b8cf',
  leaf: '#a9dcb4', balloon: '#d9cdf6', shell: '#ffdcc8', rainbow: '#c6ecda', mushroom: '#ffc3b0', fish: '#bdeeea',
  butterfly: '#e6d8f8', planet: '#c6ecda'
};

const levels = [
  { folder: '01_first_pairs', name: 'First Pairs', description: 'Three pairs to get started.', objective: 'Flip two cards at a time and find every pair.', columns: 3, back: '#bfe4f7', symbols: ['cloud', 'star', 'moon'] },
  { folder: '02_sky_friends', name: 'Sky Friends', description: 'Friends from the sky.', objective: 'Match the sky friends. Take as long as you like.', columns: 4, back: '#d9cdf6', symbols: ['cloud', 'sun', 'rainbow', 'balloon'] },
  { folder: '03_garden_pairs', name: 'Garden Pairs', description: 'Flowers, leaves and little creatures.', objective: 'Find all six pairs in the garden.', columns: 4, back: '#c6ecda', symbols: ['flower', 'leaf', 'mushroom', 'butterfly', 'drop', 'sun'] },
  { folder: '04_ocean_pairs', name: 'Ocean Pairs', description: 'Treasures from the shallows.', objective: 'Match eight pairs from the sea.', columns: 4, back: '#bdeeea', symbols: ['fish', 'shell', 'drop', 'star', 'cloud', 'heart', 'moon', 'rainbow'] },
  { folder: '05_cosmic_pairs', name: 'Cosmic Pairs', description: 'Twenty cards under the stars.', objective: 'Find ten pairs among the stars.', columns: 5, back: '#e6d8f8', symbols: ['star', 'moon', 'planet', 'sun', 'cloud', 'balloon', 'heart', 'rainbow', 'drop', 'shell'] },
  { folder: '06_big_meadow', name: 'Big Meadow', description: 'The biggest meadow: twenty-four cards.', objective: 'Match twelve pairs. A hint is always one click away.', columns: 6, back: '#ffd3e2', symbols: ['flower', 'leaf', 'mushroom', 'butterfly', 'drop', 'sun', 'cloud', 'star', 'moon', 'heart', 'fish', 'planet'] }
];

function thumb(l) {
  const n = l.symbols.length * 2;
  const rows = n / l.columns;
  const cw = Math.min(40, 210 / l.columns);
  const ch = cw * 1.2;
  const gap = 8;
  const w = l.columns * cw + (l.columns - 1) * gap;
  const h = rows * ch + (rows - 1) * gap;
  const x0 = (240 - w) / 2;
  const y0 = (180 - h) / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (i % l.columns) * (cw + gap);
    const y = y0 + Math.floor(i / l.columns) * (ch + gap);
    const open = i % 5 === 1;
    const fill = open ? ICON_COLOR[l.symbols[i % l.symbols.length]] : l.back;
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="7" fill="${fill}" stroke="${LINE}" stroke-width="1.6"/>`;
    out += open
      ? `<circle cx="${(x + cw / 2).toFixed(1)}" cy="${(y + ch / 2).toFixed(1)}" r="${(cw * 0.22).toFixed(1)}" fill="#fff" stroke="${LINE}" stroke-width="1.4"/>`
      : `<path d="M${(x + cw * 0.3).toFixed(1)} ${(y + ch * 0.5).toFixed(1)}q${(cw * 0.2).toFixed(1)} ${(-ch * 0.18).toFixed(1)} ${(cw * 0.4).toFixed(1)} 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e4f2fc"/><stop offset="1" stop-color="#efe6fb"/></linearGradient></defs><rect width="240" height="180" fill="url(#g)"/>${out}</svg>`;
}

export const memoryLevels = levels.map((l) => ({
  folder: l.folder,
  thumbnail: thumb(l),
  manifest: (version) => ({
    id: l.folder.replace(/^\d+_/, ''),
    name: l.name,
    description: l.description,
    minigame: 'memory_meadow',
    thumbnail: 'thumbnail.svg',
    version,
    minAppVersion: '1.1.0',
    objective: l.objective,
    columns: l.columns,
    cardBack: l.back,
    symbols: l.symbols
  })
}));
