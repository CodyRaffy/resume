import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { ScoreManager } from '../managers/ScoreManager';
import { ThemeManager } from '../managers/ThemeManager';
import { AudioManager } from '../managers/AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const theme = ThemeManager.getTheme();
    const c = theme.colors;

    // Background
    this.cameras.main.setBackgroundColor(c.sky);

    // Ground area
    const ground = this.add.graphics();
    ground.fillStyle(c.ground, 1);
    ground.fillRect(0, GAME_HEIGHT * 0.65, GAME_WIDTH, GAME_HEIGHT * 0.35);

    // Road lines on ground
    ground.lineStyle(2, c.laneLines, 0.3);
    for (let i = 0; i < 5; i++) {
      const y = GAME_HEIGHT * 0.7 + i * 30;
      ground.lineBetween(GAME_WIDTH * 0.1, y, GAME_WIDTH * 0.9, y);
    }

    // Title - uses theme name
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.12, `JACKSON\n${theme.name.toUpperCase()}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '44px',
      color: '#FFFFFF',
      stroke: '#1a1a2e',
      strokeThickness: 8,
      align: 'center',
      lineSpacing: 8,
    });
    title.setOrigin(0.5, 0.5);

    // Subtitle - theme-specific tagline
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, theme.subtitle, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    });
    subtitle.setOrigin(0.5, 0.5);

    // Play button
    this.createButton(
      GAME_WIDTH / 2, GAME_HEIGHT * 0.40,
      'PLAY', 0x27AE60,
      () => {
        AudioManager.getInstance().unlock();
        this.scene.start('GameScene');
      },
      200, 60, '28px'
    );

    // Customize button
    this.createButton(
      GAME_WIDTH / 2, GAME_HEIGHT * 0.52,
      'CUSTOMIZE', c.uiAccent,
      () => this.scene.start('CustomizeScene'),
      200, 48, '20px'
    );

    // High score display
    const highScore = ScoreManager.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, `High Score: ${highScore}`, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 0.5);
    }

    // Controls help
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.92,
      'Swipe or Arrow Keys to move\nSwipe Up / Space to jump\nSwipe Down / S to slide', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Animated character on the menu
    const jackson = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.76, 'player');
    jackson.setDisplaySize(96, 144);
    this.tweens.add({
      targets: jackson,
      y: jackson.y - 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating collectibles in background
    this.createFloatingCollectibles();
  }

  private createButton(
    x: number, y: number, label: string, color: number,
    callback: () => void, w = 200, h = 60, fontSize = '28px'
  ): void {
    const btn = this.add.graphics();
    const btnX = x - w / 2;
    const btnY = y - h / 2;
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(btnX, btnY, w, h, 12);
    btn.lineStyle(3, 0xFFFFFF, 0.8);
    btn.strokeRoundedRect(btnX, btnY, w, h, 12);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize,
      color: '#FFFFFF',
    }).setOrigin(0.5, 0.5);

    const hitArea = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [text],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });

    hitArea.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 1);
      btn.fillRoundedRect(btnX, btnY, w, h, 12);
      btn.lineStyle(3, 0xFFFFFF, 1);
      btn.strokeRoundedRect(btnX, btnY, w, h, 12);
    });

    hitArea.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(btnX, btnY, w, h, 12);
      btn.lineStyle(3, 0xFFFFFF, 0.8);
      btn.strokeRoundedRect(btnX, btnY, w, h, 12);
    });
  }

  private createFloatingCollectibles(): void {
    const types = ['collect-bronze', 'collect-silver', 'collect-gold'];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(GAME_HEIGHT * 0.35, GAME_HEIGHT * 0.6);
      const type = types[Phaser.Math.Between(0, types.length - 1)];
      const robot = this.add.image(x, y, type);
      robot.setAlpha(0.4);
      robot.setScale(0.8);

      this.tweens.add({
        targets: robot,
        y: robot.y - Phaser.Math.Between(10, 20),
        x: robot.x + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
