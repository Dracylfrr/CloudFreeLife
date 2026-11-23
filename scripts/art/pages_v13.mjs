// Eighteen pages for 1.3: Mountain Village, Night Garden and Happy Farm (six each).
import { Scene, C, rect, circle, ellipse, rpoly, poly, star, cloud, ground, band, curve, blob, arch, bird, dome, leaf, crown, crescent, petals, addSun, addFlower, addStars } from './dsl.mjs';

const SKY = (S, color = C.skyPale, name = 'Sky') => S.region('sky', name, rect(-6, -6, 1012, 762), color);

// ------------------------------------------------------------------ shared pieces
function pine(S, key, x, base, s = 1, color = C.leaf, snow = false) {
  S.region(`${key}_trunk`, 'Tree trunk', rect(x - 9 * s, base - 30 * s, 18 * s, 32 * s, 4), C.wood);
  S.region(`${key}_c`, 'Pine boughs', rpoly([[x, base - 116 * s], [x - 84 * s, base - 22 * s], [x + 84 * s, base - 22 * s]], 8), color);
  S.region(`${key}_b`, 'Pine boughs', rpoly([[x, base - 164 * s], [x - 68 * s, base - 62 * s], [x + 68 * s, base - 62 * s]], 8), color);
  S.region(`${key}_a`, 'Pine boughs', rpoly([[x, base - 212 * s], [x - 52 * s, base - 112 * s], [x + 52 * s, base - 112 * s]], 8), color);
  if (snow) S.region(`${key}_snow`, 'Snow on tree', rpoly([[x, base - 212 * s], [x - 26 * s, base - 164 * s], [x + 26 * s, base - 164 * s]], 6), C.white, { w: 4 });
}

function roundTree(S, key, x, base, s = 1, color = C.leaf) {
  S.region(`${key}_trunk`, 'Tree trunk', rect(x - 14 * s, base - 120 * s, 28 * s, 124 * s, 6), C.wood);
  S.region(`${key}_crown`, 'Tree leaves', crown(x, base - 150 * s, 80 * s, 3), color);
}

function cottage(S, key, x, y, w, h, wall, roof, o = {}) {
  S.region(`${key}_wall`, 'Wall', rect(x - w / 2, y - h, w, h, 6), wall);
  if (o.chimney !== false) S.region(`${key}_chimney`, 'Chimney', rect(x + w * 0.2, y - h - w * 0.4, w * 0.14, w * 0.34, 3), C.stone);
  S.region(`${key}_roof`, 'Roof', rpoly([[x - w / 2 - 14, y - h + 6], [x, y - h - w * 0.44], [x + w / 2 + 14, y - h + 6]], 10), roof);
  S.region(`${key}_door`, 'Door', arch(x - w * 0.09, y - h * 0.55, w * 0.18, h * 0.55), o.door ?? C.wood);
  S.region(`${key}_window_right`, 'Window', rect(x + w * 0.17, y - h * 0.72, w * 0.2, w * 0.2, 5), o.glass ?? C.skyPale);
  S.region(`${key}_window_left`, 'Window', rect(x - w * 0.37, y - h * 0.72, w * 0.2, w * 0.2, 5), o.glass ?? C.skyPale);
}

function lantern(S, key, x, y, s = 1, glow = C.butter) {
  S.line(`M${x} ${y - 36 * s}V${y - 16 * s}`, { w: 4 });
  S.region(`${key}_cap`, 'Lantern cap', rpoly([[x - 16 * s, y - 16 * s], [x + 16 * s, y - 16 * s], [x + 10 * s, y - 28 * s], [x - 10 * s, y - 28 * s]], 4), C.lilac, { w: 4 });
  S.region(`${key}_glass`, 'Lantern light', rect(x - 14 * s, y - 16 * s, 28 * s, 38 * s, 8 * s), glow, { w: 4 });
  S.region(`${key}_base`, 'Lantern base', rect(x - 15 * s, y + 22 * s, 30 * s, 8 * s, 3), C.lilac, { w: 4 });
}

function fencePosts(S, key, x0, x1, y, color = C.cream, step = 52) {
  const posts = [];
  for (let x = x0; x <= x1; x += step) posts.push(rect(x - 11, y - 70, 22, 74, 6));
  S.region(`${key}_posts`, 'Fence posts', posts.join(''), color, { w: 4 });
  S.region(`${key}_rail_top`, 'Fence rail', rect(x0 - 20, y - 56, x1 - x0 + 40, 14, 6), color, { w: 4 });
  S.region(`${key}_rail_low`, 'Fence rail', rect(x0 - 20, y - 24, x1 - x0 + 40, 14, 6), color, { w: 4 });
}

function snowDots(S, list, prefix = 'snow') {
  list.forEach(([x, y, r], i) => S.region(`${prefix}${i + 1}`, 'Snowflake', circle(x, y, r), C.white, { w: 3 }));
}

// =================================================================== MOUNTAIN VILLAGE
export function mountainCottage() {
  const S = new Scene('mountain_cottage', 'Mountain Cottage');
  SKY(S, C.skyPale);
  addSun(S, 150, 120, 46, false);
  S.region('cloud_a', 'Cloud', cloud(560, 110, 200, 1), C.white);
  S.region('mountain_far', 'Far mountain', rpoly([[330, 470], [560, 190], [800, 470]], 14), C.lavender);
  S.region('mountain_near', 'Mountain', rpoly([[620, 480], [820, 230], [1040, 480]], 14), C.lilac);
  S.region('snow_far', 'Snow cap', rpoly([[560, 190], [512, 262], [540, 246], [562, 272], [584, 246], [608, 262]], 6), C.white, { w: 4 });
  S.region('snow_near', 'Snow cap', rpoly([[820, 230], [776, 296], [800, 282], [822, 306], [846, 282], [868, 296]], 6), C.white, { w: 4 });
  S.region('slope', 'Hillside', ground([[-10, 470], [260, 430], [560, 480], [860, 440], [1010, 470]]), C.leaf);
  S.region('meadow', 'Meadow', ground([[-10, 590], [300, 560], [660, 596], [1010, 566]]), C.grass);
  pine(S, 'pine_a', 130, 520, 1.1, C.leaf);
  pine(S, 'pine_b', 240, 540, 0.8, C.mint);
  pine(S, 'pine_c', 880, 530, 1.1, C.leaf);
  S.region('smoke', 'Smoke', blob([[560, 280], [590, 250], [620, 262], [612, 292], [584, 304]], 0.6), C.white, { w: 4 });
  cottage(S, 'cabin', 520, 580, 250, 150, C.sand, C.coral);
  S.region('path', 'Path', curve([[520, 580], [470, 630], [560, 680], [440, 745], [640, 745], [640, 690], [560, 640]], 0.5), C.butter, { w: 4 });
  S.region('flower_bed', 'Flower bed', ellipse(760, 640, 90, 26), C.mint, { w: 4 });
  addFlower(S, 'flower_a', 730, 622, 0.8, C.pink, 650);
  addFlower(S, 'flower_b', 790, 618, 0.8, C.butter, 648);
  addFlower(S, 'flower_c', 300, 640, 0.9, C.lavender, 690);
  S.line(bird(300, 200, 0.8) + bird(370, 160, 0.6), { w: 4 });
  return S;
}

