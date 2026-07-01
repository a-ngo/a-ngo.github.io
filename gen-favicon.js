/**
 * gen-favicon.js — generate the site's PNG favicons from scratch, no dependencies.
 *
 * Draws the lime terminal-caret (the same glyph as the inline SVG favicon) on a
 * dark square and writes it as a hand-rolled PNG. Run it whenever the brand color
 * or caret shape changes:
 *
 *   node gen-favicon.js
 *
 * Pipeline: render() rasterizes the caret into raw RGB pixels, then png() wraps
 * those bytes in the minimal PNG chunk structure (zlib handles the compression).
 * Uses only Node built-ins (fs, zlib).
 */

const fs = require('fs');
const zlib = require('zlib');

/* ============================================================
   Shape + palette (the "what to draw")
   ============================================================ */

const BG = [12, 12, 12];      // #0c0c0c — dark square background
const FG = [216, 251, 80];    // #d8fb50 — lime caret stroke
/** Caret polyline in a 0..32 coordinate space (matches the SVG path "M11 9 L20 16 L11 23"). */
const PTS = [[11, 9], [20, 16], [11, 23]];
const HALF = 1.9;             // half the stroke width; round caps/joins fall out of the distance test

/* ============================================================
   Geometry — distance from a pixel to the caret
   ============================================================ */

/**
 * Shortest distance from point (px, py) to the line segment a–b.
 * @param {number} px - Point x.
 * @param {number} py - Point y.
 * @param {[number, number]} a - Segment start [x, y].
 * @param {[number, number]} b - Segment end [x, y].
 * @returns {number} Euclidean distance to the nearest point on the segment.
 */
function distToSeg(px, py, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = px - a[0], wy = py - a[1];
  const c1 = vx * wx + vy * wy;
  const c2 = vx * vx + vy * vy;
  let t = c2 ? c1 / c2 : 0; t = Math.max(0, Math.min(1, t));   // clamp the projection onto the segment
  const dx = px - (a[0] + t * vx), dy = py - (a[1] + t * vy);
  return Math.hypot(dx, dy);
}

/**
 * Distance from a point to the whole caret (the minimum over its segments).
 * @param {number} px - Point x, in the 0..32 space.
 * @param {number} py - Point y, in the 0..32 space.
 * @returns {number} Distance to the nearest part of the caret stroke.
 */
function caretDist(px, py) {
  let d = Infinity;
  for (let i = 0; i < PTS.length - 1; i++) d = Math.min(d, distToSeg(px, py, PTS[i], PTS[i + 1]));
  return d;
}

/* ============================================================
   Rasterization — caret -> raw RGB pixels
   ============================================================ */

/**
 * Render the caret into raw PNG scanline bytes at N×N pixels. Each pixel is
 * supersampled and the resulting coverage blends FG over BG for anti-aliasing.
 * @param {number} N - Output size in pixels (width = height).
 * @returns {Buffer} Raw pixels as PNG scanlines: a filter byte then N RGB
 *   triples per row — the exact input zlib-deflated into the IDAT chunk.
 */
function render(N) {
  const SS = 4;                       // supersampling factor (SS×SS samples per pixel)
  const raw = Buffer.alloc(N * (N * 3 + 1));
  let o = 0;
  for (let y = 0; y < N; y++) {
    raw[o++] = 0;                     // PNG per-scanline filter byte (0 = none)
    for (let x = 0; x < N; x++) {
      let cov = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const u = (x + (sx + 0.5) / SS) / N * 32;   // map pixel+subsample into 0..32 space
        const v = (y + (sy + 0.5) / SS) / N * 32;
        if (caretDist(u, v) <= HALF) cov++;
      }
      const a = cov / (SS * SS);       // coverage in [0, 1]
      raw[o++] = Math.round(BG[0] + (FG[0] - BG[0]) * a);
      raw[o++] = Math.round(BG[1] + (FG[1] - BG[1]) * a);
      raw[o++] = Math.round(BG[2] + (FG[2] - BG[2]) * a);
    }
  }
  return raw;
}

/* ============================================================
   PNG container — wrap pixels into a valid file
   ============================================================ */

/**
 * CRC-32 (the variant PNG uses) over a buffer.
 * @param {Buffer} buf - Bytes to checksum (chunk type + data).
 * @returns {number} Unsigned 32-bit CRC.
 */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}

/**
 * Build one PNG chunk: length, type, data, and CRC, in PNG's required layout.
 * @param {string} type - 4-character ASCII chunk type, e.g. "IHDR".
 * @param {Buffer} data - Chunk payload.
 * @returns {Buffer} The complete chunk ready to concatenate into the file.
 */
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

/**
 * Render and write a single square PNG favicon to disk.
 * @param {number} N - Icon size in pixels (width = height).
 * @param {string} file - Output path, e.g. "assets/favicon-32.png".
 */
function png(N, file) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8;   // bit depth: 8 bits per channel
  ihdr[9] = 2;   // color type 2 = truecolor RGB
  const idat = zlib.deflateSync(render(N), { level: 9 });
  const out = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),   // PNG signature
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, out);
  console.log('wrote', file, out.length, 'bytes');
}

/* ============================================================
   Outputs
   ============================================================ */

png(32, 'assets/favicon-32.png');     // browser tab icon
png(180, 'assets/apple-touch-icon.png');   // iOS home-screen icon
