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
  shoes:       [255, 130, 20, 255],    // Orange crocs
  shoesDark:   [220, 105, 10, 255],    // Croc shadow/detail
  shoesSole:   [200, 90, 5, 255],      // Darker orange sole
  shoesHole:   [240, 160, 70, 120],    // Translucent holes on crocs
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

  // ── Left croc ──
  buf.fillRoundRect(cx - 13, pantsTop + leftLegH - 2, 14, 7, 3, C.shoes);
  buf.fillRect(cx - 13, pantsTop + leftLegH + 3, 14, 2, C.shoesSole);
  // Croc holes
  buf.setPixel(cx - 10, pantsTop + leftLegH, C.shoesHole);
  buf.setPixel(cx - 7, pantsTop + leftLegH, C.shoesHole);
  buf.setPixel(cx - 4, pantsTop + leftLegH + 1, C.shoesHole);
  // Heel strap
  buf.fillRect(cx - 3, pantsTop + leftLegH - 1, 2, 5, C.shoesDark);

  // ── Right croc ──
  buf.fillRoundRect(cx, pantsTop + rightLegH - 2, 14, 7, 3, C.shoes);
  buf.fillRect(cx, pantsTop + rightLegH + 3, 14, 2, C.shoesSole);
  // Croc holes
  buf.setPixel(cx + 3, pantsTop + rightLegH, C.shoesHole);
  buf.setPixel(cx + 6, pantsTop + rightLegH, C.shoesHole);
  buf.setPixel(cx + 9, pantsTop + rightLegH + 1, C.shoesHole);
  // Heel strap
  buf.fillRect(cx + 12, pantsTop + rightLegH - 1, 2, 5, C.shoesDark);

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

  // ── Crocs ──
  buf.fillRoundRect(cx - 14, pantsTop + 13, 13, 6, 3, C.shoes);
  buf.fillRoundRect(cx + 1, pantsTop + 13, 13, 6, 3, C.shoes);
  buf.fillRect(cx - 14, pantsTop + 17, 13, 2, C.shoesSole);
  buf.fillRect(cx + 1, pantsTop + 17, 13, 2, C.shoesSole);
  // Croc holes
  buf.setPixel(cx - 11, pantsTop + 15, C.shoesHole);
  buf.setPixel(cx - 8, pantsTop + 15, C.shoesHole);
  buf.setPixel(cx + 4, pantsTop + 15, C.shoesHole);
  buf.setPixel(cx + 7, pantsTop + 15, C.shoesHole);
  // Heel straps
  buf.fillRect(cx - 3, pantsTop + 14, 2, 4, C.shoesDark);
  buf.fillRect(cx + 12, pantsTop + 14, 2, 4, C.shoesDark);

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

  // Baseball-style sideways slide: body leaning, one leg extended, one tucked
  // Viewed from behind — character slides feet-first to the right

  const groundY = H - 6; // ground line

  // ── Extended leg (right, stretched out low along ground) ──
  buf.fillRoundRect(42, groundY - 10, 24, 9, 3, C.pants);
  buf.fillRect(43, groundY - 6, 22, 3, C.pantsDark);
  // Croc on extended leg
  buf.fillRoundRect(63, groundY - 11, 14, 8, 3, C.shoes);
  buf.fillRect(63, groundY - 5, 14, 2, C.shoesSole);
  buf.setPixel(66, groundY - 9, C.shoesHole);
  buf.setPixel(69, groundY - 9, C.shoesHole);
  buf.setPixel(72, groundY - 8, C.shoesHole);

  // ── Tucked leg (left, bent underneath) ──
  buf.fillRoundRect(30, groundY - 14, 16, 9, 3, C.pants);
  buf.fillRect(31, groundY - 10, 14, 3, C.pantsDark);
  // Croc on tucked leg
  buf.fillRoundRect(25, groundY - 11, 12, 7, 3, C.shoes);
  buf.fillRect(25, groundY - 6, 12, 2, C.shoesSole);
  buf.setPixel(28, groundY - 9, C.shoesHole);
  buf.setPixel(31, groundY - 9, C.shoesHole);

  // ── Body / torso (leaning sideways, tilted) ──
  // Torso angled — higher on left (head side), lower on right (legs side)
  buf.fillRoundRect(18, groundY - 30, 26, 20, 4, C.hoodie);
  // Hood detail
  buf.fillRoundRect(20, groundY - 30, 14, 5, 2, C.hoodieDark);
  // Back seam
  for (let y = groundY - 24; y < groundY - 12; y += 2)
    buf.setPixel(31, y, C.hoodieDark);

  // ── Arms ──
  // Left arm (reaching forward/down to brace)
  buf.fillRoundRect(12, groundY - 18, 8, 14, 3, C.hoodie);
  buf.fillCircle(15, groundY - 5, 3, C.skin);
  buf.fillRect(13, groundY - 8, 5, 3, C.watch);

  // Right arm (tucked back)
  buf.fillRoundRect(38, groundY - 26, 7, 12, 3, C.hoodie);
  buf.fillCircle(41, groundY - 15, 2, C.skin);

  // ── Head (leaning forward, side/back view) ──
  const headCX = 18;
  const headCY = groundY - 36;
  const headR = 10;

  // Hair (back/side view)
  buf.fillCircle(headCX, headCY, headR, C.hair);
  buf.fillEllipse(headCX - 2, headCY - 2, 3, 6, C.hairDark);
  buf.fillEllipse(headCX + 2, headCY - 4, 4, 3, C.hairLight);
  // Hair flowing back from speed
  buf.fillRoundRect(headCX - headR - 3, headCY - 4, 8, 12, 3, C.hair);
  buf.fillRoundRect(headCX - headR - 2, headCY - 2, 6, 10, 2, C.hairDark);

  // Ear (visible on the side)
  buf.fillCircle(headCX + headR - 1, headCY + 2, 2, C.skin);

  // Neck
  buf.fillRect(headCX - 2, headCY + headR - 2, 8, 5, C.skin);

  // ── Speed/slide lines ──
  const lineColor = [255, 255, 255, 120];
  buf.fillRect(2, groundY - 20, 8, 1, lineColor);
  buf.fillRect(4, groundY - 14, 6, 1, lineColor);
  buf.fillRect(1, groundY - 8, 9, 1, lineColor);

  // ── Ground dust particles ──
  const dustColor = [200, 200, 200, 80];
  buf.fillCircle(50, groundY - 2, 3, dustColor);
  buf.fillCircle(58, groundY - 1, 2, dustColor);
  buf.fillCircle(44, groundY - 1, 2, dustColor);

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
