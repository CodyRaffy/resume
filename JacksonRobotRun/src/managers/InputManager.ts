import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

// Vertical swipe threshold is lower so jump/slide trigger easily
const SWIPE_V_THRESHOLD = 15;
const SWIPE_H_THRESHOLD = 30;
// Max time for a tap (not a swipe)
const TAP_MAX_TIME = 300;

export class InputManager {
  private scene: Phaser.Scene;
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private swipeStartTime: number = 0;
  private gestureHandled: boolean = false;

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
      this.gestureHandled = false;
    });

    // Detect swipes MID-GESTURE so they fire instantly (no waiting for lift)
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive() || this.gestureHandled || !pointer.isDown) return;

      // Ignore HUD area
      if (this.swipeStartY < 60) return;

      const deltaX = pointer.x - this.swipeStartX;
      const deltaY = pointer.y - this.swipeStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check vertical swipe first (jump/slide — most important)
      if (absY > SWIPE_V_THRESHOLD && absY > absX * 0.5) {
        this.gestureHandled = true;
        if (deltaY < 0) {
          this.getPlayer()?.jump();
        } else {
          this.getPlayer()?.slide();
        }
        return;
      }

      // Horizontal swipe (lane change)
      if (absX > SWIPE_H_THRESHOLD && absX > absY) {
        this.gestureHandled = true;
        if (deltaX > 0) {
          this.getPlayer()?.moveRight();
        } else {
          this.getPlayer()?.moveLeft();
        }
      }
    });

    // Handle taps (quick touch with no swipe)
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive() || this.gestureHandled) return;

      // Ignore HUD area
      if (pointer.y < 60 || this.swipeStartY < 60) return;

      const deltaTime = pointer.time - this.swipeStartTime;

      // Quick tap = jump (most common action in an endless runner)
      if (deltaTime <= TAP_MAX_TIME) {
        // Bottom quarter of screen = slide, everything else = jump
        if (this.swipeStartY > GAME_HEIGHT * 0.75) {
          this.getPlayer()?.slide();
        } else {
          this.getPlayer()?.jump();
        }
      }
    });
  }
}
