import Phaser from 'phaser';
import { SWIPE_THRESHOLD, SWIPE_MAX_TIME, GAME_WIDTH } from '../config/GameConfig';

export class InputManager {
  private scene: Phaser.Scene;
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private swipeStartTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
    this.setupTouch();
  }

  private getPlayer(): any {
    return (this.scene as any).player;
  }

  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // Arrow keys
    keyboard.on('keydown-LEFT', () => this.getPlayer()?.moveLeft());
    keyboard.on('keydown-RIGHT', () => this.getPlayer()?.moveRight());
    keyboard.on('keydown-UP', () => this.getPlayer()?.jump());
    keyboard.on('keydown-DOWN', () => this.getPlayer()?.slide());

    // WASD
    keyboard.on('keydown-A', () => this.getPlayer()?.moveLeft());
    keyboard.on('keydown-D', () => this.getPlayer()?.moveRight());
    keyboard.on('keydown-W', () => this.getPlayer()?.jump());
    keyboard.on('keydown-S', () => this.getPlayer()?.slide());

    // Space to jump
    keyboard.on('keydown-SPACE', () => this.getPlayer()?.jump());
  }

  private setupTouch(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = pointer.time;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - this.swipeStartX;
      const deltaY = pointer.y - this.swipeStartY;
      const deltaTime = pointer.time - this.swipeStartTime;

      // Only process as a swipe if within time limit
      if (deltaTime > SWIPE_MAX_TIME) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        // It's a swipe
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.getPlayer()?.moveRight();
          } else {
            this.getPlayer()?.moveLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            this.getPlayer()?.jump();
          } else {
            this.getPlayer()?.slide();
          }
        }
      } else {
        // It's a tap - use left/right half of screen
        if (pointer.x < GAME_WIDTH / 2) {
          this.getPlayer()?.moveLeft();
        } else {
          this.getPlayer()?.moveRight();
        }
      }
    });
  }
}
