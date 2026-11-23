import { Scene, C, rect, circle, ellipse, rpoly, star, cloud, ground, band, curve, blob, arch, bird, dome, leaf, crown, crescent, addSun, addFlower, addStars } from './dsl.mjs';

const SKY = (S, color = C.skyPale, name = 'Sky') => S.region('sky', name, rect(-6, -6, 1012, 762), color);

function mushroom(S, key, x, y, s, cap) {
  S.region(`${key}_stem`, 'Mushroom stem', rect(x - 14 * s, y, 28 * s, 46 * s, 8 * s), C.cream);
  S.region(`${key}_cap`, 'Mushroom cap', dome(x, y + 4 * s, 44 * s, 36 * s), cap);
  S.dot(x - 16 * s, y - 14 * s, 4.5 * s);
  S.dot(x + 12 * s, y - 20 * s, 4 * s);
}

function treeBg(S, key, x, base, s, seed) {
  S.region(`${key}_trunk`, 'Tree trunk', rect(x - 18 * s, base - 150 * s, 36 * s, 154 * s, 8), C.wood);
  S.region(`${key}_crown`, 'Tree leaves', crown(x, base - 190 * s, 90 * s, seed), C.leaf);
}

export function sleepyBear() {
  const S = new Scene('sleepy_bear', 'Sleepy Bear');
  SKY(S);
  addSun(S, 860, 110, 48, false);
  S.region('cloud_a', 'Cloud', cloud(200, 110, 190, 0), C.white);
  S.region('hill', 'Hill', ground([[-10, 480], [260, 440], [560, 490], [820, 450], [1010, 486]]), C.leaf);
  treeBg(S, 'tree', 800, 600, 1.2, 4);
  S.region('grass', 'Grass', ground([[-10, 600], [300, 580], [700, 606], [1010, 580]]), C.grass);
  // bear (head sits low on the shoulders so it reads as one connected animal)
  S.region('ear_left', 'Ear', circle(386, 252, 44), C.wood);
  S.region('ear_right', 'Ear', circle(554, 252, 44), C.wood);
  S.region('ear_left_inner', 'Inner ear', circle(386, 256, 22), C.peach, { w: 4 });
  S.region('ear_right_inner', 'Inner ear', circle(554, 256, 22), C.peach, { w: 4 });
  S.region('bear_arm_left', 'Arm', ellipse(340, 490, 46, 80), C.wood, { transform: 'rotate(18 340 490)' });
  S.region('bear_arm_right', 'Arm', ellipse(600, 490, 46, 80), C.wood, { transform: 'rotate(-18 600 490)' });
  S.region('bear_body', 'Body', ellipse(470, 490, 145, 140), C.wood);
  S.region('bear_belly', 'Belly', ellipse(470, 520, 88, 92), C.sand);
  S.region('bear_foot_left', 'Foot', ellipse(390, 612, 54, 32), C.wood);
  S.region('bear_foot_right', 'Foot', ellipse(550, 612, 54, 32), C.wood);
  S.region('bear_head', 'Head', circle(470, 318, 108), C.wood);
  S.region('bear_snout', 'Snout', ellipse(470, 354, 52, 40), C.sand);
  S.region('bear_nose', 'Nose', ellipse(470, 338, 18, 12), C.coral, { w: 4 });
  S.line('M416 314q14 10 28 0M496 314q14 10 28 0M470 350v14q-14 14-28 4M470 364q14 14 28 4', { w: 4.5 });
  S.region('honey_pot', 'Honey pot', ellipse(700, 590, 62, 52), C.butter);
  S.region('honey_rim', 'Honey rim', rect(650, 536, 100, 26, 12), C.sand);
  S.line('M676 570q12 24 24 0', { w: 4 });
  S.line('M200 180q10-8 20 0M236 160q10-8 20 0', { w: 4 });
  S.region('bee', 'Bee', ellipse(250, 350, 20, 14), C.butter, { w: 4 });
  S.line('M240 336l-8-12M262 336l8-12', { w: 3.5 });
  addFlower(S, 'flower_a', 130, 660, 0.9, C.pink, 720);
  addFlower(S, 'flower_b', 880, 660, 0.85, C.lavender, 720);
  return S;
}