export function villageTrain() {
  const S = new Scene('village_train', 'Village Train');
  SKY(S, C.skyPale);
  S.region('cloud_a', 'Cloud', cloud(780, 100, 190, 0), C.white);
  S.region('mountain', 'Mountain', rpoly([[-40, 420], [220, 160], [520, 420]], 14), C.lavender);
  S.region('snow', 'Snow cap', rpoly([[220, 160], [176, 232], [202, 216], [222, 244], [244, 216], [268, 232]], 6), C.white, { w: 4 });
  S.region('hill', 'Hill', ground([[-10, 440], [300, 400], [640, 450], [1010, 410]]), C.leaf);
  pine(S, 'pine_a', 120, 470, 0.9, C.leaf);
  pine(S, 'pine_b', 890, 470, 1, C.mint);
  S.region('field', 'Field', ground([[-10, 560], [400, 540], [1010, 566]]), C.grass);
  S.region('track_bed', 'Track bed', rect(-10, 510, 1020, 70, 0), C.stone, { w: 4 });
  S.line('M-10 536H1010M-10 562H1010', { w: 5 });
  for (let x = 20; x < 1000; x += 60) S.line(`M${x} 530v40`, { w: 6 });
  // cars
  S.region('car_a', 'Train car', rect(130, 380, 190, 120, 16), C.pink);
  S.region('car_b', 'Train car', rect(340, 380, 190, 120, 16), C.butter);
  S.region('car_a_win1', 'Window', rect(152, 404, 54, 46, 8), C.skyPale);
  S.region('car_a_win2', 'Window', rect(236, 404, 54, 46, 8), C.skyPale);
  S.region('car_b_win1', 'Window', rect(362, 404, 54, 46, 8), C.skyPale);
  S.region('car_b_win2', 'Window', rect(446, 404, 54, 46, 8), C.skyPale);
  // engine
  S.region('smoke', 'Smoke', blob([[742, 240], [772, 200], [820, 208], [836, 250], [800, 280], [756, 276]], 0.6), C.white, { w: 4 });
  S.region('chimney', 'Chimney', rpoly([[716, 330], [776, 330], [790, 290], [704, 290]], 6), C.lilac);
  S.region('engine_body', 'Engine', rect(560, 360, 270, 140, 20), C.mint);
  S.region('engine_cab', 'Cab', rect(700, 310, 130, 190, 18), C.sky);
  S.region('engine_cab_window', 'Cab window', rect(724, 344, 82, 66, 10), C.skyPale);
  S.region('engine_front', 'Engine front', rect(832, 420, 54, 80, 14), C.coral);
  [[180, 508], [270, 508], [400, 508], [490, 508], [610, 508], [680, 508], [770, 508]].forEach(([x, y], i) => S.region(`wheel_${i + 1}`, 'Wheel', circle(x, y, 28), C.white));
  S.region('hitch_a', 'Hitch', rect(320, 440, 20, 14, 4), C.stone, { w: 4 });
  S.region('hitch_b', 'Hitch', rect(530, 440, 30, 14, 4), C.stone, { w: 4 });
  addFlower(S, 'flower_a', 220, 700, 0.9, C.pink, 740);
  addFlower(S, 'flower_b', 860, 690, 0.9, C.lavender, 735);
  return S;
}

export function hilltopBakery() {
  const S = new Scene('hilltop_bakery', 'Hilltop Bakery');
  SKY(S, C.sunset, 'Morning sky');
  addSun(S, 860, 130, 48, false);
  S.region('cloud_a', 'Cloud', cloud(220, 110, 200, 0), C.white);
  S.region('hill_back', 'Far hill', ground([[-10, 470], [300, 430], [600, 480], [1010, 440]]), C.lavender);
  S.region('hill', 'Hill', ground([[-10, 560], [320, 500], [700, 560], [1010, 520]]), C.leaf);
  S.region('ground', 'Ground', ground([[-10, 650], [500, 630], [1010, 660]]), C.grass);
  S.region('chimney', 'Chimney', rect(620, 200, 44, 120, 4), C.stone);
  S.region('smoke', 'Smoke', blob([[620, 180], [650, 140], [700, 150], [706, 190], [666, 214]], 0.6), C.white, { w: 4 });
  S.region('bakery_wall', 'Bakery wall', rect(260, 330, 500, 270, 8), C.cream);
  S.region('bakery_roof', 'Roof', rpoly([[230, 340], [510, 190], [790, 340]], 12), C.coral);
  S.region('round_window', 'Round window', circle(510, 290, 36), C.skyPale);
  S.region('door', 'Door', arch(468, 440, 84, 160), C.wood);
  S.region('window_left', 'Window', rect(300, 400, 120, 110, 8), C.skyPale);
  S.region('window_right', 'Window', rect(600, 400, 120, 110, 8), C.skyPale);
  S.region('awning_left', 'Awning', rpoly([[290, 380], [430, 380], [440, 410], [280, 410]], 6), C.rose);
  S.region('awning_right', 'Awning', rpoly([[590, 380], [730, 380], [740, 410], [580, 410]], 6), C.rose);
  S.region('sign', 'Sign', rect(440, 340, 140, 44, 10), C.butter);
  S.line('M462 362h96', { w: 5 });
  S.region('bread_left', 'Loaf', ellipse(360, 490, 44, 20), C.sand, { w: 4 });
  S.region('bread_right', 'Loaf', ellipse(660, 490, 44, 20), C.sand, { w: 4 });
  S.region('barrel', 'Barrel', rect(150, 560, 70, 86, 14), C.wood);
  S.region('basket', 'Bread basket', rpoly([[780, 570], [880, 570], [866, 646], [794, 646]], 10), C.wood);
  S.region('basket_bread_a', 'Bread', ellipse(810, 566, 24, 14), C.sand, { w: 4 });
  S.region('basket_bread_b', 'Bread', ellipse(850, 564, 24, 14), C.butter, { w: 4 });
  pine(S, 'pine_a', 90, 540, 0.9, C.mint);
  addFlower(S, 'flower_a', 330, 690, 0.9, C.pink, 730);
  addFlower(S, 'flower_b', 690, 696, 0.9, C.butter, 735);
  S.line(bird(540, 100, 0.8), { w: 4 });
  return S;
}

export function snowyPath() {
  const S = new Scene('snowy_path', 'Snowy Path');
  SKY(S, C.lilac, 'Winter sky');
  S.region('cloud_a', 'Cloud', cloud(720, 100, 200, 1), C.white);
  S.region('mountain', 'Mountain', rpoly([[-40, 440], [260, 190], [560, 440]], 14), C.lavender);
  S.region('snow_cap', 'Snow cap', rpoly([[260, 190], [214, 262], [240, 246], [262, 274], [284, 246], [308, 262]], 6), C.white, { w: 4 });
  S.region('far_hill', 'Snowy hill', ground([[-10, 470], [320, 440], [640, 480], [1010, 450]]), C.white);
  S.region('snow_field', 'Snow', ground([[-10, 560], [420, 530], [1010, 570]]), C.cream);
  S.region('path', 'Path', curve([[420, 745], [470, 640], [560, 580], [640, 530], [700, 520], [684, 556], [620, 596], [570, 650], [590, 745]], 0.5), C.stone);
  pine(S, 'pine_a', 130, 600, 1.3, C.leaf, true);
  pine(S, 'pine_b', 260, 580, 0.9, C.mint, true);
  pine(S, 'pine_c', 880, 580, 1.2, C.leaf, true);
  cottage(S, 'cabin', 760, 540, 150, 90, C.sand, C.rose, { chimney: true, glass: C.butter });
  S.region('lamp_post', 'Lamp post', rect(374, 480, 14, 200, 5), C.stone, { w: 4 });
  lantern(S, 'lamp', 381, 470, 1.1);
  S.region('snowman_body', 'Snowman', circle(900, 690, 52), C.white);
  S.region('snowman_head', 'Snowman head', circle(900, 614, 36), C.white);
  S.region('snowman_scarf', 'Scarf', rect(868, 640, 64, 16, 8), C.coral, { w: 4 });
  S.dot(890, 608, 4);
  S.dot(912, 608, 4);
  S.region('snowman_nose', 'Nose', poly([[900, 618], [930, 624], [900, 630]]), C.peach, { w: 3 });
  snowDots(S, [[80, 120, 8], [190, 60, 7], [350, 150, 9], [460, 90, 7], [600, 190, 8], [820, 180, 7], [940, 90, 9], [70, 300, 7], [520, 300, 8]]);
  return S;
}

