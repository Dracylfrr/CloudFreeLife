// Eight more pages for the 1.2 update (two each for Forest Friends, Sweet Treats, Ocean Friends, Castle Dreams).
import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, bird, dome, leaf, crown, annulus, rays, addSun, addFlower, addStars } from './dsl.mjs';

const SKY = (S, color = C.skyPale, name = 'Sky') => S.region('sky', name, rect(-6, -6, 1012, 762), color);

export function deerGlade() {
  const S = new Scene('deer_glade', 'Deer in the Glade');
  SKY(S, C.skyPale);
  addSun(S, 860, 110, 46, false);
  S.region('cloud_a', 'Cloud', cloud(190, 110, 190, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 440], [260, 400], [560, 450], [820, 410], [1010, 444]]), C.leaf);
  S.region('tree_trunk', 'Tree trunk', rect(800, 250, 44, 260, 8), C.wood);
  S.region('tree_leaves', 'Tree leaves', crown(822, 220, 120, 5), C.grass);
  S.region('glade', 'Glade', ground([[-10, 540], [300, 520], [700, 548], [1010, 520]]), C.grass);
  // deer
  S.region('deer_leg_back_left', 'Leg', rect(366, 520, 28, 130, 12), C.wood);
  S.region('deer_leg_back_right', 'Leg', rect(420, 530, 28, 124, 12), C.wood);
  S.region('deer_body', 'Body', ellipse(500, 500, 150, 84), C.sand);
  S.region('deer_spots', 'Spots', circle(450, 480, 12) + circle(510, 460, 12) + circle(560, 490, 12) + circle(480, 530, 10) + circle(540, 530, 10), C.cream, { w: 4 });
  S.region('deer_leg_front_left', 'Leg', rect(560, 520, 28, 134, 12), C.wood);
  S.region('deer_leg_front_right', 'Leg', rect(610, 508, 28, 144, 12), C.wood);
  S.region('deer_tail', 'Tail', ellipse(366, 470, 26, 18), C.cream);
  S.region('deer_neck', 'Neck', blob([[590, 470], [610, 380], [660, 330], [700, 350], [680, 440], [650, 500]], 0.6), C.sand);
  S.region('deer_ear_back', 'Ear', leaf(660, 318, 60, 24, -150), C.sand);
  S.region('deer_head', 'Head', ellipse(700, 330, 64, 52), C.sand);
  S.region('deer_snout', 'Snout', ellipse(756, 346, 34, 26), C.cream);
  S.region('deer_ear', 'Ear', leaf(690, 300, 64, 26, -50), C.sand);
  S.region('antler_left', 'Antler', rpoly([[666, 296], [650, 220], [668, 220], [684, 290]], 4) + rpoly([[654, 250], [620, 236], [624, 224], [660, 232]], 3), C.wood, { w: 4 });
  S.region('antler_right', 'Antler', rpoly([[706, 292], [716, 216], [734, 220], [724, 292]], 4) + rpoly([[718, 244], [752, 226], [758, 238], [724, 258]], 3), C.wood, { w: 4 });
  S.dot(722, 322, 6);
  S.dot(780, 344, 5);
  S.line('M742 364q12 8 24 0', { w: 4 });
  S.region('fawn_flower_a', 'Mushroom', dome(180, 590, 40, 32), C.coral);
  S.region('fawn_flower_stem', 'Stem', rect(168, 590, 24, 40, 8), C.cream);
  addFlower(S, 'flower_a', 280, 660, 0.9, C.pink, 720);
  addFlower(S, 'flower_b', 920, 640, 0.9, C.lavender, 700);
  S.line(bird(300, 200, 0.8) + bird(350, 170, 0.6), { w: 4 });
  return S;
}

