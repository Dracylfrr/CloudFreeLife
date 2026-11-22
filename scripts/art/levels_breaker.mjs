// Handcrafted Pastel Breaker levels. Each grid row is 12 characters wide;
// "." is empty and every other letter is a block colour from the legend.
const LINE = '#6e6a8e';

const levels = [
  {
    folder: '01_cloud_wall',
    name: 'Cloud Wall',
    description: 'A fluffy wall of clouds. A gentle first level.',
    objective: 'Pop every cloud block.',
    legend: { w: '#f4f9ff', s: '#bfe4f7', d: '#a4d2f2' },
    grid: ['..ww....ww..', '.wwwww.wwwww', 'wwwwwwwwwwww', 'ssssssssssss', 'dsdsdsdsdsds', 'ssssssssssss']
  },
  {
    folder: '02_rainbow_arch',
    name: 'Rainbow Arch',
    description: 'A bright pastel rainbow to bring down, band by band.',
    objective: 'Pop all the rainbow bands.',
    legend: { r: '#f6b8cf', c: '#ffdcc8', b: '#fff2bd', m: '#c6ecda', s: '#bfe4f7' },
    grid: ['...rrrrrr...', '..rccccccr..', '.rcbbbbbbcr.', '.rcbmmmmbcr.', 'rcbmssssmbcr', 'rcbm....mbcr', 'rcb......bcr']
  },
  {
    folder: '03_castle_blocks',
    name: 'Castle Blocks',
    description: 'A sleepy castle. The lavender towers take two hits.',
    objective: 'Tumble the castle. Lavender blocks need two hits.',
    legend: { p: '#ffd3e2', l: '#d9cdf6', c: '#ffdcc8' },
    tough: ['l'],
    grid: ['..p..pp..p..', '.ppp.pp.ppp.', '.lll.ll.lll.', '.lll.ll.lll.', '.llllllllll.', '.llllccllll.', '.llllccllll.']
  },
  {
    folder: '04_star_field',
    name: 'Star Field',
    description: 'Twinkling stars in soft pastel colors.',
    objective: 'Clear the star field. Golden stars take two hits.',
    legend: { b: '#fff2bd', y: '#ffe29a', l: '#e6d8f8', p: '#ffd3e2' },
    tough: ['y'],
    grid: ['l..b....b..l', '..bbb..bbb..', 'l..b.yy.b..l', '....yyyy....', '..l.yyyy.l..', '.lll..yy.lll', '..l......l..']
  },
  {
    folder: '05_garden_blocks',
    name: 'Garden Blocks',
    description: 'Flowers and grass growing in tidy rows.',
    objective: 'Pick every flower and clear the garden.',
    legend: { p: '#ffd3e2', c: '#ffdcc8', b: '#fff2bd', l: '#e6d8f8', g: '#a9dcb4' },
    grid: ['..ppp...ccc.', '.ppbpp.ccbcc', '..ppp...ccc.', '...g.....g..', '...g..lll.g.', '..gg.lblg.gg', 'gggggggggggg']
  },
  {
    folder: '06_ocean_bubbles',
    name: 'Ocean Bubbles',
    description: 'Waves and floating bubbles under a calm sky.',
    objective: 'Burst the bubbles and ride the waves. Deep blue takes two hits.',
    legend: { t: '#bdeeea', s: '#bfe4f7', d: '#a4d2f2' },
    tough: ['d'],
    grid: ['.t....s...t.', 't.t..s.s.t.t', '.t....s...t.', '............', 'ssssssssssss', 'tttttttttttt', 'dtdtdtdtdtdt']
  }
];

function thumb(l) {
  const cols = l.grid[0].length;
  const cw = 240 / cols;
  const ch = Math.min(15, 150 / (l.grid.length + 2));
  let blocks = '';
  l.grid.forEach((row, y) => {
    [...row].forEach((c, x) => {
      const fill = l.legend[c];
      if (!fill) return;
      blocks += `<rect x="${(x * cw + 1).toFixed(1)}" y="${(22 + y * (ch + 1.5)).toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${ch.toFixed(1)}" rx="3.5" fill="${fill}" stroke="${LINE}" stroke-width="1.2"/>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#e4f2fc"/><stop offset="1" stop-color="#efe6fb"/></linearGradient></defs><rect width="240" height="180" fill="url(#g)"/>${blocks}<rect x="88" y="160" width="64" height="9" rx="4.5" fill="#b7a8ec" stroke="${LINE}" stroke-width="1.2"/><circle cx="120" cy="150" r="5.5" fill="#ffb7d1" stroke="${LINE}" stroke-width="1.2"/></svg>`;
}

export const breakerLevels = levels.map((l) => ({
  folder: l.folder,
  thumbnail: thumb(l),
  manifest: (version, minAppVersion) => ({
    id: l.folder.replace(/^\d+_/, ''),
    name: l.name,
    description: l.description,
    minigame: 'pastel_breaker',
    thumbnail: 'thumbnail.svg',
    version,
    minAppVersion,
    objective: l.objective,
    grid: l.grid,
    legend: l.legend,
    ...(l.tough ? { tough: l.tough } : {})
  })
}));
