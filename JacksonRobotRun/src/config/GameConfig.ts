export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

// Lane positions (3 lanes)
export const LANE_COUNT = 3;
export const LANE_WIDTH = GAME_WIDTH / 5;
export const LANE_POSITIONS = [
  GAME_WIDTH * 0.25,  // Left lane
  GAME_WIDTH * 0.5,   // Center lane
  GAME_WIDTH * 0.75,  // Right lane
];
export const DEFAULT_LANE = 1; // Start in center

// Perspective / pseudo-3D
export const HORIZON_Y = GAME_HEIGHT * 0.3;
export const GROUND_Y = GAME_HEIGHT * 0.9;
export const VANISHING_POINT_X = GAME_WIDTH * 0.5;
export const MIN_SCALE = 0.2;
export const MAX_SCALE = 1.2;

// Player
export const PLAYER_Y = GAME_HEIGHT * 0.78;
export const PLAYER_WIDTH = 64;
export const PLAYER_HEIGHT = 96;
export const LANE_SWITCH_DURATION = 150; // ms
export const JUMP_DURATION = 600; // ms
export const JUMP_HEIGHT = 120;
export const SLIDE_DURATION = 500; // ms
export const INVINCIBILITY_DURATION = 2000; // ms after crash

// Gameplay
export const STARTING_LIVES = 3;
export const MAX_LIVES = 5;
export const BASE_SPEED = 1;
export const SPEED_INCREMENT = 0.002;

// Spawning
export const BASE_SPAWN_INTERVAL = 1200; // ms
export const MIN_SPAWN_INTERVAL = 400; // ms
export const COLLECTIBLE_CHANCE = 0.35; // 35% chance a spawn is a collectible

// Scoring
export const DISTANCE_POINTS_PER_TICK = 1;
export const COMBO_THRESHOLDS = [
  { combo: 0, multiplier: 1 },
  { combo: 5, multiplier: 2 },
  { combo: 10, multiplier: 3 },
  { combo: 20, multiplier: 5 },
];

// Collectible point values
export const COLLECTIBLE_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50,
  special: 100,
};

// Bonus points for jumping on a platform
export const PLATFORM_JUMP_POINTS = 30;

// Bonus points for sliding under a bar
export const BAR_SLIDE_POINTS = 30;

// Bonus points for ducking under tall/flying obstacles
export const DUCK_BONUS_POINTS = 20;

// Swipe detection
export const SWIPE_THRESHOLD = 15; // minimum pixels for a swipe

// Colors (for placeholder graphics until real art is added)
export const COLORS = {
  sky: 0x87CEEB,
  ground: 0x555555,
  lane_divider: 0xFFFFFF,
  player: 0x3498DB,
  obstacle_ground: 0xE74C3C,
  obstacle_tall: 0xC0392B,
  obstacle_lane: 0xE74C3C,
  obstacle_flying: 0x9B59B6,
  obstacle_platform: 0x27AE60,
  obstacle_bar: 0xF39C12,
  collectible_bronze: 0xCD7F32,
  collectible_silver: 0xC0C0C0,
  collectible_gold: 0xFFD700,
  collectible_special: 0x00FF88,
  hud_bg: 0x000000,
  hud_text: 0xFFFFFF,
};
