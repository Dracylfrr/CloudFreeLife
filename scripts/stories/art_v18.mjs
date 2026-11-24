// Covers for the free starter series added in 1.8 (800 x 480, same soft style as the other story covers).
import * as A from './artlib.mjs';
const { scene, stars, moon, hills, ground, train, tracks, lamppost, pine, snowfall, glowdot, hotAirBalloon, S } = A;

export const v18Covers = {
  // The Night Train, part 2: the train waits out a snowfall under a pale winter sky.
  snowtrain: scene(
    '#7e93c9',
    '#dfe6f6',
    `${snowfall(46)}${stars([[120, 60, 8], [620, 70, 7], [720, 140, 6]])}${hills('#c9d6ee', 330, 28)}${hills('#b3c3e2', 392, 22, true)}${[[90, 396], [190, 404], [660, 398], [730, 406]].map(([x, y], i) => pine(x, y, 0.8 + (i % 2) * 0.25, '#9fb8d8')).join('')}<path d="M-10 410H810V490H-10z" fill="#f4f7fd" ${S}/>${tracks(414)}${train(440, 402, 1.4)}${lamppost(110, 410, 0.9)}<g fill="#fff" opacity=".95"><ellipse cx="300" cy="354" rx="120" ry="14"/><ellipse cx="560" cy="360" rx="90" ry="10"/></g>`
  ),
  // The Night Train, part 3: a warm midsummer meadow full of fireflies.
  summertrain: scene(
    '#3c4a8a',
    '#e8b3a6',
    `${stars([[100, 60, 8], [250, 90, 6], [470, 50, 7], [660, 80, 8], [740, 150, 6]])}${moon(640, 170, 34)}${hills('#5f7da8', 330, 28)}${ground('#6aa58a', 396)}<path d="M-10 396H810V490H-10z" fill="#76b596" ${S}/>${tracks(414)}${train(250, 402, 1.3)}${Array.from({ length: 22 }, (_, i) => glowdot(40 + ((i * 113) % 740), 250 + ((i * 59) % 190), 4 + (i % 3))).join('')}`
  )
};
