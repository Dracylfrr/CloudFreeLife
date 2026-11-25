/**
 * The voice files: one speech model, a small table that turns sounds into numbers, and nine voices.
 * They are not part of the app. A person who wants spoken stories downloads them once (about 93 MB),
 * and they are kept in the app's own folder. Every file is checked against a checksum that is
 * written into the app, so a damaged or swapped file is never used.
 *
 * The files are open (Apache-2.0) copies of the Kokoro-82M model, published as a release of this
 * project so the app only ever downloads from one place. See docs/VOICES.md.
 */
import { GITHUB_REPO } from '../../core/config';
import { getStorage } from '../../core/storage';
import { sha256Hex, digestsEqual } from '../updates/checksum';
import { httpGet } from '../updates/http';
import { isTrustedDownloadUrl } from '../updates/release';
import { VOICE_IDS } from './casts';
import { VOICE_BYTES } from './synth';

export const VOICE_RELEASE_TAG = 'voices_v1.0.0';
export const VOICE_DIR = 'voices';

export interface ModelFile {
  /** The file's name on the release. */
  asset: string;
  /** Where it is kept, inside the app's data folder. */
  path: string;
  sha256: string;
  size: number;
}

const VOICE_SUMS: Record<string, string> = {
  af_nicole: 'cd2191ab31b914ed7b318416b0e4440fdf392ddad9106a060819aa600a64f59a',
  af_bella: 'f69d836209b78eb8c66e75e3cda491e26ea838a3674257e9d4e5703cbaf55c8b',
  af_sarah: '4409fbc125afabacc615d94db5398d847006a737b0247d6892b7a9a0007a2f0a',
  bf_emma: '669fe0647f9dd04fcab92f1439a40eeb4c8b4ab1f82e4996fe3d918ce4a63b73',
  bf_isabella: '3754352c4aaa46d17f27654ab7518d65b62ad6163a0f55a5f4330c2da2c4e94f',
  am_michael: '1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1',
  am_onyx: 'da5d135b424164916d75a68ffb4c2abce3d7d5ccc82dd1ee6cf447ce286145e6',
  am_santa: '61150cf726ab6c5ed7a99f90a304f91f5a72c00c592e89ec94e5df11c319227a',
  bm_lewis: 'b8f671cef828c30e66fdf0b0756a76bba58f6bb3398cbbf27058642acbcedb97'
};

export const MODEL_FILES: ModelFile[] = [
  { asset: 'kokoro-tokenizer.json', path: `${VOICE_DIR}/tokenizer.json`, sha256: '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34', size: 3497 },
  ...VOICE_IDS.map((id) => ({ asset: `kokoro-voice-${id}.bin`, path: `${VOICE_DIR}/${id}.bin`, sha256: VOICE_SUMS[id], size: VOICE_BYTES })),
  { asset: 'kokoro-model_quantized.onnx', path: `${VOICE_DIR}/model.onnx`, sha256: 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478', size: 92361116 }
];
export const MODEL_BYTES = MODEL_FILES.reduce((n, f) => n + f.size, 0);

export const modelUrl = (f: ModelFile) => `https://github.com/${GITHUB_REPO}/releases/download/${VOICE_RELEASE_TAG}/${f.asset}`;

export interface ModelStatus {
  installed: boolean;
  /** Files still to be downloaded. */
  missing: ModelFile[];
}

/** Which of the files are in place. Cheap: only sizes are looked at. */
export async function modelStatus(): Promise<ModelStatus> {
  const st = await getStorage();
  const missing: ModelFile[] = [];
  for (const f of MODEL_FILES) {
    let ok = false;
    try {
      const b = await st.readBytes(f.path);
      ok = !!b && b.byteLength === f.size;
    } catch {
      ok = false;
    }
    if (!ok) missing.push(f);
  }
  return { installed: missing.length === 0, missing };
}

export type DownloadResult = { ok: true } | { ok: false; message: string };

/**
 * Downloads whatever is missing, one file at a time, checking each against its checksum before it
 * is kept. Safe to run again after a failure: files that are already in place are not fetched twice.
 */
export async function downloadModel(onProgress: (doneBytes: number, totalBytes: number) => void = () => {}): Promise<DownloadResult> {
  const st = await getStorage();
  const { missing } = await modelStatus();
  const have = MODEL_BYTES - missing.reduce((n, f) => n + f.size, 0);
  let done = have;
  onProgress(done, MODEL_BYTES);
  for (const f of missing) {
    const url = modelUrl(f);
    if (!isTrustedDownloadUrl(url, VOICE_RELEASE_TAG, f.asset)) return { ok: false, message: 'The download address was not trusted.' };
    let res;
    const base = done;
    try {
      res = await httpGet(url, {
        accept: 'application/octet-stream',
        maxBytes: f.size + 1024,
        timeoutMs: 20 * 60 * 1000,
        onProgress: (d) => onProgress(Math.min(MODEL_BYTES, base + d), MODEL_BYTES)
      });
    } catch {
      return { ok: false, message: 'The voices could not be downloaded. Check your connection and try again; what was already downloaded is kept.' };
    }
    if (res.status === 404) return { ok: false, message: 'The voices are not available to download yet.' };
    if (res.status !== 200) return { ok: false, message: `The download failed (status ${res.status}).` };
    if (res.bytes.byteLength !== f.size) return { ok: false, message: 'A downloaded file was the wrong size and was thrown away.' };
    if (!digestsEqual(await sha256Hex(res.bytes), f.sha256)) return { ok: false, message: 'A downloaded file did not match its checksum and was thrown away.' };
    try {
      await st.writeBytes(f.path, res.bytes);
    } catch {
      return { ok: false, message: 'The voice files could not be saved.' };
    }
    done = base + f.size;
    onProgress(done, MODEL_BYTES);
  }
  return { ok: true };
}

export async function removeModel(): Promise<void> {
  await (await getStorage()).remove(VOICE_DIR);
}
