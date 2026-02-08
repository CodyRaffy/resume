import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { AudioManager } from '../managers/AudioManager';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Paused text
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'PAUSED', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // Resume button
    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, 'RESUME', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#27AE60',
      stroke: '#000000',
      strokeThickness: 4,
    });
    resumeBtn.setOrigin(0.5, 0.5);
    resumeBtn.setInteractive();
    resumeBtn.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      const gameScene = this.scene.get('GameScene') as any;
      gameScene.isPaused = false;
      this.scene.stop();
    });

    // Quit button
    const quitBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.6, 'QUIT', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#E74C3C',
      stroke: '#000000',
      strokeThickness: 4,
    });
    quitBtn.setOrigin(0.5, 0.5);
    quitBtn.setInteractive();
    quitBtn.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      AudioManager.getInstance().stopMusic();
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });
  }
}
