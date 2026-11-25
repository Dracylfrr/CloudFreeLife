// Copies the speech engine's two small runtime files into public/tts so the app can load them
// from itself (nothing is fetched from the internet). Run automatically before dev and build.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const from = resolve('node_modules/onnxruntime-web/dist');
const to = resolve('public/tts');
mkdirSync(to, { recursive: true });
for (const f of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  if (!existsSync(resolve(from, f))) throw new Error(`Missing ${f}. Run npm install first.`);
  copyFileSync(resolve(from, f), resolve(to, f));
}
console.log('Voice engine files copied to public/tts');