export function mountainLake() {
  const S = new Scene('mountain_lake', 'Mountain Lake');
  SKY(S, C.skyPale);
  addSun(S, 840, 120, 44, false);
  S.region('cloud_a', 'Cloud', cloud(200, 110, 190, 0), C.white);
  S.region('mountain_left', 'Mountain', rpoly([[-60, 430], [230, 170], [500, 430]], 14), C.lavender);
  S.region('mountain_right', 'Mountain', rpoly([[360, 430], [650, 210], [960, 430]], 14), C.lilac);
  S.region('snow_left', 'Snow cap', rpoly([[230, 170], [184, 244], [208, 228], [232, 258], [254, 228], [278, 244]], 6), C.white, { w: 4 });
  S.region('snow_right', 'Snow cap', rpoly([[650, 210], [606, 276], [630, 262], [652, 290], [674, 262], [696, 276]], 6), C.white, { w: 4 });
  S.region('shore', 'Far shore', ground([[-10, 440], [250, 420], [600, 446], [1010, 424]]), C.leaf);
  pine(S, 'pine_a', 100, 470, 0.8, C.leaf);
  pine(S, 'pine_b', 190, 480, 0.6, C.mint);
  pine(S, 'pine_c', 910, 470, 0.9, C.leaf);
  S.region('lake', 'Lake', rect(-10, 450, 1020, 300, 0), C.sky);
  S.region('reflection', 'Reflection', ellipse(660, 560, 160, 26), C.skyPale, { w: 4 });
  S.line('M210 520q40 -14 80 0M740 640q40 -14 80 0M420 600q30 -10 60 0', { w: 4 });
  S.region('boat_hull', 'Rowing boat', rpoly([[330, 590], [570, 590], [530, 650], [370, 650]], 14), C.coral);
  S.region('boat_stripe', 'Boat stripe', rect(342, 602, 216, 14, 5), C.cream, { w: 4 });
  S.region('boat_sail', 'Sail', rpoly([[450, 400], [450, 580], [540, 580]], 8), C.white);
  S.line('M450 380V590', { w: 6 });
  S.region('duck_a', 'Duck', ellipse(190, 640, 34, 22), C.butter, { w: 4 });
  S.region('duck_a_head', 'Duck head', circle(222, 618, 15), C.butter, { w: 4 });
  S.dot(228, 614, 3.5);
  S.region('duck_b', 'Duckling', ellipse(110, 670, 22, 14), C.butter, { w: 4 });
  S.region('duck_b_head', 'Duckling head', circle(130, 656, 10), C.butter, { w: 4 });
  S.region('reeds_base', 'Reeds', rect(820, 600, 14, 120, 4), C.leaf, { w: 4 });
  S.region('reeds_base_b', 'Reeds', rect(850, 620, 14, 100, 4), C.mint, { w: 4 });
  S.region('cattail_a', 'Cattail', ellipse(827, 590, 12, 30), C.wood, { w: 4 });
  S.region('cattail_b', 'Cattail', ellipse(857, 610, 12, 28), C.wood, { w: 4 });
  S.line(bird(560, 110, 0.8) + bird(620, 80, 0.6), { w: 4 });
  return S;
}

export function sunsetVillage() {
  const S = new Scene('sunset_village', 'Sunset Village');
  SKY(S, C.sunset, 'Sunset sky');
  S.region('sun_glow', 'Sun glow', circle(500, 380, 220), C.butter, { w: 3 });
  S.region('sun', 'Sun', circle(500, 380, 120), C.sun);
  S.region('cloud_a', 'Cloud', cloud(170, 140, 220, 1), C.pink);
  S.region('cloud_b', 'Cloud', cloud(790, 190, 200, 0), C.pink);
  S.region('mountain_far', 'Far mountains', rpoly([[-40, 460], [140, 270], [300, 400], [440, 300], [620, 450], [800, 280], [1040, 460]], 14), C.dusk);
  S.region('mountain_near', 'Mountains', rpoly([[-40, 520], [200, 360], [420, 500], [640, 380], [1040, 520]], 14), C.lavender);
  S.region('hillside', 'Hillside', ground([[-10, 560], [260, 500], [580, 540], [1010, 500]]), C.leaf);
  cottage(S, 'house_a', 190, 600, 190, 120, C.cream, C.coral);
  cottage(S, 'house_b', 440, 570, 150, 100, C.peach, C.rose);
  cottage(S, 'house_c', 700, 600, 210, 130, C.butter, C.pink);
  S.region('tower', 'Clock tower', rect(860, 360, 80, 240, 6), C.cream);
  S.region('tower_roof', 'Tower roof', rpoly([[846, 366], [900, 270], [954, 366]], 8), C.rose);
  S.region('clock', 'Clock', circle(900, 420, 26), C.white);
  S.line('M900 420V404M900 420l12 8', { w: 4 });
  S.region('road', 'Village road', ground([[-10, 690], [400, 670], [1010, 700]], 750), C.sand);
  pine(S, 'pine_a', 60, 640, 0.8, C.leaf);
  lantern(S, 'lamp', 320, 640, 0.9);
  S.line(bird(300, 240, 0.8) + bird(360, 200, 0.6) + bird(620, 220, 0.7), { w: 4 });
  return S;
}

// =================================================================== NIGHT GARDEN
const NIGHT = '#8d8ed0';

