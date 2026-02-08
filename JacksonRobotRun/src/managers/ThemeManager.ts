import { ThemeDefinition, getTheme, DEFAULT_THEME_ID } from '../config/ThemeConfig';

const STORAGE_KEY = 'jackson-run-theme';
const CUSTOM_SPRITES_KEY = 'jackson-run-custom-sprites';

export interface CustomSpriteData {
  /** Base64 data URL for the run sprite */
  run?: string;
  /** Base64 data URL for the jump sprite */
  jump?: string;
  /** Base64 data URL for the slide sprite */
  slide?: string;
}

/**
 * Manages the active theme and custom character sprites.
 * Persists choices to localStorage.
 */
export class ThemeManager {
  private static currentThemeId: string = DEFAULT_THEME_ID;
  private static customSprites: CustomSpriteData = {};

  static init(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        ThemeManager.currentThemeId = saved;
      }
      const sprites = localStorage.getItem(CUSTOM_SPRITES_KEY);
      if (sprites) {
        ThemeManager.customSprites = JSON.parse(sprites);
      }
    } catch {
      // localStorage unavailable or corrupted, use defaults
    }
  }

  static getTheme(): ThemeDefinition {
    return getTheme(ThemeManager.currentThemeId);
  }

  static getThemeId(): string {
    return ThemeManager.currentThemeId;
  }

  static setTheme(id: string): void {
    ThemeManager.currentThemeId = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
  }

  static getCustomSprites(): CustomSpriteData {
    return ThemeManager.customSprites;
  }

  static hasCustomSprites(): boolean {
    const s = ThemeManager.customSprites;
    return !!(s.run || s.jump || s.slide);
  }

  static setCustomSprite(pose: 'run' | 'jump' | 'slide', dataUrl: string): void {
    ThemeManager.customSprites[pose] = dataUrl;
    try {
      localStorage.setItem(CUSTOM_SPRITES_KEY, JSON.stringify(ThemeManager.customSprites));
    } catch {
      // ignore storage errors
    }
  }

  static clearCustomSprites(): void {
    ThemeManager.customSprites = {};
    try {
      localStorage.removeItem(CUSTOM_SPRITES_KEY);
    } catch {
      // ignore
    }
  }
}
