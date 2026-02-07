import Phaser from 'phaser';
import { COLLECTIBLE_CHANCE } from '../config/GameConfig';
import { LevelDefinition, ObstacleType, CollectibleType } from '../config/LevelConfig';
import { Obstacle } from '../objects/Obstacle';
import { Collectible } from '../objects/Collectible';

export class SpawnManager {
  private scene: Phaser.Scene;
  private timeSinceLastSpawn: number = 0;
  private currentInterval: number = 2000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, level: LevelDefinition, _speed: number): void {
    this.timeSinceLastSpawn += delta;

    // Gradually decrease spawn interval within level bounds
    this.currentInterval = Math.max(
      level.minSpawnInterval,
      this.currentInterval - delta * 0.01
    );

    if (this.timeSinceLastSpawn >= this.currentInterval) {
      this.timeSinceLastSpawn = 0;
      this.currentInterval = level.spawnInterval; // Reset for next spawn

      // Decide: obstacle or collectible?
      if (Math.random() < (level.collectibleRate || COLLECTIBLE_CHANCE)) {
        this.spawnCollectible(level);
      } else {
        this.spawnObstacle(level);
      }
    }
  }

  private spawnObstacle(level: LevelDefinition): void {
    const gameScene = this.scene as any;

    // Pick a random obstacle type from the level's allowed types
    const types = level.obstacleTypes;
    const type = types[Phaser.Math.Between(0, types.length - 1)];

    // Pick lane(s)
    const lane = Phaser.Math.Between(0, 2);

    let secondLane: number | undefined;
    if (type === 'doubleBlocker') {
      // Block two lanes, leave one open
      const openLane = Phaser.Math.Between(0, 2);
      const blockedLanes = [0, 1, 2].filter(l => l !== openLane);
      const obstacle = new Obstacle(this.scene, type, blockedLanes[0], blockedLanes[1]);
      gameScene.obstacles.add(obstacle);
      return;
    }

    const obstacle = new Obstacle(this.scene, type, lane, secondLane);
    gameScene.obstacles.add(obstacle);
  }

  private spawnCollectible(level: LevelDefinition): void {
    const gameScene = this.scene as any;

    // Pick collectible type with weighted rarity
    const type = this.pickCollectibleType(level.collectibleTypes);
    const lane = Phaser.Math.Between(0, 2);

    const collectible = new Collectible(this.scene, type, lane);
    gameScene.collectibles.add(collectible);
  }

  private pickCollectibleType(types: CollectibleType[]): CollectibleType {
    // Weighted random: bronze is most common, special is rarest
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