export function moonGarden() {
  const S = new Scene('moon_garden', 'Moon Garden');
  SKY(S, NIGHT, 'Night sky');
  S.region('moon_glow', 'Moon glow', circle(500, 220, 190), C.nightPale, { w: 3 });
  S.region('moon', 'Moon', circle(500, 220, 120), C.moon);
  S.region('moon_crater_a', 'Crater', circle(470, 190, 22), C.butter, { w: 3 });
  S.region('moon_crater_b', 'Crater', circle(540, 250, 30), C.butter, { w: 3 });
  addStars(S, [[110, 90, 16], [250, 180, 12], [800, 120, 16], [900, 250, 12], [700, 60, 12], [180, 300, 10]], 'star', C.butter);
  S.region('hill', 'Hill', ground([[-10, 520], [300, 480], [650, 530], [1010, 490]]), C.nightDeep);
  S.region('lawn', 'Garden lawn', ground([[-10, 610], [400, 580], [1010, 620]]), C.mint);
  fencePosts(S, 'fence', 80, 360, 620, C.cream, 70);
  fencePosts(S, 'fence_b', 660, 940, 620, C.cream, 70);
  [[190, 'a', C.lilac], [500, 'b', C.pink], [800, 'c', C.lavender]].forEach(([x, k, col]) => {
    S.line(`M${x} 700Q${x + 14} 640 ${x} 570`, { w: 8 });
    S.region(`bloom_${k}_petals`, 'Moonflower', petals(x, 540, 6, 40, 32, 22, -90), col, { w: 5 });
    S.region(`bloom_${k}_center`, 'Flower center', circle(x, 540, 22), C.butter, { w: 4 });
    S.region(`leaf_${k}_l`, 'Leaf', leaf(x, 660, 70, 24, -150), C.leaf, { w: 4 });
    S.region(`leaf_${k}_r`, 'Leaf', leaf(x, 680, 70, 24, -30), C.leaf, { w: 4 });
  });
  for (let i = 0; i < 4; i++) S.region(`stone_${i + 1}`, 'Stepping stone', ellipse(360 + i * 90, 700 + (i % 2) * 14, 36, 14), C.stone, { w: 4 });
  S.region('firefly_a', 'Firefly', circle(300, 400, 10), C.butter, { w: 3 });
  S.region('firefly_b', 'Firefly', circle(680, 420, 10), C.butter, { w: 3 });
  S.region('firefly_c', 'Firefly', circle(420, 480, 8), C.butter, { w: 3 });
  return S;
}

export function fireflyPond() {
  const S = new Scene('firefly_pond', 'Firefly Pond');
  SKY(S, NIGHT, 'Night sky');
  S.region('moon', 'Moon', circle(800, 140, 64), C.moon);
  addStars(S, [[120, 80, 14], [300, 150, 10], [500, 70, 14], [640, 190, 10], [900, 280, 12]], 'star', C.butter);
  S.region('bank', 'Bank', ground([[-10, 420], [300, 390], [700, 430], [1010, 400]]), C.nightDeep);
  S.region('pond', 'Pond', ellipse(500, 560, 440, 160), C.nightPale);
  S.region('moon_reflection', 'Reflection', ellipse(640, 540, 90, 22), C.moon, { w: 4 });
  S.line('M230 580q40 -14 80 0M380 620q40 -14 80 0M760 600q40 -14 80 0', { w: 4 });
  S.region('lily_a', 'Lily pad', ellipse(330, 520, 70, 22), C.leaf);
  S.region('lily_b', 'Lily pad', ellipse(520, 610, 76, 24), C.grass);
  S.region('lily_c', 'Lily pad', ellipse(700, 520, 60, 20), C.leaf);
  S.region('lotus_petals', 'Lotus', petals(520, 596, 6, 22, 18, 14, -90), C.pink, { w: 4 });
  S.region('lotus_center', 'Lotus center', circle(520, 596, 11), C.butter, { w: 3 });
  S.region('frog_body', 'Frog', ellipse(330, 490, 44, 30), C.leaf);
  S.region('frog_eye_l', 'Frog eye', circle(310, 458, 16), C.leaf);
  S.region('frog_eye_r', 'Frog eye', circle(352, 458, 16), C.leaf);
  S.dot(310, 458, 6);
  S.dot(352, 458, 6);
  S.line('M312 492q18 14 36 0', { w: 4 });
  [[120, 760, 'a'], [170, 770, 'b'], [850, 760, 'c'], [910, 770, 'd']].forEach(([x, y, k], i) => {
    S.region(`reed_${k}`, 'Reed', rect(x, y - 360 + i * 10, 14, 340, 5), C.leaf, { w: 4 });
    S.region(`cattail_${k}`, 'Cattail', ellipse(x + 7, y - 380 + i * 10, 14, 38), C.wood, { w: 4 });
  });
  [[260, 330], [440, 300], [620, 340], [760, 290], [180, 400], [560, 440], [860, 380]].forEach(([x, y], i) => S.region(`firefly_${i + 1}`, 'Firefly', circle(x, y, 11), C.butter, { w: 3 }));
  return S;
}

export function midnightFlowers() {
  const S = new Scene('midnight_flowers', 'Midnight Flowers');
  SKY(S, NIGHT, 'Night sky');
  S.region('moon', 'Moon', crescent(780, 150, 70), C.moon);
  addStars(S, [[100, 90, 14], [260, 180, 11], [420, 80, 15], [580, 200, 10], [920, 300, 12], [160, 320, 10]], 'star', C.butter);
  S.region('hill', 'Hill', ground([[-10, 500], [300, 470], [620, 510], [1010, 480]]), C.nightDeep);
  S.region('ground', 'Ground', ground([[-10, 640], [500, 620], [1010, 650]]), C.mint);
  const cols = [C.pink, C.lavender, C.butter, C.coral, C.lilac, C.pink, C.sky];
  [[110, 380], [250, 330], [390, 420], [520, 300], [660, 400], [790, 340], [910, 420]].forEach(([x, y], i) => {
    S.line(`M${x} 700Q${x + 16} ${(y + 700) / 2} ${x} ${y}`, { w: 8 });
    S.region(`leaf_${i + 1}_a`, 'Leaf', leaf(x, 640, 76, 24, -150), C.leaf, { w: 4 });
    S.region(`leaf_${i + 1}_b`, 'Leaf', leaf(x, 660, 76, 24, -30), C.leaf, { w: 4 });
    S.region(`flower_${i + 1}_petals`, 'Petals', petals(x, y, i % 2 ? 5 : 6, 34, 26, 18, -90), cols[i], { w: 5 });
    S.region(`flower_${i + 1}_center`, 'Flower center', circle(x, y, 17), C.butter, { w: 4 });
  });
  S.region('moth_a', 'Moth', leaf(330, 250, 40, 20, -150) + leaf(330, 250, 40, 20, -30), C.lilac, { w: 4 });
  S.region('moth_b', 'Moth', leaf(840, 230, 36, 18, -150) + leaf(840, 230, 36, 18, -30), C.cream, { w: 4 });
  S.region('bee', 'Bee', ellipse(600, 360, 22, 15), C.butter, { w: 4 });
  S.line('M590 346v28M602 346v28', { w: 4 });
  return S;
}