export function squirrelAcorns() {
  const S = new Scene('squirrel_acorns', 'Squirrel and Acorns');
  SKY(S, C.peach, 'Autumn sky');
  S.region('cloud_a', 'Cloud', cloud(760, 110, 180, 1), C.white);
  S.region('hill', 'Hill', ground([[-10, 500], [260, 470], [560, 510], [820, 480], [1010, 506]]), C.sand);
  S.region('ground', 'Ground', ground([[-10, 620], [300, 600], [700, 626], [1010, 600]]), C.wood);
  S.region('trunk', 'Tree trunk', rect(120, 120, 120, 560, 14), C.wood);
  S.region('branch', 'Branch', rpoly([[220, 380], [900, 340], [900, 400], [220, 440]], 20), C.wood);
  S.region('leaves_top', 'Leaves', crown(180, 130, 150, 3), C.coral);
  S.region('branch_leaf_a', 'Leaf', leaf(700, 350, 90, 30, -60), C.butter);
  S.region('branch_leaf_b', 'Leaf', leaf(820, 345, 90, 30, -120), C.coral);
  // squirrel
  S.region('squirrel_tail', 'Tail', blob([[430, 340], [380, 250], [440, 170], [540, 190], [560, 270], [520, 330]], 0.6), C.coral);
  S.region('squirrel_tail_tip', 'Tail tip', blob([[450, 190], [500, 176], [548, 200], [500, 230]], 0.6), C.cream, { w: 4 });
  S.region('squirrel_body', 'Body', ellipse(520, 340, 78, 70), C.coral);
  S.region('squirrel_belly', 'Belly', ellipse(534, 352, 44, 46), C.cream);
  S.region('squirrel_foot', 'Foot', ellipse(520, 408, 40, 14), C.wood);
  S.region('squirrel_ear_left', 'Ear', rpoly([[580, 250], [572, 196], [610, 236]], 8), C.coral);
  S.region('squirrel_ear_right', 'Ear', rpoly([[632, 246], [650, 194], [668, 244]], 8), C.coral);
  S.region('squirrel_head', 'Head', ellipse(620, 286, 56, 48), C.coral);
  S.region('squirrel_cheek', 'Cheek', ellipse(646, 306, 30, 22), C.cream);
  S.dot(608, 278, 6.5);
  S.dot(662, 288, 4.5);
  S.line('M628 312q10 8 22 0', { w: 4 });
  S.region('acorn_held_nut', 'Acorn', ellipse(590, 352, 22, 28), C.wood);
  S.region('acorn_held_cap', 'Acorn cap', dome(590, 340, 26, 16), C.sand, { w: 4 });
  [[330, 610], [450, 640], [610, 620]].forEach(([x, y], i) => {
    S.region(`acorn_${i + 1}_nut`, 'Acorn', ellipse(x, y + 16, 28, 34), C.wood);
    S.region(`acorn_${i + 1}_cap`, 'Acorn cap', dome(x, y, 34, 22), C.sand, { w: 4 });
  });
  S.region('leaf_g1', 'Fallen leaf', leaf(760, 640, 70, 26, -20), C.coral, { w: 4 });
  S.region('leaf_g2', 'Fallen leaf', leaf(860, 600, 70, 26, 40), C.butter, { w: 4 });
  S.region('mush', 'Mushroom cap', dome(180, 640, 44, 32), C.rose);
  S.region('mush_stem', 'Mushroom stem', rect(168, 640, 24, 40, 8), C.cream);
  return S;
}

export function donutShop() {
  const S = new Scene('donut_shop', 'Donut Shop');
  S.region('wall', 'Wall', rect(-6, -6, 1012, 600), C.peach);
  S.line('M0 110H1000', { w: 2.5 });
  S.region('banner', 'Shop sign', rect(260, 30, 480, 90, 24), C.butter);
  S.line('M300 80h400', { w: 3.5, dash: '2 10' });
  S.region('counter', 'Counter', rect(-6, 560, 1012, 200), C.wood);
  S.line('M0 620H1000M0 690H1000', { w: 3 });
  S.region('plate', 'Plate', ellipse(500, 560, 300, 56), C.white);
  // big donut
  S.region('donut_dough', 'Donut', annulus(500, 380, 180, 150, 62, 50), C.sand);
  S.region('donut_frosting', 'Frosting', annulus(500, 380, 168, 132, 74, 60), C.pink);
  S.region('sprinkle_a', 'Sprinkle', rect(390, 330, 40, 12, 6), C.butter, { transform: 'rotate(-30 410 336)', w: 3.5 });
  S.region('sprinkle_b', 'Sprinkle', rect(560, 300, 40, 12, 6), C.mint, { transform: 'rotate(20 580 306)', w: 3.5 });
  S.region('sprinkle_c', 'Sprinkle', rect(620, 400, 40, 12, 6), C.sky, { transform: 'rotate(-60 640 406)', w: 3.5 });
  S.region('sprinkle_d', 'Sprinkle', rect(360, 420, 40, 12, 6), C.lavender, { transform: 'rotate(50 380 426)', w: 3.5 });
  S.region('sprinkle_e', 'Sprinkle', rect(470, 480, 40, 12, 6), C.butter, { transform: 'rotate(10 490 486)', w: 3.5 });
  S.region('sprinkle_f', 'Sprinkle', rect(470, 250, 40, 12, 6), C.coral, { transform: 'rotate(-10 490 256)', w: 3.5 });
  // small donuts
  S.region('mini_left_dough', 'Mini donut', annulus(160, 520, 80, 58, 26, 20), C.sand);
  S.region('mini_left_frosting', 'Mini frosting', annulus(160, 520, 72, 54, 34, 26), C.lavender);
  S.region('mini_right_dough', 'Mini donut', annulus(840, 520, 80, 58, 26, 20), C.sand);
  S.region('mini_right_frosting', 'Mini frosting', annulus(840, 520, 72, 54, 34, 26), C.mint);
  S.region('shelf', 'Shelf', rect(650, 240, 230, 18, 8), C.wood);
  S.region('cup', 'Milk', 'M690 160h110q0 80-55 80t-55-80z', C.white);
  S.region('cup_milk', 'Milk top', rect(690, 160, 110, 24, 8), C.cream, { w: 4 });
  S.line('M800 176q40 0 36 30q-4 24-36 24', { w: 5 });
  return S;
}

