// Splash Wall levels: an illustrated wall (SVG with colorable regions) plus a goal.
import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, petals, leaf, blob, bird, addStars, dome } from './dsl.mjs';
import { cloudCastle } from './pages_cloud.mjs';
import { sunnyBeach, meadowFlowers } from './pages_peaceful.mjs';

const PASTELS = ['#f6b8cf', '#bfe4f7', '#c6ecda', '#fff2bd', '#d9cdf6', '#ffdcc8'];

function blankCar() {
  const S = new Scene('blank_car', 'Paint the Car');
  S.region('back_wall', 'Garage wall', rect(-6, -6, 1012, 560), C.cream);
  S.region('road', 'Road', rect(-6, 548, 1012, 208), C.stone);
  S.line('M60 640h120M300 660h140M560 640h120M780 664h140', { w: 5, dash: '2 14' });
  S.region('cabin', 'Roof', rpoly([[290, 400], [390, 270], [620, 270], [720, 400]], 34), C.white);
  S.region('window_a', 'Front window', rpoly([[384, 392], [430, 308], [492, 308], [492, 392]], 10), C.sky);
  S.region('window_b', 'Back window', rpoly([[508, 392], [508, 308], [596, 308], [650, 392]], 10), C.sky);
  S.region('car_body', 'Car body', rect(160, 380, 690, 150, 56), C.white);
  S.region('bumper', 'Bumper', rect(800, 478, 66, 36, 14), C.stone);
  S.region('headlight', 'Headlight', ellipse(812, 440, 20, 26), C.butter);
  S.region('taillight', 'Taillight', ellipse(196, 440, 15, 22), C.coral);
  S.line('M500 392v118M470 450h24', { w: 5 });
  S.region('wheel_back', 'Back wheel', circle(318, 536, 78), C.stone);
  S.region('wheel_front', 'Front wheel', circle(700, 536, 78), C.stone);
  S.region('hub_back', 'Hubcap', circle(318, 536, 34), C.white);
  S.region('hub_front', 'Hubcap', circle(700, 536, 34), C.white);
  S.region('sun', 'Sun', circle(870, 110, 56), C.sun);
  S.region('cloud', 'Cloud', cloud(220, 130, 210, 0), C.white);
  return S;
}

function rainbowTarget() {
  const S = new Scene('rainbow_target', 'Rainbow Target');
  S.region('back_wall', 'Wall', rect(-6, -6, 1012, 762), C.skyPale);
  const rings = [[330, '#f6b8cf'], [275, '#ffdcc8'], [220, '#fff2bd'], [165, '#c6ecda'], [110, '#bfe4f7']];
  rings.forEach(([r, col], i) => S.region(`ring_${i + 1}`, `Ring ${i + 1}`, circle(500, 375, r), col));
  S.region('bullseye', 'Bullseye', circle(500, 375, 55), '#d9cdf6');
  return S;
}

function starConstellation() {
  const S = new Scene('star_constellation', 'Star Constellation');
  S.region('night', 'Night wall', rect(-6, -6, 1012, 762), C.nightPale);
  const pts = [[150, 210, 70], [380, 130, 56], [620, 230, 78], [850, 140, 56], [270, 520, 64], [520, 590, 74], [790, 500, 66]];
  S.line('M150 210L380 130L620 230L850 140M620 230L790 500M270 520L520 590L790 500M150 210L270 520', { w: 4, dash: '3 12' });
  pts.forEach(([x, y, r], i) => S.region(`star_${i + 1}`, 'Star', star(x, y, r, r * 0.48, 5), C.moon));
  S.region('moon', 'Moon', circle(900, 640, 50), C.pink);
  return S;
}

function flowerWall() {
  const S = new Scene('flower_wall', 'Flower Wall');
  S.region('back_wall', 'Wall', rect(-6, -6, 1012, 762), C.mint);
  const spots = [[200, 210, C.pink], [500, 190, C.lavender], [800, 210, C.peach], [200, 530, C.butter], [500, 540, C.pink], [800, 530, C.lavender]];
  spots.forEach(([x, y, col], i) => {
    S.line(`M${x} ${y}Q${x - 14} ${y + 85} ${x} ${y + 150}`, { w: 8 });
    S.region(`leaf_${i + 1}`, 'Leaf', leaf(x, y + 90, 64, 20, i % 2 ? -150 : -30), C.leaf, { w: 4 });
    S.region(`flower_${i + 1}`, 'Flower', petals(x, y, 6, 56, 48, 34, -90), col, { w: 5 });
    S.region(`center_${i + 1}`, 'Center', circle(x, y, 34), C.butter, { w: 4 });
  });
  return S;
}

function spacePlanets() {
  const S = new Scene('space_planets', 'Space Planets');
  S.region('space', 'Space', rect(-6, -6, 1012, 762), C.night);
  addStars(S, [[80, 90, 24], [900, 80, 28], [940, 420, 22], [70, 400, 20], [500, 60, 18], [440, 700, 22]]);
  S.region('planet_a', 'Big planet', circle(280, 290, 160), C.peach);
  S.region('planet_b', 'Ringed planet', circle(720, 460, 120), C.mint);
  S.region('planet_c', 'Small planet', circle(780, 150, 70), C.pink);
  S.region('planet_d', 'Tiny planet', circle(150, 640, 60), C.sky);
  S.region('moon', 'Moon', circle(500, 640, 46), C.moon);
  return S;
}

