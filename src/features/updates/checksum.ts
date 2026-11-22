/** SHA-256 helpers built on Web Crypto (available in the webview and in Node). */

export async function sha256Hex(data: Uint8Array | ArrayBuffer): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Copy into a fresh ArrayBuffer so SharedArrayBuffer-backed views are accepted.
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-structure comparison of two hex digests (case-insensitive). */
export function digestsEqual(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export async function verifyChecksum(data: Uint8Array, expectedHex: string): Promise<boolean> {
  return digestsEqual(await sha256Hex(data), expectedHex);
}
