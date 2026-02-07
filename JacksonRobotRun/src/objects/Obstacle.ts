import Phaser from 'phaser';
import {
  GAME_WIDTH, HORIZON_Y, GROUND_Y, VANISHING_POINT_X,
  MIN_SCALE, MAX_SCALE, LANE_POSITIONS,
} from '../config/GameConfig';
import { ObstacleType } from '../config/LevelConfig';

const OBSTACLE_TEXTURES: Record<ObstacleType, string> = {
  ground: 'robot-ground',
  tall: 'robot-tall',
  laneBlocker: 'robot-lane',
  doubleBlocker: 'robot-lane',
  flying: 'robot-flying',
};

export class Obstacle extends Phaser.GameObjects.Sprite {
  obstacleType: ObstacleType;
  lane: number;
  depth_z: number; // 0 = horizon, 1 = camera
  private secondSprite?: Phaser.GameObjects.Sprite; // for doubleBlocker

  constructor(
    scene: Phaser.Scene,
    type: ObstacleType,
    lane: number,
    secondLane?: number
  ) {
    const texture = OBSTACLE_TEXTURES[type];
    super(scene, VANISHING_POINT_X, HORIZON_Y, texture);

    this.obstacleType = type;
    this.lane = lane;
    this.depth_z = 0;

    scene.add.existing(this);
    this.setDepth(30);
    this.setScale(MIN_SCALE);

    // For double blocker, create a second sprite
    if (type === 'doubleBlocker' && secondLane !== undefined) {
      this.secondSprite = scene.add.sprite(VANISHING_POINT_X, HORIZON_Y, texture);
      this.secondSprite.setDepth(30);
      this.secondSprite.setScale(MIN_SCALE);
    }
  }

  updatePosition(speed: number, delta: number): void {
    this.depth_z += speed * delta * 0.001;

    if (this.depth_z > 1.2) return; // Off screen

    // Perspective calculations
    const perspT = this.depth_z * this.depth_z;
    const scale = Phaser.Math.Linear(MIN_SCALE, MAX_SCALE, perspT);
    const y = Phaser.Math.Linear(HORIZON_Y, GROUND_Y, perspT);

    // Lane position spreads out with perspective
    const laneSpread = Phaser.Math.Linear(0.05, 1, perspT);
    const laneOffset = (LANE_POSITIONS[this.lane] - VANISHING_POINT_X) * laneSpread;
    const x = VANISHING_POINT_X + laneOffset;

    this.setPosition(x, y);
    this.setScale(scale);
    this.setDepth(30 + perspT * 10); // Closer objects drawn on top

    // Flying robots hover higher
    if (this.obstacleType === 'flying') {
      this.y -= 40 * scale;
    }

    // Update second sprite for double blocker
    if (this.secondSprite) {
      const secondLane = this.lane === 0 ? 1 : (this.lane === 2 ? 1 : 2);
      const secondLaneOffset = (LANE_POSITIONS[secondLane] - VANISHING_POINT_X) * laneSpread;
      const secondX = VANISHING_POINT_X + secondLaneOffset;
      this.secondSprite.setPosition(secondX, y);
      this.secondSprite.setScale(scale);
      this.secondSprite.setDepth(30 + perspT * 10);
    }
  }

  getCollisionBounds(): Phaser.Geom.Rectangle {
    const bounds = super.getBounds();

    // Also include secondSprite bounds for doubleBlocker
    if (this.secondSprite) {
      const secondBounds = this.secondSprite.getBounds();
      return Phaser.Geom.Rectangle.Union(bounds, secondBounds);
    }

    return bounds;
  }

  destroy(fromScene?: boolean): void {
    if (this.secondSprite) {
      this.secondSprite.destroy();
    }
    super.destroy(fromScene);
  }
}
