import Phaser from 'phaser';
import {
  HORIZON_Y, GROUND_Y, VANISHING_POINT_X,
  MIN_SCALE, MAX_SCALE, LANE_POSITIONS,
} from '../config/GameConfig';
import { ObstacleType } from '../config/LevelConfig';

const OBSTACLE_TEXTURES: Record<ObstacleType, string> = {
  ground: 'robot-ground',
  tall: 'robot-tall',
  laneBlocker: 'robot-lane',
  doubleBlocker: 'robot-lane',
  flying: 'robot-flying',
  platform: 'robot-platform',
  bar: 'robot-bar',
};

export class Obstacle extends Phaser.GameObjects.Sprite {
  obstacleType: ObstacleType;
  lane: number;
  depth_z: number = 0;
  secondSpriteBounds: Phaser.Geom.Rectangle | null = null;

  private secondSprite: Phaser.GameObjects.Sprite | null = null;
  private secondLane: number = -1;

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

    scene.add.existing(this);
    this.setDepth(30);
    this.setScale(MIN_SCALE);
    this.setAlpha(0); // Start invisible, fade in

    // For double blocker, create a second sprite in the second lane
    if (type === 'doubleBlocker' && secondLane !== undefined && secondLane >= 0) {
      this.secondLane = secondLane;
      this.secondSprite = scene.add.sprite(VANISHING_POINT_X, HORIZON_Y, texture);
      this.secondSprite.setDepth(30);
      this.secondSprite.setScale(MIN_SCALE);
      this.secondSprite.setAlpha(0);
    }
  }

  updatePosition(speed: number, delta: number): void {
    this.depth_z += speed * delta * 0.0008;

    if (this.depth_z > 1.2) return;

    // Perspective
    const perspT = Math.min(this.depth_z * this.depth_z, 1);
    const scale = Phaser.Math.Linear(MIN_SCALE, MAX_SCALE, perspT);
    const y = Phaser.Math.Linear(HORIZON_Y, GROUND_Y, perspT);

    // Lane spread: lanes converge at the vanishing point
    const laneSpread = Phaser.Math.Linear(0.4, 1, perspT);
    const laneOffset = (LANE_POSITIONS[this.lane] - VANISHING_POINT_X) * laneSpread;
    const x = VANISHING_POINT_X + laneOffset;

    this.setPosition(x, y);
    this.setScale(scale);
    this.setDepth(30 + perspT * 10);

    // Fade in as it approaches
    this.setAlpha(Math.min(1, this.depth_z * 3));

    // Flying robots hover higher
    if (this.obstacleType === 'flying') {
      this.y -= 50 * scale;
    }

    // Bars sit at head height (duck under them)
    if (this.obstacleType === 'bar') {
      this.y -= 40 * scale;
    }

    // Update second sprite for double blocker
    if (this.secondSprite && this.secondLane >= 0) {
      const secondLaneOffset = (LANE_POSITIONS[this.secondLane] - VANISHING_POINT_X) * laneSpread;
      const secondX = VANISHING_POINT_X + secondLaneOffset;
      this.secondSprite.setPosition(secondX, y);
      this.secondSprite.setScale(scale);
      this.secondSprite.setDepth(30 + perspT * 10);
      this.secondSprite.setAlpha(Math.min(1, this.depth_z * 3));
      this.secondSpriteBounds = this.secondSprite.getBounds();
    }
  }

  getMainBounds(): Phaser.Geom.Rectangle {
    return super.getBounds();
  }

  destroy(fromScene?: boolean): void {
    if (this.secondSprite) {
      this.secondSprite.destroy(fromScene);
      this.secondSprite = null;
    }
    this.secondSpriteBounds = null;
    super.destroy(fromScene);
  }
}
