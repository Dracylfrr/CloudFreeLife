// Makes the small test files the Rust tests read (src-tauri/fixtures). They use a throwaway key that is
// public on purpose: it only exists to prove that Rust and Node agree on the formats.
//   node scripts/dlc/make-fixture.mjs
import { createPrivateKey } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptPack, makeLicense, publicKeyBytes } from './lib.mjs';

const out = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../src-tauri/fixtures');
mkdirSync(out, { recursive: true });

const seed = Buffer.alloc(32, 7);
const pem = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' }).export({ type: 'pkcs8', format: 'pem' });
const packKey = Buffer.alloc(32, 0x42);
const otherKey = Buffer.alloc(32, 0x24);

const plain = Buffer.from(JSON.stringify({ format: 1, kind: 'stories', id: 'fixture_pack', name: 'Fixture Pack', version: '1.0.0', minAppVersion: '1.8.0', files: {} }), 'utf8');
const meta = { id: 'fixture_pack', name: 'Fixture Pack', kind: 'stories', version: '1.0.0', minAppVersion: '1.8.0', description: 'for tests' };

const w = (name, data) => writeFileSync(resolve(out, name), data);
w('public-key.hex', publicKeyBytes(pem).toString('hex'));
w('plain.cfpack', plain);
w('fixture_pack_v1.0.0.dreampack', encryptPack(plain, meta, packKey));
// the same pack under another version, labelled as 1.0.1 but encrypted for 1.0.0's identity (must be refused)
const relabelled = JSON.parse(encryptPack(plain, meta, packKey));
relabelled.version = '1.0.1';
w('relabelled.dreampack', JSON.stringify(relabelled));
const lic = (extra = {}, packs = [{ id: 'fixture_pack', key: packKey.toString('base64') }]) => makeLicense({ id: 'fixture-license', issued: '2026-01-01', packs, ...extra }, pem);
w('good.dreamlicense', JSON.stringify(lic()));
w('expired.dreamlicense', JSON.stringify(lic({ expires: '2026-02-01' })));
w('future.dreamlicense', JSON.stringify(lic({ expires: '2999-01-01' })));
w('wrongkey.dreamlicense', JSON.stringify(lic({}, [{ id: 'fixture_pack', key: otherKey.toString('base64') }])));
w('otherpack.dreamlicense', JSON.stringify(lic({}, [{ id: 'some_other_pack', key: packKey.toString('base64') }])));
const tampered = lic();
tampered.packs.push({ id: 'extra_pack', key: otherKey.toString('base64') });
w('tampered.dreamlicense', JSON.stringify(tampered));
console.log('Wrote fixtures to', out);
