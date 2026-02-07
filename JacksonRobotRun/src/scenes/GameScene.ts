import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, LANE_POSITIONS, DEFAULT_LANE,
  HORIZON_Y, GROUND_Y, PLAYER_Y, STARTING_LIVES,
  COLORS, DISTANCE_POINTS_PER_TICK,
} from '../config/GameConfig';
import { Player } from '../objects/Player';
import { SpawnManager } from '../managers/SpawnManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LevelManager } from '../managers/LevelManager';
import { InputManager } from '../managers/InputManager';
import { Obstacle } from '../objects/Obstacle';
import { Collectible } from '../objects/Collectible';

export class GameScene extends Phaser.Scene {
  player!: Player;
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

  // HUD elements
  scoreText!: Phaser.GameObjects.Text;
  livesText!: Phaser.GameObjects.Text;
  comboText!: Phaser.GameObjects.Text;
  levelText!: Phaser.GameObjects.Text;

  // Ground scrolling
  groundLines: Phaser.GameObjects.Graphics[] = [];
  groundLinePositions: number[] = [];

  // Level transition
  levelAnnouncement!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.isGameOver = false;
    this.isPaused = false;
    this.isInvincible = false;
    this.lives = STARTING_LIVES;

    // Draw background and ground
    this.drawBackground();
    this.drawGround();

    // Create groups for obstacles and collectibles
    this.obstacles = this.add.group();
    this.collectibles = this.add.group();

    // Create player
    this.player = new Player(this, LANE_POSITIONS[DEFAULT_LANE], PLAYER_Y);

    // Initialize managers
    this.scoreManager = new ScoreManager();
    this.levelManager = new LevelManager(this);
    this.spawnManager = new SpawnManager(this);
    this.inputManager = new InputManager(this);

    // Create HUD
    this.createHUD();

    // Level announcement text (hidden by default)
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

