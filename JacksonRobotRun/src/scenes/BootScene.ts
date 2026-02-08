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
const JACKSON_SPRITES: { key: string; file: string; w: number; h: number }[] = [
  { key: 'player', file: 'assets/sprites/jackson/run.png', w: PLAYER_WIDTH, h: PLAYER_HEIGHT },
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
      this.load.image(sprite.key, sprite.file);
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
    this.createRobotTexture('robot-ground', 56, 48, 0xE74C3C, 'short');
    this.createRobotTexture('robot-tall', 48, 100, 0xC0392B, 'tall');
    this.createRobotTexture('robot-lane', 56, 72, 0xE74C3C, 'medium');
    this.createRobotTexture('robot-flying', 56, 48, 0x9B59B6, 'flying');
    this.createPlatformTexture('robot-platform', 64, 36);
    this.createBarTexture('robot-bar', 72, 20);
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

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.15, h * 0.2, w * 0.7, h * 0.55, 8);

    // Head
    g.fillStyle(color, 1);
    g.fillCircle(w / 2, h * 0.15, w * 0.22);

    // Eyes (visor)
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRoundedRect(w * 0.22, h * 0.08, w * 0.56, h * 0.1, 4);
    g.fillStyle(0x00BFFF, 1);
    g.fillCircle(w * 0.38, h * 0.13, 3);
    g.fillCircle(w * 0.62, h * 0.13, 3);

    if (pose === 'run') {
      // Legs in running pose
      g.fillStyle(color * 0.8 | 0, 1);
      g.fillRoundedRect(w * 0.2, h * 0.72, w * 0.22, h * 0.28, 4);
      g.fillRoundedRect(w * 0.55, h * 0.72, w * 0.22, h * 0.22, 4);
    } else if (pose === 'jump') {
      // Legs tucked
      g.fillStyle(color * 0.8 | 0, 1);
      g.fillRoundedRect(w * 0.2, h * 0.7, w * 0.25, h * 0.18, 4);
      g.fillRoundedRect(w * 0.52, h * 0.7, w * 0.25, h * 0.18, 4);
      // Jump boost lines
      g.lineStyle(2, 0x00BFFF, 0.7);
      g.lineBetween(w * 0.3, h * 0.95, w * 0.2, h);
      g.lineBetween(w * 0.5, h * 0.95, w * 0.5, h);
      g.lineBetween(w * 0.7, h * 0.95, w * 0.8, h);
    } else if (pose === 'slide') {
      // Sliding — wide and flat
      g.fillStyle(color * 0.8 | 0, 1);
      g.fillRoundedRect(w * 0.05, h * 0.6, w * 0.4, h * 0.35, 4);
      g.fillRoundedRect(w * 0.55, h * 0.6, w * 0.4, h * 0.35, 4);
    }

    // Outline
    g.lineStyle(2, 0xFFFFFF, 0.3);
    g.strokeRoundedRect(w * 0.15, h * 0.2, w * 0.7, h * 0.55, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createRobotTexture(key: string, w: number, h: number, color: number, variant: string): void {
    const g = this.add.graphics();

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, h * 0.2, w - 8, h * 0.65, 6);

    // Head
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.2, 0, w * 0.6, h * 0.3, 4);

    // Evil eyes
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(w * 0.35, h * 0.12, 4);
    g.fillCircle(w * 0.65, h * 0.12, 4);

    // Angry brow
    g.lineStyle(2, 0x333333, 1);
    g.lineBetween(w * 0.22, h * 0.06, w * 0.42, h * 0.1);
    g.lineBetween(w * 0.78, h * 0.06, w * 0.58, h * 0.1);

    if (variant === 'flying') {
      // Wings
      g.fillStyle(0xDDDDDD, 0.6);
      g.fillTriangle(0, h * 0.35, w * 0.15, h * 0.25, w * 0.15, h * 0.45);
      g.fillTriangle(w, h * 0.35, w * 0.85, h * 0.25, w * 0.85, h * 0.45);
    }

    if (variant === 'tall') {
      // Antenna
      g.lineStyle(2, 0xFFFF00, 1);
      g.lineBetween(w / 2, 0, w / 2, -8);
      g.fillStyle(0xFFFF00, 1);
      g.fillCircle(w / 2, -8, 3);
    }

    // Danger stripes on body
    g.lineStyle(2, 0x000000, 0.3);
    for (let i = 0; i < 3; i++) {
      const sy = h * 0.4 + i * (h * 0.12);
      g.lineBetween(8, sy, w - 8, sy);
    }

    // Outline
    g.lineStyle(2, 0xFFFFFF, 0.4);
    g.strokeRoundedRect(4, h * 0.2, w - 8, h * 0.65, 6);

    g.generateTexture(key, w, h);
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
    const g = this.add.graphics();
    const color = 0x27AE60;

    // Main crate body
    g.fillStyle(color, 1);
    g.fillRoundedRect(2, 4, w - 4, h - 4, 4);

    // Top surface (lighter, flat top you can land on)
    g.fillStyle(0x2ECC71, 1);
    g.fillRect(2, 4, w - 4, 8);

    // Metal frame edges
    g.lineStyle(2, 0x1E8449, 1);
    g.strokeRoundedRect(2, 4, w - 4, h - 4, 4);

    // Cross brace pattern (like a cargo crate)
    g.lineStyle(1.5, 0x1E8449, 0.6);
    g.lineBetween(2, 4, w - 2, h);
    g.lineBetween(w - 2, 4, 2, h);

    // Upward arrow indicator (jump hint)
    g.fillStyle(0xFFFFFF, 0.7);
    const arrowX = w / 2;
    const arrowY = h * 0.35;
    g.fillTriangle(arrowX, arrowY - 6, arrowX - 6, arrowY + 2, arrowX + 6, arrowY + 2);
    g.fillRect(arrowX - 2.5, arrowY + 2, 5, 6);

    // Corner bolts
    g.fillStyle(0x85929E, 1);
    g.fillCircle(8, 10, 2.5);
    g.fillCircle(w - 8, 10, 2.5);
    g.fillCircle(8, h - 4, 2.5);
    g.fillCircle(w - 8, h - 4, 2.5);

    g.generateTexture(key, w, h);
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
