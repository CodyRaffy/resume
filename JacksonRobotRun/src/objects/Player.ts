import Phaser from 'phaser';
import {
  LANE_POSITIONS, LANE_SWITCH_DURATION,
  JUMP_DURATION, JUMP_HEIGHT, SLIDE_DURATION,
  PLAYER_WIDTH, PLAYER_HEIGHT,
} from '../config/GameConfig';

export type PlayerState = 'running' | 'jumping' | 'sliding';

export class Player extends Phaser.GameObjects.Sprite {
  currentLane: number = 1;
  playerState: PlayerState = 'running';
  private isTransitioning: boolean = false;
  private baseY: number;
  private normalHeight: number;
  private slideHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);

    this.baseY = y;
    this.normalHeight = PLAYER_HEIGHT;
    this.slideHeight = PLAYER_HEIGHT / 2;
    this.setDepth(50);
  }

  moveLeft(): void {
    if (this.currentLane > 0 && !this.isTransitioning) {
      this.currentLane--;
      this.switchLane();
    }
  }

  moveRight(): void {
    if (this.currentLane < 2 && !this.isTransitioning) {
      this.currentLane++;
      this.switchLane();
    }
  }

  jump(): void {
    if (this.playerState !== 'running') return;
    this.playerState = 'jumping';
    this.setTexture('player-jump');

    this.scene.tweens.add({
      targets: this,
      y: this.baseY - JUMP_HEIGHT,
      duration: JUMP_DURATION / 2,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          y: this.baseY,
          duration: JUMP_DURATION / 2,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.playerState = 'running';
            this.setTexture('player');
          },
        });
      },
    });
  }

  slide(): void {
    if (this.playerState !== 'running') return;
    this.playerState = 'sliding';
    this.setTexture('player-slide');

    // Move down to ground level and shrink hitbox
    this.y = this.baseY + (this.normalHeight - this.slideHeight) / 2;

    this.scene.time.delayedCall(SLIDE_DURATION, () => {
      this.playerState = 'running';
      this.setTexture('player');
      this.y = this.baseY;
    });
  }

  flash(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.setAlpha(1);
      },
    });
  }

  getCollisionBounds(): Phaser.Geom.Rectangle {
    const w = PLAYER_WIDTH * 0.7; // Slightly forgiving hitbox
    let h: number;
    let y: number;

    if (this.playerState === 'sliding') {
      h = this.slideHeight * 0.7;
      y = this.baseY + this.normalHeight / 2 - h;
    } else {
      h = this.normalHeight * 0.8;
      y = this.y - h / 2;
    }

    return new Phaser.Geom.Rectangle(
      this.x - w / 2,
      y,
      w,
      h
    );
  }

  private switchLane(): void {
    this.isTransitioning = true;
    this.scene.tweens.add({
      targets: this,
      x: LANE_POSITIONS[this.currentLane],
      duration: LANE_SWITCH_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.isTransitioning = false;
      },
    });
  }
}