export function birthdayCake() {
  const S = new Scene('birthday_cake', 'Birthday Cake');
  S.region('wall', 'Wall', rect(-6, -6, 1012, 640), C.lilac);
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => S.region(`bunting_${i + 1}`, 'Flag', rpoly([[70 + i * 120 - 34, 40 + 24 * Math.sin((i / 7) * Math.PI)], [70 + i * 120 + 34, 40 + 24 * Math.sin((i / 7) * Math.PI)], [70 + i * 120, 104 + 24 * Math.sin((i / 7) * Math.PI)]], 6), [C.butter, C.mint, C.pink, C.sky][i % 4], { w: 4 }));
  S.line('M0 40Q500 70 1000 40', { w: 4 });
  S.region('table', 'Table', rect(-6, 600, 1012, 160), C.wood);
  S.line('M0 660H1000M0 720H1000', { w: 3 });
  S.region('plate', 'Plate', ellipse(500, 604, 330, 40), C.white);
  S.region('tier_bottom', 'Bottom tier', rect(230, 460, 540, 150, 18), C.pink);
  S.region('tier_middle', 'Middle tier', rect(300, 340, 400, 130, 18), C.butter);
  S.region('tier_top', 'Top tier', rect(370, 230, 260, 120, 18), C.mint);
  S.region('icing_bottom', 'Icing', 'M230 478q20 28 45 0q22 36 50 0q22 30 48 0q24 40 52 0q22 30 46 0q22 36 50 0q24 30 46 0q22 36 50 0v-26a18 18 0 0 0-18-18H248a18 18 0 0 0-18 18z', C.white, { w: 4 });
  S.region('icing_top', 'Icing', 'M370 248q16 24 36 0q20 30 42 0q18 28 38 0q20 30 40 0q18 26 36 0v-6a18 18 0 0 0-18-18H388a18 18 0 0 0-18 18z', C.white, { w: 4 });
  S.region('candle_a', 'Candle', rect(420, 160, 22, 64, 6), C.sky);
  S.region('candle_b', 'Candle', rect(489, 150, 22, 74, 6), C.coral);
  S.region('candle_c', 'Candle', rect(558, 160, 22, 64, 6), C.sky);
  [431, 500, 569].forEach((x, i) => S.region(`flame_${i + 1}`, 'Flame', `M${x} ${108 + (i === 1 ? -10 : 0)}Q${x + 20} ${140 + (i === 1 ? -10 : 0)} ${x} ${156 + (i === 1 ? -10 : 0)}Q${x - 20} ${140 + (i === 1 ? -10 : 0)} ${x} ${108 + (i === 1 ? -10 : 0)}z`, C.sun, { w: 4 }));
  S.region('cherry_a', 'Cherry', circle(330, 440, 16), C.rose, { w: 4 });
  S.region('cherry_b', 'Cherry', circle(500, 330, 16), C.rose, { w: 4 });
  S.region('cherry_c', 'Cherry', circle(670, 440, 16), C.rose, { w: 4 });
  S.region('balloon_left', 'Balloon', ellipse(120, 330, 54, 68), C.pink);
  S.line('M120 398q10 40-6 80', { w: 3.5 });
  S.region('balloon_right', 'Balloon', ellipse(880, 320, 54, 68), C.sky);
  S.line('M880 388q-10 40 6 80', { w: 3.5 });
  S.region('balloon_far', 'Balloon', ellipse(960, 480, 40, 52), C.butter);
  S.line('M960 532q-8 30 4 60', { w: 3.5 });
  return S;
}

