import Phaser from 'phaser';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../config/GameConfig';

/**
 * Expected Jackson sprite files in public/assets/sprites/jackson/:
 *   run.png   – running pose (approx 64x96 or similar portrait ratio)
 *   jump.png  – jumping pose
 *   slide.png – sliding/crouching pose (wider, shorter)
 *
 * If any image is missing, a procedural placeholder is generated instead.
 */
const RUN_FRAME_COUNT = 4;

const JACKSON_SPRITES: { key: string; file: string; w: number; h: number; spritesheet?: boolean }[] = [
  { key: 'player', file: 'assets/sprites/jackson/run.png', w: PLAYER_WIDTH, h: PLAYER_HEIGHT, spritesheet: true },
  { key: 'player-jump', file: 'assets/sprites/jackson/jump.png', w: PLAYER_WIDTH, h: PLAYER_HEIGHT },
  { key: 'player-slide', file: 'assets/sprites/jackson/slide.png', w: 80, h: 48 },
];

export class BootScene extends Phaser.Scene {
  private failedImages: Set<string> = new Set();

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x3498db, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Track images that fail to load so we can generate placeholders
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.failedImages.add(file.key);
    });

    // Attempt to load real Jackson sprite images
    for (const sprite of JACKSON_SPRITES) {
      if (sprite.spritesheet) {
        this.load.spritesheet(sprite.key, sprite.file, {
          frameWidth: sprite.w,
          frameHeight: sprite.h,
        });
      } else {
        this.load.image(sprite.key, sprite.file);
      }
    }
  }

  create(): void {
    // Generate placeholder textures for any Jackson sprites that failed to load
    const playerKeys = new Map([
      ['player', 'run'],
      ['player-jump', 'jump'],
      ['player-slide', 'slide'],
    ]);

    for (const [key, pose] of playerKeys) {
      if (this.failedImages.has(key) || !this.textures.exists(key)) {
        const spec = JACKSON_SPRITES.find(s => s.key === key)!;
        this.createPlayerTexture(key, spec.w, spec.h, pose === 'slide' ? 0x2471A3 : pose === 'jump' ? 0x2980B9 : 0x3498DB, pose);
      }
    }

    // Create run animation if spritesheet loaded successfully
    if (this.textures.exists('player') && !this.failedImages.has('player')) {
      const tex = this.textures.get('player');
      if (tex.frameTotal > 2) {
        this.anims.create({
          key: 'player-run',
          frames: this.anims.generateFrameNumbers('player', { start: 0, end: RUN_FRAME_COUNT - 1 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }

    // Player shadow
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.3);
    shadowGfx.fillEllipse(32, 8, 50, 16);
    shadowGfx.generateTexture('player-shadow', 64, 16);
    shadowGfx.destroy();

    // Always generate non-player placeholders (obstacles, collectibles, particles)
    this.createObstacleTextures();
    this.createCollectibleTextures();
    this.createParticleTexture();

    this.scene.start('MenuScene');
  }

  private createObstacleTextures(): void {
    this.createRobotTexture('robot-ground', 80, 56, 0xE74C3C, 'short');
    this.createRobotTexture('robot-tall', 76, 180, 0xC0392B, 'tall');
    this.createRobotTexture('robot-lane', 80, 80, 0xE74C3C, 'medium');
    this.createRobotTexture('robot-flying', 72, 56, 0x9B59B6, 'flying');
    this.createPlatformTexture('robot-platform', 64, 36);
    this.createBarTexture('robot-bar', 100, 24);
  }

  private createCollectibleTextures(): void {
    this.createCollectibleTexture('collect-bronze', 24, 0xCD7F32);
    this.createCollectibleTexture('collect-silver', 24, 0xC0C0C0);
    this.createCollectibleTexture('collect-gold', 24, 0xFFD700);
    this.createCollectibleTexture('collect-special', 28, 0x00FF88);
  }

  private createParticleTexture(): void {
    const partGfx = this.add.graphics();
    partGfx.fillStyle(0xFFFFFF, 1);
    partGfx.fillCircle(4, 4, 4);
    partGfx.generateTexture('particle', 8, 8);
    partGfx.destroy();
  }

  private createPlayerTexture(key: string, w: number, h: number, color: number, pose: string): void {
    const g = this.add.graphics();

    // Front-facing fallback with long brown hair

    // Long hair behind body
    g.fillStyle(0x9B7848, 1);
    g.fillRoundedRect(w * 0.1, h * 0.05, w * 0.25, h * 0.55, 4);
    g.fillRoundedRect(w * 0.65, h * 0.05, w * 0.25, h * 0.55, 4);

    // Hair top
    g.fillCircle(w / 2, h * 0.15, w * 0.22);

    // Face (skin)
    g.fillStyle(0xC6863E, 1);
    g.fillCircle(w / 2, h * 0.17, w * 0.17);

    // Hair bangs
    g.fillStyle(0x9B7848, 1);
    g.fillRoundedRect(w * 0.2, h * 0.02, w * 0.6, h * 0.1, 4);

    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(w * 0.32, h * 0.14, w * 0.12, h * 0.04);
    g.fillRect(w * 0.58, h * 0.14, w * 0.12, h * 0.04);
    g.fillStyle(0x2D1E14, 1);
    g.fillRect(w * 0.35, h * 0.15, w * 0.06, h * 0.03);
    g.fillRect(w * 0.61, h * 0.15, w * 0.06, h * 0.03);

    // Smile
    g.lineStyle(1, 0xB4643C, 1);
    g.lineBetween(w * 0.38, h * 0.22, w * 0.62, h * 0.22);

    // Body (hoodie)
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.15, h * 0.28, w * 0.7, h * 0.45, 8);

    // Collar
    g.fillStyle((color * 0.85) | 0, 1);
    g.fillRoundedRect(w * 0.3, h * 0.28, w * 0.4, h * 0.05, 3);

    // Front zipper
    g.lineStyle(1, 0x000000, 0.15);
    g.lineBetween(w / 2, h * 0.33, w / 2, h * 0.7);

    if (pose === 'run') {
      g.fillStyle((color * 0.8) | 0, 1);
      g.fillRoundedRect(w * 0.2, h * 0.72, w * 0.22, h * 0.28, 4);
      g.fillRoundedRect(w * 0.55, h * 0.72, w * 0.22, h * 0.22, 4);
    } else if (pose === 'jump') {
      g.fillStyle((color * 0.8) | 0, 1);
      g.fillRoundedRect(w * 0.2, h * 0.7, w * 0.25, h * 0.18, 4);
      g.fillRoundedRect(w * 0.52, h * 0.7, w * 0.25, h * 0.18, 4);
      g.lineStyle(2, 0x00BFFF, 0.7);
      g.lineBetween(w * 0.3, h * 0.95, w * 0.2, h);
      g.lineBetween(w * 0.5, h * 0.95, w * 0.5, h);
      g.lineBetween(w * 0.7, h * 0.95, w * 0.8, h);
    } else if (pose === 'slide') {
      // Sideways baseball slide — body tilted, legs kicked out

      // Clear and redraw everything for the slide pose
      g.clear();

      // Legs extended to the right (kicked out)
      g.fillStyle((color * 0.8) | 0, 1);
      g.fillRoundedRect(w * 0.5, h * 0.55, w * 0.48, h * 0.2, 4);   // front leg
      g.fillRoundedRect(w * 0.45, h * 0.7, w * 0.45, h * 0.18, 4);  // back leg

      // Shoes
      g.fillStyle(0x333333, 1);
      g.fillRoundedRect(w * 0.88, h * 0.55, w * 0.1, h * 0.12, 2);
      g.fillRoundedRect(w * 0.82, h * 0.72, w * 0.1, h * 0.1, 2);

      // Body tilted sideways
      g.fillStyle(color, 1);
      g.fillRoundedRect(w * 0.12, h * 0.3, w * 0.45, h * 0.45, 6);

      // Arm trailing behind
      g.fillStyle((color * 0.85) | 0, 1);
      g.fillRoundedRect(w * 0.0, h * 0.2, w * 0.2, h * 0.15, 3);

      // Head tilted
      g.fillStyle(0x9B7848, 1);
      g.fillCircle(w * 0.18, h * 0.2, w * 0.14);   // hair
      g.fillStyle(0xC6863E, 1);
      g.fillCircle(w * 0.2, h * 0.22, w * 0.1);    // face

      // Hair flowing behind
      g.fillStyle(0x9B7848, 1);
      g.fillRoundedRect(w * 0.02, h * 0.08, w * 0.2, h * 0.15, 4);

      // Speed lines
      g.lineStyle(1.5, 0xFFFFFF, 0.4);
      g.lineBetween(w * 0.0, h * 0.45, w * 0.08, h * 0.45);
      g.lineBetween(w * 0.0, h * 0.55, w * 0.1, h * 0.55);
      g.lineBetween(w * 0.0, h * 0.65, w * 0.06, h * 0.65);

      // No outline needed — speed lines convey motion
    }

    if (pose !== 'slide') {
      // Outline
      g.lineStyle(2, 0xFFFFFF, 0.3);
      g.strokeRoundedRect(w * 0.15, h * 0.28, w * 0.7, h * 0.45, 8);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createRobotTexture(key: string, w: number, h: number, color: number, variant: string): void {
    const drawH = variant === 'tall' ? h + 12 : h; // Extra space for spikes on tall
    const yOff = variant === 'tall' ? 12 : 0; // Offset body down to make room for spikes
    const g = this.add.graphics();

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, yOff + h * 0.2, w - 8, h * 0.65, 6);

    // Head
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.2, yOff, w * 0.6, h * 0.3, 4);

    // Evil eyes (scaled for larger robots)
    const eyeSize = Math.max(4, w * 0.07);
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(w * 0.35, yOff + h * 0.12, eyeSize);
    g.fillCircle(w * 0.65, yOff + h * 0.12, eyeSize);

    // Angry brow
    g.lineStyle(2, 0x333333, 1);
    g.lineBetween(w * 0.22, yOff + h * 0.06, w * 0.42, yOff + h * 0.1);
    g.lineBetween(w * 0.78, yOff + h * 0.06, w * 0.58, yOff + h * 0.1);

    if (variant === 'flying') {
      // Wings
      g.fillStyle(0xDDDDDD, 0.6);
      g.fillTriangle(0, h * 0.35, w * 0.15, h * 0.25, w * 0.15, h * 0.45);
      g.fillTriangle(w, h * 0.35, w * 0.85, h * 0.25, w * 0.85, h * 0.45);
    }

    if (variant === 'tall') {
      // Spikes on top - clearly cannot jump over
      g.fillStyle(0xFFFF00, 1);
      const spikeCount = 5;
      const spikeW = (w * 0.6) / spikeCount;
      for (let i = 0; i < spikeCount; i++) {
        const sx = w * 0.2 + i * spikeW;
        g.fillTriangle(sx, yOff, sx + spikeW / 2, yOff - 10, sx + spikeW, yOff);
      }

      // Warning "X" on body
      g.lineStyle(3, 0xFFFF00, 0.8);
      const cx = w / 2;
      const cy = yOff + h * 0.55;
      g.lineBetween(cx - 10, cy - 10, cx + 10, cy + 10);
      g.lineBetween(cx + 10, cy - 10, cx - 10, cy + 10);
    }

    if (variant === 'short') {
      // Up arrow on body - hint that you can jump over
      g.fillStyle(0xFFFFFF, 0.6);
      const ax = w / 2;
      const ay = yOff + h * 0.4;
      g.fillTriangle(ax, ay - 6, ax - 7, ay + 2, ax + 7, ay + 2);
      g.fillRect(ax - 3, ay + 2, 6, 8);
    }

    // Danger stripes on body
    g.lineStyle(2, 0x000000, 0.3);
    for (let i = 0; i < 3; i++) {
      const sy = yOff + h * 0.4 + i * (h * 0.12);
      g.lineBetween(8, sy, w - 8, sy);
    }

    // Outline
    g.lineStyle(2, 0xFFFFFF, 0.4);
    g.strokeRoundedRect(4, yOff + h * 0.2, w - 8, h * 0.65, 6);

    g.generateTexture(key, w, drawH);
    g.destroy();
  }

  private createBarTexture(key: string, w: number, h: number): void {
    const g = this.add.graphics();

    // Support pillars on each side
    g.fillStyle(0x7F8C8D, 1);
    g.fillRect(2, 0, 6, h);
    g.fillRect(w - 8, 0, 6, h);

    // Main horizontal bar (orange/yellow industrial pipe)
    g.fillStyle(0xF39C12, 1);
    g.fillRoundedRect(0, h * 0.2, w, h * 0.5, 3);

    // Hazard stripes
    g.lineStyle(2, 0x000000, 0.4);
    for (let sx = 6; sx < w - 6; sx += 10) {
      g.lineBetween(sx, h * 0.2, sx + 5, h * 0.7);
    }

    // Highlight on top of bar
    g.fillStyle(0xF1C40F, 0.6);
    g.fillRect(8, h * 0.2, w - 16, 3);

    // Down arrow indicators (duck hint)
    g.fillStyle(0xFFFFFF, 0.7);
    const arrowX = w / 2;
    const arrowY = h * 0.55;
    g.fillTriangle(arrowX, arrowY + 4, arrowX - 5, arrowY - 2, arrowX + 5, arrowY - 2);

    // Bolts on pillars
    g.fillStyle(0x95A5A6, 1);
    g.fillCircle(5, 3, 2);
    g.fillCircle(5, h - 3, 2);
    g.fillCircle(w - 5, 3, 2);
    g.fillCircle(w - 5, h - 3, 2);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createPlatformTexture(key: string, w: number, h: number): void {
    const springH = h + 16; // Extra height for spring
    const g = this.add.graphics();

    // Base plate (bottom)
    g.fillStyle(0x7F8C8D, 1);
    g.fillRoundedRect(w * 0.15, springH - 8, w * 0.7, 8, 2);

    // Spring coils
    const coilColor = 0x27AE60;
    const coilHighlight = 0x2ECC71;
    const coilCount = 4;
    const coilTop = 10;
    const coilBottom = springH - 10;
    const coilSpacing = (coilBottom - coilTop) / coilCount;

    g.lineStyle(3, coilColor, 1);
    for (let i = 0; i < coilCount; i++) {
      const cy = coilTop + i * coilSpacing + coilSpacing * 0.5;
      const leftX = w * 0.2;
      const rightX = w * 0.8;
      // Draw zig-zag spring coils
      g.lineBetween(leftX, cy - coilSpacing * 0.3, rightX, cy);
      g.lineBetween(rightX, cy, leftX, cy + coilSpacing * 0.3);
    }

    // Highlight on coils
    g.lineStyle(1.5, coilHighlight, 0.5);
    for (let i = 0; i < coilCount; i++) {
      const cy = coilTop + i * coilSpacing + coilSpacing * 0.5;
      const leftX = w * 0.22;
      const rightX = w * 0.78;
      g.lineBetween(leftX, cy - coilSpacing * 0.3 - 1, rightX, cy - 1);
    }

    // Top pad (the part you bounce off)
    g.fillStyle(0xE74C3C, 1);
    g.fillRoundedRect(w * 0.1, 2, w * 0.8, 10, 3);
    g.fillStyle(0xEC7063, 1);
    g.fillRect(w * 0.15, 2, w * 0.7, 4);

    // Upward arrow indicator (jump hint)
    g.fillStyle(0xFFFFFF, 0.8);
    const arrowX = w / 2;
    g.fillTriangle(arrowX, 0, arrowX - 5, 6, arrowX + 5, 6);

    g.generateTexture(key, w, springH);
    g.destroy();
  }

  private createCollectibleTexture(key: string, size: number, color: number): void {
    const g = this.add.graphics();
    const cx = size;
    const cy = size;

    // Glowing circle body
    g.fillStyle(color, 0.3);
    g.fillCircle(cx, cy, size);
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy, size * 0.7);

    // Happy face
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(cx - size * 0.22, cy - size * 0.12, 3);
    g.fillCircle(cx + size * 0.22, cy - size * 0.12, 3);

    // Smile
    g.lineStyle(1.5, 0xFFFFFF, 0.8);
    g.beginPath();
    g.arc(cx, cy, size * 0.3, 0.1, Math.PI - 0.1, false);
    g.strokePath();

    // Bolt/gear detail
    g.lineStyle(2, 0xFFFFFF, 0.4);
    g.strokeCircle(cx, cy, size * 0.5);

    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }
}
