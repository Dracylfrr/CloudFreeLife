// Covers and chapter pictures for the three long reads added for 1.5.0. They live in
// content-packs/<pack>/content/stories/... and ship as downloadable packs, not in the installer.
//   node scripts/stories/long15_art.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from './artlib.mjs';

const { scene, S, LINE, mouse, cloud, sun, moon, stars, hills, ground, tree, bush, flower, mushroom, lantern, glowdot, teacup, rain, wave, snail, lilypad, pond, reeds, dragonfly, mug, book, lamppost, stringLights, window: win, bigstar, house, sparkles, blob } = A;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../content-packs');
const out = async (pack, kind, id, file, svg) => {
  const p = resolve(root, pack, 'content/stories', kind, id, file);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, svg);
};

// ---------------------------------------------------------------- shared little characters
const critter = (x, y, s = 1, fill = '#d9b48f', ears = 'round', belly = '#fff1e0') =>
  `<g transform="translate(${x} ${y}) scale(${s})">${ears === 'round' ? `<circle cx="-18" cy="-52" r="9" fill="${fill}" ${S}/><circle cx="18" cy="-52" r="9" fill="${fill}" ${S}/>` : `<ellipse cx="-14" cy="-62" rx="7" ry="18" fill="${fill}" ${S}/><ellipse cx="14" cy="-62" rx="7" ry="18" fill="${fill}" ${S}/>`}<ellipse cx="0" cy="-20" rx="30" ry="32" fill="${fill}" ${S}/><ellipse cx="0" cy="-10" rx="18" ry="20" fill="${belly}"/><circle cx="0" cy="-48" r="22" fill="${fill}" ${S}/><circle cx="-8" cy="-50" r="3" fill="${LINE}"/><circle cx="8" cy="-50" r="3" fill="${LINE}"/><path d="M-5 -42q5 5 10 0" fill="none" ${S} stroke-width="2.4"/><ellipse cx="-14" cy="-44" rx="5" ry="3" fill="#ffb7cc" opacity=".8"/><ellipse cx="14" cy="-44" rx="5" ry="3" fill="#ffb7cc" opacity=".8"/></g>`;