export function owlTree() {
  const S = new Scene('owl_tree', 'Owl Tree');
  SKY(S, NIGHT, 'Night sky');
  S.region('moon_glow', 'Moon glow', circle(780, 170, 120), C.nightPale, { w: 3 });
  S.region('moon', 'Moon', circle(780, 170, 78), C.moon);
  addStars(S, [[100, 100, 14], [250, 200, 10], [420, 80, 14], [560, 220, 10], [160, 330, 11], [930, 330, 12]], 'star', C.butter);
  S.region('hill', 'Hill', ground([[-10, 590], [300, 560], [700, 600], [1010, 570]]), C.nightDeep);
  S.region('trunk', 'Tree trunk', rpoly([[360, 750], [400, 400], [380, 250], [560, 250], [540, 400], [590, 750]], 24), C.wood);
  S.region('hollow', 'Tree hollow', ellipse(470, 520, 46, 70), C.nightDeep);
  S.region('branch_left', 'Branch', rpoly([[390, 330], [150, 290], [140, 330], [390, 390]], 18), C.wood);
  S.region('branch_right', 'Branch', rpoly([[550, 320], [820, 280], [830, 322], [550, 380]], 18), C.wood);
  S.region('leaves_a', 'Leaves', crown(210, 250, 100, 2), C.leaf);
  S.region('leaves_b', 'Leaves', crown(480, 190, 150, 4), C.leaf);
  S.region('leaves_c', 'Leaves', crown(780, 250, 100, 6), C.leaf);
  // owl on right branch
  S.region('owl_body', 'Owl', ellipse(700, 240, 56, 70), C.lilac);
  S.region('owl_belly', 'Owl belly', ellipse(700, 262, 34, 44), C.cream, { w: 4 });
  S.region('owl_ear_l', 'Ear', rpoly([[656, 188], [664, 146], [690, 178]], 6), C.lilac);
  S.region('owl_ear_r', 'Ear', rpoly([[744, 188], [736, 146], [710, 178]], 6), C.lilac);
  S.region('owl_eye_l', 'Eye', circle(680, 214, 22), C.white);
  S.region('owl_eye_r', 'Eye', circle(722, 214, 22), C.white);
  S.dot(683, 216, 9);
  S.dot(719, 216, 9);
  S.region('owl_beak', 'Beak', poly([[690, 232], [710, 232], [700, 250]]), C.peach, { w: 4 });
  // owlet in hollow
  S.region('owlet', 'Owlet', ellipse(470, 520, 30, 34), C.butter, { w: 4 });
  S.region('owlet_eye_l', 'Eye', circle(460, 510, 10), C.white, { w: 3 });
  S.region('owlet_eye_r', 'Eye', circle(482, 510, 10), C.white, { w: 3 });
  S.dot(460, 511, 4);
  S.dot(482, 511, 4);
  S.region('mushroom_cap', 'Mushroom cap', dome(220, 670, 44, 34), C.coral);
  S.region('mushroom_stem', 'Mushroom stem', rect(206, 670, 28, 44, 8), C.cream);
  S.region('fern', 'Fern', leaf(760, 700, 90, 28, -120) + leaf(760, 700, 90, 28, -60) + leaf(760, 700, 80, 24, -90), C.mint, { w: 4 });
  return S;
}

export function lanternPath() {
  const S = new Scene('lantern_path', 'Lantern Path');
  SKY(S, NIGHT, 'Night sky');
  S.region('moon', 'Moon', crescent(150, 130, 62), C.moon);
  addStars(S, [[300, 90, 14], [480, 160, 10], [640, 70, 14], [800, 190, 11], [920, 100, 10], [380, 260, 9]], 'star', C.butter);
  S.region('hill', 'Hill', ground([[-10, 470], [300, 430], [660, 480], [1010, 440]]), C.nightDeep);
  S.region('hedge_left', 'Hedge', rect(-10, 380, 260, 180, 40), C.leaf);
  S.region('hedge_right', 'Hedge', rect(760, 380, 260, 180, 40), C.leaf);
  S.region('garden_gate_arch', 'Garden arch', arch(380, 280, 240, 290), C.stone);
  S.region('garden_gate_inner', 'Through the arch', arch(410, 310, 180, 260), C.nightPale);
  S.region('grass', 'Grass', ground([[-10, 590], [400, 560], [1010, 596]]), C.mint);
  S.region('path', 'Path', curve([[500, 570], [430, 640], [260, 700], [150, 745], [880, 745], [740, 690], [570, 630]], 0.5), C.sand);
  [[250, 650, 'a'], [740, 650, 'b'], [330, 590, 'c'], [670, 590, 'd']].forEach(([x, y, k], i) => {
    S.region(`post_${k}`, 'Lantern post', rect(x - 6, y - 10, 12, 100 - i * 10, 4), C.stone, { w: 4 });
    lantern(S, `lantern_${k}`, x, y - 20, 1.0 - i * 0.12);
  });
  addFlower(S, 'flower_a', 90, 650, 1, C.pink, 700);
  addFlower(S, 'flower_b', 910, 650, 1, C.lavender, 700);
  S.region('cat_body', 'Cat', ellipse(860, 520, 54, 44), C.cream);
  S.region('cat_head', 'Cat head', circle(820, 480, 34), C.cream);
  S.region('cat_ear_l', 'Ear', rpoly([[796, 460], [800, 424], [822, 450]], 5), C.cream);
  S.region('cat_ear_r', 'Ear', rpoly([[846, 454], [850, 424], [834, 446]], 5), C.cream);
  S.region('cat_tail', 'Tail', blob([[900, 540], [950, 500], [960, 460], [940, 470], [920, 520]], 0.6), C.cream);
  S.dot(810, 478, 4);
  S.dot(832, 478, 4);
  S.line('M814 494q6 6 12 0', { w: 3.5 });
  return S;
}

export function starryGreenhouse() {
  const S = new Scene('starry_greenhouse', 'Starry Greenhouse');
  SKY(S, NIGHT, 'Night sky');
  addStars(S, [[90, 80, 15], [220, 180, 11], [350, 70, 14], [650, 90, 14], [790, 190, 11], [920, 80, 15], [130, 300, 10], [880, 330, 10]], 'star', C.butter);
  S.region('moon', 'Moon', circle(500, 110, 50), C.moon);
  S.region('ground', 'Ground', ground([[-10, 620], [400, 600], [1010, 630]]), C.mint);
  S.region('greenhouse_base', 'Greenhouse base', rect(180, 540, 640, 80, 6), C.stone);
  S.region('pane_left', 'Glass', rpoly([[190, 540], [190, 330], [340, 330], [340, 540]], 6), C.skyPale);
  S.region('pane_mid', 'Glass', rpoly([[340, 540], [340, 330], [660, 330], [660, 540]], 6), C.nightPale);
  S.region('pane_right', 'Glass', rpoly([[660, 540], [660, 330], [810, 330], [810, 540]], 6), C.skyPale);
  S.region('roof_left', 'Glass roof', rpoly([[170, 340], [340, 200], [500, 230], [340, 340]], 6), C.skyPale);
  S.region('roof_right', 'Glass roof', rpoly([[830, 340], [660, 200], [500, 230], [660, 340]], 6), C.skyPale);
  S.region('roof_top', 'Glass roof', rpoly([[340, 200], [500, 140], [660, 200], [500, 230]], 6), C.nightPale);
  S.line('M265 330V540M500 330V540M735 330V540M340 330V540M660 330V540M190 440H810', { w: 5 });
  // plants inside
  S.region('pot_a', 'Pot', rpoly([[230, 540], [320, 540], [308, 600], [242, 600]], 6), C.coral);
  S.region('plant_a', 'Plant', crown(275, 480, 60, 2), C.leaf);
  S.region('pot_b', 'Pot', rpoly([[460, 540], [550, 540], [538, 600], [472, 600]], 6), C.rose);
  S.region('fern_b', 'Fern', leaf(505, 530, 120, 34, -120) + leaf(505, 530, 120, 34, -60) + leaf(505, 530, 110, 30, -90), C.mint, { w: 4 });
  S.region('pot_c', 'Pot', rpoly([[690, 540], [780, 540], [768, 600], [702, 600]], 6), C.butter);
  S.line('M735 540V420', { w: 7 });
  S.region('bloom', 'Flower', petals(735, 400, 6, 30, 24, 16, -90), C.pink, { w: 5 });
  S.region('bloom_center', 'Flower center', circle(735, 400, 14), C.butter, { w: 4 });
  S.region('door', 'Door', rect(468, 440, 64, 100, 4), C.wood, { w: 4 });
  S.region('can_body', 'Watering can', rect(860, 560, 70, 56, 12), C.sky);
  S.region('can_spout', 'Spout', rpoly([[860, 580], [820, 540], [836, 530], [868, 566]], 4), C.sky, { w: 4 });
  S.line('M930 576q30 -4 20 22', { w: 5 });
  S.region('stool', 'Stool', rect(90, 560, 70, 20, 6), C.wood);
  S.line('M100 580l-6 60M150 580l6 60', { w: 7 });
  S.region('firefly_a', 'Firefly', circle(120, 400, 9), C.butter, { w: 3 });
  S.region('firefly_b', 'Firefly', circle(880, 450, 9), C.butter, { w: 3 });
  return S;
}