export function foxInLeaves() {
  const S = new Scene('fox_in_leaves', 'Fox in the Leaves');
  SKY(S, C.peach, 'Autumn sky');
  S.region('cloud_a', 'Cloud', cloud(780, 120, 200, 2), C.white);
  S.region('hill', 'Hill', ground([[-10, 470], [260, 430], [560, 480], [820, 440], [1010, 476]]), C.sand);
  treeBg(S, 'tree', 150, 600, 1.1, 7);
  S.region('ground', 'Ground', ground([[-10, 590], [300, 570], [700, 596], [1010, 570]]), C.wood);
  // fox
  S.region('fox_tail', 'Tail', blob([[620, 560], [720, 500], [830, 520], [850, 590], [760, 620], [650, 610]], 0.6), C.coral);
  S.region('fox_tail_tip', 'Tail tip', blob([[780, 540], [830, 522], [850, 590], [800, 604]], 0.6), C.white, { w: 4 });
  S.region('fox_body', 'Body', ellipse(500, 520, 140, 100), C.coral);
  S.region('fox_belly', 'Belly', ellipse(490, 540, 82, 60), C.cream);
  S.region('fox_paw_left', 'Paw', ellipse(430, 612, 40, 22), C.wood);
  S.region('fox_paw_right', 'Paw', ellipse(540, 612, 40, 22), C.wood);
  S.region('fox_ear_left', 'Ear', rpoly([[380, 300], [350, 180], [450, 250]], 12), C.coral);
  S.region('fox_ear_right', 'Ear', rpoly([[580, 300], [610, 180], [510, 250]], 12), C.coral);
  S.region('fox_ear_inner_left', 'Inner ear', rpoly([[386, 276], [372, 220], [420, 254]], 8), C.wood, { w: 4 });
  S.region('fox_ear_inner_right', 'Inner ear', rpoly([[574, 276], [588, 220], [540, 254]], 8), C.wood, { w: 4 });
  S.region('fox_head', 'Head', ellipse(480, 340, 112, 94), C.coral);
  S.region('fox_cheeks', 'Cheeks', rpoly([[380, 360], [480, 420], [580, 360], [480, 330]], 40), C.white);
  S.region('fox_nose', 'Nose', ellipse(480, 392, 16, 11), C.wood, { w: 4 });
  S.dot(430, 336, 7.5);
  S.dot(530, 336, 7.5);
  S.line('M480 402v10q-14 12-26 2M480 412q14 12 26 2', { w: 4 });
  const leaves = [[120, 640, C.coral], [260, 680, C.butter], [380, 690, C.wood], [620, 690, C.coral], [760, 670, C.butter], [880, 640, C.wood], [200, 520, C.butter], [860, 500, C.coral]];
  leaves.forEach(([x, y, col], i) => S.region(`leaf_${i + 1}`, 'Autumn leaf', leaf(x, y, 62, 24, -30 + i * 38), col, { w: 4 }));
  mushroom(S, 'mush', 310, 560, 0.9, C.rose);
  return S;
}

