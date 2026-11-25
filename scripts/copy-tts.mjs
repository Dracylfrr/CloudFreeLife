// Copies the speech engine's two small runtime files into public/tts so the app can load them
// from itself (nothing is fetched from the internet). Run automatically before dev and build.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const from = resolve('node_modules/onnxruntime-web/dist');
const to = resolve('public/tts');
mkdirSync(to, { recursive: true });
// the first two run the speech model on the processor; the "jsep" pair adds the graphics chip
for (const f of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  if (!existsSync(resolve(from, f))) throw new Error(`Missing ${f}. Run npm install first.`);
  copyFileSync(resolve(from, f), resolve(to, f));
}
console.log('Voice engine files copied to public/tts');
