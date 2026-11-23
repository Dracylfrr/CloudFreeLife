// Meditation sessions (1.4). Optional quiet relaxation only: no medical claims, no goals, no streaks.
// Wording rule (checked by a test): never promise to treat, cure or relieve any condition.
import * as A from '../stories/artlib.mjs';
const { scene, cloud, sun, moon, stars, star, hills, ground, tree, pine, bush, flower, glowdot, rain, sparkles, pond, reeds, bird, lantern, mushroom, S, LINE } = A;

const breathArrows = `<g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M160 300q-30-40 0-80M640 220q30 40 0 80"/><path d="M152 232l8-12 12 8M648 288l-8 12-12-8"/></g>`;

const covers = {
  one_minute_reset: scene('#d4e9fa', '#f0e6fb', `${sun(660, 90, 30)}${cloud(120, 90, 0.7)}${hills('#cfeccd', 380, 24)}${cloud(400, 240, 1.9, '#ffffff', true)}${breathArrows}`),
  cloud_breathing: scene('#c9e3f8', '#e6dcfa', `${cloud(180, 100, 0.8)}${cloud(640, 140, 0.9)}${cloud(400, 250, 2.3, '#ffffff', true)}${breathArrows}${sparkles([[300, 130, 4], [520, 120, 3], [450, 90, 4]])}`),
  quiet_garden: scene('#d8f0e0', '#fdf3df', `${sun(120, 90, 30)}${hills('#b8e3be', 340, 28)}${hills('#cdeccf', 400, 22, true)}${tree(150, 420, 1.3)}${tree(660, 430, 1.5, '#b7e2c0')}${flower(300, 440, 1.6, '#ffd3e2')}${flower(400, 450, 1.8, '#fff2bd')}${flower(500, 440, 1.6, '#e6d8f8')}${sparkles([[250, 250, 4], [540, 230, 3], [400, 200, 4]])}`),
  evening_wind_down: scene('#5d5aa8', '#e6b8d0', `${stars([[90, 60, 9], [230, 120, 6], [360, 50, 8], [560, 70, 8], [700, 130, 6], [640, 40, 7]])}${moon(150, 150, 40)}${hills('#6a62ac', 380, 26)}${ground('#7a72b4', 430)}${cloud(500, 250, 1.4, '#f1e4f6', true)}${lantern(660, 330, 0.9)}`),
  rain_pause: scene('#bcd0e6', '#dcd3ee', `${rain(30, 770, 20, 330, 50, '#ffffff')}${cloud(200, 90, 1.2, '#e8edf6')}${cloud(520, 80, 1.4, '#e8edf6')}${cloud(400, 230, 1.5, '#f3f6fb', true)}${ground('#a9cdb4', 410)}${pond(400, 450, 260, 36, '#9fcbe6')}${reeds(660, 440, 1.2)}`),
  silent_timer: scene('#e4e0f6', '#f7eedf', `${stars([[120, 80, 7], [680, 100, 7], [220, 340, 6], [600, 330, 6]])}<g transform="translate(400 250)"><circle r="130" fill="#ffffff" ${S}/><circle r="104" fill="#f3eefb" ${S} stroke-width="2.4"/><path d="M0 -84V0l56 32" fill="none" ${S} stroke-width="6"/><circle r="9" fill="#c9bdf0" ${S}/></g>${glowdot(150, 220, 5)}${glowdot(650, 260, 5)}`)
};

export const meditationSessions = [
  {
    id: 'one_minute_reset',
    name: 'One Minute Reset',
    description: 'A single minute of slow breathing, for whenever you would like a small pause.',
    accent: '#8fc7ec',
    kind: 'breathing',
    minutes: 1,
    breath: { inhale: 4, hold: 0, exhale: 6, rest: 0 },
    ambience: 'none',
    scene: 'cloud',
    cues: [
      { at: 0, text: 'Settle in. Let your shoulders soften.' },
      { at: 18, text: 'In through your nose, out through your mouth, whenever you like.' },
      { at: 38, text: 'There is nothing to fix right now.' },
      { at: 52, text: 'Nearly there. Notice how you feel, whatever it is.' }
    ]
  },
  {
    id: 'cloud_breathing',
    name: 'Cloud Breathing',
    description: 'Breathe along with a soft little cloud that grows and settles. About three minutes.',
    accent: '#a698e0',
    kind: 'breathing',
    minutes: 3,
    breath: { inhale: 4, hold: 2, exhale: 6, rest: 1 },
    ambience: 'hush',
    scene: 'cloud',
    cues: [
      { at: 0, text: 'Imagine a small, soft cloud in front of you.' },
      { at: 25, text: 'As you breathe in, it grows. As you breathe out, it softens.' },
      { at: 70, text: 'You can follow the cloud, or simply rest your eyes.' },
      { at: 120, text: 'If your mind wanders, that is fine. Come back to the cloud.' },
      { at: 165, text: 'One more slow breath.' }
    ]
  },
  {
    id: 'quiet_garden',
    name: 'Quiet Garden',
    description: 'A gentle walk through an imaginary garden, with soft music. About five minutes.',
    accent: '#8ed2b2',
    kind: 'stillness',
    minutes: 5,
    ambience: 'garden',
    scene: 'garden',
    cues: [
      { at: 0, text: 'Picture a quiet garden in the early light.' },
      { at: 40, text: 'Notice the colors: soft greens, a few pale flowers.' },
      { at: 100, text: 'Listen for small sounds. A bee. A leaf.' },
      { at: 170, text: 'Walk slowly along the path in your mind.' },
      { at: 240, text: 'Find a bench and sit for a while.' },
      { at: 285, text: 'When you are ready, let the garden fade gently.' }
    ]
  },
  {
    id: 'evening_wind_down',
    name: 'Evening Wind Down',
    description: 'Long, slow breaths and quiet prompts to close the day. About eight minutes.',
    accent: '#8d8ed0',
    kind: 'breathing',
    minutes: 8,
    breath: { inhale: 4, hold: 0, exhale: 8, rest: 0 },
    ambience: 'hush',
    scene: 'evening',
    cues: [
      { at: 0, text: 'The day is done. You can put it down for now.' },
      { at: 40, text: 'Let your jaw and your hands go soft.' },
      { at: 120, text: 'Each long breath out can be a little slower.' },
      { at: 200, text: 'Notice the weight of your body being held.' },
      { at: 300, text: 'Nothing needs your attention right now.' },
      { at: 400, text: 'Stay as long as you like.' },
      { at: 460, text: 'Take a last slow breath.' }
    ]
  },
  {
    id: 'rain_pause',
    name: 'Rain Pause',
    description: 'Soft rain and a few quiet words. About four minutes.',
    accent: '#86a8d8',
    kind: 'stillness',
    minutes: 4,
    ambience: 'rain',
    scene: 'rain',
    cues: [
      { at: 0, text: 'Listen to the rain, soft and steady.' },
      { at: 60, text: 'Let each sound come and go.' },
      { at: 140, text: 'Rain does not need to be anywhere. Neither do you.' },
      { at: 220, text: 'Take your time coming back.' }
    ]
  },
  {
    id: 'silent_timer',
    name: 'Silent Timer',
    description: 'No guidance at all: just a soft bell, quiet, and a bell again. You choose how long.',
    accent: '#c9bdf0',
    kind: 'timer',
    minutes: 5,
    durations: [1, 3, 5, 10, 15, 20],
    ambience: 'none',
    scene: 'dots',
    cues: []
  }
].map((s, i) => ({ ...s, order: i + 1, cover: covers[s.id] }));
