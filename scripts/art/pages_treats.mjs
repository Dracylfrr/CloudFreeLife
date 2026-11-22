import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, bird, dome, leaf, addSun, addFlower } from './dsl.mjs';

const WALL = (S, color = C.cream, name = 'Wall') => S.region('wall', name, rect(-6, -6, 1012, 762), color);

function cupcake(S, key, x, y, s, wrapper, frosting, topping = C.rose) {
  S.region(`${key}_wrapper`, 'Wrapper', rpoly([[x - 70 * s, y], [x + 70 * s, y], [x + 52 * s, y + 96 * s], [x - 52 * s, y + 96 * s]], 12 * s), wrapper);
  S.line(`M${x - 30 * s} ${y + 8 * s}l${6 * s} ${84 * s}M${x} ${y + 8 * s}v${86 * s}M${x + 30 * s} ${y + 8 * s}l${-6 * s} ${84 * s}`, { w: 3.5 });
  S.region(`${key}_frosting_low`, 'Frosting', ellipse(x, y - 8 * s, 82 * s, 34 * s), frosting);
  S.region(`${key}_frosting_mid`, 'Frosting', ellipse(x, y - 44 * s, 60 * s, 28 * s), frosting);
  S.region(`${key}_frosting_top`, 'Frosting', ellipse(x, y - 74 * s, 36 * s, 22 * s), frosting);
  S.region(`${key}_cherry`, 'Cherry', circle(x, y - 100 * s, 16 * s), topping, { w: 4 });
}

function bunting(S, y, colors) {
  S.line(`M0 ${y}Q500 ${y + 60} 1000 ${y}`, { w: 4 });
  colors.forEach((c, i) => {
    const x = 70 + i * 110;
    const dy = y + 30 * Math.sin((x / 1000) * Math.PI) + 4;
    S.region(`bunting_${i + 1}`, 'Flag', rpoly([[x - 34, dy], [x + 34, dy], [x, dy + 64]], 6), c, { w: 4 });
  });
}

export function cupcakeTower() {
  const S = new Scene('cupcake_tower', 'Cupcake Tower');
  WALL(S, C.pink);
  S.line('M0 140H1000', { w: 2.5 });
  bunting(S, 40, [C.butter, C.mint, C.lilac, C.sky, C.peach, C.butter, C.mint, C.lilac]);
  S.region('table', 'Table', rect(-6, 600, 1012, 160), C.wood);
  S.line('M0 660H1000M0 720H1000', { w: 3 });
  S.region('stand_pole', 'Cake stand', rect(480, 470, 40, 140, 8), C.stone);
  S.region('stand_base', 'Stand base', ellipse(500, 610, 120, 26), C.stone);
  S.region('stand_plate', 'Cake plate', ellipse(500, 470, 330, 46), C.white);
  cupcake(S, 'cupcake_left', 300, 360, 0.95, C.lavender, C.skyPale);
  cupcake(S, 'cupcake_right', 700, 360, 0.95, C.mint, C.butter);
  cupcake(S, 'cupcake_mid', 500, 330, 1.12, C.peach, C.pink, C.coral);
  S.line('M440 250q8-14 16 0M530 270q8-14 16 0M290 200q8-14 16 0M670 210q8-14 16 0', { w: 3.5 });
  return S;
}

export function teaParty() {
  const S = new Scene('tea_party', 'Tea Party');
  WALL(S, C.lilac);
  S.region('window', 'Window', arch(70, 80, 190, 300), C.sky);
  S.line('M165 80v300M70 250h190', { w: 4 });
  S.region('curtain_left', 'Curtain', rpoly([[40, 60], [100, 60], [110, 400], [40, 400]], 10), C.pink);
  S.region('curtain_right', 'Curtain', rpoly([[230, 60], [290, 60], [290, 400], [220, 400]], 10), C.pink);
  S.region('tablecloth', 'Tablecloth', rect(-6, 500, 1012, 260), C.white);
  S.line('M0 560H1000M0 620H1000M0 680H1000M100 500v260M300 500v260M500 500v260M700 500v260M900 500v260', { w: 2.5 });
  S.region('table_top', 'Table top', rect(-6, 500, 1012, 40), C.rose);
  S.region('teapot_spout', 'Spout', rpoly([[610, 450], [690, 380], [706, 396], [650, 470]], 8), C.mint);
  S.region('teapot_handle', 'Handle', 'M440 400q-80 0-70 60q8 40 70 40', C.mint, { w: 6 });
  S.region('teapot_body', 'Teapot', ellipse(530, 440, 112, 82), C.mint);
  S.region('teapot_lid', 'Lid', dome(530, 372, 62, 34), C.skyPale);
  S.region('teapot_knob', 'Knob', circle(530, 330, 13), C.butter, { w: 4 });
  S.line('M470 430q60 30 120 0', { w: 3.5, dash: '2 8' });
  S.region('saucer_left', 'Saucer', ellipse(220, 540, 94, 22), C.white);
  S.region('cup_left', 'Cup', 'M150 470h140q0 70-70 70t-70-70z', C.peach);
  S.region('saucer_right', 'Saucer', ellipse(830, 540, 94, 22), C.white);
  S.region('cup_right', 'Cup', 'M760 470h140q0 70-70 70t-70-70z', C.butter);
  S.line('M290 490q36 0 32 24q-4 18-34 16M900 490q36 0 32 24q-4 18-34 16', { w: 5 });
  S.region('cake_plate', 'Plate', ellipse(520, 640, 150, 30), C.stone);
  S.region('cake_slice', 'Cake slice', rpoly([[430, 600], [610, 612], [450, 640]], 10), C.pink);
  S.region('cake_top', 'Icing', rpoly([[430, 600], [610, 612], [602, 624], [440, 612]], 6), C.white, { w: 4 });
  S.region('strawberry', 'Strawberry', circle(530, 588, 18), C.coral, { w: 4 });
  S.region('cookie_a', 'Cookie', circle(250, 650, 34), C.sand);
  S.region('cookie_b', 'Cookie', circle(810, 660, 34), C.sand);
  S.dot(240, 644, 4);
  S.dot(262, 658, 4);
  S.dot(802, 654, 4);
  S.dot(822, 668, 4);
  return S;
}

