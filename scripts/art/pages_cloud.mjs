import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, crescent, rays, petals, bird, crown, dome, addSun, addFlower, addStars } from './dsl.mjs';

const SKY = (S, color = C.skyPale, name = 'Sky') => S.region('sky', name, rect(-6, -6, 1012, 762), color);

export function cloudCastle() {
  const S = new Scene('cloud_castle', 'Cloud Castle');
  SKY(S);
  addSun(S, 150, 140, 58);
  S.region('cloud_top', 'Cloud', cloud(800, 120, 190, 2), C.white);
  S.region('cloud_right', 'Cloud', cloud(850, 330, 190, 0), C.white);
  S.region('cloud_left', 'Cloud', cloud(150, 330, 170, 1), C.white);
  addStars(S, [[610, 90, 20], [380, 70, 15], [930, 480, 17]], 'sparkle', C.butter);
  // castle
  S.region('wall', 'Castle wall', rect(330, 400, 340, 200, 6), C.stone);
  S.region('tower_left', 'Left tower', rect(255, 330, 100, 270, 8), C.lavender);
  S.region('tower_right', 'Right tower', rect(645, 330, 100, 270, 8), C.lavender);
  S.region('tower_center', 'Center tower', rect(440, 250, 120, 350, 8), C.lilac);
  S.region('roof_left', 'Left roof', rpoly([[243, 344], [305, 222], [367, 344]], 12), C.pink);
  S.region('roof_right', 'Right roof', rpoly([[633, 344], [695, 222], [757, 344]], 12), C.pink);
  S.region('roof_center', 'Center roof', rpoly([[426, 264], [500, 112], [574, 264]], 14), C.rose);
  S.line('M500 112V62', { w: 6 });
  S.region('flag', 'Flag', rpoly([[500, 62], [560, 82], [500, 104]], 6), C.butter);
  S.region('window_left', 'Window', arch(283, 380, 44, 66), C.skyDeep);
  S.region('window_right', 'Window', arch(673, 380, 44, 66), C.skyDeep);
  S.region('window_center', 'Window', arch(476, 300, 48, 76), C.skyDeep);
  S.region('door', 'Door', arch(458, 440, 84, 120), C.wood);
  S.line('M368 470h60M368 510h60M570 470h60M570 510h60', { w: 3.5 });
  // big cloud base
  S.region('cloud_base', 'Cloud base', cloud(500, 615, 1000, 3), C.white);
  S.face(500, 668, 1.15);
  S.line(bird(260, 190, 0.9), { w: 4 });
  S.line(bird(380, 150, 0.7), { w: 4 });
  return S;
}

export function floatingIslands() {
  const S = new Scene('floating_islands', 'Floating Islands');
  SKY(S, C.sky);
  addSun(S, 850, 110, 52);
  S.region('cloud_left', 'Cloud', cloud(170, 110, 190, 0), C.white);
  S.region('cloud_top', 'Cloud', cloud(580, 80, 140, 1), C.white);
  S.region('cloud_right', 'Cloud', cloud(880, 340, 160, 2), C.white);
  // small top island
  S.region('rock_top', 'Small island rock', rpoly([[540, 238], [700, 238], [652, 292], [620, 330], [590, 292]], 14), C.wood);
  S.region('grass_top', 'Small island grass', ellipse(620, 238, 82, 22), C.leaf);
  // big island
  S.region('rock_big', 'Island rock', rpoly([[112, 400], [548, 400], [476, 508], [402, 600], [330, 648], [258, 600], [186, 508]], 26), C.wood);
  S.region('grass_big', 'Island grass', ellipse(330, 400, 218, 50), C.leaf);
  S.region('trunk_big', 'Tree trunk', rect(250, 300, 28, 104, 8), C.wood);
  S.region('crown_big', 'Tree leaves', crown(264, 262, 72, 3), C.grass);
  S.region('house_wall', 'House', rect(400, 356, 88, 62, 4), C.peach);
  S.region('house_roof', 'Roof', rpoly([[388, 362], [444, 312], [500, 362]], 8), C.rose);
  S.region('house_door', 'Door', rect(432, 384, 26, 34, 6), C.skyDeep);
  // right island
  S.region('rock_right', 'Island rock', rpoly([[560, 548], [850, 548], [790, 624], [706, 696], [620, 624]], 20), C.wood);
  S.region('grass_right', 'Island grass', ellipse(705, 548, 146, 34), C.leaf);
  S.region('trunk_right', 'Tree trunk', rect(740, 498, 16, 58, 6), C.wood);
  S.region('crown_right', 'Tree leaves', crown(748, 470, 44, 7), C.grass);
  addFlower(S, 'flower', 620, 536, 0.55, C.pink);
  S.line(bird(420, 190, 0.9) + bird(470, 215, 0.6), { w: 4 });
  return S;
}