function colorMatch() {
  const S = new Scene('color_match', 'Color Match');
  S.region('back_wall', 'Wall', rect(-6, -6, 1012, 762), C.cream);
  S.region('ball_pink', 'Pink circle', circle(200, 220, 105), '#f6b8cf');
  S.region('square_blue', 'Blue square', rect(395, 120, 210, 210, 36), '#bfe4f7');
  S.region('star_yellow', 'Yellow star', star(800, 220, 120, 56, 5), '#fff2bd');
  S.region('triangle_mint', 'Mint triangle', rpoly([[200, 640], [95, 460], [305, 460]], 26), '#c6ecda');
  S.region('cloud_lilac', 'Lilac cloud', cloud(500, 520, 250, 0), '#d9cdf6');
  S.region('drop_peach', 'Peach drop', 'M800 440Q890 560 800 650Q710 560 800 440Z', '#ffdcc8');
  return S;
}

function freeSplash() {
  const S = new Scene('free_splash', 'Free Splash');
  S.region('back_wall', 'Wall', rect(-6, -6, 1012, 762), C.cream);
  S.region('panel_left', 'Left panel', rect(60, 70, 270, 610, 36), C.white);
  S.region('panel_center', 'Center panel', rect(365, 70, 270, 610, 36), C.white);
  S.region('panel_right', 'Right panel', rect(670, 70, 270, 610, 36), C.white);
  return S;
}

const wallLevels = [
  {
    folder: '01_blank_car',
    name: 'Paint the Car',
    description: 'A big cartoon car, waiting for color.',
    objective: 'Splash color onto the body, windows, wheels and the wall behind.',
    scene: blankCar(),
    goal: { type: 'regions', regions: ['car_body', 'cabin', 'window_a', 'window_b', 'wheel_back', 'wheel_front', 'back_wall'] }
  },
  {
    folder: '02_cloud_castle_wall',
    name: 'Cloud Castle Wall',
    description: 'A castle in the clouds painted on a long wall.',
    objective: 'Cover most of the wall with color.',
    scene: cloudCastle(),
    goal: { type: 'coverage', target: 0.7 }
  },
  {
    folder: '03_rainbow_target',
    name: 'Rainbow Target',
    description: 'A soft pastel target. Match each ring to its color.',
    objective: 'Match every ring to the color it shows as a hint.',
    scene: rainbowTarget(),
    goal: { type: 'color_match', targets: { ring_1: '#f6b8cf', ring_2: '#ffdcc8', ring_3: '#fff2bd', ring_4: '#c6ecda', ring_5: '#bfe4f7', bullseye: '#d9cdf6' } },
    colors: ['#f6b8cf', '#ffdcc8', '#fff2bd', '#c6ecda', '#bfe4f7', '#d9cdf6']
  },
  {
    folder: '04_beach_mural',
    name: 'Beach Mural',
    description: 'A sunny beach scene waiting for summer colors.',
    objective: 'Splash the whole beach with color.',
    scene: sunnyBeach(),
    goal: { type: 'coverage', target: 0.65 }
  },
  {
    folder: '05_star_constellation',
    name: 'Star Constellation',
    description: 'Seven big stars joined by dotted lines.',
    objective: 'Light up all seven stars.',
    scene: starConstellation(),
    goal: { type: 'regions', regions: ['star_1', 'star_2', 'star_3', 'star_4', 'star_5', 'star_6', 'star_7'] }
  },
  {
    folder: '06_flower_wall',
    name: 'Flower Wall',
    description: 'Six big flowers on a mint-colored wall.',
    objective: 'Make every flower bloom.',
    scene: flowerWall(),
    goal: { type: 'regions', regions: ['flower_1', 'flower_2', 'flower_3', 'flower_4', 'flower_5', 'flower_6'] }
  },
  {
    folder: '07_space_planets',
    name: 'Space Planets',
    description: 'Five round planets drifting in space.',
    objective: 'Give every planet and moon a color.',
    scene: spacePlanets(),
    goal: { type: 'regions', regions: ['planet_a', 'planet_b', 'planet_c', 'planet_d', 'moon'] }
  },
  {
    folder: '08_grassland_scene',
    name: 'Grassland Scene',
    description: 'A meadow of flowers and butterflies.',
    objective: 'Cover the meadow with color.',
    scene: meadowFlowers(),
    goal: { type: 'coverage', target: 0.6 }
  },
  {
    folder: '09_color_match',
    name: 'Color Match',
    description: 'Six shapes, each with a color to match.',
    objective: 'Splash each shape with the color it shows as a hint.',
    scene: colorMatch(),
    goal: { type: 'color_match', targets: { ball_pink: '#f6b8cf', square_blue: '#bfe4f7', star_yellow: '#fff2bd', triangle_mint: '#c6ecda', cloud_lilac: '#d9cdf6', drop_peach: '#ffdcc8' } },
    colors: ['#f6b8cf', '#bfe4f7', '#fff2bd', '#c6ecda', '#d9cdf6', '#ffdcc8']
  },
  {
    folder: '10_free_splash',
    name: 'Free Splash',
    description: 'A blank wall with three panels. No goal, just splash.',
    objective: 'Splash however you like. There is nothing to win.',
    scene: freeSplash(),
    goal: { type: 'free' }
  }
];

export const splashLevels = wallLevels.map((l) => ({
  folder: l.folder,
  scene: l.scene,
  manifest: (version, minAppVersion) => ({
    id: l.folder.replace(/^\d+_/, ''),
    name: l.name,
    description: l.description,
    minigame: 'splash_wall',
    thumbnail: 'thumbnail.svg',
    version,
    minAppVersion,
    objective: l.objective,
    wall: 'wall.svg',
    goal: l.goal,
    colors: l.colors ?? PASTELS
  })
}));
