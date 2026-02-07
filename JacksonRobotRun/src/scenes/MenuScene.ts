import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/GameConfig';
import { ScoreManager } from '../managers/ScoreManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor(COLORS.sky);

    // Ground area
    const ground = this.add.graphics();
    ground.fillStyle(COLORS.ground, 1);
    ground.fillRect(0, GAME_HEIGHT * 0.65, GAME_WIDTH, GAME_HEIGHT * 0.35);

    // Road lines on ground
    ground.lineStyle(2, COLORS.lane_divider, 0.3);
    for (let i = 0; i < 5; i++) {
      const y = GAME_HEIGHT * 0.7 + i * 30;
      ground.lineBetween(GAME_WIDTH * 0.1, y, GAME_WIDTH * 0.9, y);
    }

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 'JACKSON\nROBOT RUN', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#FFFFFF',
      stroke: '#1a1a2e',
      strokeThickness: 8,
      align: 'center',
      lineSpacing: 8,
    });
    title.setOrigin(0.5, 0.5);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, 'Dodge the robots. Collect the bots.', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    });
    subtitle.setOrigin(0.5, 0.5);

    // Play button
    const playBtn = this.add.graphics();
    const btnX = GAME_WIDTH / 2 - 100;
    const btnY = GAME_HEIGHT * 0.45;
    playBtn.fillStyle(0x27AE60, 1);
    playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
    playBtn.lineStyle(3, 0xFFFFFF, 0.8);
    playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);

    const playText = this.add.text(GAME_WIDTH / 2, btnY + 30, 'PLAY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#FFFFFF',
    });
    playText.setOrigin(0.5, 0.5);

    // Make play button interactive
    const hitArea = this.add.zone(GAME_WIDTH / 2, btnY + 30, 200, 60).setInteractive();
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [playText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.scene.start('GameScene');
        },
      });
    });

    hitArea.on('pointerover', () => {
      playBtn.clear();
      playBtn.fillStyle(0x2ECC71, 1);
      playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
      playBtn.lineStyle(3, 0xFFFFFF, 1);
      playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);
    });

    hitArea.on('pointerout', () => {
      playBtn.clear();
      playBtn.fillStyle(0x27AE60, 1);
      playBtn.fillRoundedRect(btnX, btnY, 200, 60, 12);
      playBtn.lineStyle(3, 0xFFFFFF, 0.8);
      playBtn.strokeRoundedRect(btnX, btnY, 200, 60, 12);
    });

    // High score display
    const highScore = ScoreManager.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, `High Score: ${highScore}`, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 0.5);
    }

    // Controls help
    const controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.92,
      'Swipe or Arrow Keys to move\nSwipe Up / Space to jump\nSwipe Down / S to slide', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    controlsText.setOrigin(0.5, 0.5);

    // Animated player placeholder on the menu
    const jackson = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'player');
    this.tweens.add({
      targets: jackson,
      y: jackson.y - 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating robot collectibles in background
    this.createFloatingRobots();
  }

  private createFloatingRobots(): void {
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
