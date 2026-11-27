/**
 * A small Ogg container writer for Opus audio (RFC 3533 / RFC 7845), so the pack tool can save what the
 * browser's own Opus encoder makes as plain `.opus` files, which the app's web view plays natively.
 */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    t[i] = r >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0;
  for (let i = 0; i < data.length; i++) c = ((c << 8) ^ CRC[((c >>> 24) ^ data[i]) & 255]) >>> 0;
  return c >>> 0;
}

function page(serial: number, seq: number, flags: number, granule: bigint, packets: Uint8Array[]): Uint8Array {
  const lacing: number[] = [];
  for (const p of packets) {
    let n = p.length;
    while (n >= 255) {
      lacing.push(255);
      n -= 255;
    }
    lacing.push(n);
  }
  const body = packets.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(27 + lacing.length + body);
  const v = new DataView(out.buffer);
  out.set([0x4f, 0x67, 0x67, 0x53, 0, flags]);
  v.setBigUint64(6, BigInt.asUintN(64, granule), true);
  v.setUint32(14, serial, true);
  v.setUint32(18, seq, true);
  out[26] = lacing.length;
  out.set(lacing, 27);
  let at = 27 + lacing.length;
  for (const p of packets) {
    out.set(p, at);
    at += p.length;
  }
  v.setUint32(22, crc32(out), true);
  return out;
}

export interface OpusPacket {
  data: Uint8Array;
  /** How many samples at 48,000 a second this packet holds. */
  samples48: number;
}

/** `head` is the OpusHead packet from the encoder. Returns the whole .opus file. */
export function writeOggOpus(head: Uint8Array, packets: OpusPacket[], vendor = 'Project D.R.E.A.M'): Uint8Array {
  const serial = (Math.random() * 0xffffffff) >>> 0;
  const pages: Uint8Array[] = [];
  const enc = new TextEncoder();
  const v = enc.encode(vendor);
  const tags = new Uint8Array(8 + 4 + v.length + 4);
  tags.set(enc.encode('OpusTags'));
  new DataView(tags.buffer).setUint32(8, v.length, true);
  tags.set(v, 12);
  pages.push(page(serial, 0, 0x02, 0n, [head]));
  pages.push(page(serial, 1, 0, 0n, [tags]));
  const preSkip = head.length >= 12 ? head[10] | (head[11] << 8) : 312;
  let seq = 2;
  let granule = BigInt(preSkip);
  for (let i = 0; i < packets.length; ) {
    const group: Uint8Array[] = [];
    let segs = 0;
    while (i < packets.length && group.length < 50) {
      const n = Math.floor(packets[i].data.length / 255) + 1;
      if (segs + n > 255) break;
      group.push(packets[i].data);
      segs += n;
      granule += BigInt(packets[i].samples48);
      i++;
    }
    pages.push(page(serial, seq++, i >= packets.length ? 0x04 : 0, granule, group));
  }
  const total = pages.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of pages) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