function balloon(S, key, cx, cy, r, c1, c2, c3) {
  const bottom = cy + r * 1.35;
  S.region(`${key}_ropes_basket`, 'Basket', rect(cx - r * 0.22, cy + r * 1.62, r * 0.44, r * 0.3, 5), c3);
  S.line(`M${cx - r * 0.27} ${bottom}L${cx - r * 0.2} ${cy + r * 1.62}M${cx + r * 0.27} ${bottom}L${cx + r * 0.2} ${cy + r * 1.62}`, { w: 4 });
  const env = `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Q${cx + r * 0.78} ${cy + r * 1.05} ${cx + r * 0.28} ${bottom}L${cx - r * 0.28} ${bottom}Q${cx - r * 0.78} ${cy + r * 1.05} ${cx - r} ${cy}z`;
  S.region(`${key}_envelope`, 'Balloon', env, c1);
  const stripe = `M${cx} ${cy - r}Q${cx + r * 0.82} ${cy} ${cx + r * 0.2} ${bottom}L${cx - r * 0.2} ${bottom}Q${cx - r * 0.82} ${cy} ${cx} ${cy - r}z`;
  S.region(`${key}_stripe`, 'Balloon stripe', stripe, c2);
}

export function balloonSky() {
  const S = new Scene('balloon_sky', 'Balloon Sky');
  SKY(S, C.sky);
  addSun(S, 920, 90, 44, false);
  S.region('cloud_a', 'Cloud', cloud(140, 110, 200, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(470, 100, 160, 1), C.white);
  S.region('cloud_c', 'Cloud', cloud(120, 470, 180, 2), C.white);
  balloon(S, 'balloon_small', 800, 210, 78, C.pink, C.butter, C.wood);
  balloon(S, 'balloon_left', 250, 270, 104, C.lavender, C.mint, C.wood);
  balloon(S, 'balloon_big', 570, 380, 132, C.peach, C.rose, C.wood);
  S.region('hill_far', 'Far hill', ground([[-10, 640], [240, 600], [520, 640], [780, 600], [1010, 640]]), C.leaf);
  S.region('hill_near', 'Near hill', ground([[-10, 700], [300, 668], [620, 705], [1010, 672]]), C.grass);
  S.line(bird(380, 520, 0.9) + bird(440, 545, 0.65), { w: 4 });
  return S;
}

export function rainbowMeadow() {
  const S = new Scene('rainbow_meadow', 'Rainbow Meadow');
  SKY(S, C.skyPale);
  addSun(S, 880, 120, 52);
  S.region('cloud_top_left', 'Cloud', cloud(200, 150, 200, 2), C.white);
  S.region('cloud_top', 'Cloud', cloud(620, 90, 150, 0), C.white);
  const bands = [[420, '#f6b8cf'], [372, C.peach], [324, C.butter], [276, C.mint], [228, C.sky]];
  bands.forEach(([r, col], i) => S.region(`band_${i + 1}`, `Rainbow band ${i + 1}`, circle(500, 580, r), col));
  S.region('inside', 'Sky inside the rainbow', circle(500, 580, 180), C.skyPale);
  S.region('hill_back', 'Back hill', ground([[-10, 610], [220, 566], [480, 604], [760, 562], [1010, 604]]), C.leaf);
  S.region('hill_front', 'Front hill', ground([[-10, 690], [300, 644], [610, 694], [1010, 652]]), C.grass);
  S.region('cloud_left', 'Cloud', cloud(150, 590, 230, 1), C.white);
  S.region('cloud_right', 'Cloud', cloud(860, 590, 230, 0), C.white);
  addFlower(S, 'flower_a', 300, 690, 1, C.pink, 735);
  addFlower(S, 'flower_b', 500, 705, 1.1, C.lavender, 750);
  addFlower(S, 'flower_c', 700, 690, 1, C.peach, 735);
  return S;
}

export function sunsetSea() {
  const S = new Scene('sunset_sea', 'Sunset Sea');
  S.region('sky_top', 'Upper sky', rect(-6, -6, 1012, 540), C.dusk);
  S.region('sky_mid', 'Middle sky', band(220, 540, 16, 4), C.sunset);
  S.region('sky_low', 'Low sky', band(370, 540, 14, 5), C.butter);
  S.region('cloud_a', 'Cloud', cloud(200, 160, 240, 0), C.pink);
  S.region('cloud_b', 'Cloud', cloud(790, 290, 210, 1), C.lilac);
  S.region('cloud_c', 'Cloud', cloud(540, 110, 170, 2), C.pink);
  S.region('sun_glow', 'Sun glow', circle(500, 480, 150), C.sun);
  S.region('sun', 'Sun', circle(500, 480, 105), '#ffe0a0');
  S.region('far_island', 'Far island', 'M-10 484Q110 400 240 484Z', C.nightPale);
  S.region('sea', 'Sea', rect(-6, 480, 1012, 276), C.turq);
  S.region('reflect_a', 'Sun reflection', rect(420, 506, 160, 16, 8), C.butter);
  S.region('reflect_b', 'Sun reflection', rect(390, 552, 220, 16, 8), C.butter);
  S.region('reflect_c', 'Sun reflection', rect(440, 598, 120, 14, 7), C.butter);
  S.region('reflect_d', 'Sun reflection', rect(400, 644, 200, 16, 8), C.butter);
  S.region('sail_big', 'Big sail', rpoly([[782, 484], [782, 604], [880, 604]], 8), C.white);
  S.region('sail_small', 'Small sail', rpoly([[770, 504], [770, 604], [700, 604]], 8), C.peach);
  S.region('hull', 'Boat', rpoly([[688, 606], [892, 606], [858, 664], [724, 664]], 12), C.coral);
  S.line('M776 600V470', { w: 6 });
  S.line(bird(300, 330, 0.9) + bird(360, 300, 0.65) + bird(620, 260, 0.8), { w: 4 });
  S.line('M110 560q40-14 80 0M250 700q40-14 80 0M640 700q40-14 80 0M860 540q40-14 80 0', { w: 3.5 });
  return S;
}

export function sleepyCloud() {
  const S = new Scene('sleepy_cloud', 'Sleepy Cloud');
  SKY(S, C.nightPale, 'Night sky');
  S.region('moon', 'Moon', crescent(190, 170, 84), C.moon);
  addStars(S, [[430, 100, 26], [700, 120, 20], [880, 190, 28], [90, 400, 20], [900, 470, 18], [160, 680, 22], [560, 700, 18]]);
  S.region('cloud_right', 'Small cloud', cloud(830, 270, 160, 0), C.white);
  S.region('cloud_low_left', 'Small cloud', cloud(170, 570, 200, 1), C.white);
  S.region('cloud_low_right', 'Small cloud', cloud(850, 640, 220, 0), C.white);
  S.region('big_cloud', 'Big sleepy cloud', cloud(500, 430, 580, 2), C.white);
  S.face(500, 420, 1.55, { sleepy: true });
  S.line('M690 200h42l-42 42h42M740 150h30l-30 30h30', { w: 5 });
  return S;
}

export const cloudPages = [
  { folder: '01_cloud_castle', scene: cloudCastle, name: 'Cloud Castle', description: 'A little castle resting on a big, happy cloud.' },
  { folder: '02_floating_islands', scene: floatingIslands, name: 'Floating Islands', description: 'Tiny islands drifting through the sky.' },
  { folder: '03_balloon_sky', scene: balloonSky, name: 'Balloon Sky', description: 'Three hot-air balloons on a breezy day.' },
  { folder: '04_rainbow_meadow', scene: rainbowMeadow, name: 'Rainbow Meadow', description: 'A big rainbow over soft green hills.' },
  { folder: '05_sunset_sea', scene: sunsetSea, name: 'Sunset Sea', description: 'A sailboat glides toward the setting sun.' },
  { folder: '06_sleepy_cloud', scene: sleepyCloud, name: 'Sleepy Cloud', description: 'A drowsy cloud under the moon and stars.' }
];
