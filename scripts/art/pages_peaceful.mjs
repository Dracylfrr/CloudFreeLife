import { Scene, C, rect, circle, ellipse, rpoly, cloud, ground, band, curve, blob, arch, rays, petals, bird, crown, dome, leaf, addSun, addFlower, star } from './dsl.mjs';

const SKY = (S, color = C.skyPale) => S.region('sky', 'Sky', rect(-6, -6, 1012, 762), color);

function pine(S, key, x, y, s = 1) {
  S.region(`${key}_trunk`, 'Tree trunk', rect(x - 14 * s, y - 60 * s, 28 * s, 64 * s, 6), C.wood);
  S.region(`${key}_low`, 'Pine branches', rpoly([[x - 90 * s, y - 52 * s], [x, y - 190 * s], [x + 90 * s, y - 52 * s]], 12), C.leaf);
  S.region(`${key}_mid`, 'Pine branches', rpoly([[x - 70 * s, y - 130 * s], [x, y - 250 * s], [x + 70 * s, y - 130 * s]], 12), C.grass);
  S.region(`${key}_top`, 'Pine top', rpoly([[x - 48 * s, y - 210 * s], [x, y - 300 * s], [x + 48 * s, y - 210 * s]], 10), C.mint);
}

function roundTree(S, key, x, y, s = 1, seed = 1, crownColor = C.grass) {
  S.region(`${key}_trunk`, 'Tree trunk', rect(x - 15 * s, y - 120 * s, 30 * s, 124 * s, 8), C.wood);
  S.region(`${key}_crown`, 'Tree leaves', crown(x, y - 160 * s, 88 * s, seed), crownColor);
}

