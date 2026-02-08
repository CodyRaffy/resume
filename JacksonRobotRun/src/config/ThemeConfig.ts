/**
 * Theme system - defines visual themes that change the look and feel
 * of the game while keeping the same core gameplay mechanics.
 */

export interface ThemeColors {
  sky: number;
  ground: number;
  road: number;
  buildings: number;
  buildingWindows: number;
  horizonGlow: number;
  laneLines: number;
  obstacle: number;
  obstacleDark: number;
  obstacleFlying: number;
  obstacleAccent: number;
  collectBronze: number;
  collectSilver: number;
  collectGold: number;
  collectSpecial: number;
  hudBg: number;
  hudText: number;
  uiAccent: number;
}

export interface ThemeObstacleStyle {
  eyeColor: number;
  hasWings: boolean;
  hasAntenna: boolean;
  hasStripes: boolean;
  label: string; // e.g. "robot", "cone", "asteroid"
}

export interface ThemeCollectibleStyle {
  hasFace: boolean;
  hasGearRing: boolean;
  label: string; // e.g. "bot", "trophy", "crystal"
}

export interface BackgroundElement {
  x: number;
  w: number;
  h: number;
}

export interface ThemeBackground {
  type: 'city' | 'stadium' | 'stars' | 'mountains';
  elements: BackgroundElement[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for the UI
  colors: ThemeColors;
  obstacleStyle: ThemeObstacleStyle;
  collectibleStyle: ThemeCollectibleStyle;
  background: ThemeBackground;
  levelNames: [string, string, string]; // names for the 3 levels
  subtitle: string; // tagline shown on menu
}

// --- THEME DEFINITIONS ---

export const THEMES: Record<string, ThemeDefinition> = {
  robots: {
    id: 'robots',
    name: 'Robot Run',
    description: 'Dodge evil robots in the city',
    icon: '🤖',
    colors: {
      sky: 0x87CEEB,
      ground: 0x555555,
      road: 0x3a3a3a,
      buildings: 0x2C3E50,
      buildingWindows: 0x4A6B8A,
      horizonGlow: 0xBBDDEE,
      laneLines: 0xFFFFFF,
      obstacle: 0xE74C3C,
      obstacleDark: 0xC0392B,
      obstacleFlying: 0x9B59B6,
      obstacleAccent: 0xFF0000,
      collectBronze: 0xCD7F32,
      collectSilver: 0xC0C0C0,
      collectGold: 0xFFD700,
      collectSpecial: 0x00FF88,
      hudBg: 0x000000,
      hudText: 0xFFFFFF,
      uiAccent: 0x3498DB,
    },
    obstacleStyle: {
      eyeColor: 0xFF0000,
      hasWings: true,
      hasAntenna: true,
      hasStripes: true,
      label: 'robots',
    },
    collectibleStyle: {
      hasFace: true,
      hasGearRing: true,
      label: 'bots',
    },
    background: {
      type: 'city',
      elements: [
        { x: 10, w: 45, h: 85 }, { x: 65, w: 35, h: 55 },
        { x: 108, w: 52, h: 105 }, { x: 168, w: 38, h: 72 },
        { x: 215, w: 48, h: 92 }, { x: 275, w: 32, h: 58 },
        { x: 315, w: 58, h: 115 }, { x: 382, w: 42, h: 78 },
        { x: 430, w: 40, h: 68 },
      ],
    },
    levelNames: ['Robot City', 'Robot Factory', 'Robot Wasteland'],
    subtitle: 'Dodge the robots. Collect the bots.',
  },

  soccer: {
    id: 'soccer',
    name: 'Soccer Sprint',
    description: 'Race through the stadium',
    icon: '⚽',
    colors: {
      sky: 0x4488CC,
      ground: 0x2D8B2D,
      road: 0x1E6B1E,
      buildings: 0x888888,
      buildingWindows: 0xCCCCCC,
      horizonGlow: 0x88CC88,
      laneLines: 0xFFFFFF,
      obstacle: 0xFF6600,
      obstacleDark: 0xCC5500,
      obstacleFlying: 0xDD4400,
      obstacleAccent: 0xFFFF00,
      collectBronze: 0xCD7F32,
      collectSilver: 0xC0C0C0,
      collectGold: 0xFFD700,
      collectSpecial: 0x00FF44,
      hudBg: 0x1A3A1A,
      hudText: 0xFFFFFF,
      uiAccent: 0x27AE60,
    },
    obstacleStyle: {
      eyeColor: 0xFFFF00,
      hasWings: false,
      hasAntenna: false,
      hasStripes: true,
      label: 'cones',
    },
    collectibleStyle: {
      hasFace: false,
      hasGearRing: false,
      label: 'trophies',
    },
    background: {
      type: 'stadium',
      elements: [
        { x: 0, w: 120, h: 60 }, { x: 120, w: 120, h: 70 },
        { x: 240, w: 120, h: 65 }, { x: 360, w: 120, h: 60 },
      ],
    },
    levelNames: ['Practice Field', 'League Match', 'Championship'],
    subtitle: 'Sprint past cones. Grab the trophies.',
  },

  space: {
    id: 'space',
    name: 'Space Dash',
    description: 'Navigate through the asteroid field',
    icon: '🚀',
    colors: {
      sky: 0x0A0A2E,
      ground: 0x1A1A3E,
      road: 0x222244,
      buildings: 0x333355,
      buildingWindows: 0x6666AA,
      horizonGlow: 0x4444AA,
      laneLines: 0x6666FF,
      obstacle: 0x884422,
      obstacleDark: 0x663311,
      obstacleFlying: 0xAA44FF,
      obstacleAccent: 0xFF4444,
      collectBronze: 0xCD7F32,
      collectSilver: 0xAABBFF,
      collectGold: 0xFFDD44,
      collectSpecial: 0x44FFFF,
      hudBg: 0x0A0A1E,
      hudText: 0xCCCCFF,
      uiAccent: 0x4488FF,
    },
    obstacleStyle: {
      eyeColor: 0xFF4444,
      hasWings: true,
      hasAntenna: false,
      hasStripes: false,
      label: 'asteroids',
    },
    collectibleStyle: {
      hasFace: false,
      hasGearRing: true,
      label: 'crystals',
    },
    background: {
      type: 'stars',
      elements: [], // stars are randomized
    },
    levelNames: ['Low Orbit', 'Asteroid Belt', 'Deep Space'],
    subtitle: 'Dodge asteroids. Collect crystals.',
  },
};

export const DEFAULT_THEME_ID = 'robots';

export function getTheme(id: string): ThemeDefinition {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
}

export function getAllThemes(): ThemeDefinition[] {
  return Object.values(THEMES);
}
