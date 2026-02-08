/**
 * Generate kid-proportioned Jackson sprites (12-year-old).
 * Creates run.png, jump.png, slide.png in public/assets/sprites/jackson/.
 *
 * Usage: node scripts/generate-sprites.js
 */

import fs from 'fs';
import path from 'path';
import { deflateSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'sprites', 'jackson');

// ── Colors ──
const C = {
  transparent: [0, 0, 0, 0],
  hair:        [155, 120, 72, 255],
  hairDark:    [122, 92, 50, 255],
  hairLight:   [175, 140, 90, 255],
  skin:        [198, 134, 66, 255],
  skinDark:    [170, 110, 55, 255],
  eyeWhite:    [255, 255, 255, 255],
  eyePupil:    [45, 30, 20, 255],
  eyebrow:     [120, 88, 48, 255],
  smile:       [180, 100, 60, 255],
  hoodie:      [232, 141, 48, 255],
  hoodieDark:  [196, 112, 32, 255],
  hoodieLight: [255, 183, 77, 255],
  pants:       [91, 107, 63, 255],
  pantsDark:   [74, 86, 50, 255],
  shoes:       [61, 61, 61, 255],
  shoesSole:   [34, 34, 34, 255],
  watch:       [79, 195, 247, 255],
  white:       [255, 255, 255, 180],
  outline:     [40, 30, 20, 60],
};

