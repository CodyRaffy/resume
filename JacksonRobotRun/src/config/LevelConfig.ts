export type ObstacleType = 'ground' | 'tall' | 'laneBlocker' | 'doubleBlocker' | 'flying' | 'platform' | 'bar';
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
    speed: 0.65,
    speedIncreaseRate: 0.001,
    maxSpeed: 1.6,
    spawnInterval: 700,
    minSpawnInterval: 400,
    obstacleTypes: ['ground', 'laneBlocker', 'platform', 'bar'],
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
    speed: 0.9,
    speedIncreaseRate: 0.002,
    maxSpeed: 2.0,
    spawnInterval: 600,
    minSpawnInterval: 350,
    obstacleTypes: ['ground', 'laneBlocker', 'tall', 'platform', 'bar'],
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
    speed: 1.6,
    speedIncreaseRate: 0.004,
    maxSpeed: 3.0,
    spawnInterval: 450,
    minSpawnInterval: 250,
    obstacleTypes: ['ground', 'laneBlocker', 'tall', 'flying', 'doubleBlocker'],
    collectibleTypes: ['bronze', 'silver', 'gold', 'special'],
    collectibleRate: 0.3,
    backgroundTheme: 'wasteland',
    groundColor: 0x665544,
    skyColor: 0xCC6644,
  },
];