export function bakeryShop() {
  const S = new Scene('bakery_shop', 'Bakery Shop');
  S.region('sky', 'Sky', rect(-6, -6, 1012, 762), C.skyPale);
  addSun(S, 880, 100, 44, false);
  S.region('cloud_a', 'Cloud', cloud(180, 100, 170, 0), C.white);
  S.region('shop_wall', 'Shop wall', rect(150, 250, 700, 400, 6), C.peach);
  S.region('shop_roof', 'Roof', rect(120, 200, 760, 70, 10), C.rose);
  S.region('sign', 'Sign', rect(330, 120, 340, 90, 18), C.butter);
  S.line('M360 150h280M360 180h200', { w: 3.5, dash: '2 10' });
  S.region('sign_cupcake', 'Sign cupcake', circle(500, 156, 16) , C.pink, { w: 4 });
  [0, 1, 2, 3, 4, 5].forEach((i) => S.region(`awning_${i + 1}`, 'Awning stripe', rpoly([[160 + i * 113, 270], [160 + i * 113 + 113, 270], [160 + i * 113 + 100, 340], [160 + i * 113 + 13, 340]], 8), i % 2 ? C.white : C.coral));
  S.region('window', 'Window', rect(190, 370, 290, 200, 14), C.skyPale);
  S.region('bread_loaf', 'Bread', ellipse(280, 520, 70, 30), C.sand);
  S.region('bread_round', 'Round bread', circle(400, 515, 36), C.wood);
  S.region('cake_display', 'Cake', rect(230, 460, 80, 36, 8), C.pink);
  S.line('M330 380v190M190 440h290', { w: 3.5 });
  S.region('door', 'Door', arch(560, 360, 210, 290), C.mint);
  S.region('door_glass', 'Door glass', arch(590, 390, 150, 150), C.skyPale);
  S.dot(590, 600, 8);
  S.region('sidewalk', 'Sidewalk', rect(-6, 650, 1012, 110), C.stone);
  S.line('M0 700H1000M200 650v110M500 650v110M800 650v110', { w: 3 });
  S.region('pot_left', 'Flower pot', rpoly([[110, 620], [170, 620], [160, 670], [120, 670]], 6), C.coral);
  addFlower(S, 'pot_flower_left', 140, 596, 0.8, C.pink, 620);
  S.region('pot_right', 'Flower pot', rpoly([[830, 620], [890, 620], [880, 670], [840, 670]], 6), C.coral);
  addFlower(S, 'pot_flower_right', 860, 596, 0.8, C.lavender, 620);
  return S;
}

