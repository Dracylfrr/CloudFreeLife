import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, rays, petals, bird, crown, dome, leaf, addSun, addFlower } from './dsl.mjs';

const WATER = (S, color = C.sky, name = 'Water') => S.region('water', name, rect(-6, -6, 1012, 762), color);

function seaweed(S, key, x, base, h, color = C.leaf) {
  const pts = [[x, base], [x - 30, base - h * 0.35], [x + 26, base - h * 0.7], [x - 4, base - h]];
  S.region(key, 'Seaweed', blob([...pts, [x + 40, base - h * 0.6], [x + 10, base - h * 0.32], [x + 36, base]], 0.55), color, { w: 4.5 });
}

function bubbles(S, list, prefix = 'bubble') {
  list.forEach(([x, y, r], i) => S.region(`${prefix}_${i + 1}`, 'Bubble', circle(x, y, r), C.white, { w: 4 }));
}

function fish(S, key, x, y, s, color, stripe, dir = 1) {
  S.region(`${key}_tail`, 'Tail', rpoly([[x - dir * 56 * s, y], [x - dir * 112 * s, y - 40 * s], [x - dir * 112 * s, y + 40 * s]], 10 * s), stripe);
  S.region(`${key}_fin`, 'Fin', rpoly([[x - dir * 12 * s, y - 38 * s], [x + dir * 20 * s, y - 70 * s], [x + dir * 34 * s, y - 34 * s]], 8 * s), stripe);
  S.region(`${key}_body`, 'Fish', ellipse(x, y, 72 * s, 44 * s), color);
  S.region(`${key}_stripe`, 'Stripe', ellipse(x - dir * 6 * s, y, 13 * s, 40 * s), stripe, { w: 4 });
  S.dot(x + dir * 42 * s, y - 8 * s, 6 * s);
  S.line(`M${x + dir * 40 * s} ${y + 14 * s}q${dir * 12 * s} ${10 * s} ${dir * 24 * s} 0`, { w: 4 });
}

