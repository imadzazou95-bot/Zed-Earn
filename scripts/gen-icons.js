/**
 * gen-icons.js — generates the Zed Earn PWA icon set with a pure-JS PNG encoder
 * (no native deps). Draws a gradient tile with the white "Z" mark.
 *
 *   node scripts/gen-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ── CRC32 ─────────────────────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** rgba: Uint8Array of size w*h*4 */
function encodePNG(rgba, w, h) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Drawing ───────────────────────────────────────── */
const C1 = [37, 99, 235]; // #2563EB
const C2 = [79, 70, 229]; // #4F46E5

function coverage(px, py, S, maskable) {
  // returns { bg: 0..1 (tile alpha), fg: 0..1 (white Z alpha) } with 3x3 supersampling
  const pad = maskable ? S * 0.26 : S * 0.2;
  const radius = maskable ? 0 : S * 0.22;
  const x0 = pad;
  const x1 = S - pad;
  const y0 = pad;
  const y1 = S - pad;
  const t = (y1 - y0) * 0.19;
  const dyDiag = y1 - t - (y0 + t);
  const dxDiag = x0 - x1;
  const diagW = (t * Math.hypot(dxDiag, dyDiag)) / dyDiag;

  let bg = 0;
  let fg = 0;
  const N = 3;
  for (let sy = 0; sy < N; sy++) {
    for (let sx = 0; sx < N; sx++) {
      const x = px + (sx + 0.5) / N;
      const y = py + (sy + 0.5) / N;

      // rounded-square background
      let inside = true;
      if (radius > 0) {
        const cx = Math.min(Math.max(x, radius), S - radius);
        const cy = Math.min(Math.max(y, radius), S - radius);
        inside = Math.hypot(x - cx, y - cy) <= radius;
      }
      if (inside) bg += 1;

      // "Z" mark
      let onZ = false;
      if (x >= x0 && x <= x1) {
        if (y >= y0 && y <= y0 + t) onZ = true;
        else if (y >= y1 - t && y <= y1) onZ = true;
        else if (y > y0 + t && y < y1 - t) {
          const k = (y - (y0 + t)) / dyDiag;
          const cxLine = x1 + k * dxDiag;
          if (Math.abs(x - cxLine) <= diagW / 2) onZ = true;
        }
      }
      if (onZ && inside) fg += 1;
    }
  }
  const total = N * N;
  return { bg: bg / total, fg: fg / total };
}

function render(S, maskable) {
  const out = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const { bg, fg } = coverage(x, y, S, maskable);
      const k = (x + y) / (2 * S); // diagonal gradient
      const r = Math.round(C1[0] + (C2[0] - C1[0]) * k);
      const g = Math.round(C1[1] + (C2[1] - C1[1]) * k);
      const b = Math.round(C1[2] + (C2[2] - C1[2]) * k);
      const i = (y * S + x) * 4;
      out[i] = Math.round(r + (255 - r) * fg);
      out[i + 1] = Math.round(g + (255 - g) * fg);
      out[i + 2] = Math.round(b + (255 - b) * fg);
      out[i + 3] = Math.round(255 * bg);
    }
  }
  return encodePNG(out, S, S);
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

const dir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });
targets.forEach((t) => {
  fs.writeFileSync(path.join(dir, t.file), render(t.size, t.maskable));
  console.log(`✓ public/icons/${t.file} (${t.size}x${t.size})`);
});