const scarf = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-20 -28q20 14 40 0l4 10q-24 14 -48 0z" fill="${col}" ${S} stroke-width="2.4"/></g>`;
const heron = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0V-60M3 0V-60" ${S}/><ellipse cx="0" cy="-86" rx="24" ry="30" fill="#c9cfe0" ${S}/><path d="M6 -108q6 -34 4 -62" fill="none" stroke="#c9cfe0" stroke-width="12" stroke-linecap="round"/><path d="M6 -108q6 -34 4 -62" fill="none" ${S} stroke-width="1"/><circle cx="10" cy="-176" r="10" fill="#e0e4f0" ${S}/><path d="M16 -176l34 6l-34 4z" fill="#ffd27a" ${S} stroke-width="2.4"/><circle cx="11" cy="-179" r="2.4" fill="${LINE}"/></g>`;
const boat = (x, y, s = 1, hull = '#ffe08a') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 0q80 40 160 0l-18 -26h-124z" fill="${hull}" ${S}/><rect x="-26" y="-60" width="46" height="36" rx="12" fill="#e9a35f" ${S}/><path d="M-12 -60v-14h18v14" fill="#e9a35f" ${S}/><path d="M24 -48q22 -2 22 -16" fill="none" ${S}/><path d="M-4 -80q-4 -14 6 -22M8 -84q-4 -12 6 -20" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".8"/></g>`;
const willow = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-130" ${S} stroke-width="7"/>${blob([[0, -150, 52], [-40, -130, 34], [40, -130, 34]], '#b9e3a8')}<g fill="none" stroke="#8ccaa0" stroke-width="5" stroke-linecap="round"><path d="M-48 -126q-6 50 -2 86M-24 -112q-4 44 0 80M24 -112q4 44 0 80M48 -126q6 50 2 86"/></g></g>`;
const water = (y, a = '#bfe0ee', b = '#a9d2e6') => `<path d="M-10 ${y}H810V490H-10z" fill="${a}" ${S}/>${wave(b, y + 28, 8)}`;
const badgerPal = (x, y, s = 1) => critter(x, y, s, '#b9b4c6', 'round', '#f2f0f8');
const tortoise = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-26" rx="46" ry="30" fill="#b9d8a0" ${S}/><path d="M-26 -34q26 -22 52 0M-14 -26l-6 14M14 -26l6 14" fill="none" ${S} stroke-width="2.4"/><ellipse cx="52" cy="-22" rx="14" ry="12" fill="#d9e8c4" ${S}/><circle cx="56" cy="-25" r="2.6" fill="${LINE}"/><rect x="-30" y="-6" width="14" height="10" rx="4" fill="#d9e8c4" ${S}/><rect x="16" y="-6" width="14" height="10" rx="4" fill="#d9e8c4" ${S}/></g>`;
const ladybird = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-10" rx="16" ry="12" fill="#ff8f8f" ${S} stroke-width="2.4"/><path d="M0 -22v24" ${S} stroke-width="2"/><circle cx="-6" cy="-12" r="2.6" fill="${LINE}"/><circle cx="7" cy="-6" r="2.6" fill="${LINE}"/><circle cx="16" cy="-14" r="6" fill="${LINE}"/></g>`;
const kitten = (x, y, s = 1, fill = '#f1e3d3') => critter(x, y, s, fill, 'round');
const stall = (x, y, s = 1, a = '#ffb7cc', b = '#fff6e6') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-44" y="-50" width="88" height="50" fill="#f3d9bd" ${S}/><path d="M-54 -50l12 -34h84l12 34z" fill="${a}" ${S}/><path d="M-30 -50l8 -34M-6 -50l2 -34M18 -50l-4 -34" fill="none" stroke="${b}" stroke-width="2" stroke-linecap="round"/><g>${lantern(0, -30, 0.5)}</g></g>`;
const tower = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 0l8 -190h44l8 190z" fill="#d7c9e8" ${S}/><circle cx="0" cy="-214" r="34" fill="#fff3c4" ${S}/><circle cx="0" cy="-214" r="62" fill="#fff59d" opacity=".25"/><path d="M-36 -178h72" ${S}/></g>`;
const pipe = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0l40 -70" ${S} stroke-width="5"/></g>`;
void pipe;