export function dolphinJump() {
  const S = new Scene('dolphin_jump', 'Dolphin Jump');
  S.region('sky', 'Sky', rect(-6, -6, 1012, 480), C.skyPale);
  addSun(S, 150, 120, 52);
  S.region('cloud_a', 'Cloud', cloud(560, 110, 190, 2), C.white);
  S.region('cloud_b', 'Cloud', cloud(860, 220, 150, 0), C.white);
  S.region('sea_far', 'Far sea', band(400, 770, 7, 6), C.sky);
  S.region('dolphin_tail', 'Tail', blob([[300, 520], [230, 470], [200, 400], [270, 420], [300, 470], [330, 420], [400, 410], [370, 480], [350, 530]]), C.skyDeep);
  S.region('dolphin_body', 'Dolphin', blob([[330, 500], [350, 380], [460, 280], [600, 250], [700, 300], [690, 380], [600, 440], [470, 520]], 0.6), C.skyDeep);
  S.region('dolphin_belly', 'Belly', blob([[470, 470], [550, 400], [640, 380], [680, 350], [670, 400], [590, 450], [500, 505]], 0.6), C.cream);
  S.region('dolphin_snout', 'Snout', rpoly([[690, 290], [770, 330], [760, 350], [684, 350]], 14), C.skyDeep);
  S.region('dolphin_fin_top', 'Fin', rpoly([[520, 280], [540, 200], [590, 262]], 10), C.skyDeep);
  S.region('dolphin_fin_side', 'Fin', leaf(540, 410, 100, 30, 60), C.sky);
  S.dot(668, 322, 7);
  S.line('M700 342q26 10 50 0', { w: 4.5 });
  S.region('wave_front', 'Front wave', band(560, 770, 14, 5), C.turq);
  [[230, 560, 18], [400, 540, 14], [760, 510, 16], [860, 560, 12]].forEach(([x, y, r], i) => S.region(`splash_${i + 1}`, 'Splash', circle(x, y, r), C.white, { w: 4 }));
  S.line('M60 650q40-14 80 0M300 700q40-14 80 0M640 660q40-14 80 0M860 710q40-14 80 0', { w: 3.5 });
  S.line(bird(380, 170, 0.8) + bird(430, 140, 0.6), { w: 4 });
  return S;
}

export function jellyfishGlow() {
  const S = new Scene('jellyfish_glow', 'Glowing Jellyfish');
  S.region('water', 'Water', rect(-6, -6, 1012, 762), C.skyDeep);
  S.region('glow', 'Deep glow', ellipse(500, 380, 420, 330), C.sky);
  S.region('sand', 'Sand', ground([[-10, 670], [300, 650], [700, 680], [1010, 650]]), C.sand);
  const jelly = (key, cx, cy, s, bell, rim) => {
    [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => S.region(`${key}_tentacle_${i + 1}`, 'Tentacle', blob([[cx + k * 28 * s, cy + 10 * s], [cx + k * 28 * s - 14 * s, cy + 90 * s], [cx + k * 28 * s + 16 * s, cy + 160 * s], [cx + k * 28 * s + 2 * s, cy + 230 * s], [cx + k * 28 * s + 20 * s, cy + 160 * s], [cx + k * 28 * s + 10 * s, cy + 80 * s]], 0.6), rim, { w: 4 }));
    S.region(`${key}_bell`, 'Jellyfish bell', dome(cx, cy + 10 * s, 110 * s, 100 * s), bell);
    S.region(`${key}_frill`, 'Frill', rect(cx - 112 * s, cy + 2 * s, 224 * s, 22 * s, 11 * s), rim);
    S.region(`${key}_spots`, 'Spots', circle(cx - 40 * s, cy - 44 * s, 12 * s) + circle(cx + 30 * s, cy - 60 * s, 16 * s) + circle(cx + 56 * s, cy - 20 * s, 10 * s), C.white, { w: 4 });
    S.dot(cx - 26 * s, cy - 8 * s, 6 * s);
    S.dot(cx + 26 * s, cy - 8 * s, 6 * s);
    S.line(`M${cx - 12 * s} ${cy + 0} q${12 * s} ${10 * s} ${24 * s} 0`, { w: 4 });
  };
  jelly('big', 420, 230, 1.15, C.pink, C.lilac);
  jelly('small', 780, 360, 0.62, C.lavender, C.pink);
  [[150, 220, 26], [260, 120, 16], [620, 140, 22], [940, 200, 14], [880, 560, 20], [140, 520, 18]].forEach(([x, y, r], i) => S.region(`bubble_${i + 1}`, 'Bubble', circle(x, y, r), C.white, { w: 4 }));
  S.region('seaweed_a', 'Seaweed', blob([[120, 680], [90, 580], [150, 500], [120, 410], [180, 470], [150, 560], [170, 680]], 0.55), C.leaf, { w: 4.5 });
  S.region('seaweed_b', 'Seaweed', blob([[900, 680], [870, 600], [930, 520], [910, 450], [960, 520], [930, 610], [950, 680]], 0.55), C.grass, { w: 4.5 });
  S.region('shell', 'Shell', dome(560, 690, 50, 42), C.peach);
  S.line('M560 648v42M536 658l8 32M584 658l-8 32', { w: 3.5 });
  return S;
}

