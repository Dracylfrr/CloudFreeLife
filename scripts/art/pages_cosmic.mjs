import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, blob, crescent, annulus, annulusLower, circleBand, addStars, curve, crown } from './dsl.mjs';

const SPACE = (S, color = C.night) => S.region('space', 'Night sky', rect(-6, -6, 1012, 762), color);

function planet(S, key, cx, cy, r, base, band1, band2) {
  S.region(key, 'Planet', circle(cx, cy, r), base);
  if (band1) S.region(`${key}_band_a`, 'Planet stripe', circleBand(cx, cy, r, cy - r * 0.35, cy - r * 0.05), band1);
  if (band2) S.region(`${key}_band_b`, 'Planet stripe', circleBand(cx, cy, r, cy + r * 0.3, cy + r * 0.62), band2);
}

export function ringedPlanet() {
  const S = new Scene('ringed_planet', 'Ringed Planet');
  SPACE(S);
  addStars(S, [[110, 90, 24], [880, 90, 28], [900, 420, 20], [90, 560, 22], [700, 90, 16]]);
  S.region('moon', 'Moon', circle(160, 230, 52), C.moon);
  S.line('M140 214a8 8 0 1 0 16 0a8 8 0 1 0-16 0M168 250a6 6 0 1 0 12 0a6 6 0 1 0-12 0', { w: 3.5 });
  S.region('small_planet', 'Small planet', circle(850, 600, 56), C.pink);
  const tilt = 'rotate(-16 500 380)';
  S.region('ring_back', 'Planet ring', annulus(500, 380, 340, 88, 258, 58), C.lilac, { transform: tilt });
  planet(S, 'planet', 500, 380, 170, C.peach, C.coral, C.pink);
  S.region('ring_front', 'Planet ring front', annulusLower(500, 380, 340, 88, 258, 58), C.lilac, { transform: tilt });
  S.region('comet_tail', 'Comet tail', rpoly([[760, 700], [610, 640], [690, 720]], 10), C.skyPale);
  S.region('comet_head', 'Comet', circle(782, 706, 22), C.butter);
  return S;
}

export function rocketRide() {
  const S = new Scene('rocket_ride', 'Rocket Ride');
  SPACE(S, C.nightPale);
  planet(S, 'big_planet', 180, 610, 140, C.mint, C.leaf, null);
  S.region('small_planet', 'Small planet', circle(860, 170, 62), C.pink);
  S.region('moon', 'Moon', circle(830, 560, 46), C.moon);
  addStars(S, [[120, 120, 22], [330, 70, 16], [640, 90, 20], [920, 380, 18], [680, 690, 20]]);
  const T = 'rotate(24 500 380)';
  S.region('flame_outer', 'Flame', 'M446 494Q500 690 554 494Z', C.coral, { transform: T });
  S.region('flame_inner', 'Flame glow', 'M472 494Q500 590 528 494Z', C.butter, { transform: T });
  S.region('fin_left', 'Fin', rpoly([[412, 380], [322, 520], [412, 476]], 14), C.rose, { transform: T });
  S.region('fin_right', 'Fin', rpoly([[588, 380], [678, 520], [588, 476]], 14), C.rose, { transform: T });
  S.region('body', 'Rocket body', 'M500 110Q596 214 596 380V476H404V380Q404 214 500 110Z', C.white, { transform: T });
  S.region('nose', 'Nose cone', 'M500 110Q538 152 560 214H440Q462 152 500 110Z', C.pink, { transform: T });
  S.region('stripe', 'Stripe', rect(404, 410, 192, 28), C.lavender, { transform: T });
  S.region('window_rim', 'Window', circle(500, 320, 54), C.skyDeep, { transform: T });
  S.region('window_glass', 'Window glass', circle(500, 320, 36), C.skyPale, { transform: T });
  S.region('engine', 'Engine', rect(436, 474, 128, 26, 10), C.stone, { transform: T });
  S.line('M250 250l-60 20M240 330l-80 10M730 500l60 24', { w: 5 });
  return S;
}