    // Pause button
    const pauseBtn = this.add.text(GAME_WIDTH - 15, 15, '||', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    });
    pauseBtn.setOrigin(1, 0);
    pauseBtn.setInteractive();
    pauseBtn.setDepth(100);
    pauseBtn.on('pointerdown', () => this.togglePause());
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.isPaused) return;

    const currentLevel = this.levelManager.getCurrentLevel();
    const speed = this.levelManager.getCurrentSpeed();

    // Update ground scrolling
    this.updateGround(speed, delta);

    // Update score (distance)
    this.scoreManager.addDistance(DISTANCE_POINTS_PER_TICK);

    // Check for level progression
    this.levelManager.checkLevelUp(this.scoreManager.getScore());

    // Spawn obstacles and collectibles
    this.spawnManager.update(delta, currentLevel, speed);

    // Update obstacles
    this.obstacles.getChildren().forEach((obj) => {
      const obstacle = obj as Obstacle;
      obstacle.updatePosition(speed, delta);

      // Check collision with player
      if (!this.isInvincible && this.checkPlayerObstacleCollision(this.player, obstacle)) {
        this.onObstacleHit(obstacle);
      }

      // Remove if off screen
      if (obstacle.y > GAME_HEIGHT + 50) {
        obstacle.destroy();
      }
    });

    // Update collectibles
    this.collectibles.getChildren().forEach((obj) => {
      const collectible = obj as Collectible;
      collectible.updatePosition(speed, delta);

      // Check collection
      if (this.checkPlayerCollectibleCollision(this.player, collectible)) {
        this.onCollectiblePickup(collectible);
      }

      // Remove if off screen
      if (collectible.y > GAME_HEIGHT + 50) {
        collectible.destroy();
      }
    });

    // Update HUD
    this.updateHUD();
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.sky, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Simple city skyline silhouette
    bg.fillStyle(0x2C3E50, 1);
    const buildings = [
      { x: 20, w: 40, h: 80 },
      { x: 70, w: 30, h: 60 },
      { x: 110, w: 50, h: 100 },
      { x: 170, w: 35, h: 70 },
      { x: 220, w: 45, h: 90 },
      { x: 280, w: 30, h: 55 },
      { x: 320, w: 55, h: 110 },
      { x: 385, w: 40, h: 75 },
      { x: 430, w: 35, h: 65 },
    ];

    buildings.forEach(b => {
      bg.fillRect(b.x, HORIZON_Y - b.h, b.w, b.h);
    });
  }

  private drawGround(): void {
    // Main ground
    const ground = this.add.graphics();
    ground.fillStyle(COLORS.ground, 1);
    ground.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    // Perspective road
    const road = this.add.graphics();
    road.fillStyle(0x444444, 1);

    // Road widens from horizon to bottom
    const topLeft = GAME_WIDTH * 0.35;
    const topRight = GAME_WIDTH * 0.65;
    const botLeft = GAME_WIDTH * 0.05;
    const botRight = GAME_WIDTH * 0.95;

    road.beginPath();
    road.moveTo(topLeft, HORIZON_Y);
    road.lineTo(topRight, HORIZON_Y);
    road.lineTo(botRight, GAME_HEIGHT);
    road.lineTo(botLeft, GAME_HEIGHT);
    road.closePath();
    road.fillPath();

    // Lane dividers (static base)
    road.lineStyle(2, 0xFFFFFF, 0.3);
    // Left divider
    const lDiv1TopX = Phaser.Math.Linear(topLeft, topRight, 0.33);
    const lDiv1BotX = Phaser.Math.Linear(botLeft, botRight, 0.33);
    road.lineBetween(lDiv1TopX, HORIZON_Y, lDiv1BotX, GAME_HEIGHT);
    // Right divider
    const lDiv2TopX = Phaser.Math.Linear(topLeft, topRight, 0.67);
    const lDiv2BotX = Phaser.Math.Linear(botLeft, botRight, 0.67);
    road.lineBetween(lDiv2TopX, HORIZON_Y, lDiv2BotX, GAME_HEIGHT);

    // Create animated ground lines for scrolling effect
    for (let i = 0; i < 8; i++) {
      const lineGfx = this.add.graphics();
      this.groundLines.push(lineGfx);
      this.groundLinePositions.push(i / 8);
    }
  }

  private updateGround(speed: number, delta: number): void {
    const topLeft = GAME_WIDTH * 0.35;
    const topRight = GAME_WIDTH * 0.65;
    const botLeft = GAME_WIDTH * 0.05;
    const botRight = GAME_WIDTH * 0.95;

    for (let i = 0; i < this.groundLines.length; i++) {
      this.groundLinePositions[i] += speed * delta * 0.0005;
      if (this.groundLinePositions[i] > 1) {
        this.groundLinePositions[i] -= 1;
      }

      const t = this.groundLinePositions[i];
      // Perspective: lines get wider and more spaced as they approach camera
      const perspT = t * t; // quadratic for perspective effect
      const y = Phaser.Math.Linear(HORIZON_Y, GAME_HEIGHT, perspT);
      const leftX = Phaser.Math.Linear(topLeft, botLeft, perspT);
      const rightX = Phaser.Math.Linear(topRight, botRight, perspT);

      const gfx = this.groundLines[i];
      gfx.clear();
      gfx.lineStyle(1 + perspT * 2, 0xFFFFFF, 0.15 + perspT * 0.15);
      gfx.lineBetween(leftX, y, rightX, y);
    }
  }

  private createHUD(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(COLORS.hud_bg, 0.5);
    hudBg.fillRect(0, 0, GAME_WIDTH, 45);
    hudBg.setDepth(90);

    this.scoreText = this.add.text(15, 12, 'Score: 0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
    });
    this.scoreText.setDepth(100);

    this.livesText = this.add.text(GAME_WIDTH / 2, 12, '♥♥♥', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FF4444',
    });
    this.livesText.setOrigin(0.5, 0);
    this.livesText.setDepth(100);

    this.comboText = this.add.text(15, 30, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#FFD700',
    });
    this.comboText.setDepth(100);

    this.levelText = this.add.text(GAME_WIDTH - 60, 12, 'Level 1', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#88DDFF',
    });
    this.levelText.setDepth(100);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.scoreManager.getScore()}`);

    const hearts = '♥'.repeat(this.lives) + '♡'.repeat(STARTING_LIVES - this.lives);
    this.livesText.setText(hearts);

    const combo = this.scoreManager.getCombo();
    const multiplier = this.scoreManager.getMultiplier();
    if (combo > 0) {
      this.comboText.setText(`Combo: ${combo} (${multiplier}x)`);
    } else {
      this.comboText.setText('');
    }

    this.levelText.setText(`Level ${this.levelManager.getCurrentLevel().id}`);
  }

  checkPlayerObstacleCollision(player: Player, obstacle: Obstacle): boolean {
    const playerBounds = player.getCollisionBounds();
    const obstacleBounds = obstacle.getCollisionBounds();
    return Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacleBounds);
  }

  checkPlayerCollectibleCollision(player: Player, collectible: Collectible): boolean {
    const playerBounds = player.getCollisionBounds();
    const collectibleBounds = collectible.getBounds();
    return Phaser.Geom.Rectangle.Overlaps(playerBounds, collectibleBounds);
  }

  onObstacleHit(obstacle: Obstacle): void {
    this.lives--;
    this.scoreManager.resetCombo();
    obstacle.destroy();

    // Screen shake
    this.cameras.main.shake(200, 0.01);

    // Flash player red
    this.player.flash();

    // Brief invincibility
    this.isInvincible = true;
    this.time.delayedCall(2000, () => {
      this.isInvincible = false;
    });

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  onCollectiblePickup(collectible: Collectible): void {
    const points = collectible.getPoints();
    this.scoreManager.addCollectible(points);

    // Visual feedback - floating text
    const floatText = this.add.text(collectible.x, collectible.y, `+${points * this.scoreManager.getMultiplier()}`, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    floatText.setOrigin(0.5, 0.5);
    floatText.setDepth(90);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => floatText.destroy(),
    });

    collectible.destroy();
  }

  showLevelAnnouncement(levelName: string): void {
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
          delay: 1500,
          duration: 500,
        });
      },
    });
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.launch('PauseScene');
    } else {
      this.scene.stop('PauseScene');
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.scoreManager.saveHighScore();

    // Slow-mo effect
    this.tweens.addCounter({
      from: 1,
      to: 0,
      duration: 500,
      onComplete: () => {
        this.scene.start('GameOverScene', {
          score: this.scoreManager.getScore(),
          highScore: ScoreManager.getHighScore(),
          level: this.levelManager.getCurrentLevel().id,
          robotsCollected: this.scoreManager.getCollected(),
        });
      },
    });
  }
}
