// Writes voicepacks.json for a folder of finished recordings (the *.dvp files of one voice): the list the app reads to
// know what can be downloaded, with every file's size and checksum.
//   node scripts/voices/make-manifest.mjs voicepacks-out [voice word]
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'voicepacks-out');
const voice = process.argv[3] ?? 'elodie';
const stories = {};
for (const f of readdirSync(dir).filter((n) => n.startsWith(`${voice}.`) && n.endsWith('.dvp')).sort()) {
  const bytes = readFileSync(resolve(dir, f));
  if (bytes.subarray(0, 4).toString() !== 'DVP1') throw new Error(`${f} is not a recording`);
  const head = JSON.parse(bytes.subarray(8, 8 + bytes.readUInt32LE(4)).toString('utf8'));
  if (head.voice !== voice) throw new Error(`${f} is recorded in ${head.voice}, not ${voice}`);
  const id = f.slice(voice.length + 1, -4);
  if (id !== head.story) throw new Error(`${f} holds ${head.story}`);
  const seconds = Object.values(head.units).reduce((n, u) => n + u.s, 0);
  stories[id] = { asset: f, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length, seconds: Math.round(seconds) };
}
writeFileSync(resolve(dir, 'voicepacks.json'), JSON.stringify({ v: 1, stories }, null, 1));
const n = Object.keys(stories).length;
const mb = Object.values(stories).reduce((a, s) => a + s.size, 0) / 1048576;
console.log(`voicepacks.json: ${n} stories in ${voice}'s voice, ${mb.toFixed(1)} MB`);
