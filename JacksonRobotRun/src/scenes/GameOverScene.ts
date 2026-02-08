import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { AudioManager } from '../managers/AudioManager';

interface GameOverData {
  score: number;
  highScore: number;
  level: number;
  robotsCollected: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { score, highScore, level, robotsCollected } = data;
    const isNewHighScore = score >= highScore && score > 0;

    // Dark overlay background
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Game Over title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.12, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#E74C3C',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // New high score banner
    if (isNewHighScore) {
      const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      });
      banner.setOrigin(0.5, 0.5);

      this.tweens.add({
        targets: banner,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Stats panel
    const panelY = GAME_HEIGHT * 0.32;
    const panel = this.add.graphics();
    panel.fillStyle(0x16213e, 0.9);
    panel.fillRoundedRect(40, panelY, GAME_WIDTH - 80, 200, 12);
    panel.lineStyle(2, 0x3498DB, 0.8);
    panel.strokeRoundedRect(40, panelY, GAME_WIDTH - 80, 200, 12);

    const statStyle = {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
    };

    const valueStyle = {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#3498DB',
    };

    const statX = 70;
    const valX = GAME_WIDTH - 70;
    let statY = panelY + 30;

    // Score
    this.add.text(statX, statY, 'Score', statStyle);
    this.add.text(valX, statY, `${score}`, valueStyle).setOrigin(1, 0);
    statY += 40;

    // High Score
    this.add.text(statX, statY, 'Best', statStyle);
    this.add.text(valX, statY, `${Math.max(score, highScore)}`, {
      ...valueStyle,
      color: '#FFD700',
    }).setOrigin(1, 0);
    statY += 40;

    // Level Reached
    this.add.text(statX, statY, 'Level', statStyle);
    this.add.text(valX, statY, `${level}`, valueStyle).setOrigin(1, 0);
    statY += 40;

    // Robots Collected
    this.add.text(statX, statY, 'Robots', statStyle);
    this.add.text(valX, statY, `${robotsCollected}`, valueStyle).setOrigin(1, 0);

    // Play Again button
    const btnY = GAME_HEIGHT * 0.65;
    this.createButton(GAME_WIDTH / 2, btnY, 'PLAY AGAIN', 0x27AE60, () => {
      this.scene.start('GameScene');
    });

    // Menu button
    this.createButton(GAME_WIDTH / 2, btnY + 80, 'MENU', 0x2C3E50, () => {
      this.scene.start('MenuScene');
    });
  }

  private createButton(x: number, y: number, label: string, color: number, callback: () => void): void {
    const btnW = 200;
    const btnH = 55;

    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
    btn.lineStyle(2, 0xFFFFFF, 0.6);
    btn.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5, 0.5);

    const hitArea = this.add.zone(x, y, btnW, btnH).setInteractive();
    hitArea.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.tweens.add({
        targets: text,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });
  }
}
