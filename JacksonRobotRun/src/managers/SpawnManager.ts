import Phaser from 'phaser';
import { COLLECTIBLE_CHANCE } from '../config/GameConfig';
import { LevelDefinition, CollectibleType } from '../config/LevelConfig';
import { Obstacle } from '../objects/Obstacle';
import { Collectible } from '../objects/Collectible';

export class SpawnManager {
  private scene: Phaser.Scene;
  private timeSinceLastSpawn: number = 0;
  private totalTimeElapsed: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, level: LevelDefinition, _speed: number): void {
    this.timeSinceLastSpawn += delta;
    this.totalTimeElapsed += delta;

    // Spawn interval decreases over time from level.spawnInterval to level.minSpawnInterval
    // Reaches min over ~60 seconds of play within the level
    const rampProgress = Math.min(1, this.totalTimeElapsed / 60000);
    const currentInterval = Phaser.Math.Linear(
      level.spawnInterval,
      level.minSpawnInterval,
      rampProgress
    );

    if (this.timeSinceLastSpawn >= currentInterval) {
      this.timeSinceLastSpawn = 0;

      if (Math.random() < (level.collectibleRate || COLLECTIBLE_CHANCE)) {
        this.spawnCollectible(level);
      } else {
        this.spawnObstacle(level);
      }
    }
  }

  private spawnObstacle(level: LevelDefinition): void {
    const gameScene = this.scene as any;

    const types = level.obstacleTypes;
    const type = types[Phaser.Math.Between(0, types.length - 1)];

    if (type === 'doubleBlocker') {
      const openLane = Phaser.Math.Between(0, 2);
      const blockedLanes = [0, 1, 2].filter(l => l !== openLane);
      const obstacle = new Obstacle(this.scene, type, blockedLanes[0], blockedLanes[1]);
      gameScene.obstacles.add(obstacle);
      return;
    }

    const lane = Phaser.Math.Between(0, 2);
    const obstacle = new Obstacle(this.scene, type, lane);
    gameScene.obstacles.add(obstacle);
  }

  private spawnCollectible(level: LevelDefinition): void {
    const gameScene = this.scene as any;

    const type = this.pickCollectibleType(level.collectibleTypes);
    const lane = Phaser.Math.Between(0, 2);

    const collectible = new Collectible(this.scene, type, lane);
    gameScene.collectibles.add(collectible);
  }

  private pickCollectibleType(types: CollectibleType[]): CollectibleType {
    const weights: Record<CollectibleType, number> = {
      bronze: 50,
      silver: 30,
      gold: 15,
      special: 5,
    };

    const available = types.filter(t => weights[t] !== undefined);
    const totalWeight = available.reduce((sum, t) => sum + weights[t], 0);
    let random = Math.random() * totalWeight;

    for (const type of available) {
      random -= weights[type];
      if (random <= 0) return type;
    }

    return available[0] || 'bronze';
  }
}
