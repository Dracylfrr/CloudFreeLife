import { isTauri } from '../../core/storage';

export interface HttpResult {
  status: number;
  contentType: string;
  bytes: Uint8Array;
}

export type HttpGet = (url: string, opts?: { timeoutMs?: number; maxBytes?: number; accept?: string; onProgress?: (doneBytes: number, totalBytes: number) => void }) => Promise<HttpResult>;

export class NetworkError extends Error {
  constructor(message: string, readonly offline = true) {
    super(message);
    this.name = 'NetworkError';
  }
}

/** HTTPS GET with a timeout and a hard size cap. The only network entry point in the app. */
export const defaultHttpGet: HttpGet = async (url, opts = {}) => {
  if (!url.startsWith('https://')) throw new NetworkError('Only HTTPS requests are allowed', false);
  const { timeoutMs = 12000, maxBytes = 5 * 1024 * 1024, accept, onProgress } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const doFetch = isTauri() ? (await import('@tauri-apps/plugin-http')).fetch : fetch;
    const res = await doFetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        Accept: accept ?? 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      redirect: 'follow',
      cache: 'no-store'
    } as RequestInit);
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new NetworkError('Response is larger than allowed', false);
    let buf: Uint8Array;
    if (onProgress && res.body) {
      // a big download is read piece by piece so the person can see it moving
      const reader = res.body.getReader();
      const parts: Uint8Array[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += value.byteLength;
        if (got > maxBytes) throw new NetworkError('Response is larger than allowed', false);
        parts.push(value);
        onProgress(got, declared);
      }
      buf = new Uint8Array(got);
      let at = 0;
      for (const p of parts) {
        buf.set(p, at);
        at += p.byteLength;
      }
    } else buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new NetworkError('Response is larger than allowed', false);
    return { status: res.status, contentType: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(), bytes: buf };
  } catch (err) {
    if (err instanceof NetworkError) throw err;
    throw new NetworkError(ctrl.signal.aborted ? 'The request timed out' : 'Could not reach the update service');
  } finally {
    clearTimeout(timer);
  }
};

let impl: HttpGet = defaultHttpGet;
export const httpGet: HttpGet = (url, opts) => impl(url, opts);
/** Tests inject a fake network. */
export function setHttpGet(fn: HttpGet | null) {
  impl = fn ?? defaultHttpGet;
}
