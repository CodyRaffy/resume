import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '../config/GameConfig';
import { ThemeManager } from '../managers/ThemeManager';
import { getAllThemes, ThemeDefinition } from '../config/ThemeConfig';

// Capacitor camera types - dynamically imported so it doesn't break on web
interface CapCamera {
  getPhoto(options: {
    resultType: string;
    source: string;
    quality: number;
    width?: number;
    height?: number;
    allowEditing?: boolean;
  }): Promise<{ dataUrl?: string; base64String?: string }>;
}

/**
 * Customization screen where users can:
 * 1. Pick a theme (robots, soccer, space, etc.)
 * 2. Upload their own photos for the character sprites
 *
 * Supports both:
 * - Native camera/gallery via @capacitor/camera (on mobile)
 * - File picker with optional camera capture (on web)
 */
export class CustomizeScene extends Phaser.Scene {
  private themeCards: Phaser.GameObjects.Container[] = [];
  private selectedBorder!: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private characterPreview!: Phaser.GameObjects.Image;
  private hasCustomLabel!: Phaser.GameObjects.Text;
  private isCapacitorAvailable: boolean = false;

  constructor() {
    super({ key: 'CustomizeScene' });
  }

  create(): void {
    this.scrollY = 0;
    this.themeCards = [];

    // Detect if running inside Capacitor (native mobile app)
    this.isCapacitorAvailable = !!(window as any).Capacitor?.isNativePlatform?.();

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Header
    this.add.text(GAME_WIDTH / 2, 30, 'CUSTOMIZE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5);

    // --- THEME SECTION ---
    this.add.text(GAME_WIDTH / 2, 68, 'Choose Your Theme', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#AAAACC',
    }).setOrigin(0.5, 0.5);

    const themes = getAllThemes();
    const currentThemeId = ThemeManager.getThemeId();
    const cardWidth = 130;
    const cardGap = 12;
    const totalWidth = themes.length * cardWidth + (themes.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2;

    themes.forEach((theme, i) => {
      const x = startX + i * (cardWidth + cardGap) + cardWidth / 2;
      const y = 140;
      const card = this.createThemeCard(theme, x, y, cardWidth, theme.id === currentThemeId);
      this.themeCards.push(card);
    });

    // --- CHARACTER SECTION ---
    this.add.text(GAME_WIDTH / 2, 225, 'Your Character', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#AAAACC',
    }).setOrigin(0.5, 0.5);

    // Character preview
    this.characterPreview = this.add.image(GAME_WIDTH / 2, 320, 'player');
    this.characterPreview.setDisplaySize(PLAYER_WIDTH * 1.8, PLAYER_HEIGHT * 1.8);

    // Custom sprite indicator
    this.hasCustomLabel = this.add.text(GAME_WIDTH / 2, 395, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#27AE60',
    }).setOrigin(0.5, 0.5);
    this.updateCustomLabel();

    // --- Photo buttons: side by side ---
    const btnY = 430;
    const btnGap = 8;
    const btnW = 150;
    const btnH = 44;

    // Take Photo button (camera)
    this.createButton(
      GAME_WIDTH / 2 - btnW / 2 - btnGap / 2, btnY,
      'Take Photo', 0x8E44AD,
      () => this.getPhoto('camera'),
      btnW, btnH, '14px'
    );

    // Choose from Gallery button (file picker / photo library)
    this.createButton(
      GAME_WIDTH / 2 + btnW / 2 + btnGap / 2, btnY,
      'From Gallery', 0x3498DB,
      () => this.getPhoto('gallery'),
      btnW, btnH, '14px'
    );

