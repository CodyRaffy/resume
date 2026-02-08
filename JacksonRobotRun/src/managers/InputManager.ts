import Phaser from 'phaser';
import { SWIPE_THRESHOLD, GAME_WIDTH } from '../config/GameConfig';

// Increased from 300ms to 500ms so slower/deliberate taps are not ignored
const SWIPE_MAX_TIME = 500;
// Taps longer than this are discarded entirely
const TAP_MAX_TIME = 800;

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

  private isActive(): boolean {
    const gs = this.scene as any;
    return !gs.isPaused && !gs.isGameOver;
  }

  private getPlayer(): any {
    return (this.scene as any).player;
  }

  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    keyboard.on('keydown-LEFT', () => { if (this.isActive()) this.getPlayer()?.moveLeft(); });
    keyboard.on('keydown-RIGHT', () => { if (this.isActive()) this.getPlayer()?.moveRight(); });
    keyboard.on('keydown-UP', () => { if (this.isActive()) this.getPlayer()?.jump(); });
    keyboard.on('keydown-DOWN', () => { if (this.isActive()) this.getPlayer()?.slide(); });

    keyboard.on('keydown-A', () => { if (this.isActive()) this.getPlayer()?.moveLeft(); });
    keyboard.on('keydown-D', () => { if (this.isActive()) this.getPlayer()?.moveRight(); });
    keyboard.on('keydown-W', () => { if (this.isActive()) this.getPlayer()?.jump(); });
    keyboard.on('keydown-S', () => { if (this.isActive()) this.getPlayer()?.slide(); });

    keyboard.on('keydown-SPACE', () => { if (this.isActive()) this.getPlayer()?.jump(); });
  }

  private setupTouch(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = pointer.time;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive()) return;

      // Ignore taps in the top 60px (HUD area / pause button zone)
      if (pointer.y < 60 || this.swipeStartY < 60) return;

      const deltaX = pointer.x - this.swipeStartX;
      const deltaY = pointer.y - this.swipeStartY;
      const deltaTime = pointer.time - this.swipeStartTime;

      // Discard very long holds
      if (deltaTime > TAP_MAX_TIME) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (deltaTime <= SWIPE_MAX_TIME && (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD)) {
        // It's a swipe
        if (absX > absY) {
          if (deltaX > 0) {
            this.getPlayer()?.moveRight();
          } else {
            this.getPlayer()?.moveLeft();
          }
        } else {
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
