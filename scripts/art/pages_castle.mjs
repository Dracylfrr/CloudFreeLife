import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, rays, petals, bird, crown, dome, leaf, addSun, addFlower, addStars } from './dsl.mjs';

const SKY = (S, color = C.skyPale) => S.region('sky', 'Sky', rect(-6, -6, 1012, 762), color);

function flag(S, key, x, y, color = C.pink) {
  S.line(`M${x} ${y}V${y - 56}`, { w: 5 });
  S.region(key, 'Flag', rpoly([[x, y - 56], [x + 52, y - 40], [x, y - 24]], 6), color);
}

export function gateHouse() {
  const S = new Scene('gate_house', 'Gate House');
  SKY(S);
  addSun(S, 150, 130, 50);
  S.region('cloud_a', 'Cloud', cloud(620, 110, 190, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(880, 230, 150, 1), C.white);
  S.region('hill_far', 'Far hill', ground([[-10, 440], [250, 400], [560, 440], [820, 396], [1010, 436]]), C.leaf);
  S.region('grass', 'Grass', ground([[-10, 540], [300, 520], [700, 546], [1010, 520]]), C.grass);
  S.region('moat', 'Moat', band(606, 770, 9, 5), C.sky);
  S.line('M60 660h80M220 700h110M720 650h100M860 700h90', { w: 4 });
  S.region('tower_left', 'Left tower', rect(218, 250, 112, 372, 8), C.lavender);
  S.region('tower_right', 'Right tower', rect(670, 250, 112, 372, 8), C.lavender);
  S.region('gate_wall', 'Gate wall', rect(318, 340, 364, 282, 6), C.stone);
  S.region('merlons', 'Battlements', [0, 1, 2, 3, 4].map((i) => rect(332 + i * 70, 306, 42, 36, 4)).join(''), C.stone, { w: 4 });
  S.region('roof_left', 'Left roof', rpoly([[206, 262], [274, 128], [342, 262]], 12), C.pink);
  S.region('roof_right', 'Right roof', rpoly([[658, 262], [726, 128], [794, 262]], 12), C.pink);
  flag(S, 'flag_left', 274, 128, C.butter);
  flag(S, 'flag_right', 726, 128, C.butter);
  S.region('window_left', 'Window', arch(252, 330, 44, 70), C.skyDeep);
  S.region('window_right', 'Window', arch(704, 330, 44, 70), C.skyDeep);
  S.region('gate_door', 'Gate door', arch(430, 420, 140, 202), C.wood);
  S.line('M470 450V622M500 440V622M530 450V622M436 500h128M436 560h128', { w: 3.5 });
  S.region('drawbridge', 'Drawbridge', rpoly([[440, 622], [560, 622], [590, 760], [410, 760]], 6), C.wood);
  S.line('M472 622l-14 138M500 622v138M528 622l14 138', { w: 3.5 });
  S.line('M436 430Q410 520 420 610M564 430Q590 520 580 610', { w: 4, dash: '2 9' });
  S.line(bird(430, 220, 0.8) + bird(480, 190, 0.6), { w: 4 });
  return S;
}

export function dragonTower() {
  const S = new Scene('dragon_tower', 'Dragon Tower');
  SKY(S);
  addSun(S, 870, 120, 52);
  S.region('cloud_a', 'Cloud', cloud(180, 130, 200, 2), C.white);
  S.region('cloud_b', 'Cloud', cloud(560, 80, 140, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 560], [260, 520], [560, 570], [820, 530], [1010, 570]]), C.leaf);
  S.region('tower', 'Tower', rect(150, 230, 170, 400, 8), C.stone);
  S.region('tower_roof', 'Tower roof', rpoly([[128, 246], [235, 70], [342, 246]], 14), C.coral);
  flag(S, 'tower_flag', 235, 70, C.pink);
  S.region('tower_window_top', 'Window', arch(212, 290, 46, 74), C.skyDeep);
  S.region('tower_window_mid', 'Window', arch(212, 410, 46, 74), C.skyDeep);
  S.region('tower_door', 'Door', arch(200, 540, 70, 90), C.wood);
  S.line('M150 380h170M150 500h170', { w: 3.5 });
  S.region('grass', 'Grass', ground([[-10, 660], [300, 640], [700, 668], [1010, 640]]), C.grass);
  // the friendly dragon
  S.region('dragon_tail', 'Tail', blob([[700, 560], [800, 600], [900, 650], [960, 620], [930, 570], [860, 590], [780, 540]]), C.mint);
  S.region('dragon_wing', 'Wing', leaf(560, 400, 190, 80, -48), C.lilac);
  S.region('dragon_body', 'Body', ellipse(600, 530, 150, 105), C.mint);
  S.region('dragon_belly', 'Belly', ellipse(612, 566, 100, 60), C.butter);
  S.region('dragon_neck', 'Neck', blob([[520, 470], [540, 360], [590, 300], [660, 320], [640, 400], [650, 470]]), C.mint);
  S.region('dragon_head', 'Head', ellipse(630, 285, 78, 62), C.mint);
  S.region('dragon_snout', 'Snout', ellipse(700, 305, 40, 30), C.leaf);
  S.region('dragon_spikes', 'Back spikes', [0, 1, 2, 3].map((i) => rpoly([[510 + i * 18, 430 - i * 28], [530 + i * 18, 394 - i * 28], [546 + i * 18, 430 - i * 28]], 4)).join(''), C.pink, { w: 4 });
  S.dot(640, 270, 7);
  S.dot(722, 296, 4);
  S.line('M690 322q16 12 34 0', { w: 4.5 });
  S.region('dragon_foot_a', 'Foot', ellipse(540, 630, 44, 24), C.leaf);
  S.region('dragon_foot_b', 'Foot', ellipse(670, 632, 44, 24), C.leaf);
  addFlower(S, 'flower_a', 420, 700, 0.85, C.pink, 746);
  addFlower(S, 'flower_b', 860, 704, 0.9, C.lavender, 748);
  return S;
}