export function sunnyBeach() {
  const S = new Scene('sunny_beach', 'Sunny Beach');
  SKY(S, C.skyPale);
  addSun(S, 850, 110, 56);
  S.region('cloud_a', 'Cloud', cloud(230, 120, 200, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(560, 190, 150, 1), C.white);
  S.region('sea_far', 'Far sea', band(320, 540, 6, 5), C.turq);
  S.region('sea_near', 'Near sea', band(410, 560, 12, 4), '#a9dcf0');
  S.region('sand', 'Sand', ground([[-10, 548], [300, 524], [650, 552], [1010, 520]]), C.sand);
  S.line('M60 520q40-14 80 0t80 0M520 540q40-14 80 0t80 0', { w: 3.5 });
  // palm
  S.region('palm_trunk', 'Palm trunk', 'M196 600Q238 460 214 318L252 322Q282 470 238 600Z', C.wood);
  const lx = 233;
  const ly = 322;
  const leaves = [leaf(lx, ly, 150, 34, -160), leaf(lx, ly, 150, 34, -118), leaf(lx, ly, 150, 34, -62), leaf(lx, ly, 150, 34, -20), leaf(lx, ly, 120, 30, 22)].join('');
  S.region('palm_leaves', 'Palm leaves', leaves, C.leaf);
  S.region('coconuts', 'Coconuts', circle(222, 340, 15) + circle(252, 344, 15), C.wood, { w: 4 });
  // umbrella
  S.region('umbrella_pole', 'Umbrella pole', rect(693, 420, 14, 190, 6), C.stone);
  S.region('umbrella_top', 'Umbrella', dome(700, 430, 110, 96), C.pink);
  S.region('umbrella_stripe', 'Umbrella stripe', 'M700 334Q748 364 764 430H636Q652 364 700 334Z', C.butter);
  S.region('towel', 'Beach towel', rect(520, 600, 200, 72, 8), C.lavender, { transform: 'rotate(-4 620 636)' });
  S.line('M556 612l-4 56M596 610l-4 56M636 608l-4 56', { w: 3.5 });
  S.region('beach_ball', 'Beach ball', circle(400, 640, 44), C.white);
  S.region('ball_stripe', 'Ball stripe', 'M400 596Q432 640 400 684Q368 640 400 596Z', C.coral, { w: 4 });
  S.region('starfish', 'Starfish', star(880, 650, 40, 18, 5, -70), C.peach);
  S.line(bird(480, 280, 0.9) + bird(540, 250, 0.6), { w: 4 });
  return S;
}

export function mountainLake() {
  const S = new Scene('mountain_lake', 'Mountain Lake');
  SKY(S, C.skyPale);
  addSun(S, 180, 150, 54, false);
  S.region('cloud_a', 'Cloud', cloud(560, 110, 190, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(870, 210, 150, 1), C.white);
  S.region('mountain_left', 'Left mountain', rpoly([[-20, 450], [220, 200], [480, 450]], 22), C.lavender);
  S.region('snow_left', 'Snow cap', rpoly([[220, 200], [158, 262], [190, 248], [222, 276], [252, 248], [287, 262]], 6), C.white);
  S.region('mountain_right', 'Right mountain', rpoly([[390, 450], [650, 170], [940, 450]], 22), C.skyDeep);
  S.region('snow_right', 'Snow cap', rpoly([[650, 170], [585, 240], [620, 226], [652, 252], [684, 226], [725, 240]], 6), C.white);
  S.region('meadow', 'Meadow', ground([[-10, 462], [500, 440], [1010, 462]]), C.leaf);
  S.region('lake', 'Lake', blob([[90, 540], [300, 490], [600, 492], [900, 536], [940, 620], [700, 700], [300, 700], [70, 630]]), C.sky);
  S.line('M280 560h90M560 540h110M420 610h140M700 600h90', { w: 4 });
  S.region('boat_sail', 'Sail', rpoly([[552, 548], [552, 600], [608, 600]], 6), C.white);
  S.region('boat_hull', 'Boat', rpoly([[522, 602], [630, 602], [612, 630], [540, 630]], 8), C.coral);
  S.line('M548 604V528', { w: 5 });
  S.region('bank', 'Grassy bank', ground([[-10, 712], [300, 684], [650, 714], [1010, 680]]), C.grass);
  pine(S, 'pine_left', 130, 720, 1.05);
  pine(S, 'pine_right', 880, 716, 0.95);
  return S;
}

export function cozyCottage() {
  const S = new Scene('cozy_cottage', 'Cozy Cottage');
  SKY(S, C.skyPale);
  S.region('sun', 'Sun', circle(130, 120, 56), C.sun);
  S.region('cloud_a', 'Cloud', cloud(430, 110, 190, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(850, 170, 170, 1), C.white);
  S.region('hill_back', 'Back hill', ground([[-10, 470], [260, 420], [560, 460], [820, 410], [1010, 450]]), C.leaf);
  S.region('grass', 'Garden', ground([[-10, 600], [300, 574], [700, 606], [1010, 580]]), C.grass);
  roundTree(S, 'tree', 830, 610, 1.1, 5);
  S.region('chimney', 'Chimney', rect(588, 220, 46, 110, 5), C.stone);
  S.region('smoke_a', 'Smoke', circle(616, 190, 20), C.white, { w: 4 });
  S.region('smoke_b', 'Smoke', circle(640, 150, 26), C.white, { w: 4 });
  S.region('cottage_wall', 'Cottage wall', rect(330, 360, 340, 240, 6), C.peach);
  S.region('roof', 'Roof', rpoly([[296, 372], [500, 200], [704, 372]], 20), C.rose);
  S.region('attic_window', 'Round window', circle(500, 308, 30), C.skyDeep);
  S.line('M500 278v60M470 308h60', { w: 3.5 });
  S.region('door', 'Door', arch(462, 440, 76, 160), C.wood);
  S.dot(522, 530, 5.5);
  S.region('window_left', 'Window', rect(364, 420, 76, 76, 8), C.skyDeep);
  S.region('window_right', 'Window', rect(560, 420, 76, 76, 8), C.skyDeep);
  S.line('M402 420v76M364 458h76M598 420v76M560 458h76', { w: 3.5 });
  S.region('path', 'Garden path', rpoly([[466, 600], [534, 600], [640, 760], [360, 760]], 16), C.sand);
  const pickets = [60, 110, 160, 210, 260].map((x) => rpoly([[x, 560], [x + 16, 540], [x + 32, 560], [x + 32, 640], [x, 640]], 4)).join('');
  S.region('fence', 'Fence', pickets, C.white, { w: 4 });
  S.line('M50 585H300M50 620H300', { w: 4 });
  addFlower(S, 'flower_a', 730, 690, 0.95, C.pink, 740);
  addFlower(S, 'flower_b', 290, 700, 0.85, C.lavender, 745);
  return S;
}

export function forestPath() {
  const S = new Scene('forest_path', 'Forest Path');
  SKY(S, C.skyPale);
  S.region('sun', 'Sun', circle(860, 110, 52), C.sun);
  S.region('cloud_a', 'Cloud', cloud(280, 110, 190, 1), C.white);
  S.region('hill_far', 'Far hills', ground([[-10, 400], [200, 340], [440, 392], [700, 330], [1010, 390]]), C.leaf);
  S.region('ground', 'Forest floor', ground([[-10, 480], [500, 448], [1010, 484]]), C.grass);
  roundTree(S, 'tree_far_left', 330, 470, 0.7, 2, C.leaf);
  roundTree(S, 'tree_far_right', 670, 466, 0.7, 4, C.leaf);
  S.region('path', 'Winding path', blob([[420, 770], [630, 770], [588, 660], [552, 570], [524, 490], [492, 488], [486, 570], [452, 664]], 0.7), C.sand);
  roundTree(S, 'tree_left', 150, 690, 1.15, 7);
  roundTree(S, 'tree_right', 860, 700, 1.25, 9);
  S.region('bush_a', 'Bush', crown(300, 640, 62, 3, 8), C.leaf);
  S.region('bush_b', 'Bush', crown(700, 650, 56, 6, 8), C.leaf);
  S.region('mushroom_stem_a', 'Mushroom', rect(386, 690, 22, 36, 8), C.cream);
  S.region('mushroom_cap_a', 'Mushroom cap', dome(397, 696, 36, 28), C.coral);
  S.dot(386, 678, 4.5);
  S.dot(408, 674, 4);
  S.region('mushroom_stem_b', 'Mushroom', rect(612, 704, 18, 30, 8), C.cream);
  S.region('mushroom_cap_b', 'Mushroom cap', dome(621, 710, 30, 24), C.pink);
  S.dot(612, 698, 4);
  S.dot(630, 696, 3.5);
  S.line(bird(480, 230, 0.9) + bird(540, 200, 0.65), { w: 4 });
  return S;
}

function butterfly(S, key, x, y, s, color) {
  const wings = leaf(x, y, 56 * s, 30 * s, -150) + leaf(x, y, 56 * s, 30 * s, -30) + leaf(x, y, 44 * s, 24 * s, 150) + leaf(x, y, 44 * s, 24 * s, 30);
  S.region(`${key}_wings`, 'Butterfly', wings, color, { w: 4 });
  S.line(`M${x} ${y - 14 * s}V${y + 22 * s}`, { w: 6 });
}

export function meadowFlowers() {
  const S = new Scene('meadow_flowers', 'Meadow Flowers');
  SKY(S, C.skyPale);
  addSun(S, 860, 120, 54);
  S.region('cloud_a', 'Cloud', cloud(210, 120, 200, 0), C.white);
  S.region('cloud_b', 'Cloud', cloud(560, 80, 150, 2), C.white);
  S.region('hill_far', 'Far hill', ground([[-10, 420], [250, 380], [560, 420], [820, 384], [1010, 416]]), C.leaf);
  S.region('meadow', 'Meadow', ground([[-10, 480], [350, 448], [700, 486], [1010, 452]]), C.grass);
  const stems = [[170, 560, 1.7, C.pink], [380, 500, 1.4, C.lavender], [600, 580, 1.8, C.peach], [790, 510, 1.5, C.pink], [960, 600, 1.4, C.butter]];
  stems.forEach(([x, y, s], i) => {
    S.line(`M${x} ${y}Q${x - 14} ${(y + 760) / 2} ${x} 760`, { w: 8 });
    S.region(`leaf_${i + 1}`, 'Leaf', leaf(x, (y + 760) / 2 + 20, 60, 20, i % 2 ? -150 : -30), C.leaf, { w: 4 });
  });
  stems.forEach(([x, y, s, col], i) => addFlower(S, `flower_${i + 1}`, x, y, s, col));
  butterfly(S, 'butterfly_a', 470, 330, 1.1, C.pink);
  butterfly(S, 'butterfly_b', 700, 280, 0.9, C.lavender);
  S.region('ladybug', 'Ladybug', circle(290, 660, 20), C.coral, { w: 4 });
  S.dot(284, 656, 3);
  S.dot(298, 664, 3);
  return S;
}

export function lakesideSunrise() {
  const S = new Scene('lakeside_sunrise', 'Lakeside Sunrise');
  S.region('sky_top', 'Upper sky', rect(-6, -6, 1012, 480), C.dusk);
  S.region('sky_glow', 'Glowing sky', band(230, 480, 14, 4), C.peach);
  S.region('sun', 'Rising sun', dome(500, 400, 120, 120), C.sun);
  S.region('cloud_a', 'Cloud', cloud(200, 140, 200, 0), C.pink);
  S.region('cloud_b', 'Cloud', cloud(760, 190, 220, 1), C.lilac);
  S.region('hill_left', 'Left hill', ground([[-10, 430], [150, 360], [330, 410], [440, 400]], 420, -10, 440), C.leaf);
  S.region('hill_right', 'Right hill', ground([[560, 400], [720, 350], [900, 395], [1010, 380]], 420, 560, 1010), C.leaf);
  S.region('lake', 'Lake', rect(-6, 400, 1012, 356), C.sky);
  S.region('reflect_a', 'Sun reflection', rect(430, 436, 140, 14, 7), C.butter);
  S.region('reflect_b', 'Sun reflection', rect(404, 474, 192, 14, 7), C.butter);
  S.region('reflect_c', 'Sun reflection', rect(446, 512, 108, 14, 7), C.butter);
  roundTree(S, 'tree_a', 90, 500, 0.9, 11);
  roundTree(S, 'tree_b', 220, 470, 0.7, 13, C.leaf);
  // duck
  S.region('duck_wing_back', 'Duck tail', rpoly([[640, 590], [690, 568], [676, 620]], 8), C.butter);
  S.region('duck_body', 'Duck', ellipse(600, 616, 80, 50), C.butter);
  S.region('duck_head', 'Duck head', circle(548, 556, 36), C.butter);
  S.region('duck_beak', 'Beak', rpoly([[514, 556], [484, 566], [514, 576]], 6), C.coral);
  S.region('duck_wing', 'Wing', ellipse(612, 618, 40, 24), C.sand);
  S.dot(544, 548, 5.5);
  // lily pads
  S.region('pad_a', 'Lily pad', ellipse(260, 640, 72, 26), C.leaf);
  S.region('pad_b', 'Lily pad', ellipse(820, 660, 64, 22), C.leaf);
  S.region('pad_c', 'Lily pad', ellipse(150, 710, 50, 18), C.leaf);
  S.region('lily_petals', 'Lily', petals(260, 618, 6, 16, 17, 10, -90), C.pink, { w: 4 });
  S.region('lily_center', 'Lily center', circle(260, 618, 9), C.butter, { w: 3.5 });
  // reeds
  [[900, 520], [930, 490], [880, 540]].forEach(([x, y], i) => {
    S.line(`M${x} 700Q${x - 10} ${(y + 700) / 2} ${x} ${y}`, { w: 6 });
    S.region(`cattail_${i + 1}`, 'Cattail', ellipse(x, y - 22, 10, 28), C.wood, { w: 4 });
  });
  return S;
}

export const peacefulPages = [
  { folder: '01_sunny_beach', scene: sunnyBeach, name: 'Sunny Beach', description: 'Sand, sea, a palm tree and a striped umbrella.' },
  { folder: '02_mountain_lake', scene: mountainLake, name: 'Mountain Lake', description: 'Snowy peaks above a calm blue lake.' },
  { folder: '03_cozy_cottage', scene: cozyCottage, name: 'Cozy Cottage', description: 'A little cottage with a garden and a smoking chimney.' },
  { folder: '04_forest_path', scene: forestPath, name: 'Forest Path', description: 'A quiet path winding through friendly trees.' },
  { folder: '05_meadow_flowers', scene: meadowFlowers, name: 'Meadow Flowers', description: 'Flowers, butterflies and a sunny meadow.' },
  { folder: '06_lakeside_sunrise', scene: lakesideSunrise, name: 'Lakeside Sunrise', description: 'A duck paddles on a lake at sunrise.' }
];
