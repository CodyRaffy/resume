export type ObstacleType = 'ground' | 'tall' | 'laneBlocker' | 'doubleBlocker' | 'flying';
export type CollectibleType = 'bronze' | 'silver' | 'gold' | 'special';

export interface LevelDefinition {
  id: number;
  name: string;
  scoreThreshold: number;
  speed: number;
  speedIncreaseRate: number;
  maxSpeed: number;
  spawnInterval: number;
  minSpawnInterval: number;
  obstacleTypes: ObstacleType[];
  collectibleTypes: CollectibleType[];
  collectibleRate: number;
  backgroundTheme: string;
  groundColor: number;
  skyColor: number;
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'Robot City',
    scoreThreshold: 0,
    speed: 3,
    speedIncreaseRate: 0.01,
    maxSpeed: 5,
    spawnInterval: 2000,
    minSpawnInterval: 1200,
    obstacleTypes: ['ground', 'laneBlocker'],
    collectibleTypes: ['bronze', 'silver'],
    collectibleRate: 0.4,
    backgroundTheme: 'city',
    groundColor: 0x555555,
    skyColor: 0x87CEEB,
  },
  {
    id: 2,
    name: 'Robot Factory',
    scoreThreshold: 500,
    speed: 4,
    speedIncreaseRate: 0.015,
    maxSpeed: 7,
    spawnInterval: 1500,
    minSpawnInterval: 800,
    obstacleTypes: ['ground', 'laneBlocker', 'tall'],
    collectibleTypes: ['bronze', 'silver', 'gold'],
    collectibleRate: 0.35,
    backgroundTheme: 'factory',
    groundColor: 0x444444,
    skyColor: 0x667788,
  },
  {
    id: 3,
    name: 'Robot Wasteland',
    scoreThreshold: 1500,
    speed: 5,
    speedIncreaseRate: 0.02,
    maxSpeed: 9,
    spawnInterval: 1200,
    minSpawnInterval: 600,
    obstacleTypes: ['ground', 'laneBlocker', 'tall', 'flying', 'doubleBlocker'],
    collectibleTypes: ['bronze', 'silver', 'gold', 'special'],
    collectibleRate: 0.3,
    backgroundTheme: 'wasteland',
    groundColor: 0x665544,
    skyColor: 0xCC6644,
  },
];
