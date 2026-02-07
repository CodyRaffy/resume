import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading bar
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

    // Load assets here as they become available
    // For now we use generated placeholder graphics
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createPlaceholderTextures(): void {
    // Player placeholder
    this.createRectTexture('player', 64, 96, 0x3498DB);
    this.createRectTexture('player-jump', 64, 96, 0x2980B9);
    this.createRectTexture('player-slide', 80, 48, 0x2471A3);

    // Obstacle placeholders
    this.createRectTexture('robot-ground', 56, 48, 0xE74C3C);
    this.createRectTexture('robot-tall', 48, 120, 0xC0392B);
    this.createRectTexture('robot-lane', 56, 72, 0xE74C3C);
    this.createRectTexture('robot-flying', 56, 48, 0x9B59B6);

    // Collectible placeholders
    this.createCircleTexture('collect-bronze', 20, 0xCD7F32);
    this.createCircleTexture('collect-silver', 20, 0xC0C0C0);
    this.createCircleTexture('collect-gold', 20, 0xFFD700);
    this.createCircleTexture('collect-special', 24, 0x00FF88);
  }

  private createRectTexture(key: string, width: number, height: number, color: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 6);
    graphics.lineStyle(2, 0xFFFFFF, 0.5);
    graphics.strokeRoundedRect(0, 0, width, height, 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createCircleTexture(key: string, radius: number, color: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.lineStyle(2, 0xFFFFFF, 0.6);
    graphics.strokeCircle(radius, radius, radius);

    // Add a small robot icon indicator (cross pattern)
    graphics.lineStyle(2, 0x333333, 0.8);
    graphics.lineBetween(radius - 6, radius, radius + 6, radius);
    graphics.lineBetween(radius, radius - 6, radius, radius + 6);

    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }
}