// ---------------------------------------------------------------- The Tea Boat on Willow River
const TEA = 'tales_of_the_slow_country';
const teaId = 'the_tea_boat_on_willow_river';
const teaScenes = {
  'cover.svg': scene('#fde8d4', '#d7ecf4', `${sun(610, 110, 44)}${cloud(150, 90, 0.9)}${hills('#bfe6c4', 300, 24)}${willow(120, 360, 1.1)}${willow(690, 360, 0.9)}${water(330)}${boat(400, 372, 1.2)}${critter(396, 330, 0.8, '#c9a27c', 'round')}${scarf(396, 330, 0.8, '#ff9fb8')}`),
  'ch1.svg': scene('#fde0cf', '#cfe3ef', `${sun(400, 250, 60)}${hills('#c9e8c8', 290, 22)}${water(300, '#cfe4ee', '#b9d7e6')}${willow(110, 330, 1)}${willow(700, 330, 1)}${boat(400, 372, 1.1)}${sparkles([[300, 280, 3], [500, 300, 3], [440, 260, 2]])}`),
  'ch2.svg': scene('#e3eff8', '#dfeede', `${cloud(160, 90, 0.8)}${water(330)}${reeds(90, 340, 1)}${reeds(700, 340, 1)}${heron(400, 330, 1.05)}${dragonfly(520, 240, 1)}${boat(180, 400, 0.7)}`),
  'ch3.svg': scene('#fdeee0', '#d9ecf2', `${hills('#c4e6c0', 280, 20)}${house(520, 310, 1.5, '#ffe9cf', '#f2a28b', true)}${water(335)}<rect x="440" y="330" width="170" height="12" fill="#e4c9a8" ${S}/>${critter(330, 340, 0.8, '#b79a82', 'round')}${critter(380, 340, 0.8, '#c4a58a', 'round')}${boat(150, 400, 0.8)}`),
  'ch4.svg': scene('#cfe0ee', '#dfe8ef', `<rect x="-10" y="120" width="260" height="360" fill="#c9c4d6" ${S}/><rect x="550" y="120" width="260" height="360" fill="#c9c4d6" ${S}/>${water(300, '#a9cde0', '#93bfd6')}${boat(400, 360, 0.9)}${critter(120, 150, 0.7, '#8d86a2', 'round')}${sparkles([[330, 200, 3], [470, 160, 3], [400, 120, 2]])}`),
  'ch5.svg': scene('#e8f1e0', '#dfeef2', `${sun(660, 90, 36)}${water(300, '#d5e8e2', '#bfdad4')}<rect x="150" y="290" width="400" height="26" rx="8" fill="#e8caa0" ${S}/>${book(220, 286, 1.1, '#bfa8f0')}${book(280, 286, 1, '#f4a6a6')}${book(560, 286, 1.2, '#a9dcb4')}${critter(390, 292, 0.9, '#e8c98a', 'round')}${boat(150, 400, 0.6)}${willow(710, 330, 0.9)}`),
  'ch6.svg': scene('#f6e8d4', '#dbe9e0', `${willow(120, 340, 1.1)}${water(310)}${boat(400, 380, 1)}${teacup(560, 330, 1.2)}${glowdot(566, 306, 10)}${sparkles([[470, 290, 3], [620, 300, 3]])}`),
  'ch7.svg': scene('#eef0f5', '#e6eaf0', `<g opacity=".9"><ellipse cx="400" cy="300" rx="420" ry="90" fill="#ffffff"/><ellipse cx="200" cy="200" rx="260" ry="60" fill="#f4f6fa"/><ellipse cx="620" cy="360" rx="300" ry="70" fill="#f4f6fa"/></g>${reeds(80, 360, 1)}${reeds(730, 360, 1)}${boat(400, 360, 0.9)}${glowdot(420, 300, 14)}${glowdot(380, 330, 8)}${heron(640, 380, 0.7)}`),
  'ch8.svg': scene('#ffd7b8', '#9aa5d6', `${hills('#7d86c0', 300, 22)}${water(330, '#8f9ad0', '#7d89c4')}<rect x="120" y="290" width="560" height="14" rx="5" fill="#d9bb92" ${S}/>${stringLights(240, ['#ffe08a', '#ffb7cc', '#bfe4f7', '#c6ecda'])}${lantern(200, 270, 1)}${lantern(400, 270, 1)}${lantern(600, 270, 1)}${critter(280, 300, 0.7, '#b79a82', 'round')}${critter(520, 300, 0.7, '#c9a27c', 'round')}${stars([[90, 60, 7], [700, 80, 8], [420, 50, 6]])}`),
  'ch9.svg': scene('#232a62', '#4b57a0', `${stars([[90, 60, 8], [330, 40, 7], [560, 70, 9], [720, 40, 7]])}${water(300, '#33407f', '#2c3874')}${lantern(150, 330, 1)}${lantern(260, 350, 1.1)}${lantern(380, 335, 1)}${lantern(500, 355, 1.1)}${lantern(620, 340, 1)}${lantern(450, 410, 0.55)}${glowdot(450, 405, 12)}`),
  'ch10.svg': scene('#1c2354', '#5a5ea8', `${stars([[60, 50, 8], [200, 90, 6], [330, 40, 8], [470, 80, 7], [640, 50, 8], [740, 100, 6]])}${moon(660, 140, 34)}${water(280, '#2a3470', '#242d66')}${Array.from({ length: 11 }, (_, i) => lantern(120 + i * 58, 320 + (i % 3) * 14 + i * 4, 0.8)).join('')}${boat(110, 420, 0.7, '#e0b96a')}`)
};