export function unicornMeadow() {
  const S = new Scene('unicorn_meadow', 'Unicorn Meadow');
  SKY(S, C.skyPale);
  S.region('rainbow_outer', 'Rainbow band', circle(180, 480, 300), '#f6b8cf');
  S.region('rainbow_mid', 'Rainbow band', circle(180, 480, 250), C.butter);
  S.region('rainbow_inner', 'Rainbow band', circle(180, 480, 200), C.mint);
  S.region('rainbow_sky', 'Sky inside', circle(180, 480, 150), C.skyPale);
  addSun(S, 880, 110, 46, false);
  S.region('cloud_a', 'Cloud', cloud(620, 110, 190, 1), C.white);
  S.region('far_wall', 'Castle wall', rect(740, 330, 200, 120, 4), C.stone);
  S.region('far_tower', 'Castle tower', rect(700, 270, 70, 180, 4), C.lavender);
  S.region('far_roof', 'Castle roof', rpoly([[690, 282], [735, 206], [780, 282]], 8), C.pink);
  S.region('hill', 'Hill', ground([[-10, 450], [260, 420], [560, 460], [820, 430], [1010, 456]]), C.leaf);
  S.region('meadow', 'Meadow', ground([[-10, 540], [300, 520], [700, 548], [1010, 520]]), C.grass);
  // unicorn
  S.region('uni_leg_a', 'Leg', rect(340, 540, 28, 130, 12), C.white);
  S.region('uni_leg_b', 'Leg', rect(392, 550, 28, 124, 12), C.white);
  S.region('uni_tail', 'Tail', blob([[300, 500], [220, 520], [180, 600], [230, 640], [290, 580], [330, 560]], 0.6), C.lavender);
  S.region('uni_body', 'Body', ellipse(470, 510, 150, 84), C.white);
  S.region('uni_leg_c', 'Leg', rect(530, 540, 28, 134, 12), C.white);
  S.region('uni_leg_d', 'Leg', rect(580, 530, 28, 144, 12), C.white);
  S.region('uni_neck', 'Neck', blob([[570, 480], [590, 390], [640, 340], [690, 360], [670, 450], [640, 500]], 0.6), C.white);
  S.region('uni_mane', 'Mane', blob([[580, 440], [560, 360], [600, 300], [650, 310], [620, 360], [630, 430]], 0.6), C.pink);
  S.region('uni_head', 'Head', ellipse(680, 340, 62, 50), C.white);
  S.region('uni_snout', 'Snout', ellipse(736, 356, 30, 24), C.cream);
  S.region('uni_ear', 'Ear', rpoly([[656, 306], [652, 262], [684, 296]], 6), C.white);
  S.region('uni_horn', 'Horn', rpoly([[690, 302], [722, 210], [716, 306]], 4), C.butter);
  S.dot(704, 332, 6);
  S.line('M722 374q12 8 24 0', { w: 4 });
  S.region('uni_forelock', 'Forelock', blob([[646, 310], [672, 296], [690, 316], [664, 334]], 0.6), C.pink, { w: 4 });
  addFlower(S, 'flower_a', 150, 670, 1, C.pink, 730);
  addFlower(S, 'flower_b', 880, 650, 0.9, C.lavender, 710);
  addStars(S, [[560, 70, 18], [420, 150, 14]], 'sparkle', C.butter);
  return S;
}

