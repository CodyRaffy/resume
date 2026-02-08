import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, LANE_POSITIONS, DEFAULT_LANE,
  HORIZON_Y, GROUND_Y, PLAYER_Y, STARTING_LIVES,
  COLORS, DISTANCE_POINTS_PER_TICK, PLATFORM_JUMP_POINTS, BAR_SLIDE_POINTS,
  DUCK_BONUS_POINTS,
} from '../config/GameConfig';
import { Player } from '../objects/Player';
import { SpawnManager } from '../managers/SpawnManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LevelManager } from '../managers/LevelManager';
import { InputManager } from '../managers/InputManager';
import { Obstacle } from '../objects/Obstacle';
import { Collectible } from '../objects/Collectible';
import { AudioManager } from '../managers/AudioManager';

// Depth zone where collisions are checked (obstacle near the player).
const COLLISION_Z_MIN = 0.82;
const COLLISION_Z_MAX = 1.0;

export class GameScene extends Phaser.Scene {
  player!: Player;
  playerShadow!: Phaser.GameObjects.Image;
  spawnManager!: SpawnManager;
  scoreManager!: ScoreManager;
  levelManager!: LevelManager;
  inputManager!: InputManager;

  obstacles!: Phaser.GameObjects.Group;
  collectibles!: Phaser.GameObjects.Group;

  lives: number = STARTING_LIVES;
  isGameOver: boolean = false;
  isPaused: boolean = false;
  isInvincible: boolean = false;
  isLevelTransition: boolean = false;

  // HUD elements
  scoreText!: Phaser.GameObjects.Text;
  livesText!: Phaser.GameObjects.Text;
  comboText!: Phaser.GameObjects.Text;
  levelText!: Phaser.GameObjects.Text;

  // Ground scrolling
  private groundLines: Phaser.GameObjects.Graphics[] = [];
  private groundLinePositions: number[] = [];

  // Level transition
  levelAnnouncement!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Reset all state for replays
    this.isGameOver = false;
    this.isPaused = false;
    this.isInvincible = false;
    this.isLevelTransition = false;
    this.lives = STARTING_LIVES;
    this.groundLines = [];
    this.groundLinePositions = [];

    // Draw background and ground
    this.drawBackground();
    this.drawGround();

    // Create groups
    this.obstacles = this.add.group();
    this.collectibles = this.add.group();

    // Player shadow (drawn under the player)
    this.playerShadow = this.add.image(LANE_POSITIONS[DEFAULT_LANE], PLAYER_Y + 44, 'player-shadow');
    this.playerShadow.setDepth(49);

    // Create player
    this.player = new Player(this, LANE_POSITIONS[DEFAULT_LANE], PLAYER_Y);

    // Initialize managers
    this.scoreManager = new ScoreManager();
    this.levelManager = new LevelManager(this);
    this.spawnManager = new SpawnManager(this);
    this.inputManager = new InputManager(this);

    // HUD
    this.createHUD();