// =================================================================== HAPPY FARM
const FARM_SKY = C.skyPale;

export function farmhouse() {
  const S = new Scene('farmhouse', 'Farmhouse');
  SKY(S, FARM_SKY);
  addSun(S, 870, 110, 46, false);
  S.region('cloud_a', 'Cloud', cloud(220, 110, 200, 1), C.white);
  S.region('hill', 'Hill', ground([[-10, 440], [300, 400], [640, 450], [1010, 410]]), C.leaf);
  S.region('field', 'Field', ground([[-10, 580], [400, 550], [1010, 590]]), C.grass);
  S.region('silo', 'Silo', rect(110, 280, 90, 280, 16), C.stone);
  S.region('silo_top', 'Silo top', dome(155, 288, 52, 44), C.rose);
  S.region('house_wall', 'House', rect(300, 360, 360, 220, 8), C.cream);
  S.region('chimney', 'Chimney', rect(560, 250, 46, 100, 4), C.stone);
  S.region('house_roof', 'Roof', rpoly([[270, 370], [480, 220], [690, 370]], 12), C.coral);
  S.region('house_door', 'Door', arch(446, 450, 70, 130), C.wood);
  S.region('house_window_l', 'Window', rect(330, 420, 80, 80, 8), C.skyPale);
  S.region('house_window_r', 'Window', rect(550, 420, 80, 80, 8), C.skyPale);
  S.region('attic', 'Attic window', circle(480, 310, 28), C.skyPale);
  S.region('porch', 'Porch', rect(420, 570, 120, 22, 4), C.wood);
  S.region('barn_small', 'Barn', rect(740, 430, 190, 150, 6), C.rose);
  S.region('barn_roof', 'Barn roof', rpoly([[722, 440], [835, 350], [948, 440]], 10), C.coral);
  S.region('barn_door', 'Barn door', rect(790, 480, 90, 100, 4), C.cream);
  S.line('M790 480l90 100M880 480l-90 100', { w: 4 });
  fencePosts(S, 'fence', 60, 280, 650, C.cream, 55);
  S.region('hen_body', 'Hen', ellipse(620, 650, 46, 36), C.cream);
  S.region('hen_head', 'Hen head', circle(662, 622, 18), C.cream);
  S.region('hen_comb', 'Comb', circle(664, 600, 8), C.coral, { w: 3 });
  S.region('hen_beak', 'Beak', poly([[676, 622], [694, 628], [676, 634]]), C.butter, { w: 3 });
  S.dot(666, 620, 3.5);
  S.region('hen_tail', 'Tail', leaf(576, 640, 46, 18, -150), C.sand, { w: 4 });
  addFlower(S, 'flower_a', 800, 660, 1, C.pink, 710);
  addFlower(S, 'flower_b', 880, 680, 0.9, C.butter, 730);
  addFlower(S, 'flower_c', 360, 690, 0.9, C.lavender, 735);
  return S;
}

export function barnFriends() {
  const S = new Scene('barn_friends', 'Barn Friends');
  SKY(S, C.sunset, 'Morning sky');
  S.region('cloud_a', 'Cloud', cloud(780, 100, 190, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 440], [300, 410], [640, 450], [1010, 420]]), C.leaf);
  S.region('ground', 'Ground', ground([[-10, 590], [400, 570], [1010, 600]]), C.grass);
  S.region('barn_wall', 'Barn', rect(220, 250, 560, 330, 6), C.coral);
  S.region('barn_roof', 'Barn roof', rpoly([[190, 270], [500, 90], [810, 270]], 12), C.rose);
  S.region('barn_loft', 'Hayloft', rect(440, 170, 120, 90, 8), C.butter);
  S.region('barn_door_l', 'Barn door', rect(320, 330, 170, 250, 4), C.cream);
  S.region('barn_door_r', 'Barn door', rect(510, 330, 170, 250, 4), C.cream);
  S.line('M320 330l170 250M490 330l-170 250M510 330l170 250M680 330l-170 250', { w: 5 });
  // cow in the door gap
  S.region('cow_body', 'Cow', ellipse(500, 520, 100, 54), C.white);
  S.region('cow_spot_a', 'Spot', ellipse(450, 510, 28, 20), C.stone, { w: 4 });
  S.region('cow_spot_b', 'Spot', ellipse(540, 530, 24, 18), C.stone, { w: 4 });
  S.region('cow_head', 'Cow head', ellipse(590, 470, 46, 40), C.white);
  S.region('cow_snout', 'Snout', ellipse(612, 488, 26, 18), C.pink, { w: 4 });
  S.region('cow_ear', 'Ear', ellipse(560, 440, 20, 10), C.white, { w: 4 });
  S.dot(582, 462, 4.5);
  // hay and animals on the lawn
  S.region('hay_a', 'Hay bale', rect(60, 520, 130, 90, 14), C.butter);
  S.line('M60 550h130M60 580h130M110 520v90M150 520v90', { w: 4 });
  S.region('pig_body', 'Pig', ellipse(850, 640, 70, 50), C.pink);
  S.region('pig_head', 'Pig head', circle(910, 620, 34), C.pink);
  S.region('pig_snout', 'Snout', ellipse(938, 628, 16, 12), C.rose, { w: 4 });
  S.region('pig_ear', 'Ear', rpoly([[898, 596], [904, 570], [926, 596]], 5), C.rose);
  S.dot(912, 612, 4);
  S.region('pig_tail', 'Tail', circle(782, 626, 10), C.pink, { w: 4 });
  S.region('sheep_body', 'Sheep', blob([[240, 680], [210, 640], [250, 610], [320, 610], [360, 650], [330, 690]], 0.7), C.white);
  S.region('sheep_head', 'Sheep head', ellipse(360, 650, 26, 28), C.stone);
  S.dot(366, 644, 4);
  fencePosts(S, 'fence', 620, 780, 740, C.cream, 52);
  addFlower(S, 'flower_a', 470, 690, 0.9, C.pink, 730);
  return S;
}

