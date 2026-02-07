import {
  HORIZON_Y, GROUND_Y, VANISHING_POINT_X,
  MIN_SCALE, MAX_SCALE, LANE_POSITIONS,
} from '../config/GameConfig';

/**
 * Helper functions for pseudo-3D perspective calculations.
 * depth_z ranges from 0 (at horizon) to 1 (at camera/player position).
 */

export function getScreenY(depth_z: number): number {
  const perspT = depth_z * depth_z;
  return lerp(HORIZON_Y, GROUND_Y, perspT);
}

export function getScale(depth_z: number): number {
  const perspT = depth_z * depth_z;
  return lerp(MIN_SCALE, MAX_SCALE, perspT);
}

export function getLaneX(lane: number, depth_z: number): number {
  const perspT = depth_z * depth_z;
  const laneSpread = lerp(0.05, 1, perspT);
  const laneOffset = (LANE_POSITIONS[lane] - VANISHING_POINT_X) * laneSpread;
  return VANISHING_POINT_X + laneOffset;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