// ---------------------------------------------------------------- The Cartographer of Small Things
const CARTO = 'tales_of_the_slow_country';
const cartoId = 'the_cartographer_of_small_things';
const cartoScenes = {
  'cover.svg': scene('#e4f0dc', '#cfe6d4', `${sun(640, 90, 36)}${hills('#bfe4b8', 290, 20)}${ground('#a9d89e', 330)}${mushroom(160, 380, 1.4)}${mushroom(250, 400, 0.9, '#ffd27a')}${flower(560, 390, 1.3)}${badgerPal(400, 400, 1.2)}<circle cx="446" cy="344" r="26" fill="#ffffff" opacity=".6" ${S}/><path d="M464 362l22 22" ${S} stroke-width="6"/>${ladybird(520, 400, 1.2)}`),
  'ch1.svg': scene('#fbe8c8', '#f1d9bf', `<rect x="60" y="60" width="160" height="200" fill="#cfe3f0" ${S}/><rect x="580" y="60" width="160" height="200" fill="#d9ecd0" ${S}/><rect x="40" y="320" width="720" height="150" fill="#d9b48f" ${S}/>${badgerPal(300, 330, 1)}${tortoise(560, 330, 1.1)}${lantern(400, 150, 1)}${sparkles([[330, 220, 3], [470, 240, 3]])}`),
  'ch2.svg': scene('#f6ead6', '#e8d9c0', `<rect x="140" y="260" width="520" height="160" rx="14" fill="#7d8f6a" ${S}/><circle cx="400" cy="340" r="64" fill="#e8c98a" ${S}/><circle cx="400" cy="340" r="46" fill="#dff0f8" ${S}/><path d="M446 386l56 52" ${S} stroke-width="14"/><path d="M446 386l56 52" stroke="#c9a864" stroke-width="8" stroke-linecap="round"/>${sparkles([[380, 320, 4], [420, 350, 3]])}`),
  'ch3.svg': scene('#dff0d6', '#c6e2bc', `${tree(110, 330, 2.6, '#8fc98f')}${tree(700, 330, 2.4, '#8fc98f')}${ground('#a9d89e', 340)}${mushroom(260, 400, 1.1)}${flower(520, 400, 1.5)}${A.daisy(600, 410, 1.2)}${ladybird(400, 410, 2.2)}${badgerPal(240, 450, 0.9)}${sparkles([[330, 300, 3], [470, 280, 3], [560, 330, 2]])}`),
  'ch4.svg': scene('#fdeedd', '#f1dcc6', `<path d="M150 380q0 -170 250 -170t250 170z" fill="#8fc98f" ${S}/>${ground('#d9b48f', 380)}${snail(400, 380, 2.4, '#f7c9a8')}<rect x="360" y="270" width="80" height="22" rx="4" fill="#fff" ${S}/>${mug(620, 400, 0.9)}${sparkles([[300, 300, 3], [520, 280, 3]])}`),
  'ch5.svg': scene('#e1f1f6', '#cfe8ee', `${tree(80, 330, 2.2, '#8fc98f')}<ellipse cx="400" cy="330" rx="260" ry="90" fill="#cfe9f4" ${S}/><ellipse cx="400" cy="324" rx="210" ry="62" fill="#e7f5fb"/>${sun(460, 318, 14)}${sparkles([[300, 320, 3], [520, 336, 3], [400, 300, 2]])}${ladybird(640, 392, 1.5)}${dragonfly(250, 230, 1)}`),
  'ch6.svg': scene('#2a2f58', '#4f5a8a', `${stars([[90, 50, 6], [700, 70, 7]])}${[120, 260, 400, 540, 680].map((x, i) => mushroom(x, 430, 2.1 - (i % 2) * 0.5, i % 2 ? '#ffd27a' : '#ff9fb8')).join('')}${[170, 330, 470, 610].map((x, i) => glowdot(x, 180 + (i % 2) * 40, 8)).join('')}<path d="M70 120Q240 190 400 150T730 130" fill="none" stroke="#f0e6c8" stroke-width="2.4"/>`),
  'ch7.svg': scene('#d3d8e6', '#bfc9de', `${hills('#a9bcc9', 260, 18)}<ellipse cx="400" cy="360" rx="380" ry="96" fill="#aebccf" ${S}/><ellipse cx="400" cy="356" rx="330" ry="72" fill="#c4d0df"/><path d="M360 340l50 -26l-4 30z" fill="#fff" ${S} stroke-width="2.4"/>${mouse(150, 430, 1.1)}${ladybird(640, 440, 1.5)}`),
  'ch8.svg': scene('#fbd7c0', '#a8a0d0', `${hills('#8f86bc', 270, 18)}<ellipse cx="400" cy="360" rx="380" ry="96" fill="#9aa2d6" ${S}/><path d="M60 350q340 -50 680 0" fill="none" stroke="#ffb7d1" stroke-width="10" stroke-linecap="round" opacity=".8"/>${stars([[400, 120, 5], [250, 80, 4], [600, 100, 5]])}${sun(400, 250, 30)}${mouse(120, 440, 1.1)}`),
  'ch9.svg': scene('#1b2150', '#3b4380', `${stars([[90, 50, 7], [220, 100, 5], [480, 60, 8], [700, 90, 6], [620, 40, 5]])}${ground('#2f5a4c', 340)}${[160, 260, 540, 640].map((x, i) => glowdot(x, 330 + (i % 2) * 24, 9)).join('')}${badgerPal(400, 420, 1.2)}<g fill="none" stroke="#ffd98a" stroke-width="3" opacity=".6"><circle cx="400" cy="400" r="60"/><circle cx="400" cy="400" r="100"/><circle cx="400" cy="400" r="150"/></g>`),
  'ch10.svg': scene('#fdebd0', '#f0d5b6', `<rect x="40" y="60" width="150" height="190" fill="#cfe3f0" ${S}/><rect x="610" y="60" width="150" height="190" fill="#e0efd0" ${S}/><rect x="40" y="330" width="720" height="140" fill="#d9b48f" ${S}/><rect x="280" y="290" width="240" height="50" rx="6" fill="#fff" ${S}/>${badgerPal(220, 340, 1)}${tortoise(590, 340, 1.1)}${sparkles([[400, 250, 3], [330, 270, 3]])}`),
  'ch11.svg': scene('#fbe9cf', '#eed6b8', `${[80, 240, 400, 560, 700].map((x, i) => `<rect x="${x - 55}" y="${90 + (i % 2) * 20}" width="110" height="130" fill="${['#cfe3f0', '#dff0d0', '#fff2bd', '#e6d8f8', '#ffd3e2'][i]}" ${S}/>`).join('')}<rect x="40" y="340" width="720" height="130" fill="#d9b48f" ${S}/>${badgerPal(320, 350, 1)}${tortoise(520, 350, 1)}${lantern(400, 130, 0.8)}`),
  'ch12.svg': scene('#fdeccf', '#eed5b6', `<rect x="120" y="50" width="560" height="320" fill="#f6efe0" ${S}/><rect x="370" y="190" width="60" height="44" rx="3" fill="#fff" ${S}/><path d="M378 200h44M378 210h30M378 220h40" ${S} stroke-width="2"/>${sun(400, 140, 22)}${sparkles([[330, 120, 3], [470, 110, 3], [400, 270, 3]])}<rect x="40" y="400" width="720" height="70" fill="#d9b48f" ${S}/>${badgerPal(260, 420, 0.8)}`)
};

