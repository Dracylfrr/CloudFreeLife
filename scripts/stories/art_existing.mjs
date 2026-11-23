// Illustrations for the six original Cozy Stories (three chapter pictures each).
import * as A from './artlib.mjs';
const { scene, cloud, sun, moon, stars, star, hills, ground, tree, pine, bush, flower, daisy, mushroom, house, lantern, glowdot, owl, teacup, rain, whale, wave, snail, frog, lilypad, mouse, badger, snowman, snowfall, mug, rainbow, book, bird, pond, reeds, dragonfly, bee, moth, glowflower, pip, sled, stringLights, sparkles, fence, blanket, S, LINE } = A;

const note = (x, y, s = 1, fill = '#fff') => `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" ${S} stroke-width="2.4"><ellipse cx="0" cy="0" rx="9" ry="7" transform="rotate(-20)"/><path d="M8 -2V-34q10 4 14 14" fill="none"/></g>`;
const snowcap = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-38 -52A44 40 0 0 1 38 -52q-9 9 -19 1q-10 9 -19 0q-9 8 -19 -1z" fill="#fff" ${S} stroke-width="2.6"/></g>`;
const brick = (x, y, w, h) => {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e4cfc4" ${S}/>`;
  for (let r = 0; r < h / 28; r++) {
    out += `<path d="M${x} ${y + r * 28}H${x + w}" stroke="${LINE}" stroke-width="2" opacity=".5"/>`;
    for (let c = (r % 2) * 30; c < w; c += 60) out += `<path d="M${x + c} ${y + r * 28}v28" stroke="${LINE}" stroke-width="2" opacity=".5"/>`;
  }
  return out;
};

