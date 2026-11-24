// "Quiet Moments": four more meditation sessions, shipped as a downloadable pack (1.6).
//   node scripts/wellness/quiet_moments.mjs
// Same rules as the built-in sessions: optional quiet relaxation only. No medical claims, no goals,
// no streaks, and nothing that promises to treat or relieve anything.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from '../stories/artlib.mjs';
const { scene, cloud, sun, moon, stars, hills, ground, tree, flower, glowdot, sparkles, lantern, mushroom } = A;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../content-packs/quiet_moments');

const covers = {
  gentle_morning: scene('#fde8d4', '#d9ecf6', `${sun(400, 250, 70)}${cloud(150, 90, 0.8)}${cloud(650, 110, 0.9)}${hills('#cdeccf', 340, 24)}${ground('#bfe6c4', 380)}${flower(150, 420, 1.3)}${flower(250, 430, 1)}${flower(560, 425, 1.2)}${flower(660, 420, 1.4)}${sparkles([[330, 150, 3], [480, 120, 3], [560, 200, 2]])}`),
  soft_shoulders: scene('#e4e0f6', '#f9e4ec', `${cloud(400, 220, 2.4, '#ffffff', true)}${cloud(150, 110, 0.7)}${cloud(660, 100, 0.8)}${sparkles([[250, 160, 3], [560, 160, 3], [400, 110, 2], [330, 330, 3], [490, 330, 3]])}<g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M150 340q250 40 500 0"/><path d="M190 380q210 30 420 0"/></g>`),
  before_sleep: scene('#262c64', '#6a5aa8', `${stars([[90, 60, 8], [230, 110, 6], [360, 50, 8], [560, 70, 8], [700, 120, 6], [640, 40, 7]])}${moon(560, 150, 44)}${hills('#3f4a8c', 360, 24)}${ground('#33407f', 400)}${lantern(220, 360, 1.1)}${glowdot(224, 340, 10)}${mushroom(640, 420, 1.2, '#c9b8f2')}`),
  a_kind_thought: scene('#fdebd8', '#f7dce8', `${sun(120, 100, 30)}${hills('#f3d9c2', 340, 22)}${ground('#f6e3cf', 390)}${tree(640, 400, 1.6, '#f7c6b8')}${flower(300, 420, 1.6, '#ffd3e2')}${flower(380, 430, 1.2, '#ffe9a8')}${flower(460, 420, 1.5, '#ffd3e2')}${sparkles([[240, 200, 3], [420, 160, 3], [520, 230, 2]])}`)
};

const sessions = [
  {
    id: 'gentle_morning',
    name: 'Gentle Morning',
    description: 'A soft, slow start to the day with a few easy breaths. About three minutes.',
    accent: '#f4c27a',
    kind: 'breathing',
    minutes: 3,
    breath: { inhale: 4, hold: 1, exhale: 5, rest: 1 },
    ambience: 'garden',
    scene: 'garden',
    order: 20,
    cues: [
      { at: 0, text: 'Good morning. There is no hurry yet.' },
      { at: 25, text: 'Feel the light on the other side of your eyelids.' },
      { at: 70, text: 'Let your breath find its own easy rhythm.' },
      { at: 120, text: 'Think of one small, kind thing you could do today.' },
      { at: 165, text: 'When you are ready, take a stretch and start your day.' }
    ]
  },
  {
    id: 'soft_shoulders',
    name: 'Soft Shoulders',
    description: 'A slow, quiet rest where you notice each part of yourself and let it be. About five minutes.',
    accent: '#c3b0ee',
    kind: 'stillness',
    minutes: 5,
    ambience: 'hush',
    scene: 'cloud',
    order: 21,
    cues: [
      { at: 0, text: 'Find a comfortable way to sit or lie.' },
      { at: 30, text: 'Notice your feet. They have carried you all day.' },
      { at: 75, text: 'Notice your legs, and let them be heavy and still.' },
      { at: 120, text: 'Notice your hands. Let them open, just a little.' },
      { at: 170, text: 'Notice your shoulders. If they have crept upward, let them settle.' },
      { at: 220, text: 'Notice your face. Let your jaw and brow go soft.' },
      { at: 265, text: 'Rest here a moment longer. There is nothing to do.' }
    ]
  },
  {
    id: 'before_sleep',
    name: 'Before Sleep',
    description: 'Long, slow breaths under a quiet sky, to rest with before bed. About six minutes.',
    accent: '#8f8ad6',
    kind: 'breathing',
    minutes: 6,
    breath: { inhale: 4, hold: 2, exhale: 8, rest: 1 },
    ambience: 'hush',
    scene: 'evening',
    order: 22,
    cues: [
      { at: 0, text: 'The day is finished. You can put it down.' },
      { at: 45, text: 'Breathe in slowly, and let the breath out even more slowly.' },
      { at: 120, text: 'Picture a quiet room, with one small lamp glowing.' },
      { at: 200, text: 'If thoughts come, let them float by like clouds in the dark.' },
      { at: 280, text: 'Your bed is waiting. You have done enough today.' },
      { at: 330, text: 'Goodnight. Breathe, and rest.' }
    ]
  },
  {
    id: 'a_kind_thought',
    name: 'A Kind Thought',
    description: 'A few minutes of sending good wishes, first to yourself, then to everyone nearby. About four minutes.',
    accent: '#f2a7c3',
    kind: 'stillness',
    minutes: 4,
    ambience: 'none',
    scene: 'dots',
    order: 23,
    cues: [
      { at: 0, text: 'Sit quietly. Let your breathing be easy.' },
      { at: 35, text: 'Think of yourself, and wish yourself something gentle: may I be at ease.' },
      { at: 90, text: 'Now think of someone you care about. May you be happy.' },
      { at: 145, text: 'Think of someone you see every day. May you have a good day.' },
      { at: 195, text: 'Let the kind thought grow wider, to everyone nearby.' },
      { at: 225, text: 'Carry the warmth with you when you go.' }
    ]
  }
];

for (const s of sessions) {
  const dir = resolve(root, 'content/meditation', s.id);
  await mkdir(dir, { recursive: true });
  const manifest = { ...s, version: '1.0.0', minAppVersion: '1.6.0', cover: 'cover.svg' };
  await writeFile(resolve(dir, 'session.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(resolve(dir, 'cover.svg'), covers[s.id]);
}
await writeFile(
  resolve(root, 'pack.json'),
  JSON.stringify({ name: 'Quiet Moments', description: 'Four more meditation sessions: Gentle Morning, Soft Shoulders, Before Sleep and A Kind Thought.', kind: 'meditation', minAppVersion: '1.6.0' }, null, 2) + '\n'
);
void [cloud, sun, moon, stars, hills, ground, tree, flower];
console.log(`wrote ${sessions.length} sessions`);
