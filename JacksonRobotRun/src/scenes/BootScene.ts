import Phaser from 'phaser';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../config/GameConfig';
import { ThemeManager, CustomSpriteData } from '../managers/ThemeManager';
import { ThemeDefinition } from '../config/ThemeConfig';

/**
 * Expected player sprite files in public/assets/sprites/jackson/:
 *   run.png   – running pose (back-facing, approx 64x96)
 *   jump.png  – jumping pose (back-facing)
 *   slide.png – sliding/crouching pose (back-facing, wider, shorter)
 *
 * Users can also upload custom photos which override these files.
 * If any image is missing, a procedural placeholder is generated instead.
 */
const PLAYER_SPRITES: { key: string; file: string; w: number; h: number }[] = [
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
    // Initialize theme manager from localStorage
    ThemeManager.init();

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

    // Attempt to load real player sprite images
    for (const sprite of PLAYER_SPRITES) {
      if (sprite.key === 'player') {
        // Run sprite is a spritesheet with multiple animation frames
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
    const theme = ThemeManager.getTheme();
    const customSprites = ThemeManager.getCustomSprites();

    // Load custom user sprites if available (override loaded files)
    this.loadCustomSprites(customSprites);

    // Generate placeholder textures for any player sprites that failed to load
    // and don't have custom overrides
    const playerKeys = new Map([
      ['player', 'run'],
      ['player-jump', 'jump'],
      ['player-slide', 'slide'],
    ]);

    for (const [key, pose] of playerKeys) {
      const customKey = pose as keyof CustomSpriteData;
      if (!customSprites[customKey] && (this.failedImages.has(key) || !this.textures.exists(key))) {
        const spec = PLAYER_SPRITES.find(s => s.key === key)!;
        this.createPlayerTexture(key, spec.w, spec.h, pose === 'slide' ? 0x2471A3 : pose === 'jump' ? 0x2980B9 : 0x3498DB, pose);
      }
    }

    // Create run animation from spritesheet if the player texture has multiple frames
    if (this.anims.exists('player-run')) {
      this.anims.remove('player-run');
    }
    const playerTex = this.textures.get('player');
    if (playerTex && playerTex.frameTotal > 2) {
      this.anims.create({
        key: 'player-run',
        frames: this.anims.generateFrameNumbers('player', {
          start: 0,
          end: playerTex.frameTotal - 2,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Player shadow
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.3);
    shadowGfx.fillEllipse(32, 8, 50, 16);
    shadowGfx.generateTexture('player-shadow', 64, 16);
    shadowGfx.destroy();

    // Generate themed obstacle, collectible, and particle textures
    this.createObstacleTextures(theme);
    this.createCollectibleTextures(theme);
    this.createParticleTexture();

    this.scene.start('MenuScene');
  }

  /**
   * If the user has uploaded custom photos, create textures from their data URLs.
   */
  private loadCustomSprites(customSprites: CustomSpriteData): void {
    const mapping: [keyof CustomSpriteData, string][] = [
      ['run', 'player'],
      ['jump', 'player-jump'],
      ['slide', 'player-slide'],
    ];

    for (const [pose, key] of mapping) {
      const dataUrl = customSprites[pose];
      if (dataUrl) {
        // Remove existing texture if present
        if (this.textures.exists(key)) {
          this.textures.remove(key);
        }
        // Create from data URL
        const img = new Image();
        img.src = dataUrl;
        this.textures.addImage(key, img);
      }
    }
  }

  // --- Themed obstacle textures ---

  private createObstacleTextures(theme: ThemeDefinition): void {
    const c = theme.colors;
    this.createObstacleTexture('robot-ground', 56, 48, c.obstacle, 'short', theme);
    this.createObstacleTexture('robot-tall', 48, 100, c.obstacleDark, 'tall', theme);
    this.createObstacleTexture('robot-lane', 56, 72, c.obstacle, 'medium', theme);
    this.createObstacleTexture('robot-flying', 56, 48, c.obstacleFlying, 'flying', theme);
    this.createPlatformTexture();
    this.createBarTexture();
  }

  private createCollectibleTextures(theme: ThemeDefinition): void {
    const c = theme.colors;
    this.createCollectibleTexture('collect-bronze', 24, c.collectBronze, theme);
    this.createCollectibleTexture('collect-silver', 24, c.collectSilver, theme);
    this.createCollectibleTexture('collect-gold', 24, c.collectGold, theme);
    this.createCollectibleTexture('collect-special', 28, c.collectSpecial, theme);
  }

  private createParticleTexture(): void {
    const partGfx = this.add.graphics();
    partGfx.fillStyle(0xFFFFFF, 1);
    partGfx.fillCircle(4, 4, 4);
    partGfx.generateTexture('particle', 8, 8);
    partGfx.destroy();
  }

  private createPlatformTexture(): void {
    const g = this.add.graphics();
    const w = 56;
    const h = 48;

    // Base plate
    g.fillStyle(0x888888, 1);
    g.fillRoundedRect(4, h - 10, w - 8, 10, 3);

    // Spring coils
    g.lineStyle(3, 0x27AE60, 1);
    const coilLeft = w * 0.25;
    const coilRight = w * 0.75;
    for (let i = 0; i < 4; i++) {
      const cy = h - 14 - i * 7;
      g.lineBetween(coilLeft, cy, coilRight, cy - 3);
      g.lineBetween(coilRight, cy - 3, coilLeft, cy - 6);
    }

    // Top pad
    g.fillStyle(0x2ECC71, 1);
    g.fillRoundedRect(2, 2, w - 4, 10, 4);
    g.fillStyle(0x27AE60, 1);
    g.fillRoundedRect(2, 8, w - 4, 4, { tl: 0, tr: 0, bl: 4, br: 4 });

    // Highlight
    g.lineStyle(1, 0xFFFFFF, 0.5);
    g.strokeRoundedRect(2, 2, w - 4, 10, 4);

    g.generateTexture('robot-platform', w, h);
    g.destroy();
  }

  private createBarTexture(): void {
    const g = this.add.graphics();
    const w = 72;
    const h = 56;
    // Support posts extending down
    g.fillStyle(0x999999, 1);
    g.fillRect(6, 10, 8, h - 10);
    g.fillRect(w - 14, 10, 8, h - 10);
    // Post caps
    g.fillStyle(0xAAAAAA, 1);
    g.fillRect(4, h - 6, 12, 6);
    g.fillRect(w - 16, h - 6, 12, 6);
    // Horizontal beam at top
    g.fillStyle(0xF39C12, 1);
    g.fillRoundedRect(0, 0, w, 14, 4);
    // Beam highlight
    g.fillStyle(0xF9CF49, 1);
    g.fillRect(2, 2, w - 4, 5);
    // Hazard stripes on beam
    g.lineStyle(2, 0xCC0000, 0.5);
    for (let sx = 8; sx < w - 8; sx += 14) {
      g.lineBetween(sx, 3, sx + 8, 11);
    }
    // Border
    g.lineStyle(1, 0xFFFFFF, 0.4);
    g.strokeRoundedRect(0, 0, w, 14, 4);
    g.generateTexture('robot-bar', w, h);
    g.destroy();
  }

  // --- Player placeholder (back-facing) ---

  private createPlayerTexture(key: string, w: number, h: number, color: number, pose: string): void {
    const g = this.add.graphics();

    // Back-facing view: character runs INTO the screen (away from camera)

    // Body (back of hoodie)
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.15, h * 0.2, w * 0.7, h * 0.55, 8);

    // Head (back of head - just the round shape, no face)
    g.fillStyle(color, 1);
    g.fillCircle(w / 2, h * 0.15, w * 0.22);

    // Hair (visible from behind - covers back of head)
    g.fillStyle(0x9B7848, 1);
    g.fillCircle(w / 2, h * 0.14, w * 0.21);
    g.fillRoundedRect(w * 0.28, h * 0.08, w * 0.44, h * 0.18, 6);

    // Hood bunched at neck
    g.fillStyle((color * 0.85) | 0, 1);
    g.fillRoundedRect(w * 0.25, h * 0.22, w * 0.5, h * 0.06, 3);

    // Back seam line on hoodie
    g.lineStyle(1, 0x000000, 0.15);
    g.lineBetween(w / 2, h * 0.26, w / 2, h * 0.7);

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
      g.fillStyle((color * 0.8) | 0, 1);
      g.fillRoundedRect(w * 0.05, h * 0.6, w * 0.4, h * 0.35, 4);
      g.fillRoundedRect(w * 0.55, h * 0.6, w * 0.4, h * 0.35, 4);
    }

    g.lineStyle(2, 0xFFFFFF, 0.3);
    g.strokeRoundedRect(w * 0.15, h * 0.2, w * 0.7, h * 0.55, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // --- Themed obstacle textures ---

  private createObstacleTexture(key: string, w: number, h: number, color: number, variant: string, theme: ThemeDefinition): void {
    const g = this.add.graphics();
    const style = theme.obstacleStyle;

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, h * 0.2, w - 8, h * 0.65, 6);

    // Head
    g.fillStyle(color, 1);
    g.fillRoundedRect(w * 0.2, 0, w * 0.6, h * 0.3, 4);

    // Eyes
    g.fillStyle(style.eyeColor, 1);
    g.fillCircle(w * 0.35, h * 0.12, 4);
    g.fillCircle(w * 0.65, h * 0.12, 4);

    // Angry brow
    g.lineStyle(2, 0x333333, 1);
    g.lineBetween(w * 0.22, h * 0.06, w * 0.42, h * 0.1);
    g.lineBetween(w * 0.78, h * 0.06, w * 0.58, h * 0.1);

    if (variant === 'flying' && style.hasWings) {
      g.fillStyle(0xDDDDDD, 0.6);
      g.fillTriangle(0, h * 0.35, w * 0.15, h * 0.25, w * 0.15, h * 0.45);
      g.fillTriangle(w, h * 0.35, w * 0.85, h * 0.25, w * 0.85, h * 0.45);
    }

    if (variant === 'tall' && style.hasAntenna) {
      g.lineStyle(2, 0xFFFF00, 1);
      g.lineBetween(w / 2, 0, w / 2, -8);
      g.fillStyle(0xFFFF00, 1);
      g.fillCircle(w / 2, -8, 3);
    }

    if (style.hasStripes) {
      g.lineStyle(2, 0x000000, 0.3);
      for (let i = 0; i < 3; i++) {
        const sy = h * 0.4 + i * (h * 0.12);
        g.lineBetween(8, sy, w - 8, sy);
      }
    }

    g.lineStyle(2, 0xFFFFFF, 0.4);
    g.strokeRoundedRect(4, h * 0.2, w - 8, h * 0.65, 6);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // --- Themed collectible textures ---

  private createCollectibleTexture(key: string, size: number, color: number, theme: ThemeDefinition): void {
    const g = this.add.graphics();
    const cx = size;
    const cy = size;
    const style = theme.collectibleStyle;

    // Glowing circle body
    g.fillStyle(color, 0.3);
    g.fillCircle(cx, cy, size);
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy, size * 0.7);

    if (style.hasFace) {
      // Happy face
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(cx - size * 0.22, cy - size * 0.12, 3);
      g.fillCircle(cx + size * 0.22, cy - size * 0.12, 3);
      g.lineStyle(1.5, 0xFFFFFF, 0.8);
      g.beginPath();
      g.arc(cx, cy, size * 0.3, 0.1, Math.PI - 0.1, false);
      g.strokePath();
    } else {
      // Star/diamond shape inside
      g.fillStyle(0xFFFFFF, 0.7);
      const r = size * 0.3;
      g.fillTriangle(cx, cy - r, cx - r * 0.6, cy, cx + r * 0.6, cy);
      g.fillTriangle(cx, cy + r, cx - r * 0.6, cy, cx + r * 0.6, cy);
    }

    if (style.hasGearRing) {
      g.lineStyle(2, 0xFFFFFF, 0.4);
      g.strokeCircle(cx, cy, size * 0.5);
    }

    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }
}
