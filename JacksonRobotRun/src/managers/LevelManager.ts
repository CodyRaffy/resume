import { LEVELS, LevelDefinition } from '../config/LevelConfig';

export class LevelManager {
  private currentLevelIndex: number = 0;
  private currentSpeed: number;
  private scene: Phaser.Scene;
  private lastLevelId: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentSpeed = LEVELS[0].speed;
  }

  getCurrentLevel(): LevelDefinition {
    return LEVELS[this.currentLevelIndex];
  }

  getCurrentSpeed(): number {
    return this.currentSpeed;
  }

  checkLevelUp(score: number, delta: number): void {
    const level = this.getCurrentLevel();

    // Gradually increase speed (delta-scaled so frame-rate independent)
    // speedIncreaseRate is per-second; delta is in ms
    this.currentSpeed = Math.min(
      level.maxSpeed,
      this.currentSpeed + level.speedIncreaseRate * (delta / 1000)
    );

    // Check if we should advance to the next level
    const nextLevelIndex = this.currentLevelIndex + 1;
    if (nextLevelIndex < LEVELS.length) {
      const nextLevel = LEVELS[nextLevelIndex];
      if (score >= nextLevel.scoreThreshold) {
        this.currentLevelIndex = nextLevelIndex;
        // Don't reset speed — keep current speed, just raise the max ceiling.
        // If current speed is below new level's base, bump up to it.
        this.currentSpeed = Math.max(this.currentSpeed, nextLevel.speed);

        if (this.lastLevelId !== nextLevel.id) {
          this.lastLevelId = nextLevel.id;
          this.onLevelUp(nextLevel);
        }
      }
    }
  }

  private onLevelUp(level: LevelDefinition): void {
    const gameScene = this.scene as any;
    if (gameScene.showLevelAnnouncement) {
      gameScene.showLevelAnnouncement(`Level ${level.id}: ${level.name}`);
    }
  }
}