export function tractorField() {
  const S = new Scene('tractor_field', 'Tractor Field');
  SKY(S, FARM_SKY);
  addSun(S, 150, 120, 46, false);
  S.region('cloud_a', 'Cloud', cloud(620, 110, 200, 1), C.white);
  S.region('hill', 'Hill', ground([[-10, 420], [260, 380], [600, 430], [1010, 390]]), C.leaf);
  S.region('field_a', 'Field', ground([[-10, 500], [400, 470], [1010, 510]]), C.butter);
  S.region('field_b', 'Field rows', ground([[-10, 560], [400, 540], [1010, 570]]), C.grass);
  S.region('field_c', 'Field rows', ground([[-10, 640], [400, 620], [1010, 650]]), C.leaf);
  S.line('M-10 520Q400 500 1010 530M-10 590Q400 570 1010 600M-10 670Q400 650 1010 680', { w: 4 });
  // scarecrow
  S.region('scarecrow_pole', 'Pole', rect(120, 300, 14, 220, 4), C.wood, { w: 4 });
  S.region('scarecrow_arms', 'Arms', rect(60, 372, 134, 14, 6), C.wood, { w: 4 });
  S.region('scarecrow_shirt', 'Shirt', rect(94, 360, 66, 86, 10), C.coral);
  S.region('scarecrow_head', 'Head', circle(127, 316, 28), C.sand);
  S.region('scarecrow_hat', 'Hat', rpoly([[90, 300], [164, 300], [140, 264], [112, 264]], 6), C.wood);
  S.dot(118, 314, 3.5);
  S.dot(138, 314, 3.5);
  S.line('M118 330q9 8 18 0', { w: 3.5 });
  // tractor
  S.region('tractor_wheel_big', 'Big wheel', circle(300, 560, 96), C.stone);
  S.region('tractor_hub_big', 'Hub', circle(300, 560, 40), C.butter, { w: 4 });
  S.region('tractor_body', 'Tractor', rect(300, 440, 280, 110, 20), C.mint);
  S.region('tractor_hood', 'Hood', rect(520, 468, 150, 80, 16), C.sky);
  S.region('tractor_cab', 'Cab', rect(310, 330, 150, 130, 14), C.coral);
  S.region('tractor_window', 'Cab window', rect(332, 350, 106, 78, 10), C.skyPale);
  S.region('tractor_pipe', 'Exhaust', rect(640, 410, 18, 70, 5), C.stone, { w: 4 });
  S.region('tractor_wheel_small', 'Small wheel', circle(610, 590, 58), C.stone);
  S.region('tractor_hub_small', 'Hub', circle(610, 590, 24), C.butter, { w: 4 });
  S.region('puff', 'Puff of smoke', blob([[650, 400], [660, 370], [700, 360], [716, 390], [690, 416]], 0.6), C.white, { w: 4 });
  S.region('crow', 'Little bird', ellipse(860, 440, 28, 18), C.nightPale, { w: 4 });
  S.region('crow_head', 'Bird head', circle(884, 432, 11), C.nightPale, { w: 4 });
  S.dot(888, 430, 3);
  [[820, 690], [900, 700], [740, 710]].forEach(([x, y], i) => addFlower(S, `flower_${i + 1}`, x, y, 0.8, [C.pink, C.lavender, C.butter][i], y + 40));
  return S;
}

export function vegetableGarden() {
  const S = new Scene('vegetable_garden', 'Vegetable Garden');
  SKY(S, FARM_SKY);
  addSun(S, 860, 110, 44, false);
  S.region('cloud_a', 'Cloud', cloud(220, 100, 190, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 360], [300, 330], [680, 370], [1010, 340]]), C.leaf);
  fencePosts(S, 'fence', 40, 960, 440, C.cream, 70);
  S.region('lawn', 'Lawn', ground([[-10, 470], [400, 450], [1010, 480]]), C.grass);
  S.region('bed_a', 'Garden bed', rect(70, 500, 260, 90, 14), C.wood);
  S.region('bed_b', 'Garden bed', rect(370, 500, 260, 90, 14), C.wood);
  S.region('bed_c', 'Garden bed', rect(670, 500, 260, 90, 14), C.wood);
  S.region('soil_a', 'Soil', rect(84, 512, 232, 66, 10), C.sand, { w: 4 });
  S.region('soil_b', 'Soil', rect(384, 512, 232, 66, 10), C.sand, { w: 4 });
  S.region('soil_c', 'Soil', rect(684, 512, 232, 66, 10), C.sand, { w: 4 });
  // carrots (bed a)
  [120, 190, 260].forEach((x, i) => {
    S.region(`carrot_${i + 1}`, 'Carrot', rpoly([[x - 16, 520], [x + 16, 520], [x, 590]], 6), C.coral, { w: 4 });
    S.region(`carrot_top_${i + 1}`, 'Carrot leaves', leaf(x, 520, 70, 22, -110) + leaf(x, 520, 70, 22, -70), C.leaf, { w: 4 });
  });
  // cabbages (bed b)
  [430, 500, 570].forEach((x, i) => {
    S.region(`cabbage_${i + 1}`, 'Cabbage', circle(x, 540, 34), C.mint);
    S.line(`M${x - 18} 540q18 -22 36 0`, { w: 3.5 });
  });
  // tomatoes (bed c)
  S.line('M760 590V400M860 590V420', { w: 6 });
  S.region('vine_a', 'Tomato leaves', crown(760, 430, 54, 1), C.leaf);
  S.region('vine_b', 'Tomato leaves', crown(860, 450, 50, 3), C.leaf);
  [[740, 450], [780, 470], [850, 480], [880, 450]].forEach(([x, y], i) => S.region(`tomato_${i + 1}`, 'Tomato', circle(x, y, 20), C.coral, { w: 4 }));
  S.region('can_body', 'Watering can', rect(110, 640, 90, 70, 14), C.sky);
  S.region('can_spout', 'Spout', rpoly([[110, 664], [60, 620], [78, 608], [118, 650]], 4), C.sky, { w: 4 });
  S.line('M200 660q36 -6 24 26', { w: 5 });
  S.region('bunny_body', 'Bunny', ellipse(560, 680, 54, 44), C.cream);
  S.region('bunny_head', 'Bunny head', circle(610, 650, 32), C.cream);
  S.region('bunny_ear_a', 'Ear', ellipse(602, 600, 11, 34), C.cream, { w: 4 });
  S.region('bunny_ear_b', 'Ear', ellipse(630, 604, 11, 32), C.cream, { w: 4 });
  S.dot(620, 648, 4);
  S.region('bunny_tail', 'Tail', circle(508, 690, 14), C.white, { w: 4 });
  S.region('carrot_snack', 'Carrot', rpoly([[640, 668], [690, 676], [640, 684]], 4), C.coral, { w: 4 });
  S.region('bee', 'Bee', ellipse(300, 440, 18, 12), C.butter, { w: 4 });
  S.line('M292 430v20M302 430v20', { w: 3.5 });
  return S;
}

export function orchard() {
  const S = new Scene('orchard', 'Orchard');
  SKY(S, C.skyPale);
  addSun(S, 860, 100, 42, false);
  S.region('cloud_a', 'Cloud', cloud(200, 100, 200, 1), C.white);
  S.region('hill', 'Hill', ground([[-10, 440], [300, 410], [660, 450], [1010, 420]]), C.leaf);
  S.region('lawn', 'Lawn', ground([[-10, 540], [400, 520], [1010, 550]]), C.grass);
  [[220, 'a'], [560, 'b'], [850, 'c']].forEach(([x, k], i) => {
    S.region(`tree_${k}_trunk`, 'Tree trunk', rpoly([[x - 24, 600], [x - 12, 400], [x + 12, 400], [x + 24, 600]], 8), C.wood);
    S.region(`tree_${k}_leaves`, 'Tree leaves', crown(x, 330, 130 - i * 8, i + 2), C.leaf);
    [[-70, -30], [30, -60], [70, 10], [-20, 20], [-60, 50]].forEach(([dx, dy], j) => S.region(`apple_${k}_${j + 1}`, 'Apple', circle(x + dx, 330 + dy, 20), C.coral, { w: 4 }));
  });
  S.region('picnic_blanket', 'Picnic blanket', rpoly([[330, 640], [500, 640], [540, 720], [290, 720]], 6), C.pink);
  S.line('M360 640l-24 80M420 640l-8 80M470 640l14 80', { w: 4 });
  S.region('basket', 'Basket', rpoly([[690, 640], [790, 640], [776, 716], [704, 716]], 10), C.wood);
  S.line('M700 640q40 -50 80 0', { w: 6 });
  [[720, 636], [752, 632], [774, 640]].forEach(([x, y], i) => S.region(`basket_apple_${i + 1}`, 'Apple', circle(x, y, 17), C.coral, { w: 4 }));
  S.region('ladder', 'Ladder', rect(100, 380, 18, 280, 4), C.wood, { w: 4 });
  S.region('ladder_b', 'Ladder', rect(150, 380, 18, 280, 4), C.wood, { w: 4 });
  S.line('M118 420h32M118 470h32M118 520h32M118 570h32M118 620h32', { w: 6 });
  S.region('bee_a', 'Bee', ellipse(420, 250, 18, 12), C.butter, { w: 4 });
  S.line('M412 240v20M422 240v20', { w: 3.5 });
  S.region('bee_b', 'Bee', ellipse(700, 300, 18, 12), C.butter, { w: 4 });
  S.line('M692 290v20M702 290v20', { w: 3.5 });
  S.region('fallen_apple', 'Fallen apple', circle(600, 700, 22), C.coral, { w: 4 });
  return S;
}