export const existing = {
  cloud_who_lost_its_rain: [
    {
      alt: 'Pebble, a small round cloud, floats above a green hill dotted with daisies.',
      caption: 'Pebble above Willow Hill',
      svg: scene('#c9e7fa', '#efe4fb', `${sun(668, 96, 34)}${cloud(150, 96, 0.8)}${cloud(600, 190, 0.6)}${cloud(400, 160, 1.7, '#ffffff', true)}${hills('#b9e5be', 350, 30)}${hills('#cdeccc', 400, 24, true)}${[110, 220, 330, 470, 590, 690].map((x, i) => daisy(x, 412 + (i % 2) * 20, 1.1)).join('')}`)
    },
    {
      alt: 'A frog sits on a lily pad in a pond while Pebble the cloud floats nearby, looking thoughtful.',
      caption: 'Asking the wise old frog',
      svg: scene('#d8ecfb', '#f4ecfb', `${sun(100, 90, 28)}${cloud(260, 110, 0.7)}${cloud(560, 150, 1.2, '#ffffff', true)}${hills('#c2e8c4', 300, 22)}${pond(400, 390, 330, 86)}${lilypad(300, 400, 120)}${lilypad(520, 380, 90)}${frog(300, 392, 1.5)}${reeds(690, 360, 1.1)}${reeds(95, 350, 1)}<path d="M640 160q30 -16 54 0M650 190q24 -12 44 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>`)
    },
    {
      alt: 'Soft silver rain falls from Pebble onto the pond, the daisies and a sleepy frog, while a dragonfly and a bee hover nearby.',
      caption: 'Rain, slowly',
      svg: scene('#bfd9ee', '#e3dcf4', `${cloud(400, 110, 1.8, '#f3f6fb', true)}${rain(250, 560, 190, 330, 30)}${hills('#b7dcc0', 340, 26)}${pond(400, 420, 330, 72, '#9fcbe6')}${lilypad(380, 430, 110)}${frog(380, 422, 1.3)}${[90, 170, 640, 720].map((x, i) => daisy(x, 400 + (i % 2) * 22, 1.1)).join('')}${dragonfly(600, 250, 1)}${bee(180, 280, 1)}`)
    }
  ],
  lantern_for_the_little_owl: [
    {
      alt: 'A small owl clings to a branch at the edge of her nest as a plum-colored sky grows dark behind her.',
      caption: 'Olive and the big, quiet dark',
      svg: scene('#6b4f94', '#f0b5c8', `${stars([[90, 70, 8], [220, 40, 6], [330, 100, 7], [600, 60, 8], [700, 120, 6]])}${moon(660, 140, 30)}${hills('#5a4a82', 380, 30)}${hills('#4a3d72', 430, 22, true)}<path d="M-20 270H620" stroke="#a77f62" stroke-width="22" stroke-linecap="round"/><path d="M120 270C150 220 250 220 280 270z" fill="#d9b88c" ${S}/><path d="M138 262q60 -30 130 0" fill="none" ${S} stroke-width="2.4"/>${owl(200, 216, 1.02)}<path d="M470 270q40 -60 100 -50M530 270q30 -40 70 -50" fill="none" stroke="#7fc79a" stroke-width="6" stroke-linecap="round"/>`)
    },
    {
      alt: 'A ring of fireflies glows around the little owl as they drift together over a moonlit meadow.',
      caption: '"We are made of lanterns"',
      svg: scene('#2b2a5e', '#58509a', `${stars([[80, 60, 8], [200, 120, 6], [330, 50, 7], [560, 80, 8], [700, 40, 6], [740, 150, 7]])}${moon(130, 120, 32)}${hills('#40548a', 360, 28)}${hills('#35457a', 420, 24, true)}${pond(580, 430, 180, 40, '#6f8fcb')}${moon(580, 430, 14)}${owl(400, 220, 1)}${[[300, 170], [330, 250], [380, 320], [450, 330], [500, 270], [510, 190], [450, 130], [350, 120], [260, 240], [560, 330], [220, 160]].map(([x, y], i) => glowdot(x, y, 5 + (i % 3))).join('')}`)
    },
    {
      alt: 'Back in her nest, the owl looks calmly out at a night full of stars and a pale moon path.',
      caption: 'Good night, dark',
      svg: scene('#1f2350', '#4a4a8c', `${stars([[70, 60, 9], [180, 110, 6], [300, 50, 8], [480, 90, 7], [600, 40, 9], [700, 120, 6], [120, 200, 6], [740, 230, 7]])}${moon(620, 130, 40)}${hills('#33407a', 380, 26)}<path d="M-20 400L180 440L420 400H820" fill="none"/><path d="M440 480Q470 380 560 330" fill="none" stroke="#fff3c4" stroke-width="26" opacity=".12" stroke-linecap="round"/><path d="M60 350H300" stroke="#a77f62" stroke-width="22" stroke-linecap="round"/><path d="M90 350C110 300 230 300 270 350z" fill="#d9b88c" ${S}/>${owl(180, 316, 0.78)}${glowdot(400, 260, 5)}${glowdot(440, 210, 4)}`)
    }
  ],
  tea_shop_at_the_rainbows_end: [
    {
      alt: 'A rainbow lands beside a tiny tea shop with a round green door. Mr. Hazel the badger stands in his apron.',
      caption: 'Opening time at the rainbow\'s end',
      svg: scene('#d7ecfb', '#fdeaf3', `${cloud(120, 100, 0.8)}${cloud(690, 80, 0.7)}${rainbow(420, 380, 300)}${hills('#bfe6c4', 380, 24)}${ground('#cdeccf', 410)}<g transform="translate(420 410)"><rect x="-90" y="-110" width="180" height="110" rx="10" fill="#fff1dc" ${S}/><path d="M-106 -104L0 -176L106 -104z" fill="#f4a6a6" ${S}/><rect x="-24" y="-70" width="48" height="70" rx="24" fill="#8fd0a4" ${S}/><circle cx="12" cy="-34" r="4" fill="#ffe9a8" ${S} stroke-width="2"/><rect x="-80" y="-88" width="40" height="34" rx="6" fill="#ffe9a8" ${S}/><rect x="40" y="-88" width="40" height="34" rx="6" fill="#ffe9a8" ${S}/><rect x="70" y="-168" width="16" height="36" fill="#e7cdb8" ${S}/></g>${badger(610, 410, 0.9)}${flower(180, 440, 1.2)}${flower(260, 430, 1)}${flower(690, 440, 1.1, '#ffffff', '#ffe27a')}`)
    },
    {
      alt: 'Inside the tea shop, a sparrow sips from a cup by the window while teapots and cakes wait on a round table.',
      caption: 'Everyone gets what they need',
      svg: scene('#ffeede', '#ffe0d0', `<rect x="0" y="360" width="800" height="120" fill="#f1d2b6" ${S}/>${A.window(80, 70, 190, 170, `<path d="M80 240q60 -70 190 -30V240z" fill="#bfe6c4"/>${sun(210, 130, 22)}`)}${A.window(520, 70, 190, 170, `${rainbow(615, 230, 70)}`)}<ellipse cx="400" cy="330" rx="200" ry="36" fill="#f4c9a4" ${S}/><rect x="392" y="330" width="16" height="70" fill="#e0b28a" ${S}/>${teacup(300, 300, 1)}${teacup(500, 300, 1, '#d98c8c')}<g transform="translate(400 290)"><path d="M-30 0Q-34 -36 0 -38Q34 -36 30 0z" fill="#ffc9c9" ${S}/><path d="M-12 -38q12 -14 24 0" fill="#ffc9c9" ${S}/><path d="M30 -20q24 0 18 18" fill="none" ${S}/></g>${bird(180, 290, 1.1)}${badger(680, 400, 0.92)}`)
    },
    {
      alt: 'At golden hour, an old snail sits at a little table with a cup of tea while Mr. Hazel tucks a blanket over his shell.',
      caption: 'The last cup of the day',
      svg: scene('#ffe3b8', '#ffc9a2', `${rainbow(150, 300, 120)}<g opacity=".55">${rainbow(150, 300, 120)}</g>${hills('#f0c9a0', 360, 20)}<rect x="0" y="360" width="800" height="120" fill="#e9bd94" ${S}/><ellipse cx="400" cy="372" rx="170" ry="30" fill="#f6d8b8" ${S}/><rect x="392" y="372" width="16" height="60" fill="#d9a77c" ${S}/>${teacup(470, 340, 1)}${snail(330, 360, 1.5)}${badger(620, 420, 1)}<path d="M290 310q40 -34 90 -10l-6 28q-44 -16 -78 4z" fill="#ffd3e2" ${S}/>${lantern(130, 90, 0.8)}${sparkles([[250, 140, 4], [560, 110, 3], [700, 200, 4]])}`)
    }
  ],
  moss_and_the_midnight_garden: [
    {
      alt: 'A little gray mouse sits beside a silver flower bud at the foot of an old stone wall, with a thimble of warm milk.',
      caption: 'Nine days of watching one silver bud',
      svg: scene('#2f3a72', '#5d5a9c', `${stars([[110, 70, 8], [250, 40, 6], [420, 90, 7], [640, 50, 8], [730, 130, 6]])}${moon(660, 110, 32)}${brick(0, 130, 800, 190)}${ground('#6aa88a', 330)}${bush(90, 350, 1.2, '#5e9c7e')}${bush(720, 350, 1.2, '#5e9c7e')}<path d="M400 340V268" stroke="#9ed8b4" stroke-width="6" stroke-linecap="round"/><path d="M400 270C376 258 376 220 400 200C424 220 424 258 400 270z" fill="#e8e8f6" ${S}/><path d="M400 262C392 240 394 224 400 214" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>${mouse(300, 380, 1.3)}<path d="M470 380h30l-3 22h-24z" fill="#ffe9ef" ${S}/>${glowdot(430, 240, 3)}`)
    },
    {
      alt: 'The mouse waits patiently on a tiny pillow while a moth sleeps beside him and a snail glides by under the rising moon.',
      caption: 'Waiting is a kind of listening',
      svg: scene('#26305f', '#53508f', `${stars([[90, 60, 8], [230, 110, 6], [360, 50, 7], [520, 80, 8], [700, 60, 7], [660, 170, 5]])}${moon(560, 130, 44)}${brick(0, 120, 800, 170)}${ground('#5e9a80', 300)}${bush(60, 330, 1.3, '#4f8c72')}${bush(740, 330, 1.3, '#4f8c72')}<path d="M300 330V280" stroke="#9ed8b4" stroke-width="6" stroke-linecap="round"/><path d="M300 282C284 272 284 244 300 232C316 244 316 272 300 282z" fill="#dcdcf0" ${S}/>${blanket(380, 400, 120, 36, '#cfe3f8', '#fff')}${mouse(440, 392, 1.2)}${moth(520, 340, 1)}${snail(640, 410, 1)}${glowdot(180, 250, 3)}${glowdot(220, 300, 3)}`)
    },
    {
      alt: 'At midnight the silver flower opens fully, glowing pearly white, and the mouse watches with his chin in his paws.',
      caption: 'Midnight',
      svg: scene('#232a5a', '#4a4a8a', `${stars([[80, 60, 8], [200, 110, 6], [340, 50, 7], [480, 100, 6], [700, 70, 8], [740, 190, 6], [150, 190, 5]])}${brick(0, 110, 800, 190)}${ground('#58957c', 310)}${bush(70, 340, 1.4, '#4a8468')}${bush(730, 340, 1.4, '#4a8468')}${glowflower(400, 360, 2.3)}${mouse(250, 410, 1.3)}${sparkles([[330, 150, 4], [470, 180, 3], [560, 250, 4], [300, 250, 3], [520, 120, 3], [610, 170, 3]], '#fffbe0')}${moon(690, 120, 28)}`)
    }
  ],
  the_whale_who_hummed: [
    {
      alt: 'Wren, a gentle whale the size of a small hill, hums softly in the deep blue sea as a few fish swim by.',
      caption: 'Wren, who hums when she is happy',
      svg: scene('#9fd5f0', '#4e8fd0', `${sun(660, 70, 28)}${wave('#7fbbe6', 130, 10)}${wave('#6aa9de', 170, 12)}${whale(380, 290, 1.5)}${note(560, 150, 1.4)}${note(610, 190, 1.1)}${note(520, 100, 1)}${[[110, 360], [180, 410], [680, 380], [740, 330], [90, 280]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="11" fill="#ffd6a5" ${S} stroke-width="2.4"/><path d="M${x + 20} ${y}l14 -9v18z" fill="#ffd6a5" ${S} stroke-width="2.4"/><circle cx="${x - 10}" cy="${y - 2}" r="2.4" fill="${LINE}"/>`).join('')}`)
    },
    {
      alt: 'At sunset the whale hums while the song drifts across the waves to a small fishing village on the shore.',
      caption: 'A song on the tide',
      svg: scene('#ffd2a6', '#ff9ab5', `${sun(400, 200, 50)}${wave('#ffb1b8', 250, 10)}${wave('#9ab0e6', 290, 12)}${wave('#7d98d8', 350, 14)}${whale(220, 380, 1.1, '#a7cbe8')}${note(380, 300, 1.2)}${note(450, 270, 1.1)}${note(530, 290, 1.2)}${note(610, 250, 1)}<path d="M560 400H830V490H560z" fill="#f6d8a8" ${S}/>${house(640, 400, 0.6, '#fff1dc', '#f4a6a6')}${house(730, 404, 0.5, '#e8f4ff', '#a9c3f0')}${cloud(110, 100, 0.7, '#fff5ee')}${cloud(620, 90, 0.6, '#fff5ee')}`)
    },
    {
      alt: 'Under a pale moon the whale drifts, asleep, above a quiet sea while the village and its lights dim to sleep.',
      caption: 'Everyone asleep',
      svg: scene('#1f2a5c', '#3d4f9a', `${stars([[90, 60, 8], [210, 110, 6], [330, 50, 7], [480, 100, 6], [600, 60, 8], [720, 130, 6], [150, 190, 5]])}${moon(640, 120, 40)}${wave('#3f5a9f', 250, 10)}${wave('#33498a', 300, 12)}${whale(340, 370, 1.35, '#8db0e0')}<g fill="#fff" opacity=".9">${[[470, 300, 7], [490, 270, 5], [512, 246, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><text x="520" y="230" font-family="Georgia,serif" font-size="30" fill="#fff" opacity=".8" font-style="italic">z</text><text x="550" y="195" font-family="Georgia,serif" font-size="22" fill="#fff" opacity=".7" font-style="italic">z</text><path d="M560 410H830V490H560z" fill="#43578f" ${S}/>${house(650, 410, 0.55, '#e8dcc8', '#7f8fd0', true)}${house(735, 414, 0.45, '#e8dcc8', '#7f8fd0', false)}`)
    }
  ],
  snow_day_in_mushroom_village: [
    {
      alt: 'Snow covers the toadstool roofs of a quiet village while Pip peeks out of a round door into the soft white morning.',
      caption: 'The whole world is wearing earmuffs',
      svg: scene('#e6f1fb', '#f6effb', `${snowfall(28)}${hills('#ffffff', 330, 24)}${hills('#f1f4fb', 380, 22, true)}${ground('#ffffff', 410)}${mushroom(170, 400, 1.6, '#ff9fb8')}${snowcap(170, 400, 1.6)}${mushroom(400, 396, 2, '#ffb38a')}${snowcap(400, 396, 2)}${mushroom(640, 404, 1.5, '#b9a3f0')}${snowcap(640, 404, 1.5)}<rect x="378" y="346" width="26" height="40" rx="13" fill="#b98a6a" ${S}/>${pip(470, 420, 1)}`)
    },
    {
      alt: 'Pip and her neighbors sit on a log under a red mushroom, sharing steaming mugs of cocoa while snow drifts down.',
      caption: 'Cocoa for everyone',
      svg: scene('#dfeaf8', '#f0e8fa', `${snowfall(24)}${ground('#ffffff', 380)}${mushroom(400, 330, 3.2, '#ff7f9f', '#fff')}${snowcap(400, 330, 3.2)}<rect x="170" y="360" width="460" height="46" rx="23" fill="#d4b194" ${S}/><path d="M200 380h400" stroke="${LINE}" stroke-width="2" opacity=".35"/>${pip(260, 366, 1, '#ff9fb8')}${pip(400, 366, 1, '#9fd3f2')}${pip(540, 366, 1, '#b9e3a8')}${mug(308, 340, 0.8)}${mug(448, 340, 0.8, '#bfe4f7')}${mug(588, 340, 0.8, '#fff2bd')}${snowman(710, 420, 0.9)}${sled(110, 410, 1)}`)
    },
    {
      alt: 'At dusk, little lanterns glow along the lane beside a round snowman, while the sky turns the pink of a seashell.',
      caption: 'Blankets and lanterns',
      svg: scene('#f7c3d8', '#e6d3f6', `${snowfall(20)}${hills('#fbf5ff', 330, 26)}${ground('#fbf5ff', 400)}${stringLights(120, ['#ffe9a8', '#ffb7cc', '#bfe4f7', '#c6ecda', '#fff2bd', '#e6d8f8', '#ffd6a5', '#ffe9a8', '#ffb7cc', '#bfe4f7', '#c6ecda'])}${mushroom(150, 400, 1.6, '#ff9fb8')}${snowcap(150, 400, 1.6)}${mushroom(640, 400, 1.8, '#b9a3f0')}${snowcap(640, 400, 1.8)}${snowman(400, 424, 1.3)}${lantern(280, 300, 0.7)}${lantern(520, 300, 0.7)}${pip(250, 430, 0.9)}${sled(560, 424, 1)}`)
    }
  ]
};
