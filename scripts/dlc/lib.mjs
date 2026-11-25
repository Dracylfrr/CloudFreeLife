// Premium content: the formats and the crypto, in one place. No secrets live in this file.
//
//   Encrypted pack  (.dreampack)  JSON: { format: 2, premium: true, id, name, kind, version, minAppVersion,
//                                         description, nonce: base64(12 bytes), data: base64(AES-256-GCM ciphertext + tag) }
//                                 The plaintext is an ordinary .cfpack. The GCM "associated data" is "<id>:<version>",
//                                 so a pack cannot be swapped for another one or relabelled.
//   License         (.dreamlicense) JSON: { format: 1, id, issued: "YYYY-MM-DD", expires: "YYYY-MM-DD" | null,
//                                         packs: [{ id, key: base64(32 bytes) }], sig: base64(Ed25519 signature) }
//                                 The signature covers licenseMessage() below. The app holds only the PUBLIC key,
//                                 so it can check a license but can never make one.
//
// The Rust side (src-tauri/src/premium.rs) implements exactly the same two formats; the fixture test keeps them honest.
import { createCipheriv, createDecipheriv, createPrivateKey, createPublicKey, randomBytes, sign, verify } from 'node:crypto';

export const PACK_FORMAT = 2;
export const LICENSE_FORMAT = 1;
export const LICENSE_MAGIC = 'DREAMLIC1';

const ID_RE = /^[a-z0-9][a-z0-9_]{0,63}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const newKey = () => randomBytes(32);

/** The exact bytes a license signature covers. Simple on purpose, so every language builds it identically. */
export function licenseMessage(l) {
  const packs = l.packs.map((p) => `${p.id}:${p.key}`).join(',');
  return Buffer.from(`${LICENSE_MAGIC}\n${l.id}\n${l.issued}\n${l.expires ?? ''}\n${packs}`, 'utf8');
}

export function packAad(id, version) {
  return Buffer.from(`${id}:${version}`, 'utf8');
}

/** plain: the bytes of a .cfpack. Returns the .dreampack text. */
export function encryptPack(plain, meta, key) {
  if (!ID_RE.test(meta.id)) throw new Error('bad pack id');
  if (key.length !== 32) throw new Error('key must be 32 bytes');
  const nonce = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, nonce);
  c.setAAD(packAad(meta.id, meta.version));
  const data = Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]);
  return JSON.stringify({
    format: PACK_FORMAT,
    premium: true,
    id: meta.id,
    name: meta.name,
    kind: meta.kind,
    version: meta.version,
    minAppVersion: meta.minAppVersion,
    description: meta.description ?? '',
    nonce: nonce.toString('base64'),
    data: data.toString('base64')
  });
}

export function decryptPack(text, key) {
  const p = JSON.parse(text);
  if (p.format !== PACK_FORMAT) throw new Error('not an encrypted pack');
  const data = Buffer.from(p.data, 'base64');
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(p.nonce, 'base64'));
  d.setAAD(packAad(p.id, p.version));
  d.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
}

/** Builds and signs a license. privatePem: the Ed25519 private key (PKCS#8 PEM). */
export function makeLicense({ id, issued, expires = null, packs }, privatePem) {
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) throw new Error('bad license id');
  if (!DATE_RE.test(issued) || (expires !== null && !DATE_RE.test(expires))) throw new Error('dates must look like 2027-01-31');
  for (const p of packs) if (!ID_RE.test(p.id) || Buffer.from(p.key, 'base64').length !== 32) throw new Error(`bad pack entry ${p.id}`);
  const body = { format: LICENSE_FORMAT, id, issued, expires, packs };
  const sig = sign(null, licenseMessage(body), createPrivateKey(privatePem)).toString('base64');
  return { ...body, sig };
}

/** The 32-byte public key (raw) of a PKCS#8 private key or an SPKI public key. */
export function publicKeyBytes(pem) {
  const spki = createPublicKey(pem).export({ type: 'spki', format: 'der' });
  return spki.subarray(spki.length - 32);
}

export function verifyLicense(l, publicPem) {
  try {
    return verify(null, licenseMessage(l), createPublicKey(publicPem), Buffer.from(l.sig, 'base64'));
  } catch {
    return false;
  }
}

/** "0x12, 0x34, ..." for pasting into premium.rs. */
export const rustBytes = (b) => [...b].map((x) => `0x${x.toString(16).padStart(2, '0')}`).join(', ');