    // Level announcement (hidden)
    this.levelAnnouncement = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    });
    this.levelAnnouncement.setOrigin(0.5, 0.5);
    this.levelAnnouncement.setAlpha(0);
    this.levelAnnouncement.setDepth(100);

    // Start music
    const audio = AudioManager.getInstance();
    audio.unlock();
    audio.playMusic();

    // Mute button
    const muteBtn = this.add.text(GAME_WIDTH - 50, 30, audio.isMuted() ? 'M' : 'S', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    });
    muteBtn.setOrigin(0.5, 0.5);
    muteBtn.setInteractive({ useHandCursor: true });
    muteBtn.setDepth(100);
    muteBtn.on('pointerdown', () => {
      const muted = audio.toggleMute();
      muteBtn.setText(muted ? 'M' : 'S');
    });

    // Pause button
    const pauseBtn = this.add.text(GAME_WIDTH - 15, 15, '| |', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    });
    pauseBtn.setOrigin(1, 0);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.setDepth(100);
    pauseBtn.on('pointerdown', () => this.togglePause());
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.isPaused) return;

    const currentLevel = this.levelManager.getCurrentLevel();
    const speed = this.levelManager.getCurrentSpeed();

    // During level transition, only update player shadow and HUD — freeze everything else
    if (this.isLevelTransition) {
      this.playerShadow.x = this.player.x;
      this.playerShadow.y = PLAYER_Y + 44;
      this.updateHUD();
      return;
    }

    // Scrolling ground lines
    this.updateGround(speed, delta);

    // Distance score
    this.scoreManager.addDistance(DISTANCE_POINTS_PER_TICK);

    // Level check (pass delta for frame-rate-independent speed ramp)
    this.levelManager.checkLevelUp(this.scoreManager.getScore(), delta);

    // Spawn
    this.spawnManager.update(delta, currentLevel, speed);

    // Update player shadow position
    this.playerShadow.x = this.player.x;
    this.playerShadow.y = PLAYER_Y + 44;
    this.playerShadow.setAlpha(this.player.playerState === 'jumping' ? 0.15 : 0.3);

    // --- Update obstacles (collect into array first to avoid mutation during iteration) ---
    const obstaclesToDestroy: Obstacle[] = [];
    const obstacleChildren = this.obstacles.getChildren().slice() as Obstacle[];

    for (const obstacle of obstacleChildren) {
      obstacle.updatePosition(speed, delta);

      // Only check collision when obstacle is near the player
      if (obstacle.depth_z >= COLLISION_Z_MIN
        && obstacle.depth_z <= COLLISION_Z_MAX
      ) {
        // Platforms: jumping on them awards points
        if (obstacle.obstacleType === 'platform'
          && this.player.playerState === 'jumping'
          && this.checkPlayerVsObstacle(obstacle)
        ) {
          this.onPlatformLand(obstacle);
          continue;
        }

        // Bars: sliding under them awards points (check lane, not bounds —
        // the bar is elevated so bounds won't overlap with the sliding player)
        if (obstacle.obstacleType === 'bar'
          && this.player.playerState === 'sliding'
          && this.player.currentLane === obstacle.lane
          && !obstacle.duckBonusAwarded
        ) {
          this.onBarSlide(obstacle);
          continue;
        }

        // Tall/flying obstacles: ducking under them awards bonus points
        if ((obstacle.obstacleType === 'tall' || obstacle.obstacleType === 'flying')
          && this.player.playerState === 'sliding'
          && this.player.currentLane === obstacle.lane
          && !obstacle.duckBonusAwarded
        ) {
          this.onDuckUnder(obstacle);
        }

        // Normal obstacle collision
        if (!this.isInvincible && this.checkPlayerVsObstacle(obstacle)) {
          this.onObstacleHit(obstacle);
          continue;
        }
      }

      // Remove if past the camera
      if (obstacle.depth_z > 1.05) {
        obstaclesToDestroy.push(obstacle);
      }
    }
    obstaclesToDestroy.forEach(o => o.destroy());

    // --- Update collectibles ---
    const collectiblesToDestroy: Collectible[] = [];
    const collectChildren = this.collectibles.getChildren().slice() as Collectible[];

    for (const collectible of collectChildren) {
      collectible.updatePosition(speed, delta);

      if (collectible.depth_z >= COLLISION_Z_MIN
        && collectible.depth_z <= COLLISION_Z_MAX
        && this.checkPlayerVsCollectible(collectible)
      ) {
        this.onCollectiblePickup(collectible);
        continue;
      }

      if (collectible.depth_z > 1.05) {
        collectiblesToDestroy.push(collectible);
      }
    }
    collectiblesToDestroy.forEach(c => c.destroy());

    // HUD
    this.updateHUD();
  }

  // --- Drawing ---

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.sky, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // City skyline silhouette
    bg.fillStyle(0x2C3E50, 1);
    const buildings = [
      { x: 10, w: 45, h: 85 }, { x: 65, w: 35, h: 55 },
      { x: 108, w: 52, h: 105 }, { x: 168, w: 38, h: 72 },
      { x: 215, w: 48, h: 92 }, { x: 275, w: 32, h: 58 },
      { x: 315, w: 58, h: 115 }, { x: 382, w: 42, h: 78 },
      { x: 430, w: 40, h: 68 },
    ];
    buildings.forEach(b => {
      bg.fillRect(b.x, HORIZON_Y - b.h, b.w, b.h);
      // Window dots
      bg.fillStyle(0x4A6B8A, 0.5);
      for (let wy = HORIZON_Y - b.h + 8; wy < HORIZON_Y - 8; wy += 14) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
          bg.fillRect(wx, wy, 4, 6);
        }
      }
      bg.fillStyle(0x2C3E50, 1);
    });

    // Horizon glow
    bg.fillStyle(0xBBDDEE, 0.3);
    bg.fillRect(0, HORIZON_Y - 2, GAME_WIDTH, 4);
  }

  private drawGround(): void {
    const ground = this.add.graphics();
    ground.fillStyle(COLORS.ground, 1);
    ground.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    // Perspective road
    const road = this.add.graphics();
    road.fillStyle(0x3a3a3a, 1);

    const topLeft = GAME_WIDTH * 0.35;
    const topRight = GAME_WIDTH * 0.65;
    const botLeft = GAME_WIDTH * 0.02;
    const botRight = GAME_WIDTH * 0.98;

    road.beginPath();
    road.moveTo(topLeft, HORIZON_Y);
    road.lineTo(topRight, HORIZON_Y);
    road.lineTo(botRight, GAME_HEIGHT);
    road.lineTo(botLeft, GAME_HEIGHT);
    road.closePath();
    road.fillPath();

    // Sidewalk edges
    road.lineStyle(3, 0x666666, 0.5);
    road.lineBetween(topLeft, HORIZON_Y, botLeft, GAME_HEIGHT);
    road.lineBetween(topRight, HORIZON_Y, botRight, GAME_HEIGHT);

    // Lane dividers (static dashed lines)
    road.lineStyle(2, 0xFFFFFF, 0.25);
    const lDiv1TopX = Phaser.Math.Linear(topLeft, topRight, 0.33);
    const lDiv1BotX = Phaser.Math.Linear(botLeft, botRight, 0.33);
    road.lineBetween(lDiv1TopX, HORIZON_Y, lDiv1BotX, GAME_HEIGHT);
    const lDiv2TopX = Phaser.Math.Linear(topLeft, topRight, 0.67);
    const lDiv2BotX = Phaser.Math.Linear(botLeft, botRight, 0.67);
    road.lineBetween(lDiv2TopX, HORIZON_Y, lDiv2BotX, GAME_HEIGHT);

    // Animated ground lines for scrolling effect
    for (let i = 0; i < 10; i++) {
      const lineGfx = this.add.graphics();
      lineGfx.setDepth(5);
      this.groundLines.push(lineGfx);
      this.groundLinePositions.push(i / 10);
    }
  }

  private updateGround(speed: number, delta: number): void {
    const topLeft = GAME_WIDTH * 0.35;
    const topRight = GAME_WIDTH * 0.65;
    const botLeft = GAME_WIDTH * 0.02;
    const botRight = GAME_WIDTH * 0.98;

    for (let i = 0; i < this.groundLines.length; i++) {
      this.groundLinePositions[i] += speed * delta * 0.0004;
      if (this.groundLinePositions[i] > 1) {
        this.groundLinePositions[i] -= 1;
      }

      const t = this.groundLinePositions[i];
      const perspT = t * t;
      const y = Phaser.Math.Linear(HORIZON_Y, GAME_HEIGHT, perspT);
      const leftX = Phaser.Math.Linear(topLeft, botLeft, perspT);
      const rightX = Phaser.Math.Linear(topRight, botRight, perspT);

      const gfx = this.groundLines[i];
      gfx.clear();
      const alpha = 0.08 + perspT * 0.2;
      const width = 1 + perspT * 2.5;
      gfx.lineStyle(width, 0xFFFFFF, alpha);
      gfx.lineBetween(leftX + 5, y, rightX - 5, y);
    }
  }

  // --- HUD ---

  private createHUD(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(COLORS.hud_bg, 0.6);
    hudBg.fillRect(0, 0, GAME_WIDTH, 48);
    hudBg.setDepth(90);

    this.scoreText = this.add.text(15, 8, 'Score: 0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#FFFFFF',
    }).setDepth(100);

    this.livesText = this.add.text(GAME_WIDTH / 2, 8, '\u2764\u2764\u2764', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FF4444',
    }).setOrigin(0.5, 0).setDepth(100);

    this.comboText = this.add.text(15, 30, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFD700',
    }).setDepth(100);

    this.levelText = this.add.text(GAME_WIDTH - 15, 8, 'Level 1', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#88DDFF',
    }).setOrigin(1, 0).setDepth(100);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.scoreManager.getScore()}`);

    let hearts = '';
    for (let i = 0; i < STARTING_LIVES; i++) {
      hearts += i < this.lives ? '\u2764' : '\u2661';
    }
    this.livesText.setText(hearts);

    const combo = this.scoreManager.getCombo();
    const multiplier = this.scoreManager.getMultiplier();
    this.comboText.setText(combo > 1 ? `Combo: ${combo} (${multiplier}x)` : '');

    this.levelText.setText(`Level ${this.levelManager.getCurrentLevel().id}`);
  }

  // --- Collision ---

  private checkPlayerVsObstacle(obstacle: Obstacle): boolean {
    const playerBounds = this.player.getCollisionBounds();

    // For double blockers, check both sprites
    if (obstacle.secondSpriteBounds) {
      const mainBounds = obstacle.getMainBounds();
      const secondBounds = obstacle.secondSpriteBounds;
      return Phaser.Geom.Rectangle.Overlaps(playerBounds, mainBounds)
        || Phaser.Geom.Rectangle.Overlaps(playerBounds, secondBounds);
    }

    const obstacleBounds = obstacle.getMainBounds();

    // For tall obstacles, only collide if player is NOT sliding
    if (obstacle.obstacleType === 'tall' && this.player.playerState === 'sliding') {
      return false;
    }

    // For ground obstacles, no collision if player is jumping
    if (obstacle.obstacleType === 'ground' && this.player.playerState === 'jumping') {
      return false;
    }

    // For flying obstacles, no collision if player is sliding
    if (obstacle.obstacleType === 'flying' && this.player.playerState === 'sliding') {
      return false;
    }

    return Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacleBounds);
  }

  private checkPlayerVsCollectible(collectible: Collectible): boolean {
    const playerBounds = this.player.getCollisionBounds();
    const collectBounds = collectible.getBounds();
    return Phaser.Geom.Rectangle.Overlaps(playerBounds, collectBounds);
  }

  // --- Hit / Pickup ---

  onObstacleHit(obstacle: Obstacle): void {
    this.lives--;
    this.scoreManager.resetCombo();
    obstacle.destroy();

    AudioManager.getInstance().playHit();

    // Screen shake
    this.cameras.main.shake(300, 0.015);

    // Flash player
    this.player.flash();

    // Red flash overlay
    const flash = this.add.graphics();
    flash.fillStyle(0xFF0000, 0.2);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    flash.setDepth(80);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Invincibility
    this.isInvincible = true;
    this.time.delayedCall(2000, () => {
      this.isInvincible = false;
    });

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  onPlatformLand(platform: Obstacle): void {
    AudioManager.getInstance().playPlatformLand();
    const earned = this.scoreManager.addCollectible(PLATFORM_JUMP_POINTS);

    // Floating score text
    const floatText = this.add.text(platform.x, platform.y, `+${earned}`, {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#2ECC71',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(90);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 80,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => floatText.destroy(),
    });

    // Green particle burst
    const particles = this.add.particles(platform.x, platform.y, 'particle', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 450,
      quantity: 10,
      tint: 0x2ECC71,
      emitting: false,
    });
    particles.setDepth(85);
    particles.explode();
    this.time.delayedCall(500, () => particles.destroy());

    platform.destroy();
  }

  onBarSlide(bar: Obstacle): void {
    bar.duckBonusAwarded = true;
    AudioManager.getInstance().playBarSlide();
    const earned = this.scoreManager.addCollectible(BAR_SLIDE_POINTS);

    // Floating score text
    const floatText = this.add.text(bar.x, bar.y, `+${earned}`, {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#F39C12',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(90);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 80,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => floatText.destroy(),
    });

    // Orange particle burst
    const particles = this.add.particles(bar.x, bar.y, 'particle', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 450,
      quantity: 10,
      tint: 0xF39C12,
      emitting: false,
    });
    particles.setDepth(85);
    particles.explode();
    this.time.delayedCall(500, () => particles.destroy());

    bar.destroy();
  }

  onDuckUnder(obstacle: Obstacle): void {
    obstacle.duckBonusAwarded = true;
    AudioManager.getInstance().playBarSlide();
    const earned = this.scoreManager.addCollectible(DUCK_BONUS_POINTS);

    // Floating score text
    const floatText = this.add.text(obstacle.x, obstacle.y, `+${earned}`, {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#00BFFF',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(90);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 70,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => floatText.destroy(),
    });

    // Cyan particle burst
    const particles = this.add.particles(obstacle.x, obstacle.y, 'particle', {
      speed: { min: 30, max: 100 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: 0x00BFFF,
      emitting: false,
    });
    particles.setDepth(85);
    particles.explode();
    this.time.delayedCall(500, () => particles.destroy());
  }

  onCollectiblePickup(collectible: Collectible): void {
    AudioManager.getInstance().playCollect();
    const basePoints = collectible.getPoints();
    // addCollectible returns the actual earned value (with multiplier applied)
    const earned = this.scoreManager.addCollectible(basePoints);

    // Floating score text
    const floatText = this.add.text(collectible.x, collectible.y, `+${earned}`, {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(90);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 70,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => floatText.destroy(),
    });

    // Particle burst
    const particles = this.add.particles(collectible.x, collectible.y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: collectible.collectibleType === 'gold' ? 0xFFD700
        : collectible.collectibleType === 'silver' ? 0xC0C0C0
        : collectible.collectibleType === 'special' ? 0x00FF88
        : 0xCD7F32,
      emitting: false,
    });
    particles.setDepth(85);
    particles.explode();
    this.time.delayedCall(500, () => particles.destroy());

    collectible.destroy();
  }

  // --- Level Announcement ---

  showLevelAnnouncement(levelName: string): void {
    // Freeze obstacles and clear the field
    this.isLevelTransition = true;

    // Destroy all existing obstacles and collectibles
    this.obstacles.getChildren().slice().forEach(o => o.destroy());
    this.collectibles.getChildren().slice().forEach(c => c.destroy());

    this.levelAnnouncement.setText(`${levelName}!`);
    this.levelAnnouncement.setAlpha(1);
    this.levelAnnouncement.setScale(0.5);

    this.tweens.add({
      targets: this.levelAnnouncement,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.levelAnnouncement,
          alpha: 0,
          delay: 1200,
          duration: 500,
          onComplete: () => {
            // Resume gameplay after text fades
            this.isLevelTransition = false;
          },
        });
      },
    });
  }

  // --- Pause ---

  togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.launch('PauseScene');
    } else {
      this.scene.stop('PauseScene');
    }
  }

  // --- Game Over ---

  private gameOver(): void {
    this.isGameOver = true;
    this.scoreManager.saveHighScore();
    const audio = AudioManager.getInstance();
    audio.stopMusic();
    audio.playGameOver();

    // Brief delay then transition
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', {
        score: this.scoreManager.getScore(),
        highScore: ScoreManager.getHighScore(),
        level: this.levelManager.getCurrentLevel().id,
        robotsCollected: this.scoreManager.getCollected(),
      });
    });
  }
}
