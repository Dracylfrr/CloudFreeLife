// Copies the voice files from their open-source home to this project's own release, checking every
// file against the checksum pinned in scripts/voices-manifest.json first. Run by the "Voices release"
// workflow when a tag such as voices_v1.0.0 is pushed.
//
//   node scripts/mirror-voices.mjs [--out voices-out] [--from <folder with the files already downloaded>]
//
// --from is for trying it out by hand: it takes the files from a folder instead of the internet.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const out = resolve(opt('out', 'voices-out'));
const from = opt('from');
const manifest = JSON.parse(await readFile(new URL('./voices-manifest.json', import.meta.url), 'utf8'));
await mkdir(out, { recursive: true });

for (const f of manifest.files) {
  let bytes;
  if (from) {
    // the same file names as on the source: tokenizer.json, voices/<name>.bin, model_quantized.onnx
    const name = f.source.includes('/voices/') ? `voices/${f.source.split('/').pop()}` : f.source.split('/').pop();
    bytes = await readFile(join(resolve(from), name));
  } else {
    const res = await fetch(f.source, { redirect: 'follow' });
    if (!res.ok) throw new Error(`${f.asset}: the source answered ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
  }
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== f.size) throw new Error(`${f.asset}: expected ${f.size} bytes, got ${bytes.length}`);
  if (sha !== f.sha256) throw new Error(`${f.asset}: checksum ${sha} does not match the pinned ${f.sha256}`);
  await writeFile(join(out, f.asset), bytes);
  console.log(`ok  ${f.asset}  ${bytes.length} bytes`);
}
console.log(`Wrote ${manifest.files.length} verified files to ${out}`);