export function iceCreamCart() {
  const S = new Scene('ice_cream_cart', 'Ice Cream Cart');
  S.region('sky', 'Sky', rect(-6, -6, 1012, 762), C.skyPale);
  addSun(S, 130, 120, 48);
  S.region('cloud_a', 'Cloud', cloud(640, 110, 190, 1), C.white);
  S.region('grass', 'Grass', ground([[-10, 560], [300, 540], [700, 566], [1010, 540]]), C.grass);
  S.region('umbrella_pole', 'Pole', rect(494, 170, 14, 260, 6), C.stone);
  [0, 1, 2, 3, 4].forEach((i) => S.region(`umbrella_${i + 1}`, 'Umbrella stripe', rpoly([[260 + i * 96, 232], [260 + i * 96 + 96, 232], [500, 150]].slice(0, 3), 10), i % 2 ? C.white : C.pink));
  S.region('cart_body', 'Cart', rect(240, 400, 520, 190, 24), C.mint);
  S.region('cart_window', 'Cart window', rect(280, 430, 440, 80, 14), C.skyPale);
  S.line('M280 470h440', { w: 3.5, dash: '2 9' });
  S.region('cart_stripe', 'Cart stripe', rect(240, 530, 520, 34, 6), C.butter);
  S.region('wheel_left', 'Wheel', circle(340, 610, 46), C.stone);
  S.region('wheel_right', 'Wheel', circle(660, 610, 46), C.stone);
  S.region('hub_left', 'Hub', circle(340, 610, 16), C.white, { w: 4 });
  S.region('hub_right', 'Hub', circle(660, 610, 16), C.white, { w: 4 });
  S.region('cone', 'Cone', rpoly([[430, 360], [500, 360], [465, 460]], 8), C.sand);
  S.line('M440 380l20 60M470 372l-6 80', { w: 3 });
  S.region('scoop_bottom', 'Scoop', circle(465, 340, 36), C.pink);
  S.region('scoop_middle', 'Scoop', circle(465, 300, 32), C.mint);
  S.region('scoop_top', 'Scoop', circle(465, 262, 28), C.lilac);
  S.region('cherry', 'Cherry', circle(465, 226, 12), C.coral, { w: 4 });
  S.line(bird(800, 220, 0.8) + bird(850, 190, 0.6), { w: 4 });
  addFlower(S, 'flower_a', 120, 660, 0.9, C.pink, 720);
  addFlower(S, 'flower_b', 880, 660, 0.9, C.butter, 720);
  return S;
}

export function picnicBasket() {
  const S = new Scene('picnic_basket', 'Picnic Basket');
  S.region('sky', 'Sky', rect(-6, -6, 1012, 762), C.skyPale);
  addSun(S, 860, 110, 50);
  S.region('cloud_a', 'Cloud', cloud(220, 110, 190, 2), C.white);
  S.region('hill', 'Hill', ground([[-10, 330], [260, 290], [560, 340], [820, 300], [1010, 336]]), C.leaf);
  S.region('tree_trunk', 'Tree trunk', rect(120, 220, 40, 140, 8), C.wood);
  S.region('tree_leaves', 'Tree leaves', ellipse(140, 190, 100, 90), C.grass);
  S.region('meadow', 'Meadow', ground([[-10, 400], [300, 380], [700, 406], [1010, 380]]), C.grass);
  S.region('blanket', 'Blanket', rpoly([[120, 700], [880, 700], [800, 480], [200, 480]], 16), C.pink);
  S.line('M175 590H825M150 645H850M300 480L240 700M450 480L420 700M600 480l30 220M750 480l60 220', { w: 3.5 });
  S.region('basket_handle', 'Handle', 'M330 530q170-190 340 0', C.sand, { w: 7 });
  S.region('basket', 'Basket', rpoly([[300, 540], [700, 540], [660, 660], [340, 660]], 14), C.wood);
  S.line('M330 580h340M340 620h320M420 540l10 120M500 540v120M580 540l-10 120', { w: 3.5 });
  S.region('jug', 'Lemonade', rect(740, 520, 70, 110, 16), C.butter);
  S.region('jug_cap', 'Jug lid', rect(750, 500, 50, 26, 8), C.coral);
  S.region('apple', 'Apple', circle(210, 640, 36), C.coral);
  S.region('apple_leaf', 'Leaf', leaf(212, 602, 36, 14, -30), C.leaf, { w: 4 });
  S.region('sandwich', 'Sandwich', rpoly([[160, 560], [260, 560], [210, 510]], 8), C.sand);
  S.region('cookie', 'Cookie', circle(270, 650, 30), C.sand);
  S.region('cherries', 'Cherries', circle(790, 660, 20) + circle(826, 670, 20), C.rose, { w: 4 });
  addFlower(S, 'flower_a', 900, 440, 0.8, C.lavender, 480);
  S.line(bird(500, 200, 0.9) + bird(560, 170, 0.6), { w: 4 });
  return S;
}

export const treatsPages = [
  { folder: '01_cupcake_tower', scene: cupcakeTower, name: 'Cupcake Tower', description: 'Three fluffy cupcakes on a party stand.' },
  { folder: '02_tea_party', scene: teaParty, name: 'Tea Party', description: 'A teapot, tiny cups and a slice of cake.' },
  { folder: '03_bakery_shop', scene: bakeryShop, name: 'Bakery Shop', description: 'A striped awning and warm bread in the window.' },
  { folder: '04_ice_cream_cart', scene: iceCreamCart, name: 'Ice Cream Cart', description: 'A cheerful cart with a four-scoop treat.' },
  { folder: '05_picnic_basket', scene: picnicBasket, name: 'Picnic Basket', description: 'A sunny picnic on a pink blanket.' }
];
