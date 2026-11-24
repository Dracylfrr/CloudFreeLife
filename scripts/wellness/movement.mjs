// Gentle Movement cards (1.4): general, conservative ideas for a pleasant movement break.
// Not medical advice, no diagnoses, no goals, no streaks, no calories. Each card has one cute picture.
import * as A from '../stories/artlib.mjs';
const { cloud, sun, hills, ground, flower, sparkles, S, LINE, fixDup } = A;

// ---- "Puff", a round little friend, drawn from a few joints so every pose stays consistent ----
const limb = (pts, w, fill) => {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  return `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const arrow = (x, y, r, from = 200, to = 520, color = '#ffffff') => {
  const pts = [];
  for (let a = from; a <= to; a += 20) pts.push(`${(x + r * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(y + r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`);
  const last = pts[pts.length - 1].split(' ').map(Number);
  return `<path d="M${pts.join('L')}" fill="none" stroke="${LINE}" stroke-width="9" stroke-linecap="round"/><path d="M${pts.join('L')}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="7" fill="${color}" stroke="${LINE}" stroke-width="2.4"/>`;
};

/**
 * pose: { body: fill, lean: degrees (torso tilt about the hips), headTilt: degrees,
 *         armL, armR: arrays of [x,y] points from the shoulder, legL, legR: points from the hip,
 *         extras: svg drawn on top, behind: svg drawn first, seated: draws a stool }
 */
function puff(p) {
  const body = p.body ?? '#ffd3e2';
  const hipX = 400;
  const hipY = 330;
  const lean = p.lean ?? 0;
  const head = p.headTilt ?? 0;
  const torso = `<g transform="rotate(${lean} ${hipX} ${hipY})">${limb([[400, 318], [400, 210]], 66, body)}${limb([[372, 226], ...(p.armL ?? [[352, 300]])], 24, body)}${limb([[428, 226], ...(p.armR ?? [[448, 300]])], 24, body)}<g transform="rotate(${head} 400 196)"><circle cx="400" cy="150" r="44" fill="${body}" stroke="${LINE}" stroke-width="3"/><circle cx="384" cy="150" r="4.6" fill="${LINE}"/><circle cx="416" cy="150" r="4.6" fill="${LINE}"/><path d="M392 164q8 8 16 0" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/><ellipse cx="372" cy="162" rx="7" ry="4.5" fill="#ffb7cc" opacity=".8"/><ellipse cx="428" cy="162" rx="7" ry="4.5" fill="#ffb7cc" opacity=".8"/></g></g>`;
  const legs = `${limb([[386, 320], ...(p.legL ?? [[372, 400]])], 28, '#c9d8f5')}${limb([[414, 320], ...(p.legR ?? [[428, 400]])], 28, '#c9d8f5')}`;
  const stool = p.seated ? `<rect x="330" y="318" width="140" height="18" rx="9" fill="#e7cdb8" stroke="${LINE}" stroke-width="3"/><path d="M350 336v70M450 336v70" stroke="${LINE}" stroke-width="12" stroke-linecap="round"/><path d="M350 336v70M450 336v70" stroke="#e7cdb8" stroke-width="6" stroke-linecap="round"/>` : '';
  return `${p.behind ?? ''}<g transform="translate(400 262) scale(1.28) translate(-400 -262)">${stool}${legs}${torso}${p.extras ?? ''}</g>`;
}

// The picture has NO background of its own: the card shows the app's current theme behind it, so it fits
// every theme. A soft white glow sits right behind the little friend so the pink body and the outline
// stay easy to see on a pale theme and on a dark one. (The two colors a and b are no longer used.)
const sky = (_a, _b, body) =>
  fixDup(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480"><defs><radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".34"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><ellipse cx="400" cy="262" rx="330" ry="215" fill="url(#glow)"/>${body}</svg>`);
// A soft mat under the feet instead of a full-width floor.
const floor = (c) => `<ellipse cx="400" cy="446" rx="318" ry="34" fill="${c}" stroke="${LINE}" stroke-width="3"/>`;
const sparkle = sparkles([[160, 120, 4], [660, 100, 3], [700, 250, 4], [120, 260, 3]]);

const arts = {
  shoulder_rolls: sky('#d4e9fa', '#f1e6fb', `${cloud(150, 90, 0.7)}${cloud(650, 120, 0.8)}${floor('#cfeccd')}${puff({ legL: [[372, 405]], legR: [[428, 405]], armL: [[336, 296]], armR: [[464, 296]], extras: `${arrow(350, 226, 30, 190, 480)}${arrow(450, 226, 30, 350, 640)}` })}${sparkle}`),
  neck_mobility: sky('#e6e0f8', '#fdf0e2', `${cloud(130, 100, 0.7)}${floor('#e9e0f4')}${puff({ seated: true, headTilt: 16, legL: [[350, 330], [340, 405]], legR: [[450, 330], [460, 405]], extras: `${arrow(400, 150, 70, 200, 330)}` })}${sparkle}`),
  wrist_break: sky('#d8f0e6', '#fdf3df', `${cloud(670, 100, 0.8)}${floor('#cfeccd')}${puff({ seated: true, legL: [[350, 330], [340, 405]], legR: [[450, 330], [460, 405]], armL: [[330, 262], [300, 232]], armR: [[470, 262], [500, 232]], extras: `${arrow(300, 214, 26, 180, 480)}${arrow(500, 214, 26, 60, 360)}` })}${sparkle}`),
  hand_stretch: sky('#fbe4ec', '#fff3d8', `${floor('#f9e4d4')}${puff({ legL: [[372, 405]], legR: [[428, 405]], armL: [[332, 250], [316, 200]], armR: [[468, 250], [484, 200]], extras: `${[-30, -12, 6, 24].map((a) => limb([[316, 196], [316 + Math.sin((a * Math.PI) / 180) * 34, 196 - Math.cos((a * Math.PI) / 180) * 34]], 10, '#ffd3e2')).join('')}${[-24, -6, 12, 30].map((a) => limb([[484, 196], [484 + Math.sin((a * Math.PI) / 180) * 34, 196 - Math.cos((a * Math.PI) / 180) * 34]], 10, '#ffd3e2')).join('')}` })}${sparkle}`),
  seated_side_stretch: sky('#d4e9fa', '#e6dcfa', `${cloud(120, 90, 0.7)}${floor('#e6e0f4')}${puff({ seated: true, lean: 14, legL: [[350, 330], [340, 405]], legR: [[450, 330], [460, 405]], armL: [[350, 300]], armR: [[470, 170], [420, 90]], extras: '' })}<path d="M300 120q-40 60 -10 120" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".8"/>${sparkle}`),
  standing_reach: sky('#cfe9fa', '#fde8f1', `${sun(660, 90, 30)}${cloud(140, 110, 0.8)}${floor('#cfeccd')}${puff({ legL: [[350, 405]], legR: [[450, 405]], armL: [[362, 150], [356, 70]], armR: [[438, 150], [444, 70]], extras: `<path d="M330 90v-40M470 90v-40" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".85"/>` })}${sparkle}`),
  gentle_back_stretch: sky('#fdeee0', '#f4e6f8', `${floor('#efe3d6')}${puff({ seated: true, lean: 26, headTilt: 8, legL: [[350, 330], [340, 405]], legR: [[450, 330], [460, 405]], armL: [[372, 330]], armR: [[452, 330]], extras: `<path d="M520 220q40 40 0 90" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".85"/>` })}${sparkle}`),
  ankle_circles: sky('#e0f0e4', '#fdf0d8', `${floor('#d9ecd6')}${puff({ seated: true, legL: [[350, 330], [340, 405]], legR: [[460, 340], [540, 350]], extras: `${arrow(560, 340, 30, 200, 520)}` })}${sparkle}`),
  short_desk_break: sky('#e4eefb', '#f8e9f2', `<rect x="500" y="300" width="250" height="16" rx="8" fill="#e7cdb8" stroke="${LINE}" stroke-width="3"/><path d="M520 316v90M730 316v90" stroke="${LINE}" stroke-width="10" stroke-linecap="round"/><rect x="560" y="196" width="130" height="90" rx="10" fill="#cfe9fa" stroke="${LINE}" stroke-width="3"/><path d="M625 286v14M600 300h50" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/><rect x="706" y="262" width="30" height="38" rx="8" fill="#c6ecda" stroke="${LINE}" stroke-width="3"/>${floor('#e6e0f4')}${puff({ seated: true, behind: '', legL: [[350, 330], [340, 405]], legR: [[450, 330], [460, 405]], armL: [[346, 170], [330, 90]], armR: [[454, 170], [470, 90]] })}${sparkle}`),
  full_body_reset: sky('#fde6f0', '#d9ecfb', `${sun(140, 100, 32)}${cloud(650, 110, 0.9)}${floor('#cfeccd')}${puff({ legL: [[336, 405]], legR: [[464, 405]], armL: [[330, 170], [290, 100]], armR: [[470, 170], [510, 100]], extras: '' })}${sparkles([[220, 150, 5], [600, 140, 5], [240, 300, 4], [580, 310, 4], [400, 60, 5]])}`)
};

const T = 'Move slowly and only as far as feels comfortable. Stop if anything hurts.';
export const movementCards = [
  { id: 'shoulder_rolls', name: 'Shoulder Rolls', description: 'Slow circles to loosen up tight shoulders.', minutes: 1, position: 'Seated or standing', accent: '#8fc7ec', steps: [
    { title: 'Sit or stand tall', text: 'Let your arms hang loosely by your sides and take an easy breath.' },
    { title: 'Roll back', text: 'Lift your shoulders up toward your ears, then roll them back and down. Do this five times, slowly.' },
    { title: 'Roll forward', text: 'Now roll them forward in the opposite direction, five slow times.' },
    { title: 'Let them drop', text: 'Let your shoulders rest and notice how they feel. ' + T }
  ] },
  { id: 'neck_mobility', name: 'Neck Mobility', description: 'Tiny, easy neck movements for a long day at a screen.', minutes: 2, position: 'Seated', accent: '#a698e0', steps: [
    { title: 'Sit tall', text: 'Rest your hands in your lap and let your shoulders relax away from your ears.' },
    { title: 'Look side to side', text: 'Turn your head slowly to look over one shoulder, then slowly to the other. Keep it small and easy, three times each side.' },
    { title: 'Ear toward shoulder', text: 'Gently tilt one ear toward its shoulder without lifting the shoulder, then switch sides.' },
    { title: 'Chin down, then up', text: 'Let your chin drop a little, then come back to the middle. Keep every movement small. ' + T }
  ] },
  { id: 'wrist_break', name: 'Wrist Break', description: 'Easy wrist circles for hands that have been typing or drawing.', minutes: 1, position: 'Seated or standing', accent: '#8ed2b2', steps: [
    { title: 'Arms out in front', text: 'Hold your arms in front of you with your hands relaxed.' },
    { title: 'Circle gently', text: 'Draw slow circles with your wrists, five one way and five the other.' },
    { title: 'Bend and stretch', text: 'Gently bend your hands up, then down, without pushing at the end of the movement.' },
    { title: 'Shake it out', text: 'Give your hands a loose, floppy little shake. ' + T }
  ] },
  { id: 'hand_stretch', name: 'Hand Stretch', description: 'Open, close and soften your hands.', minutes: 1, position: 'Seated or standing', accent: '#f49bbd', steps: [
    { title: 'Open wide', text: 'Spread your fingers as comfortably wide as you can, like a star.' },
    { title: 'Soft fist', text: 'Gently curl your fingers into a loose fist. Open and close slowly five times.' },
    { title: 'Press and release', text: 'Press your palms together in front of your chest for a few breaths, then let go and shake your hands loose. ' + T }
  ] },
  { id: 'seated_side_stretch', name: 'Seated Side Stretch', description: 'A long, easy reach to the side while you sit.', minutes: 2, position: 'Seated', accent: '#86c3ea', steps: [
    { title: 'Sit tall', text: 'Place both feet flat and rest one hand on your thigh.' },
    { title: 'Reach up and over', text: 'Raise the other arm overhead and lean gently to the side, as if reaching toward a far wall. Breathe slowly.' },
    { title: 'Come back and switch', text: 'Return to the middle and repeat on the other side. ' + T }
  ] },
  { id: 'standing_reach', name: 'Standing Reach', description: 'Stand up, stretch tall and take a deep breath.', minutes: 2, position: 'Standing', accent: '#f7c78a', steps: [
    { title: 'Stand comfortably', text: 'Place your feet about hip-width apart and let your arms rest.' },
    { title: 'Reach up', text: 'As you breathe in, slowly raise your arms and reach upward, lengthening through your whole body.' },
    { title: 'Lower slowly', text: 'As you breathe out, bring your arms down in a wide, slow arc.' },
    { title: 'Repeat', text: 'Do this a few more times at an easy pace. ' + T }
  ] },
  { id: 'gentle_back_stretch', name: 'Gentle Back Stretch', description: 'A relaxed forward curl and long breath while seated.', minutes: 2, position: 'Seated', accent: '#c9a8e8', steps: [
    { title: 'Hands on your thighs', text: 'Sit tall with your feet flat and your hands resting on your thighs.' },
    { title: 'Round forward', text: 'As you breathe out, let your back curl forward gently, only as far as feels comfortable.' },
    { title: 'Lengthen', text: 'As you breathe in, slowly sit tall again. Repeat a few times.' },
    { title: 'Optional easy twist', text: 'Turn your upper body slightly to look over one shoulder, then the other. Keep it small. ' + T }
  ] },
  { id: 'ankle_circles', name: 'Ankle Circles', description: 'Slow ankle circles to wake up tired feet.', minutes: 2, position: 'Seated', accent: '#8ed2b2', steps: [
    { title: 'Lift one foot', text: 'Sit tall and lift one foot a little off the floor.' },
    { title: 'Trace a circle', text: 'Draw slow, smooth circles with your toes, five in each direction.' },
    { title: 'Switch feet', text: 'Rest that foot and repeat with the other.' },
    { title: 'Rest', text: 'Press both feet gently into the floor and notice how they feel. ' + T }
  ] },
  { id: 'short_desk_break', name: 'Short Desk Break', description: 'A quick mix of small moves for a break from your screen.', minutes: 3, position: 'Seated', accent: '#86c3ea', steps: [
    { title: 'Look far away', text: 'Rest your eyes on something far away, like a window or a tree, for a few slow breaths.' },
    { title: 'Roll your shoulders', text: 'Roll your shoulders back a few times, slowly.' },
    { title: 'Reach up', text: 'Raise both arms overhead and stretch tall, then lower them.' },
    { title: 'Shake out your hands', text: 'Give your hands and wrists a loose little shake.' },
    { title: 'Take a sip of water', text: 'Have a drink if you like, and breathe out slowly. ' + T }
  ] },
  { id: 'full_body_reset', name: 'Full Body Reset', description: 'A calm, whole-body stretch break on your feet.', minutes: 5, position: 'Standing', accent: '#f49bbd', steps: [
    { title: 'March gently', text: 'Stand tall and march slowly on the spot for about half a minute, swinging your arms.' },
    { title: 'Reach up', text: 'Raise your arms and stretch toward the ceiling, then lower them slowly.' },
    { title: 'Side reaches', text: 'Reach one arm overhead and lean gently to the side, then switch. Keep your movements easy.' },
    { title: 'Soft forward bend', text: 'With your knees a little bent, tip forward slightly from the hips only as far as feels comfortable, then slowly stand up.' },
    { title: 'Shake it out', text: 'Let your arms and legs shake out loosely, then take three slow breaths. ' + T }
  ] }
].map((c, i) => ({ ...c, order: i + 1, cover: arts[c.id] }));