export function happyWhale() {
  const S = new Scene('happy_whale', 'Happy Whale');
  S.region('sky', 'Sky', rect(-6, -6, 1012, 420), C.skyPale);
  addSun(S, 860, 120, 50);
  S.region('cloud_a', 'Cloud', cloud(200, 130, 200, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(560, 90, 150, 2), C.white);
  S.region('sea', 'Sea', band(330, 770, 8, 6), C.sky);
  S.region('whale_tail', 'Tail', blob([[220, 470], [140, 400], [100, 330], [170, 350], [210, 400], [250, 350], [300, 330], [270, 400], [300, 470]]), C.skyDeep);
  S.region('whale_body', 'Whale', blob([[230, 500], [250, 410], [400, 360], [600, 370], [740, 430], [760, 520], [680, 600], [450, 630], [290, 600]]), C.skyDeep);
  S.region('whale_belly', 'Belly', blob([[330, 580], [450, 540], [640, 540], [730, 520], [690, 590], [520, 620], [380, 612]]), C.cream);
  S.region('whale_fin', 'Fin', leaf(470, 540, 130, 40, 60), C.sky);
  S.region('whale_spout', 'Water spout', rect(634, 290, 32, 80, 10) + circle(600, 270, 38) + circle(700, 262, 42) + circle(650, 215, 44), C.white, { w: 4 });
  S.dot(660, 470, 8);
  S.line('M690 520q24 18 52-6', { w: 4.5 });
  S.region('wave_front', 'Front wave', band(640, 770, 14, 5), C.turq);
  S.line('M60 690q40-14 80 0M300 720q40-14 80 0M640 700q40-14 80 0M860 730q40-14 80 0', { w: 3.5 });
  S.line(bird(400, 220, 0.8) + bird(450, 190, 0.6), { w: 4 });
  return S;
}

export function octopusCove() {
  const S = new Scene('octopus_cove', 'Octopus Cove');
  WATER(S, C.skyPale);
  S.region('sand', 'Sand', ground([[-10, 640], [300, 620], [700, 650], [1010, 620]]), C.sand);
  const tent = [
    [[420, 420], [330, 520], [300, 640], [360, 680], [380, 620], [400, 540], [470, 460]],
    [[470, 440], [440, 560], [430, 680], [490, 700], [500, 620], [520, 540], [540, 450]],
    [[530, 440], [560, 560], [600, 690], [660, 690], [640, 620], [610, 540], [590, 450]],
    [[580, 420], [680, 510], [740, 620], [800, 600], [770, 540], [700, 450], [640, 400]]
  ];
  const colors = [C.lilac, C.lavender, C.lilac, C.lavender];
  tent.forEach((p, i) => S.region(`tentacle_${i + 1}`, 'Tentacle', blob(p, 0.6), colors[i], { w: 5 }));
  S.region('octopus_head', 'Head', ellipse(500, 300, 170, 160), C.lavender);
  S.region('head_spots', 'Spots', circle(430, 220, 18) + circle(560, 200, 22) + circle(500, 160, 14), C.lilac, { w: 4 });
  S.region('eye_left', 'Eye', circle(440, 320, 40), C.white);
  S.region('eye_right', 'Eye', circle(560, 320, 40), C.white);
  S.dot(448, 324, 15);
  S.dot(568, 324, 15);
  S.line('M470 392q30 24 60 0', { w: 4.5 });
  seaweed(S, 'seaweed_left', 110, 660, 260);
  seaweed(S, 'seaweed_right', 900, 660, 300, C.grass);
  S.region('rock', 'Rock', rpoly([[760, 700], [830, 620], [920, 640], [960, 720]], 24), C.stone);
  S.region('shell', 'Shell', dome(190, 670, 50, 44), C.peach);
  S.line('M190 626v44M164 636l8 34M216 636l-8 34', { w: 3.5 });
  bubbles(S, [[260, 180, 28], [320, 110, 18], [700, 150, 24], [770, 80, 14]]);
  return S;
}

export function turtleReef() {
  const S = new Scene('turtle_reef', 'Turtle Reef');
  WATER(S, C.sky);
  S.region('sand', 'Sand', ground([[-10, 650], [300, 630], [700, 660], [1010, 630]]), C.sand);
  S.region('coral_a', 'Coral', blob([[110, 660], [90, 560], [60, 470], [110, 500], [130, 420], [170, 500], [200, 470], [190, 570], [200, 660]], 0.45), C.pink);
  S.region('coral_b', 'Coral', blob([[880, 670], [860, 580], [830, 520], [880, 540], [900, 470], [940, 540], [970, 510], [960, 600], [970, 670]], 0.45), C.coral);
  S.region('flipper_back', 'Back flipper', leaf(300, 500, 120, 36, 150), C.leaf);
  S.region('flipper_back_2', 'Back flipper', leaf(640, 520, 120, 36, 30), C.leaf);
  S.region('turtle_tail', 'Tail', rpoly([[250, 440], [190, 450], [250, 470]], 6), C.leaf);
  S.region('flipper_front', 'Front flipper', leaf(560, 470, 190, 46, 55), C.leaf);
  S.region('flipper_front_2', 'Front flipper', leaf(330, 420, 170, 42, -150), C.leaf);
  S.region('turtle_head', 'Head', circle(760, 400, 74), C.leaf);
  S.dot(785, 385, 8);
  S.line('M752 424q20 14 40 0', { w: 4.5 });
  S.region('turtle_shell', 'Shell', dome(480, 480, 230, 190), C.grass);
  S.region('shell_center', 'Shell pattern', rpoly([[440, 360], [520, 360], [550, 410], [520, 460], [440, 460], [410, 410]], 12), C.butter);
  S.region('shell_left', 'Shell pattern', rpoly([[320, 420], [390, 410], [400, 470], [340, 480]], 10), C.mint);
  S.region('shell_right', 'Shell pattern', rpoly([[570, 410], [640, 420], [630, 480], [580, 470]], 10), C.mint);
  S.region('shell_rim', 'Shell rim', rect(250, 478, 460, 34, 17), C.leaf);
  fish(S, 'fish', 220, 200, 0.7, C.peach, C.coral, -1);
  bubbles(S, [[560, 160, 20], [610, 100, 14], [700, 200, 18]]);
  seaweed(S, 'seaweed', 330, 650, 220);
  return S;
}

export function seahorseGarden() {
  const S = new Scene('seahorse_garden', 'Seahorse Garden');
  WATER(S, C.skyPale);
  S.region('sand', 'Sand', ground([[-10, 660], [300, 640], [700, 670], [1010, 640]]), C.sand);
  seaweed(S, 'seaweed_left', 120, 680, 340);
  seaweed(S, 'seaweed_right', 880, 680, 300, C.grass);
  S.region('seahorse_tail', 'Tail', blob([[470, 560], [420, 640], [490, 690], [570, 660], [560, 600], [520, 620], [510, 580]], 0.6), C.peach);
  S.region('seahorse_body', 'Body', blob([[430, 330], [380, 440], [420, 560], [520, 560], [560, 450], [530, 340]], 0.6), C.coral);
  S.region('seahorse_belly', 'Belly', blob([[470, 380], [450, 450], [480, 530], [520, 520], [530, 440], [510, 380]], 0.6), C.butter);
  S.region('seahorse_fin', 'Fin', leaf(545, 430, 100, 40, 20), C.pink);
  S.region('seahorse_crest', 'Crest', rpoly([[420, 260], [400, 200], [450, 230], [470, 170], [490, 240]], 6), C.pink);
  S.region('seahorse_head', 'Head', ellipse(480, 290, 80, 66), C.coral);
  S.region('seahorse_snout', 'Snout', ellipse(570, 330, 54, 22), C.coral);
  S.dot(498, 272, 8);
  S.line('M440 320q16 14 34 0', { w: 4.5 });
  S.line('M400 380h110M396 420h110M410 460h100M432 500h80', { w: 3, dash: '1 9' });
  S.region('shell_a', 'Shell', dome(260, 680, 58, 50), C.pink);
  S.line('M260 630v50M232 640l8 40M288 640l-8 40', { w: 3.5 });
  S.region('shell_b', 'Shell', dome(740, 690, 50, 44), C.lavender);
  S.region('starfish', 'Starfish', star(660, 660, 40, 18, 5, -70), C.butter);
  S.region('coral', 'Coral', blob([[800, 690], [790, 620], [770, 570], [810, 590], [830, 540], [860, 600], [880, 600], [870, 690]], 0.45), C.coral);
  bubbles(S, [[300, 200, 26], [250, 120, 16], [700, 180, 22], [760, 100, 14], [650, 280, 12]]);
  return S;
}

export function fishSchool() {
  const S = new Scene('fish_school', 'Fish School');
  WATER(S, C.sky);
  S.region('light_beam', 'Light beam', rpoly([[300, -6], [420, -6], [560, 560], [250, 560]], 20), C.skyPale);
  S.region('sand', 'Sand', ground([[-10, 650], [300, 630], [700, 660], [1010, 630]]), C.sand);
  seaweed(S, 'seaweed_a', 90, 670, 260);
  seaweed(S, 'seaweed_b', 930, 670, 320, C.grass);
  S.region('coral', 'Coral', blob([[400, 670], [390, 600], [370, 540], [410, 560], [430, 500], [470, 570], [500, 540], [490, 610], [500, 670]], 0.45), C.pink);
  S.region('rock', 'Rock', rpoly([[640, 690], [700, 600], [800, 620], [850, 700]], 24), C.stone);
  fish(S, 'fish_big', 560, 260, 1.15, C.peach, C.coral, 1);
  fish(S, 'fish_mid', 300, 400, 0.9, C.lavender, C.pink, -1);
  fish(S, 'fish_small', 760, 440, 0.7, C.butter, C.peach, -1);
  fish(S, 'fish_tiny', 180, 190, 0.55, C.mint, C.leaf, 1);
  bubbles(S, [[760, 150, 22], [820, 90, 14], [640, 100, 12], [450, 120, 18]]);
  return S;
}

export const oceanPages = [
  { folder: '01_happy_whale', scene: happyWhale, name: 'Happy Whale', description: 'A big, gentle whale blowing a water spout.' },
  { folder: '02_octopus_cove', scene: octopusCove, name: 'Octopus Cove', description: 'A shy octopus in a cozy cove.' },
  { folder: '03_turtle_reef', scene: turtleReef, name: 'Turtle Reef', description: 'A sea turtle gliding past the coral.' },
  { folder: '04_seahorse_garden', scene: seahorseGarden, name: 'Seahorse Garden', description: 'A little seahorse among shells and seaweed.' },
  { folder: '05_fish_school', scene: fishSchool, name: 'Fish School', description: 'Four colorful fish swimming through a sunbeam.' }
];