export function knightFriend() {
  const S = new Scene('knight_friend', 'Knight Friend');
  SKY(S, C.skyPale);
  addSun(S, 860, 120, 48, false);
  S.region('cloud_a', 'Cloud', cloud(170, 120, 190, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 470], [260, 430], [560, 470], [820, 436], [1010, 466]]), C.leaf);
  S.region('far_wall', 'Far castle wall', rect(70, 330, 220, 150, 4), C.stone);
  S.region('far_tower', 'Far tower', rect(230, 270, 70, 210, 4), C.lavender);
  S.region('far_roof', 'Far roof', rpoly([[220, 282], [265, 200], [310, 282]], 8), C.pink);
  S.region('grass', 'Grass', ground([[-10, 590], [300, 570], [700, 596], [1010, 570]]), C.grass);
  // knight
  S.region('leg_left', 'Leg', rect(438, 560, 50, 110, 20), C.stone);
  S.region('leg_right', 'Leg', rect(512, 560, 50, 110, 20), C.stone);
  S.region('boot_left', 'Boot', rect(424, 646, 74, 40, 18), C.wood);
  S.region('boot_right', 'Boot', rect(504, 646, 74, 40, 18), C.wood);
  S.region('armor', 'Armor', rect(412, 380, 176, 200, 44), C.skyPale);
  S.region('armor_belt', 'Belt', rect(412, 500, 176, 28), C.wood);
  S.region('arm_right', 'Arm', rect(582, 400, 110, 50, 25), C.skyPale, { transform: 'rotate(-48 600 425)' });
  S.region('sword_blade', 'Sword blade', rpoly([[700, 130], [722, 330], [690, 330]], 6), C.stone);
  S.region('sword_hilt', 'Sword hilt', rect(664, 322, 82, 20, 8), C.butter);
  S.region('arm_left', 'Arm', rect(318, 420, 110, 50, 25), C.skyPale, { transform: 'rotate(18 420 445)' });
  S.region('shield', 'Shield', 'M262 400h126v96q0 70-63 96q-63-26-63-96z', C.lavender);
  S.region('shield_star', 'Shield star', star(325, 480, 38, 17, 5), C.butter);
  S.region('plume', 'Plume', blob([[500, 196], [470, 150], [520, 120], [570, 150], [545, 200]]), C.pink);
  S.region('helmet', 'Helmet', circle(500, 290, 98), C.stone);
  S.region('face_opening', 'Face', rect(430, 262, 140, 66, 28), C.peach);
  S.dot(470, 292, 7);
  S.dot(530, 292, 7);
  S.line('M486 312q14 12 28 0', { w: 4.5 });
  S.line('M500 190v28', { w: 4 });
  addFlower(S, 'flower_a', 170, 650, 0.9, C.pink, 710);
  addFlower(S, 'flower_b', 840, 640, 1, C.butter, 706);
  return S;
}