export function moonAndStars() {
  const S = new Scene('moon_and_stars', 'Moon and Stars');
  SPACE(S, C.nightDeep);
  S.region('moon', 'Moon', crescent(380, 360, 230, 0.5), C.moon);
  S.face(272, 350, 1.2, { sleepy: true });
  addStars(S, [[690, 130, 34], [830, 260, 24], [580, 300, 22], [100, 110, 26], [150, 600, 22], [620, 560, 28], [900, 560, 20], [470, 90, 18]]);
  S.region('planet', 'Small planet', circle(870, 420, 52), C.pink);
  S.region('cloud_a', 'Cloud', cloud(770, 650, 270, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(170, 690, 220, 1), C.white);
  S.region('shooting_tail', 'Shooting star tail', rpoly([[880, 90], [760, 188], [820, 196]], 10), C.skyPale);
  S.region('shooting_star', 'Shooting star', star(890, 80, 38, 17, 5), C.butter);
  return S;
}

export function galaxySwirl() {
  const S = new Scene('galaxy_swirl', 'Galaxy Swirl');
  SPACE(S, C.nightDeep);
  const ring = (n, rx, ry, rot, seed) => {
    const pts = [];
    let s = seed;
    for (let i = 0; i < n; i++) {
      s = (s * 9301 + 49297) % 233280;
      const k = 0.88 + (s / 233280) * 0.24;
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * rx * k;
      const y = Math.sin(a) * ry * k;
      pts.push([500 + x * Math.cos(rot) - y * Math.sin(rot), 375 + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return blob(pts, 0.55);
  };
  S.region('nebula_outer', 'Outer nebula', ring(10, 390, 250, -0.35, 11), C.lilac);
  S.region('nebula_middle', 'Middle nebula', ring(9, 290, 180, -0.35, 23), C.pink);
  S.region('nebula_inner', 'Inner nebula', ring(8, 190, 112, -0.35, 37), C.peach);
  S.region('galaxy_core', 'Galaxy core', ellipse(500, 375, 86, 52), C.butter, { transform: 'rotate(-20 500 375)' });
  S.line('M330 470Q300 330 460 300Q640 270 690 380', { w: 4, dash: '2 12' });
  S.line('M310 520Q260 290 470 250Q720 220 760 400', { w: 4, dash: '2 12' });
  addStars(S, [[420, 360, 17], [560, 400, 15], [620, 300, 14], [380, 280, 13], [700, 470, 16], [300, 420, 12], [540, 250, 13], [470, 450, 12]], 'star', C.moon);
  S.region('planet_a', 'Planet', circle(120, 120, 56), C.mint);
  S.region('planet_b', 'Planet', circle(880, 630, 74), C.sky);
  S.region('moon', 'Moon', circle(880, 130, 40), C.moon);
  return S;
}

export function astronaut() {
  const S = new Scene('astronaut_friend', 'Astronaut Friend');
  SPACE(S, C.nightPale);
  planet(S, 'planet', 850, 650, 170, C.peach, C.coral, null);
  S.region('moon', 'Moon', circle(150, 150, 54), C.moon);
  addStars(S, [[350, 80, 22], [660, 110, 18], [880, 230, 22], [120, 420, 18], [180, 650, 24]]);
  S.line('M560 520Q700 560 700 700', { w: 5, dash: '2 12' });
  S.region('backpack', 'Backpack', rect(384, 296, 232, 232, 30), C.lavender);
  S.region('leg_left', 'Leg', rect(430, 500, 62, 120, 28), C.white, { transform: 'rotate(10 461 500)' });
  S.region('leg_right', 'Leg', rect(508, 500, 62, 120, 28), C.white, { transform: 'rotate(-10 539 500)' });
  S.region('boot_left', 'Boot', rect(404, 596, 82, 46, 20), C.rose, { transform: 'rotate(10 445 619)' });
  S.region('boot_right', 'Boot', rect(514, 596, 82, 46, 20), C.rose, { transform: 'rotate(-10 555 619)' });
  S.region('suit', 'Space suit', rect(414, 326, 172, 200, 44), C.white);
  S.region('arm_left', 'Arm', rect(330, 352, 118, 54, 27), C.white, { transform: 'rotate(-28 390 380)' });
  S.region('arm_right', 'Arm', rect(552, 352, 118, 54, 27), C.white, { transform: 'rotate(28 610 380)' });
  S.region('chest_panel', 'Chest panel', rect(462, 392, 76, 52, 12), C.skyPale);
  S.region('button_a', 'Button', circle(484, 418, 11), C.pink, { w: 4 });
  S.region('button_b', 'Button', circle(516, 418, 11), C.butter, { w: 4 });
  S.region('helmet', 'Helmet', circle(500, 244, 118), C.white);
  S.region('visor', 'Visor', rect(412, 194, 176, 106, 50), C.skyDeep);
  S.face(500, 250, 0.9);
  S.line('M436 218q10-14 30-14', { w: 5 });
  return S;
}

export function cometNight() {
  const S = new Scene('comet_night', 'Comet Night');
  SPACE(S, C.nightDeep);
  planet(S, 'planet_a', 190, 170, 84, C.mint, C.leaf, null);
  planet(S, 'planet_b', 870, 590, 96, C.pink, C.rose, null);
  S.line('M120 520L260 440L330 560M260 440L460 600', { w: 3.5, dash: '3 10' });
  addStars(S, [[120, 520, 20], [260, 440, 26], [330, 560, 18], [460, 600, 22], [600, 120, 20], [450, 140, 16], [900, 300, 22]]);
  S.region('tail_outer', 'Comet tail', rpoly([[728, 154], [826, 256], [110, 690]], 34), C.lilac);
  S.region('tail_mid', 'Comet tail', rpoly([[744, 182], [808, 240], [250, 610]], 26), C.pink);
  S.region('tail_inner', 'Comet tail', rpoly([[762, 204], [796, 232], [420, 500]], 18), C.butter);
  S.region('comet_head', 'Comet', circle(780, 208, 64), C.moon);
  S.face(780, 212, 0.9);
  return S;
}

export const cosmicPages = [
  { folder: '01_ringed_planet', scene: ringedPlanet, name: 'Ringed Planet', description: 'A big striped planet with a dreamy ring.' },
  { folder: '02_rocket_ride', scene: rocketRide, name: 'Rocket Ride', description: 'A cheerful rocket zooming past the planets.' },
  { folder: '03_moon_and_stars', scene: moonAndStars, name: 'Moon and Stars', description: 'A sleepy crescent moon and a sky full of stars.' },
  { folder: '04_galaxy_swirl', scene: galaxySwirl, name: 'Galaxy Swirl', description: 'A glowing spiral galaxy with soft nebula clouds.' },
  { folder: '05_astronaut_friend', scene: astronaut, name: 'Astronaut Friend', description: 'A friendly astronaut floating in space.' },
  { folder: '06_comet_night', scene: cometNight, name: 'Comet Night', description: 'A smiling comet streaking across the night.' }
];
