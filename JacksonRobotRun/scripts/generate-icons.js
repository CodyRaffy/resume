/**
 * Generate PWA icons for Jackson Robot Run.
 * Creates 192x192 and 512x512 PNG icons in public/icons/.
 *
 * Usage: node scripts/generate-icons.js
 *
 * This uses only Node.js built-ins — no external dependencies needed.
 * It creates a simple branded icon with the game's theme colors.
 */

import fs from 'fs';
import path from 'path';
import { deflateSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Create a minimal valid PNG file with a colored background and text.
 * Since we can't use canvas in pure Node, we generate a BMP-style approach
 * via raw pixel data encoded as PNG.
 */
function createPNG(width, height) {
  // We'll build a raw PNG from scratch
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Background color: #1a1a2e
  const bgR = 0x1a, bgG = 0x1a, bgB = 0x2e;
  // Accent color: bright cyan/teal for the robot theme
  const fgR = 0x00, fgG = 0xd4, fgB = 0xff;

  // Build raw pixel data with filter byte per row
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3); // filter byte + RGB
    row[0] = 0; // no filter

    for (let x = 0; x < width; x++) {
      const offset = 1 + x * 3;
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.4;

      if (dist < radius) {
        // Draw a circle with robot-like "JR" symbol
        // Inner circle area
        const innerRadius = radius * 0.75;

        if (dist < innerRadius) {
          // Check if we should draw letter pixels
          const normX = (x - cx) / (innerRadius);
          const normY = (y - cy) / (innerRadius);

          let isLetter = false;

          // "J" letter (left side)
          const jLeft = -0.55, jRight = -0.05;
          const jTop = -0.55, jBottom = 0.55;
          const jBarThick = 0.15;
          // Top bar of J
          if (normX >= jLeft && normX <= jRight && normY >= jTop && normY <= jTop + jBarThick) isLetter = true;
          // Vertical stroke of J (right side)
          if (normX >= jRight - jBarThick && normX <= jRight && normY >= jTop && normY <= jBottom) isLetter = true;
          // Bottom curve of J
          if (normX >= jLeft && normX <= jRight && normY >= jBottom - jBarThick && normY <= jBottom) isLetter = true;
          // Left uptick of J
          if (normX >= jLeft && normX <= jLeft + jBarThick && normY >= jBottom - jBarThick * 2.5 && normY <= jBottom) isLetter = true;

          // "R" letter (right side)
          const rLeft = 0.1, rRight = 0.6;
          const rTop = -0.55, rBottom = 0.55;
          const rBarThick = 0.15;
          const rMid = 0.0;
          // Vertical stroke of R
          if (normX >= rLeft && normX <= rLeft + rBarThick && normY >= rTop && normY <= rBottom) isLetter = true;
          // Top bar of R
          if (normX >= rLeft && normX <= rRight && normY >= rTop && normY <= rTop + rBarThick) isLetter = true;
          // Middle bar of R
          if (normX >= rLeft && normX <= rRight && normY >= rMid - rBarThick / 2 && normY <= rMid + rBarThick / 2) isLetter = true;
          // Right side of R bump
          if (normX >= rRight - rBarThick && normX <= rRight && normY >= rTop && normY <= rMid) isLetter = true;
          // Diagonal leg of R
          const legProgress = (normY - rMid) / (rBottom - rMid);
          if (legProgress > 0 && legProgress <= 1) {
            const legX = rLeft + rBarThick + legProgress * (rRight - rLeft - rBarThick);
            if (normX >= legX - rBarThick / 2 && normX <= legX + rBarThick / 2 && normY > rMid) isLetter = true;
          }

          if (isLetter) {
            row[offset] = fgR;
            row[offset + 1] = fgG;
            row[offset + 2] = fgB;
          } else {
            row[offset] = bgR;
            row[offset + 1] = bgG;
            row[offset + 2] = bgB;
          }
        } else {
          // Ring area between inner and outer radius
          row[offset] = fgR;
          row[offset + 1] = fgG;
          row[offset + 2] = fgB;
        }
      } else {
        // Background
        row[offset] = bgR;
        row[offset + 1] = bgG;
        row[offset + 2] = bgB;
      }
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);

  // Compress with zlib (deflate)
  const compressed = deflateSync(rawData);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const icon192 = createPNG(192, 192);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
console.log('Created icon-192.png');

const icon512 = createPNG(512, 512);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
console.log('Created icon-512.png');

console.log('PWA icons generated in public/icons/');