export function moatSwans() {
  const S = new Scene('moat_swans', 'Swans on the Moat');
  SKY(S, C.skyPale);
  addSun(S, 860, 110, 46);
  S.region('cloud_a', 'Cloud', cloud(200, 110, 190, 2), C.white);
  S.region('castle_wall', 'Castle wall', rect(120, 250, 760, 200, 6), C.stone);
  S.region('merlons', 'Battlements', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(130 + i * 74, 218, 42, 36, 4)).join(''), C.stone, { w: 4 });
  S.region('tower_left', 'Tower', rect(70, 200, 110, 260, 8), C.lavender);
  S.region('tower_right', 'Tower', rect(820, 200, 110, 260, 8), C.lavender);
  S.region('roof_left', 'Roof', rpoly([[58, 212], [125, 90], [192, 212]], 12), C.pink);
  S.region('roof_right', 'Roof', rpoly([[808, 212], [875, 90], [942, 212]], 12), C.pink);
  S.region('gate', 'Gate', arch(440, 310, 120, 140), C.wood);
  S.line('M470 330v120M500 322v128M530 330v120M446 380h108', { w: 3.5 });
  S.region('bank', 'Bank', ground([[-10, 460], [300, 450], [700, 464], [1010, 450]]), C.grass);
  S.region('moat', 'Moat', band(520, 770, 9, 5), C.sky);
  S.region('pad_a', 'Lily pad', ellipse(150, 640, 70, 24), C.leaf);
  S.region('pad_b', 'Lily pad', ellipse(880, 690, 62, 22), C.leaf);
  S.region('lily', 'Lily', circle(150, 620, 14), C.pink, { w: 4 });
  // swan left
  S.region('swan_a_body', 'Swan', blob([[260, 640], [310, 590], [400, 590], [470, 620], [430, 670], [320, 680]], 0.6), C.white);
  S.region('swan_a_wing', 'Wing', leaf(340, 628, 90, 30, 10), C.cream, { w: 4 });
  S.region('swan_a_neck', 'Neck', blob([[390, 600], [380, 520], [420, 470], [470, 480], [450, 520], [430, 600]], 0.6), C.white);
  S.region('swan_a_head', 'Head', circle(456, 486, 30), C.white);
  S.region('swan_a_beak', 'Beak', rpoly([[480, 484], [530, 494], [482, 504]], 5), C.coral, { w: 4 });
  S.dot(452, 480, 4.5);
  // swan right
  S.region('swan_b_body', 'Swan', blob([[640, 690], [690, 640], [780, 640], [850, 670], [810, 720], [700, 730]], 0.6), C.white);
  S.region('swan_b_wing', 'Wing', leaf(720, 678, 90, 30, 10), C.cream, { w: 4 });
  S.region('swan_b_neck', 'Neck', blob([[770, 650], [760, 580], [800, 530], [850, 540], [830, 580], [810, 650]], 0.6), C.white);
  S.region('swan_b_head', 'Head', circle(836, 546, 30), C.white);
  S.region('swan_b_beak', 'Beak', rpoly([[860, 544], [910, 554], [862, 564]], 5), C.coral, { w: 4 });
  S.dot(832, 540, 4.5);
  S.line(bird(300, 180, 0.8) + bird(350, 150, 0.6), { w: 4 });
  return S;
}

export const extraPages = {
  forest_friends: [
    { folder: '06_deer_glade', scene: deerGlade, name: 'Deer in the Glade', description: 'A gentle deer resting in a sunny glade.' },
    { folder: '07_squirrel_acorns', scene: squirrelAcorns, name: 'Squirrel and Acorns', description: 'A busy squirrel collecting autumn acorns.' }
  ],
  sweet_treats: [
    { folder: '06_donut_shop', scene: donutShop, name: 'Donut Shop', description: 'A giant frosted donut with a sprinkle on every wish.' },
    { folder: '07_birthday_cake', scene: birthdayCake, name: 'Birthday Cake', description: 'A three-tier cake with candles, cherries and balloons.' }
  ],
  ocean_friends: [
    { folder: '06_dolphin_jump', scene: dolphinJump, name: 'Dolphin Jump', description: 'A happy dolphin leaping over the waves.' },
    { folder: '07_jellyfish_glow', scene: jellyfishGlow, name: 'Glowing Jellyfish', description: 'Two soft jellyfish drifting through the deep blue.' }
  ],
  castle_dreams: [
    { folder: '06_unicorn_meadow', scene: unicornMeadow, name: 'Unicorn Meadow', description: 'A unicorn trotting beneath a pastel rainbow.' },
    { folder: '07_moat_swans', scene: moatSwans, name: 'Swans on the Moat', description: 'Two graceful swans gliding past the castle gate.' }
  ]
};
