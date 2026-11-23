// Covers for the three 1.3 books. Built with the same soft scene pieces as the story art.
import * as A from '../stories/artlib.mjs';
const { scene, cloud, sun, moon, stars, hills, ground, tree, pine, bush, flower, house, lantern, glowdot, mushroom, sparkles, S, LINE } = A;

const barn = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-90" y="-110" width="180" height="110" rx="6" fill="#f6b8cf" ${S}/><path d="M-106 -104L0 -176L106 -104z" fill="#ffc3b0" ${S}/><rect x="-34" y="-70" width="68" height="70" rx="4" fill="#fff8ec" ${S}/><path d="M-34 -70l68 70M34 -70l-68 70" ${S} stroke-width="2.6"/><rect x="-14" y="-140" width="28" height="22" rx="4" fill="#fff2bd" ${S} stroke-width="2.6"/></g>`;
const snowcap = (x, y, s = 1) => `<path d="M${x - 34 * s} ${y + 44 * s}L${x} ${y}L${x + 34 * s} ${y + 44 * s}q-8 10 -17 2q-9 10 -17 0q-9 10 -17 0q-8 8 -17 -2z" fill="#fff" ${S} stroke-width="2.6"/>`;

export const covers13 = {
  mountain_village: scene(
    '#cde9fa',
    '#efe4fb',
    `${sun(110, 90, 30)}${cloud(620, 90, 0.8)}<path d="M-40 380L230 150L470 380z" fill="#d9cdf6" ${S}/>${snowcap(230, 150, 2.2)}<path d="M330 380L600 190L860 380z" fill="#e6d8f8" ${S}/>${snowcap(600, 190, 2)}${hills('#a9dcb4', 400, 26)}${hills('#c2e8c4', 440, 22, true)}${pine(110, 440, 0.9)}${pine(690, 440, 1.1)}${pine(760, 450, 0.7, '#b2e3c4')}${house(400, 436, 1.2, '#f8e4c2', '#ffc3b0')}${flower(250, 450, 1, '#ffd3e2')}${flower(550, 456, 1, '#fff2bd')}`
  ),
  night_garden: scene(
    '#6d6fb8',
    '#a99ad8',
    `${stars([[100, 70, 11], [250, 130, 8], [560, 60, 11], [700, 150, 9], [330, 40, 8]])}${moon(560, 140, 62)}${hills('#5a5da6', 400, 24)}${ground('#7fb8a0', 430)}${[[170, '#ffd3e2'], [400, '#e6d8f8'], [630, '#fff2bd']].map(([x, c]) => `<path d="M${x} 480Q${x + 10} 420 ${x} 360" stroke="#a9dcb4" stroke-width="7" fill="none" stroke-linecap="round"/>${flower(x, 440, 1.7, c).replace(/stroke="#8ccaa0"/, '')}`).join('')}${glowdot(110, 250, 7)}${glowdot(300, 200, 6)}${glowdot(480, 300, 7)}${glowdot(700, 260, 6)}${glowdot(230, 330, 5)}${lantern(720, 350, 1.1)}`
  ),
  happy_farm: scene(
    '#d7ecfb',
    '#fdeaf3',
    `${sun(680, 80, 36)}${cloud(150, 80, 0.8)}${hills('#b9e5be', 380, 28)}${ground('#cdeccf', 410)}${barn(330, 420, 1.35)}<g transform="translate(600 420)"><rect x="-26" y="-190" width="52" height="190" rx="12" fill="#e3e0f0" ${S}/><path d="M-26 -190a26 26 0 0 1 52 0z" fill="#f6b8cf" ${S}/></g>${tree(130, 450, 1.1)}<path d="M80 470q80 -28 160 0M440 480q80 -28 160 0M660 470q80 -28 140 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>${flower(200, 470, 1.1, '#ffd3e2')}${flower(520, 472, 1.1, '#fff2bd')}${flower(700, 470, 1, '#e6d8f8')}`
  )
};
void LINE;
void bush;
void mushroom;
void sparkles;
