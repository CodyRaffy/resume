import Phaser from 'phaser';
import {
  HORIZON_Y, GROUND_Y, VANISHING_POINT_X,
  MIN_SCALE, MAX_SCALE, LANE_POSITIONS,
  COLLECTIBLE_POINTS,
} from '../config/GameConfig';
import { CollectibleType } from '../config/LevelConfig';

const COLLECTIBLE_TEXTURES: Record<CollectibleType, string> = {
  bronze: 'collect-bronze',
  silver: 'collect-silver',
  gold: 'collect-gold',
  special: 'collect-special',
};

export class Collectible extends Phaser.GameObjects.Sprite {
  collectibleType: CollectibleType;
  lane: number;
  depth_z: number = 0;
  private bobOffset: number = 0;

  constructor(scene: Phaser.Scene, type: CollectibleType, lane: number) {
    const texture = COLLECTIBLE_TEXTURES[type];
    super(scene, VANISHING_POINT_X, HORIZON_Y, texture);

    this.collectibleType = type;
    this.lane = lane;

    scene.add.existing(this);
    this.setDepth(30);
    this.setScale(MIN_SCALE);
    this.setAlpha(0);
  }

  updatePosition(speed: number, delta: number): void {
    this.depth_z += speed * delta * 0.0008;
    this.bobOffset += delta * 0.005;

    if (this.depth_z > 1.2) return;

    const perspT = Math.min(this.depth_z * this.depth_z, 1);
    const scale = Phaser.Math.Linear(MIN_SCALE, MAX_SCALE, perspT);
    const y = Phaser.Math.Linear(HORIZON_Y, GROUND_Y, perspT);

    const laneSpread = Phaser.Math.Linear(0.4, 1, perspT);
    const laneOffset = (LANE_POSITIONS[this.lane] - VANISHING_POINT_X) * laneSpread;
    const x = VANISHING_POINT_X + laneOffset;

    // Floating bob effect
    const bob = Math.sin(this.bobOffset) * 6 * scale;

    this.setPosition(x, y - 25 * scale + bob);
    this.setScale(scale * 1.1);
    this.setDepth(30 + perspT * 10);

    // Fade in
    this.setAlpha(Math.min(1, this.depth_z * 3));

    // Gentle rotation
    this.rotation += delta * 0.002;
  }

  getPoints(): number {
    return COLLECTIBLE_POINTS[this.collectibleType] || 10;
  }
}