// ---------------------------------------------------------------- The Night Market at Lamplight Quay
const MARKET = 'night_market_lamplight_quay';
const marketId = 'the_night_market_at_lamplight_quay';
const marketScenes = {
  'cover.svg': scene('#1d2456', '#5a4a98', `${stars([[70, 60, 8], [210, 100, 6], [330, 50, 8], [560, 70, 8], [700, 110, 7]])}${moon(150, 140, 34)}${water(330, '#3a4585', '#2f3a78')}${tower(560, 330, 1.3)}${stall(150, 330, 1.2)}${stall(300, 330, 1, '#bfe4f7')}${stringLights(250, ['#ffe08a', '#ffb7cc', '#bfe4f7'])}${lantern(390, 400, 0.9)}`)
};

for (const [f, svg] of Object.entries(teaScenes)) await out(TEA, 'relaxing', teaId, f, svg);
for (const [f, svg] of Object.entries(cartoScenes)) await out(CARTO, 'relaxing', cartoId, f, svg);
for (const [f, svg] of Object.entries(marketScenes)) await out(MARKET, 'adventures', marketId, f, svg);
console.log(`wrote ${Object.keys(teaScenes).length + Object.keys(cartoScenes).length + Object.keys(marketScenes).length} pictures`);
void [ground, rain, lilypad, pond, bush, win, bigstar, lamppost, book, tree, cloud, sun, moon, stars, hills, flower, mushroom, snail, teacup, reeds, dragonfly, mug];