export function bunnyGarden() {
  const S = new Scene('bunny_garden', 'Bunny Garden');
  SKY(S, C.skyPale);
  addSun(S, 860, 110, 48);
  S.region('cloud_a', 'Cloud', cloud(200, 110, 190, 1), C.white);
  S.region('hill', 'Far hill', ground([[-10, 420], [260, 390], [560, 430], [820, 396], [1010, 424]]), C.leaf);
  S.region('garden', 'Garden', ground([[-10, 500], [300, 480], [700, 506], [1010, 480]]), C.grass);
  S.region('fence', 'Fence', [0, 1, 2, 3, 4, 5].map((i) => rpoly([[40 + i * 70, 470], [60 + i * 70, 440], [80 + i * 70, 470], [80 + i * 70, 540], [40 + i * 70, 540]], 4)).join(''), C.white, { w: 4 });
  S.line('M30 480H470M30 520H470', { w: 4 });
  // bunny
  S.region('bunny_ear_left', 'Ear', leaf(450, 270, 190, 40, -110), C.cream, { transform: 'rotate(-10 450 270)' });
  S.region('bunny_ear_right', 'Ear', leaf(540, 270, 190, 40, -70), C.cream, { transform: 'rotate(10 540 270)' });
  S.region('bunny_ear_inner_left', 'Inner ear', leaf(450, 262, 130, 20, -110), C.pink, { transform: 'rotate(-10 450 270)', w: 4 });
  S.region('bunny_ear_inner_right', 'Inner ear', leaf(540, 262, 130, 20, -70), C.pink, { transform: 'rotate(10 540 270)', w: 4 });
  S.region('bunny_body', 'Body', ellipse(500, 520, 130, 120), C.cream);
  S.region('bunny_belly', 'Belly', ellipse(500, 540, 80, 76), C.white);
  S.region('bunny_foot_left', 'Foot', ellipse(420, 626, 56, 26), C.cream);
  S.region('bunny_foot_right', 'Foot', ellipse(580, 626, 56, 26), C.cream);
  S.region('bunny_head', 'Head', ellipse(496, 340, 100, 88), C.cream);
  S.region('bunny_nose', 'Nose', ellipse(496, 362, 12, 9), C.rose, { w: 4 });
  S.region('bunny_cheek_left', 'Cheek', circle(446, 372, 16), C.pink, { w: 3.5 });
  S.region('bunny_cheek_right', 'Cheek', circle(546, 372, 16), C.pink, { w: 3.5 });
  S.dot(462, 332, 7.5);
  S.dot(530, 332, 7.5);
  S.line('M496 370v10q-12 10-22 2M496 380q12 10 22 2', { w: 4 });
  [[700, 600], [810, 630], [880, 580]].forEach(([x, y], i) => {
    S.region(`carrot_leaves_${i + 1}`, 'Carrot leaves', leaf(x, y - 4, 60, 18, -100) + leaf(x, y - 4, 60, 18, -60) + leaf(x, y - 4, 52, 16, -80), C.leaf, { w: 4 });
    S.region(`carrot_${i + 1}`, 'Carrot', rpoly([[x - 24, y], [x + 24, y], [x, y + 96]], 14), C.coral);
    S.line(`M${x - 10} ${y + 24}h12M${x + 2} ${y + 50}h10`, { w: 3 });
  });
  addFlower(S, 'flower_a', 170, 650, 0.9, C.pink, 710);
  addFlower(S, 'flower_b', 300, 690, 0.8, C.butter, 740);
  return S;
}

export function owlMoon() {
  const S = new Scene('owl_moon', 'Owl and Moon');
  SKY(S, C.nightPale, 'Night sky');
  S.region('moon', 'Moon', circle(780, 170, 100), C.moon);
  S.region('moon_crater_a', 'Crater', circle(750, 150, 16), C.sun, { w: 4 });
  S.region('moon_crater_b', 'Crater', circle(810, 200, 12), C.sun, { w: 4 });
  addStars(S, [[110, 110, 24], [300, 70, 18], [460, 150, 20], [940, 360, 20], [90, 330, 18], [620, 80, 16]]);
  S.region('cloud_a', 'Cloud', cloud(260, 250, 190, 0), C.lilac);
  S.region('branch', 'Branch', rpoly([[-20, 600], [1020, 540], [1020, 590], [-20, 660]], 20), C.wood);
  S.region('branch_leaf_a', 'Leaf', leaf(160, 590, 90, 30, -50), C.leaf);
  S.region('branch_leaf_b', 'Leaf', leaf(830, 540, 90, 30, -130), C.leaf);
  // owl
  S.region('owl_tail', 'Tail', rpoly([[430, 560], [570, 560], [500, 640]], 12), C.wood);
  S.region('owl_body', 'Body', ellipse(500, 420, 150, 160), C.wood);
  S.region('owl_belly', 'Belly', ellipse(500, 450, 94, 110), C.sand);
  S.line('M450 420q12 12 24 0M490 440q12 12 24 0M530 420q12 12 24 0M470 470q12 12 24 0M510 480q12 12 24 0', { w: 3.5 });
  S.region('owl_wing_left', 'Wing', leaf(360, 330, 200, 50, 80), C.wood, { transform: 'rotate(8 360 330)' });
  S.region('owl_wing_right', 'Wing', leaf(640, 330, 200, 50, 100), C.wood, { transform: 'rotate(-8 640 330)' });
  S.region('owl_foot_left', 'Foot', ellipse(450, 590, 34, 16), C.butter);
  S.region('owl_foot_right', 'Foot', ellipse(550, 590, 34, 16), C.butter);
  S.region('owl_tuft_left', 'Ear tuft', rpoly([[390, 250], [380, 170], [450, 230]], 8), C.wood);
  S.region('owl_tuft_right', 'Ear tuft', rpoly([[610, 250], [620, 170], [550, 230]], 8), C.wood);
  S.region('owl_head', 'Head', ellipse(500, 280, 126, 100), C.wood);
  S.region('owl_eye_left', 'Eye', circle(450, 280, 42), C.white);
  S.region('owl_eye_right', 'Eye', circle(550, 280, 42), C.white);
  S.dot(456, 284, 17);
  S.dot(544, 284, 17);
  S.region('owl_beak', 'Beak', rpoly([[480, 316], [520, 316], [500, 350]], 6), C.butter, { w: 4 });
  return S;
}