    // Instructions
    this.add.text(GAME_WIDTH / 2, 470, 'Use a photo of yourself as the character!', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#666688',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Clear custom sprites button (only if custom sprites exist)
    if (ThemeManager.hasCustomSprites()) {
      this.createButton(GAME_WIDTH / 2, 510, 'Reset to Default', 0x884444, () => {
        ThemeManager.clearCustomSprites();
        this.updateCustomLabel();
        // Restart to regenerate textures
        this.scene.start('BootScene');
      }, 160, 36, '14px');
    }

    // --- BOTTOM BUTTONS ---
    // Save & back button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Done', 0x27AE60, () => {
      // Restart from boot to regenerate all themed textures
      this.scene.start('BootScene');
    });

    // Back without saving
    const backText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Cancel', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private createThemeCard(theme: ThemeDefinition, x: number, y: number, w: number, isSelected: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const h = 100;

    // Card background
    const cardBg = this.add.graphics();
    const bgColor = isSelected ? 0x2a3a5e : 0x222244;
    cardBg.fillStyle(bgColor, 1);
    cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // Selection border
    if (isSelected) {
      cardBg.lineStyle(3, 0x3498DB, 1);
      cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    } else {
      cardBg.lineStyle(1, 0x444466, 0.5);
      cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    }

    // Theme color preview strip
    const strip = this.add.graphics();
    strip.fillStyle(theme.colors.sky, 1);
    strip.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, 24, { tl: 6, tr: 6, bl: 0, br: 0 });
    // Ground strip
    strip.fillStyle(theme.colors.ground, 1);
    strip.fillRect(-w / 2 + 4, -h / 2 + 20, w - 8, 8);
    // Obstacle dot
    strip.fillStyle(theme.colors.obstacle, 1);
    strip.fillCircle(-10, -h / 2 + 18, 5);
    // Collectible dot
    strip.fillStyle(theme.colors.collectGold, 1);
    strip.fillCircle(10, -h / 2 + 18, 5);

    // Icon
    const icon = this.add.text(0, -4, theme.icon, {
      fontSize: '24px',
    }).setOrigin(0.5, 0.5);

    // Theme name
    const nameText = this.add.text(0, 22, theme.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: isSelected ? '#FFFFFF' : '#AAAACC',
      fontStyle: isSelected ? 'bold' : 'normal',
    }).setOrigin(0.5, 0.5);

    // Selected check
    let checkText: Phaser.GameObjects.Text | null = null;
    if (isSelected) {
      checkText = this.add.text(w / 2 - 14, -h / 2 + 6, '✓', {
        fontSize: '14px',
        color: '#27AE60',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
    }

    container.add([cardBg, strip, icon, nameText]);
    if (checkText) container.add(checkText);

    // Interactive zone
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      ThemeManager.setTheme(theme.id);
      // Rebuild the scene to reflect the selection
      this.scene.restart();
    });

    return container;
  }

  private createButton(
    x: number, y: number, label: string, color: number,
    callback: () => void, width = 180, height = 48, fontSize = '18px'
  ): void {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    btn.lineStyle(2, 0xFFFFFF, 0.6);
    btn.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize,
      color: '#FFFFFF',
    }).setOrigin(0.5, 0.5);

    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: text,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private updateCustomLabel(): void {
    if (ThemeManager.hasCustomSprites()) {
      this.hasCustomLabel.setText('Custom photo active');
    } else {
      this.hasCustomLabel.setText('Using default character');
    }
  }

  /**
   * Get a photo from either the camera or gallery.
   * Uses @capacitor/camera on native mobile, falls back to HTML file input on web.
   */
  private getPhoto(source: 'camera' | 'gallery'): void {
    if (this.isCapacitorAvailable) {
      this.getPhotoCapacitor(source);
    } else {
      this.getPhotoWeb(source);
    }
  }

  /**
   * Native mobile path: use @capacitor/camera plugin.
   * Dynamically imports the plugin so it doesn't break when running on web.
   */
  private async getPhotoCapacitor(source: 'camera' | 'gallery'): Promise<void> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        quality: 90,
        width: 512,
        height: 768,
        allowEditing: true,
      });

      if (photo.dataUrl) {
        this.processUploadedPhoto(photo.dataUrl);
      }
    } catch (err: any) {
      // User cancelled or permission denied - that's okay
      if (err?.message && !err.message.includes('cancel')) {
        console.error('Camera error:', err);
      }
    }
  }

  /**
   * Web fallback: use an HTML file input.
   * For "camera" source, adds the capture attribute so mobile browsers
   * open the camera directly. For "gallery", opens the normal file picker.
   */
  private getPhotoWeb(source: 'camera' | 'gallery'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') {
      input.setAttribute('capture', 'environment');
    }
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          this.processUploadedPhoto(dataUrl);
        }
        document.body.removeChild(input);
      };
      reader.readAsDataURL(file);
    });

    input.click();
  }

  /**
   * Process an uploaded photo:
   * - Resize to fit sprite dimensions
   * - Center on transparent canvas
   * - Save as custom sprite for all 3 poses
   */
  private processUploadedPhoto(dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      // Process for run pose (portrait 64x96 -> we use 128x192 for better quality)
      const runCanvas = this.createSpriteCanvas(img, PLAYER_WIDTH * 2, PLAYER_HEIGHT * 2);
      ThemeManager.setCustomSprite('run', runCanvas);

      // Process for jump pose (same size, slightly shifted up)
      const jumpCanvas = this.createSpriteCanvas(img, PLAYER_WIDTH * 2, PLAYER_HEIGHT * 2);
      ThemeManager.setCustomSprite('jump', jumpCanvas);

      // Process for slide pose (wider, shorter)
      const slideCanvas = this.createSpriteCanvas(img, 160, 96);
      ThemeManager.setCustomSprite('slide', slideCanvas);

      this.updateCustomLabel();

      // Show confirmation and restart to reload textures
      const confirmText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Photo saved!\nReloading...', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#27AE60',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }).setOrigin(0.5, 0.5).setDepth(200);

      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.6);
      overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      overlay.setDepth(199);

      this.time.delayedCall(1000, () => {
        this.scene.start('BootScene');
      });
    };
    img.src = dataUrl;
  }

  /**
   * Resize and center an image onto a transparent canvas of the given dimensions.
   * Returns a data URL.
   */
  private createSpriteCanvas(img: HTMLImageElement, targetW: number, targetH: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    // Fit image within target while preserving aspect ratio
    const scale = Math.min(targetW / img.width, targetH / img.height);
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    const offsetX = (targetW - scaledW) / 2;
    const offsetY = (targetH - scaledH) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

    return canvas.toDataURL('image/png');
  }
}
