import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
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

    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createPlaceholderTextures(): void {
    // --- Player textures with robot-character look ---
    this.createPlayerTexture('player', 64, 96, 0x3498DB, 'run');
    this.createPlayerTexture('player-jump', 64, 96, 0x2980B9, 'jump');
    this.createPlayerTexture('player-slide', 80, 48, 0x2471A3, 'slide');

    // Player shadow
    const shadowGfx = this.add.graphics();
    shadowGfx.fillStyle(0x000000, 0.3);
    shadowGfx.fillEllipse(32, 8, 50, 16);
    shadowGfx.generateTexture('player-shadow', 64, 16);
    shadowGfx.destroy();

    // --- Obstacle robot textures ---
    this.createRobotTexture('robot-ground', 56, 48, 0xE74C3C, 'short');
    this.createRobotTexture('robot-tall', 48, 100, 0xC0392B, 'tall');
    this.createRobotTexture('robot-lane', 56, 72, 0xE74C3C, 'medium');
    this.createRobotTexture('robot-flying', 56, 48, 0x9B59B6, 'flying');

    // --- Collectible robot textures ---
    this.createCollectibleTexture('collect-bronze', 24, 0xCD7F32);
    this.createCollectibleTexture('collect-silver', 24, 0xC0C0C0);
    this.createCollectibleTexture('collect-gold', 24, 0xFFD700);
    this.createCollectibleTexture('collect-special', 28, 0x00FF88);

    // --- Particle ---
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