export function hedgehogMeadow() {
  const S = new Scene('hedgehog_meadow', 'Hedgehog Meadow');
  SKY(S, C.skyPale);
  addSun(S, 140, 110, 48);
  S.region('cloud_a', 'Cloud', cloud(640, 110, 190, 2), C.white);
  S.region('hill', 'Hill', ground([[-10, 400], [260, 370], [560, 410], [820, 376], [1010, 404]]), C.leaf);
  S.region('meadow', 'Meadow', ground([[-10, 480], [300, 460], [700, 486], [1010, 460]]), C.grass);
  // hedgehog
  S.region('hog_spikes', 'Spikes', (() => {
    let d = '';
    for (let i = 0; i < 13; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const cx = 460 + Math.cos(a) * 190;
      const cy = 520 + Math.sin(a) * 160;
      d += rpoly([[cx - 22 * Math.cos(a + 1.57), cy - 22 * Math.sin(a + 1.57)], [460 + Math.cos(a) * 250, 520 + Math.sin(a) * 214], [cx + 22 * Math.cos(a + 1.57), cy + 22 * Math.sin(a + 1.57)]], 6);
    }
    return d;
  })(), C.wood, { w: 4 });
  S.region('hog_body', 'Body', ellipse(470, 540, 210, 120), C.sand);
  S.region('hog_back', 'Back', dome(460, 520, 200, 170), C.wood);
  S.region('hog_face', 'Face', blob([[560, 560], [620, 470], [720, 470], [790, 540], [740, 610], [620, 610]], 0.6), C.sand);
  S.region('hog_nose', 'Nose', circle(790, 538, 15), C.rose, { w: 4 });
  S.region('hog_ear', 'Ear', circle(640, 480, 24), C.wood, { w: 4 });
  S.dot(704, 520, 8);
  S.line('M720 566q14 10 30 0', { w: 4.5 });
  S.region('hog_foot_left', 'Foot', ellipse(420, 650, 40, 20), C.sand);
  S.region('hog_foot_right', 'Foot', ellipse(560, 654, 40, 20), C.sand);
  S.region('apple', 'Apple', circle(330, 450, 28), C.coral, { w: 4 });
  mushroom(S, 'mush_a', 120, 580, 1, C.coral);
  mushroom(S, 'mush_b', 880, 590, 0.9, C.pink);
  addFlower(S, 'flower_a', 230, 690, 0.8, C.butter, 740);
  addFlower(S, 'flower_b', 720, 700, 0.8, C.lavender, 745);
  S.region('butterfly', 'Butterfly', leaf(820, 300, 40, 20, -150) + leaf(820, 300, 40, 20, -30) + leaf(820, 300, 32, 16, 150) + leaf(820, 300, 32, 16, 30), C.lilac, { w: 4 });
  return S;
}

export const forestPages = [
  { folder: '01_sleepy_bear', scene: sleepyBear, name: 'Sleepy Bear', description: 'A cuddly bear with a pot of honey.' },
  { folder: '02_fox_in_leaves', scene: foxInLeaves, name: 'Fox in the Leaves', description: 'A clever little fox in a shower of autumn leaves.' },
  { folder: '03_bunny_garden', scene: bunnyGarden, name: 'Bunny Garden', description: 'A bunny guarding a patch of carrots.' },
  { folder: '04_owl_moon', scene: owlMoon, name: 'Owl and Moon', description: 'A wide-eyed owl under a big round moon.' },
  { folder: '05_hedgehog_meadow', scene: hedgehogMeadow, name: 'Hedgehog Meadow', description: 'A shy hedgehog strolling past the mushrooms.' }
];