// ── Pixel Buffer ──
class PixelBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4); // RGBA
  }

  setPixel(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    // Alpha blend
    const sa = color[3] / 255;
    const da = this.data[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    this.data[i]     = Math.round((color[0] * sa + this.data[i] * da * (1 - sa)) / oa);
    this.data[i + 1] = Math.round((color[1] * sa + this.data[i + 1] * da * (1 - sa)) / oa);
    this.data[i + 2] = Math.round((color[2] * sa + this.data[i + 2] * da * (1 - sa)) / oa);
    this.data[i + 3] = Math.round(oa * 255);
  }

  fillRect(x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        this.setPixel(x + dx, y + dy, color);
  }

  fillRoundRect(x, y, w, h, r, color) {
    this.fillRect(x + r, y, w - 2 * r, h, color);
    this.fillRect(x, y + r, w, h - 2 * r, color);
    this.fillCircle(x + r, y + r, r, color);
    this.fillCircle(x + w - r - 1, y + r, r, color);
    this.fillCircle(x + r, y + h - r - 1, r, color);
    this.fillCircle(x + w - r - 1, y + h - r - 1, r, color);
  }

  fillCircle(cx, cy, r, color) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r * r)
          this.setPixel(cx + dx, cy + dy, color);
  }

  fillEllipse(cx, cy, rx, ry, color) {
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++)
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1)
          this.setPixel(cx + dx, cy + dy, color);
  }

  toPNG() {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function crc32(buf) {
      let c = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
      return (c ^ 0xffffffff) >>> 0;
    }

    function chunk(type, data) {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      const td = Buffer.concat([Buffer.from(type), data]);
      const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
      return Buffer.concat([len, td, crc]);
    }

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

    // Raw image data with filter bytes
    const raw = [];
    for (let y = 0; y < this.h; y++) {
      const row = Buffer.alloc(1 + this.w * 4);
      row[0] = 0; // no filter
      for (let x = 0; x < this.w; x++) {
        const si = (y * this.w + x) * 4;
        const di = 1 + x * 4;
        row[di] = this.data[si];
        row[di + 1] = this.data[si + 1];
        row[di + 2] = this.data[si + 2];
        row[di + 3] = this.data[si + 3];
      }
      raw.push(row);
    }

    const compressed = deflateSync(Buffer.concat(raw));
    return Buffer.concat([
      signature,
      chunk('IHDR', ihdr),
      chunk('IDAT', compressed),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

// ── Draw Kid Character (front view, long brown hair) ──

function drawRunSpritesheet() {
  const FRAME_COUNT = 4;
  const W = 64, H = 96;
  const buf = new PixelBuffer(W * FRAME_COUNT, H);

  for (let i = 0; i < FRAME_COUNT; i++) {
    drawRunFrame(buf, i * W, W, H, i);
  }

  return buf.toPNG();
}

function drawRunFrame(buf, ox, W, H, frameIndex) {
  const cx = ox + W / 2;

  // ── Static parts (same every frame) ──
  const headCY = 17;
  const headR = 14;
  const torsoTop = 33;
  const torsoW = 30;
  const torsoH = 28;

  // ── Long hair behind body (drawn first so body overlaps) ──
  buf.fillRoundRect(cx - headR, headCY + 2, 7, 38, 3, C.hair);
  buf.fillRoundRect(cx - headR + 1, headCY + 6, 5, 34, 2, C.hairDark);
  buf.fillRoundRect(cx + headR - 7, headCY + 2, 7, 38, 3, C.hair);
  buf.fillRoundRect(cx + headR - 6, headCY + 6, 5, 34, 2, C.hairDark);
  // Hair tips taper
  buf.fillRoundRect(cx - headR + 1, headCY + 36, 4, 6, 2, C.hair);
  buf.fillRoundRect(cx + headR - 5, headCY + 36, 4, 6, 2, C.hair);

  // ── Hair top (full head shape) ──
  buf.fillCircle(cx, headCY, headR, C.hair);

  // ── Face (skin, lower portion of head) ──
  buf.fillEllipse(cx, headCY + 2, 10, 11, C.skin);

  // ── Hair bangs/fringe over forehead ──
  buf.fillEllipse(cx, headCY - 8, 12, 6, C.hair);
  buf.fillRoundRect(cx - 10, headCY - 11, 8, 8, 3, C.hair);
  buf.fillRoundRect(cx + 3, headCY - 10, 7, 6, 2, C.hair);
  // Hair highlight
  buf.fillRoundRect(cx - 8, headCY - 10, 5, 4, 2, C.hairLight);

  // ── Face features ──
  // Eyes
  buf.fillRect(cx - 6, headCY, 4, 3, C.eyeWhite);
  buf.fillRect(cx + 3, headCY, 4, 3, C.eyeWhite);
  buf.fillRect(cx - 5, headCY + 1, 2, 2, C.eyePupil);
  buf.fillRect(cx + 4, headCY + 1, 2, 2, C.eyePupil);
  // Eyebrows
  buf.fillRect(cx - 7, headCY - 2, 5, 1, C.eyebrow);
  buf.fillRect(cx + 3, headCY - 2, 5, 1, C.eyebrow);
  // Nose
  buf.setPixel(cx, headCY + 5, C.skinDark);
  buf.setPixel(cx + 1, headCY + 5, C.skinDark);
  // Smile
  buf.fillRect(cx - 3, headCY + 8, 7, 1, C.smile);
  buf.setPixel(cx - 3, headCY + 7, C.smile);
  buf.setPixel(cx + 3, headCY + 7, C.smile);

  // Ears (peeking from behind hair)
  buf.fillCircle(cx - 11, headCY + 3, 2, C.skin);
  buf.fillCircle(cx + 11, headCY + 3, 2, C.skin);

  // Neck
  buf.fillRect(cx - 4, 30, 8, 5, C.skin);

  // ── Hoodie / torso (front view) ──
  buf.fillRoundRect(cx - torsoW / 2, torsoTop, torsoW, torsoH, 5, C.hoodie);
  // Collar
  buf.fillRoundRect(cx - 8, torsoTop, 16, 5, 2, C.hoodieDark);
  // Front zipper line
  for (let y = torsoTop + 5; y < torsoTop + torsoH - 2; y += 2)
    buf.setPixel(cx, y, C.hoodieDark);
  // Hoodie pocket
  buf.fillRoundRect(cx - 8, torsoTop + 16, 16, 6, 2, C.hoodieDark);
  // Shoulder seams
  buf.fillRect(cx - torsoW / 2 + 2, torsoTop + 5, 3, 1, C.hoodieDark);
  buf.fillRect(cx + torsoW / 2 - 5, torsoTop + 5, 3, 1, C.hoodieDark);

  // ── Frame-dependent parts (arms + legs) ──
  const pantsTop = torsoTop + torsoH - 2; // = 59

  // Swing data: positive = extended back (longer/lower), negative = forward (shorter)
  const swingData = [
    { leftLegExt: -5, rightLegExt: 5,  leftArmExt: 5,  rightArmExt: -5 },
    { leftLegExt: 0,  rightLegExt: 0,  leftArmExt: 0,  rightArmExt: 0 },
    { leftLegExt: 5,  rightLegExt: -5, leftArmExt: -5, rightArmExt: 5 },
    { leftLegExt: 0,  rightLegExt: 0,  leftArmExt: 0,  rightArmExt: 0 },
  ];
  const s = swingData[frameIndex];

  // ── Left arm ──
  const leftArmBaseY = torsoTop + 4;
  const leftArmH = Math.max(18 + s.leftArmExt, 10);
  buf.fillRoundRect(cx - torsoW / 2 - 5, leftArmBaseY, 8, leftArmH, 3, C.hoodie);
  buf.fillRoundRect(cx - torsoW / 2 - 6, leftArmBaseY - 2, 8, 6, 2, C.hoodieDark);
  const leftHandY = leftArmBaseY + leftArmH;
  buf.fillCircle(cx - torsoW / 2 - 2, leftHandY, 3, C.skin);
  buf.fillRect(cx - torsoW / 2 - 4, leftHandY - 3, 5, 3, C.watch);

  // ── Right arm ──
  const rightArmBaseY = torsoTop + 4;
  const rightArmH = Math.max(18 + s.rightArmExt, 10);
  buf.fillRoundRect(cx + torsoW / 2 - 3, rightArmBaseY, 8, rightArmH, 3, C.hoodie);
  buf.fillRoundRect(cx + torsoW / 2 - 2, rightArmBaseY - 2, 8, 6, 2, C.hoodieDark);
  const rightHandY = rightArmBaseY + rightArmH;
  buf.fillCircle(cx + torsoW / 2 + 2, rightHandY, 3, C.skin);

  // ── Left leg ──
  const leftLegH = Math.max(20 + s.leftLegExt, 12);
  buf.fillRoundRect(cx - 10, pantsTop, 10, leftLegH, 3, C.pants);
  buf.fillRect(cx - 9, pantsTop + leftLegH - 4, 8, 3, C.pantsDark);

  // ── Right leg ──
  const rightLegH = Math.max(20 + s.rightLegExt, 12);
  buf.fillRoundRect(cx + 1, pantsTop, 10, rightLegH, 3, C.pants);
  buf.fillRect(cx + 2, pantsTop + rightLegH - 4, 8, 3, C.pantsDark);

  // ── Left shoe ──
  buf.fillRoundRect(cx - 12, pantsTop + leftLegH - 2, 12, 6, 2, C.shoes);
  buf.fillRect(cx - 12, pantsTop + leftLegH + 2, 12, 2, C.shoesSole);

  // ── Right shoe ──
  buf.fillRoundRect(cx + 1, pantsTop + rightLegH - 2, 12, 6, 2, C.shoes);
  buf.fillRect(cx + 1, pantsTop + rightLegH + 2, 12, 2, C.shoesSole);

  // ── Motion lines (subtle) ──
  for (let i = 0; i < 3; i++) {
    const y = 86 + i * 3;
    buf.fillRect(cx - 8 + i * 3, y, 6, 1, C.white);
  }
}

function drawJumpSprite() {
  const W = 64, H = 96;
  const buf = new PixelBuffer(W, H);
  const cx = W / 2;

  const headCY = 15;
  const headR = 14;
  const torsoTop = 30;
  const torsoW = 30;
  const torsoH = 26;

  // ── Long hair behind body (flowing up slightly from jump) ──
  buf.fillRoundRect(cx - headR, headCY + 2, 7, 34, 3, C.hair);
  buf.fillRoundRect(cx - headR + 1, headCY + 6, 5, 30, 2, C.hairDark);
  buf.fillRoundRect(cx + headR - 7, headCY + 2, 7, 34, 3, C.hair);
  buf.fillRoundRect(cx + headR - 6, headCY + 6, 5, 30, 2, C.hairDark);
  // Hair tips flare out (wind from jumping)
  buf.fillRoundRect(cx - headR - 1, headCY + 32, 5, 6, 2, C.hair);
  buf.fillRoundRect(cx + headR - 4, headCY + 32, 5, 6, 2, C.hair);

  // ── Hair top ──
  buf.fillCircle(cx, headCY, headR, C.hair);

  // ── Face ──
  buf.fillEllipse(cx, headCY + 2, 10, 11, C.skin);

  // ── Hair bangs ──
  buf.fillEllipse(cx, headCY - 8, 12, 6, C.hair);
  buf.fillRoundRect(cx - 10, headCY - 11, 8, 8, 3, C.hair);
  buf.fillRoundRect(cx + 3, headCY - 10, 7, 6, 2, C.hair);
  buf.fillRoundRect(cx - 8, headCY - 10, 5, 4, 2, C.hairLight);

  // ── Face features ──
  buf.fillRect(cx - 6, headCY, 4, 3, C.eyeWhite);
  buf.fillRect(cx + 3, headCY, 4, 3, C.eyeWhite);
  buf.fillRect(cx - 5, headCY + 1, 2, 2, C.eyePupil);
  buf.fillRect(cx + 4, headCY + 1, 2, 2, C.eyePupil);
  buf.fillRect(cx - 7, headCY - 2, 5, 1, C.eyebrow);
  buf.fillRect(cx + 3, headCY - 2, 5, 1, C.eyebrow);
  buf.setPixel(cx, headCY + 5, C.skinDark);
  buf.setPixel(cx + 1, headCY + 5, C.skinDark);
  // Open mouth (excited jump)
  buf.fillEllipse(cx, headCY + 8, 3, 2, C.smile);

  // Ears
  buf.fillCircle(cx - 11, headCY + 3, 2, C.skin);
  buf.fillCircle(cx + 11, headCY + 3, 2, C.skin);

  // Neck
  buf.fillRect(cx - 4, 28, 8, 4, C.skin);

  // ── Torso (front view) ──
  buf.fillRoundRect(cx - torsoW / 2, torsoTop, torsoW, torsoH, 5, C.hoodie);
  buf.fillRoundRect(cx - 8, torsoTop, 16, 5, 2, C.hoodieDark);
  for (let y = torsoTop + 5; y < torsoTop + torsoH - 2; y += 2)
    buf.setPixel(cx, y, C.hoodieDark);
  buf.fillRoundRect(cx - 8, torsoTop + 14, 16, 6, 2, C.hoodieDark);

  // ── Arms raised up ──
  buf.fillRoundRect(cx - torsoW / 2 - 6, torsoTop - 6, 8, 18, 3, C.hoodie);
  buf.fillCircle(cx - torsoW / 2 - 3, torsoTop - 8, 3, C.skin);
  buf.fillRect(cx - torsoW / 2 - 5, torsoTop + 8, 5, 3, C.watch);

  buf.fillRoundRect(cx + torsoW / 2 - 2, torsoTop - 4, 8, 16, 3, C.hoodie);
  buf.fillCircle(cx + torsoW / 2 + 2, torsoTop - 6, 3, C.skin);

  // ── Legs tucked ──
  const pantsTop = torsoTop + torsoH - 2;
  buf.fillRoundRect(cx - 12, pantsTop, 11, 16, 3, C.pants);
  buf.fillRoundRect(cx + 1, pantsTop, 11, 16, 3, C.pants);
  buf.fillRect(cx - 10, pantsTop + 12, 8, 3, C.pantsDark);
  buf.fillRect(cx + 3, pantsTop + 12, 8, 3, C.pantsDark);

  // ── Shoes ──
  buf.fillRoundRect(cx - 13, pantsTop + 14, 11, 5, 2, C.shoes);
  buf.fillRoundRect(cx + 2, pantsTop + 14, 11, 5, 2, C.shoes);
  buf.fillRect(cx - 13, pantsTop + 17, 11, 2, C.shoesSole);
  buf.fillRect(cx + 2, pantsTop + 17, 11, 2, C.shoesSole);

  // Jump boost lines
  const boostColor = [0, 191, 255, 140];
  for (let i = 0; i < 3; i++) {
    const x = cx - 8 + i * 8;
    const y = 78 + i * 4;
    buf.fillRect(x, y, 2, 8, boostColor);
    buf.fillRect(x - 1, y + 6, 4, 2, boostColor);
  }

  return buf.toPNG();
}

function drawSlideSprite() {
  const W = 80, H = 48;
  const buf = new PixelBuffer(W, H);
  const cy = H / 2;

  // Sliding / ducking — character is low and wide (front view)
  // Head on left side, legs extending right

  const headCX = 20;
  const headCY = cy - 4;
  const headR = 11;

  // ── Long hair behind body (spread out on ground) ──
  buf.fillRoundRect(headCX - headR - 2, headCY - 2, 8, 20, 3, C.hair);
  buf.fillRoundRect(headCX - headR - 1, headCY + 1, 6, 18, 2, C.hairDark);
  // Hair flowing behind head on ground
  buf.fillRoundRect(headCX - 6, headCY + headR - 2, 12, 8, 3, C.hair);
  buf.fillRoundRect(headCX - 4, headCY + headR, 8, 6, 2, C.hairDark);

  // ── Hair top ──
  buf.fillCircle(headCX, headCY, headR, C.hair);

  // ── Face ──
  buf.fillEllipse(headCX, headCY + 1, 8, 9, C.skin);

  // ── Hair bangs ──
  buf.fillEllipse(headCX, headCY - 6, 9, 5, C.hair);
  buf.fillRoundRect(headCX - 8, headCY - 8, 6, 5, 2, C.hair);
  buf.fillRoundRect(headCX + 3, headCY - 7, 5, 4, 2, C.hair);
  buf.fillRoundRect(headCX - 6, headCY - 7, 4, 3, 1, C.hairLight);

  // ── Face features ──
  buf.fillRect(headCX - 5, headCY - 1, 3, 2, C.eyeWhite);
  buf.fillRect(headCX + 2, headCY - 1, 3, 2, C.eyeWhite);
  buf.fillRect(headCX - 4, headCY, 2, 1, C.eyePupil);
  buf.fillRect(headCX + 3, headCY, 2, 1, C.eyePupil);
  buf.setPixel(headCX, headCY + 3, C.skinDark);
  buf.fillRect(headCX - 2, headCY + 5, 5, 1, C.smile);

  // ── Body (horizontal, sliding, front view) ──
  buf.fillRoundRect(headCX + 6, cy - 8, 30, 18, 4, C.hoodie);
  // Collar
  buf.fillRoundRect(headCX + 4, cy - 6, 8, 14, 2, C.hoodieDark);
  // Zipper line
  for (let x = headCX + 14; x < headCX + 34; x += 3)
    buf.setPixel(x, cy, C.hoodieDark);

  // Arms (tucked alongside body)
  buf.fillRoundRect(headCX + 8, cy - 12, 6, 8, 2, C.hoodie);
  buf.fillCircle(headCX + 11, cy - 13, 2, C.skin);
  buf.fillRect(headCX + 9, cy - 10, 4, 2, C.watch);

  buf.fillRoundRect(headCX + 8, cy + 6, 6, 8, 2, C.hoodie);
  buf.fillCircle(headCX + 11, cy + 14, 2, C.skin);

  // Legs (extended right)
  buf.fillRoundRect(headCX + 34, cy - 6, 20, 8, 3, C.pants);
  buf.fillRoundRect(headCX + 34, cy + 0, 20, 8, 3, C.pants);

  // Shoes
  buf.fillRoundRect(headCX + 52, cy - 6, 8, 7, 2, C.shoes);
  buf.fillRoundRect(headCX + 52, cy + 1, 8, 7, 2, C.shoes);

  // Ground slide lines
  const lineColor = [255, 255, 255, 100];
  for (let i = 0; i < 4; i++) {
    buf.fillRect(4 + i * 5, cy + 12 + (i % 2), 8, 1, lineColor);
  }

  return buf.toPNG();
}

// ── Generate ──
console.log('Generating kid-proportioned Jackson sprites...');

fs.writeFileSync(path.join(outDir, 'run.png'), drawRunSpritesheet());
console.log('  run.png');

fs.writeFileSync(path.join(outDir, 'jump.png'), drawJumpSprite());
console.log('  jump.png');

fs.writeFileSync(path.join(outDir, 'slide.png'), drawSlideSprite());
console.log('  slide.png');

console.log('Done! Sprites saved to public/assets/sprites/jackson/');