export function sunriseFarm() {
  const S = new Scene('sunrise_farm', 'Sunrise Farm');
  SKY(S, C.sunset, 'Sunrise sky');
  S.region('sun_glow', 'Sun glow', circle(500, 470, 260), C.butter, { w: 3 });
  S.region('sun', 'Sun', circle(500, 470, 150), C.sun);
  S.region('cloud_a', 'Cloud', cloud(190, 150, 210, 0), C.pink);
  S.region('cloud_b', 'Cloud', cloud(800, 190, 190, 1), C.pink);
  S.region('hill_far', 'Far hill', ground([[-10, 470], [260, 430], [560, 480], [1010, 440]]), C.leaf);
  S.region('field_a', 'Field', ground([[-10, 540], [400, 510], [1010, 550]]), C.grass);
  S.region('field_b', 'Field stripes', ground([[-10, 610], [400, 590], [1010, 620]]), C.butter);
  S.line('M-10 570Q400 550 1010 580M-10 640Q400 620 1010 650', { w: 4 });
  S.region('barn_wall', 'Barn', rect(120, 380, 200, 150, 6), C.rose);
  S.region('barn_roof', 'Barn roof', rpoly([[100, 390], [220, 300], [340, 390]], 10), C.coral);
  S.region('barn_door', 'Barn door', rect(180, 440, 80, 90, 4), C.cream);
  S.region('silo', 'Silo', rect(350, 330, 70, 200, 14), C.stone);
  S.region('silo_top', 'Silo top', dome(385, 336, 40, 34), C.rose);
  S.region('windmill_tower', 'Windmill', rpoly([[800, 540], [840, 540], [828, 340], [812, 340]], 4), C.cream);
  for (let i = 0; i < 4; i++) S.region(`blade_${i + 1}`, 'Windmill blade', leaf(820, 340, 110, 26, i * 90 + 20), C.white, { w: 4 });
  S.region('hub', 'Windmill hub', circle(820, 340, 14), C.butter, { w: 4 });
  fencePosts(S, 'fence', 500, 720, 680, C.cream, 55);
  S.region('rooster_body', 'Rooster', ellipse(606, 612, 40, 48), C.coral);
  S.region('rooster_head', 'Rooster head', circle(606, 548, 24), C.coral);
  S.region('rooster_comb', 'Comb', rpoly([[596, 530], [604, 506], [612, 528], [622, 506], [628, 534]], 4), C.rose, { w: 4 });
  S.region('rooster_beak', 'Beak', poly([[626, 546], [650, 554], [626, 562]]), C.butter, { w: 3 });
  S.region('rooster_tail', 'Tail', leaf(568, 596, 80, 30, -140) + leaf(568, 596, 80, 30, -170), C.mint, { w: 4 });
  S.dot(614, 543, 4);
  S.region('cow_a', 'Cow', ellipse(120, 640, 60, 34), C.white);
  S.region('cow_a_head', 'Cow head', circle(180, 628, 24), C.white);
  S.region('cow_a_spot', 'Spot', ellipse(110, 630, 18, 12), C.stone, { w: 4 });
  S.line(bird(260, 150, 0.8) + bird(320, 120, 0.6), { w: 4 });
  addFlower(S, 'flower_a', 400, 700, 0.9, C.pink, 740);
  addFlower(S, 'flower_b', 900, 700, 0.9, C.lavender, 740);
  return S;
}

// ------------------------------------------------------------------ page lists
export const mountainPages = [
  { folder: '01_mountain_cottage', scene: mountainCottage, name: 'Mountain Cottage', description: 'A snug cabin below the snowy peaks.' },
  { folder: '02_village_train', scene: villageTrain, name: 'Village Train', description: 'A tiny train chugging past the pines.' },
  { folder: '03_hilltop_bakery', scene: hilltopBakery, name: 'Hilltop Bakery', description: 'Warm bread and a smoking chimney on the hill.' },
  { folder: '04_snowy_path', scene: snowyPath, name: 'Snowy Path', description: 'A lantern, a snowman and a quiet winter path.' },
  { folder: '05_mountain_lake', scene: mountainLake, name: 'Mountain Lake', description: 'A little boat and ducks on a still blue lake.' },
  { folder: '06_sunset_village', scene: sunsetVillage, name: 'Sunset Village', description: 'The whole village glowing in the evening.' }
];

export const nightPages = [
  { folder: '01_moon_garden', scene: moonGarden, name: 'Moon Garden', description: 'Moonflowers blooming under a huge round moon.' },
  { folder: '02_firefly_pond', scene: fireflyPond, name: 'Firefly Pond', description: 'A sleepy frog and drifting fireflies.' },
  { folder: '03_midnight_flowers', scene: midnightFlowers, name: 'Midnight Flowers', description: 'A row of flowers that bloom after dark.' },
  { folder: '04_owl_tree', scene: owlTree, name: 'Owl Tree', description: 'An owl and her owlet in a great old tree.' },
  { folder: '05_lantern_path', scene: lanternPath, name: 'Lantern Path', description: 'A glowing path to the garden gate.' },
  { folder: '06_starry_greenhouse', scene: starryGreenhouse, name: 'Starry Greenhouse', description: 'A glass greenhouse full of sleeping plants.' }
];

export const farmPages = [
  { folder: '01_farmhouse', scene: farmhouse, name: 'Farmhouse', description: 'A cheerful farmhouse with a barn and a hen.' },
  { folder: '02_barn_friends', scene: barnFriends, name: 'Barn Friends', description: 'A cow, a pig and a woolly sheep at the barn.' },
  { folder: '03_tractor_field', scene: tractorField, name: 'Tractor Field', description: 'A little tractor in the rows beside a scarecrow.' },
  { folder: '04_vegetable_garden', scene: vegetableGarden, name: 'Vegetable Garden', description: 'Carrots, cabbages and tomatoes, and a hungry bunny.' },
  { folder: '05_orchard', scene: orchard, name: 'Orchard', description: 'Apple trees, a basket and a picnic blanket.' },
  { folder: '06_sunrise_farm', scene: sunriseFarm, name: 'Sunrise Farm', description: 'A rooster greeting the morning sun.' }
];