export function throneRoom() {
  const S = new Scene('throne_room', 'Throne Room');
  S.region('back_wall', 'Wall', rect(-6, -6, 1012, 600), C.lilac);
  S.line('M0 120H1000M0 240H1000M0 360H1000M0 480H1000', { w: 2.5 });
  S.region('floor', 'Floor', rect(-6, 560, 1012, 200), C.sand);
  S.line('M0 640H1000M0 700H1000M200 560l-60 190M400 560l-30 190M600 560l30 190M800 560l60 190', { w: 3 });
  S.region('window_left', 'Window glass', arch(90, 150, 120, 250), C.sky);
  S.region('window_right', 'Window glass', arch(790, 150, 120, 250), C.sky);
  S.line('M150 150v250M90 270h120M850 150v250M790 270h120', { w: 4 });
  S.region('banner_left', 'Banner', rpoly([[260, 90], [340, 90], [340, 330], [300, 290], [260, 330]], 6), C.pink);
  S.region('banner_right', 'Banner', rpoly([[660, 90], [740, 90], [740, 330], [700, 290], [660, 330]], 6), C.pink);
  S.region('banner_star_left', 'Banner star', star(300, 170, 28, 13, 5), C.butter);
  S.region('banner_star_right', 'Banner star', star(700, 170, 28, 13, 5), C.butter);
  S.region('carpet', 'Carpet', rpoly([[420, 560], [580, 560], [700, 760], [300, 760]], 8), C.rose);
  S.line('M440 600l-70 160M560 600l70 160', { w: 3.5, dash: '2 9' });
  S.region('throne_back', 'Throne back', 'M392 480V250q0-92 108-92t108 92v230z', C.butter);
  S.region('throne_arm_left', 'Throne arm', rect(372, 400, 50, 120, 20), C.wood);
  S.region('throne_arm_right', 'Throne arm', rect(578, 400, 50, 120, 20), C.wood);
  S.region('throne_seat', 'Seat', rect(392, 440, 216, 100, 16), C.coral);
  S.region('throne_cushion', 'Cushion', rect(420, 424, 160, 40, 18), C.pink);
  S.region('throne_crown', 'Crown', rpoly([[440, 250], [450, 196], [475, 226], [500, 186], [525, 226], [550, 196], [560, 250]], 6), C.sun);
  S.dot(500, 214, 6);
  S.region('torch_left', 'Torch', rect(48, 420, 20, 90, 8), C.wood);
  S.region('flame_left', 'Flame', 'M58 340Q94 390 58 420Q22 390 58 340Z', C.coral);
  S.region('torch_right', 'Torch', rect(932, 420, 20, 90, 8), C.wood);
  S.region('flame_right', 'Flame', 'M942 340Q978 390 942 420Q906 390 942 340Z', C.coral);
  S.line('M500 0V70', { w: 4 });
  S.region('lantern', 'Lantern', rect(470, 70, 60, 64, 14), C.butter);
  return S;
}

export function castleGarden() {
  const S = new Scene('castle_garden', 'Castle Garden');
  SKY(S, C.skyPale);
  addSun(S, 860, 120, 48);
  S.region('cloud_a', 'Cloud', cloud(200, 120, 190, 1), C.white);
  S.region('hill', 'Hill', ground([[-10, 420], [260, 380], [560, 424], [820, 388], [1010, 420]]), C.leaf);
  S.region('far_wall', 'Castle wall', rect(380, 290, 240, 140, 4), C.stone);
  S.region('far_tower_left', 'Tower', rect(330, 240, 70, 190, 4), C.lavender);
  S.region('far_tower_right', 'Tower', rect(600, 240, 70, 190, 4), C.lavender);
  S.region('far_roof_left', 'Roof', rpoly([[320, 252], [365, 174], [410, 252]], 8), C.pink);
  S.region('far_roof_right', 'Roof', rpoly([[590, 252], [635, 174], [680, 252]], 8), C.pink);
  S.region('far_door', 'Door', arch(472, 350, 56, 80), C.wood);
  S.region('lawn', 'Lawn', ground([[-10, 480], [300, 460], [700, 486], [1010, 460]]), C.grass);
  S.region('garden_path', 'Path', rpoly([[470, 470], [530, 470], [640, 760], [360, 760]], 14), C.sand);
  S.region('hedge_left', 'Hedge', rect(40, 440, 230, 120, 50), C.leaf);
  S.region('hedge_right', 'Hedge', rect(730, 440, 230, 120, 50), C.leaf);
  S.line('M90 470q10-14 20 0M150 480q10-14 20 0M210 470q10-14 20 0M780 470q10-14 20 0M840 480q10-14 20 0M900 470q10-14 20 0', { w: 3.5 });
  S.region('fountain_water', 'Fountain water', 'M500 440Q548 500 500 536Q452 500 500 440Z', C.sky, { w: 4 });
  S.region('fountain_pillar', 'Fountain pillar', rect(484, 530, 32, 70, 8), C.stone);
  S.region('fountain_bowl', 'Fountain bowl', 'M410 540q90 50 180 0l-20 50h-140z', C.lavender);
  S.region('fountain_basin', 'Fountain basin', ellipse(500, 640, 170, 52), C.skyDeep);
  addFlower(S, 'flower_a', 120, 650, 1, C.pink, 720);
  addFlower(S, 'flower_b', 260, 690, 0.85, C.butter, 744);
  addFlower(S, 'flower_c', 880, 650, 1, C.lavender, 720);
  addFlower(S, 'flower_d', 750, 700, 0.85, C.peach, 746);
  S.line(bird(560, 150, 0.8) + bird(610, 124, 0.6), { w: 4 });
  return S;
}

export const castlePages = [
  { folder: '01_gate_house', scene: gateHouse, name: 'Gate House', description: 'A friendly gate house with a drawbridge over the moat.' },
  { folder: '02_dragon_tower', scene: dragonTower, name: 'Dragon Tower', description: 'A gentle green dragon who only wants to say hello.' },
  { folder: '03_knight_friend', scene: knightFriend, name: 'Knight Friend', description: 'A cheerful knight with a star-shaped shield.' },
  { folder: '04_throne_room', scene: throneRoom, name: 'Throne Room', description: 'A cozy throne room with banners and soft candlelight.' },
  { folder: '05_castle_garden', scene: castleGarden, name: 'Castle Garden', description: 'Hedges, flowers and a fountain beside the castle.' }
];
