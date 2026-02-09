# Jackson Robot Run

An endless runner game built with **Phaser 3** and **TypeScript** where the player controls Jackson, dodging robots and collecting bots in a pseudo-3D perspective.

**Author:** Cody Raffensperger
**Purpose:** Portfolio project

---

## Tech Stack

- **Phaser 3.90.0** - HTML5 game framework (rendering, physics, input, state)
- **TypeScript 5.9.3** - Type-safe source code
- **Vite 7.3.1** - Bundler for dev server and production builds
- Game dimensions: 480x800 (portrait/mobile-friendly)

## Running the Project

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run deploy       # Build + copy dist/ to ../game/ for GitHub Pages
```

Build output: `dist/index.html` + `dist/game.min.js`

## Deployment

The game is hosted on GitHub Pages at codyraffensperger.com/game/. The built files live in the `game/` directory at the root of the parent `resume` repo.

To deploy: run `npm run deploy`, then commit `../game/` and push `master`.

---

## Project Structure

```
src/
  main.ts                    # Entry point, Phaser game config
  config/
    GameConfig.ts            # Constants (dimensions, physics, scoring, colors)
    LevelConfig.ts           # Level definitions (3 levels)
  scenes/
    BootScene.ts             # Asset loading, procedural texture generation
    MenuScene.ts             # Title screen with play button
    GameScene.ts             # Main gameplay loop
    GameOverScene.ts         # Results screen with stats
    PauseScene.ts            # Pause overlay
  objects/
    Player.ts                # Jackson character (movement, states, sprites)
    Obstacle.ts              # Obstacle types and behavior
    Collectible.ts           # Collectible types and bobbing animation
  managers/
    InputManager.ts          # Keyboard + touch/swipe input handling
    SpawnManager.ts          # Obstacle/collectible spawn logic
    ScoreManager.ts          # Score, combo, multiplier tracking
    LevelManager.ts          # Level progression and speed ramping
    AudioManager.ts          # Audio framework (structure in place)
  utils/
    ObjectPool.ts            # Object pooling for performance
    PerspectiveHelper.ts     # Pseudo-3D perspective calculations
public/
  assets/
    sprites/jackson/         # Player sprites (run.png, jump.png, slide.png)
    data/levels.json         # External level configuration
index.html                   # Game entry page
```

---

## Game Overview

### Scene Flow

`BootScene` (load assets) -> `MenuScene` (title/play) -> `GameScene` (gameplay) -> `GameOverScene` (results)

`PauseScene` overlays `GameScene` when paused.

### Controls

| Action     | Keyboard         | Touch            |
|------------|------------------|------------------|
| Move left  | Left arrow / A   | Swipe left       |
| Move right | Right arrow / D  | Swipe right      |
| Jump       | Up arrow / W / Space | Swipe up     |
| Slide      | Down arrow / S   | Swipe down       |

Tap fallback: tap left/right half of screen to move lanes.

### Core Mechanics

- **3 lanes** - Player switches between left, center, right lanes
- **Pseudo-3D perspective** - Objects spawn at the horizon and scale up as they approach
- **Player runs into the screen** (back-facing sprite perspective)
- **3 lives** (max 5), 2-second invincibility after each hit
- **High scores** saved to `localStorage` (`jacksonRobotRun_highScore`)

### Obstacle Types (7)

| Type            | Avoidance Strategy                    | Special         |
|-----------------|---------------------------------------|-----------------|
| Ground          | Jump over or switch lanes             |                 |
| Tall            | Slide under or switch lanes           | Can't jump over |
| Lane Blocker    | Switch lanes, jump, or slide          |                 |
| Double Blocker  | Find the 1 open lane                  |                 |
| Flying          | Slide under or switch lanes           | Can't jump over |
| Platform        | Jump on for bonus points              | +30 pts         |
| Bar             | Slide under for bonus points          | +30 pts         |

### Collectible Types (4)

| Type        | Points | Rarity      |
|-------------|--------|-------------|
| Bronze Bot  | 10     | Common      |
| Silver Bot  | 25     | Common      |
| Gold Bot    | 50     | Rare        |
| Special Bot | 100    | Very Rare   |

### Scoring & Combo System

- **Distance**: 1 point per tick (continuous)
- **Collectibles**: Base value x combo multiplier
- **Platform jump / Bar slide**: 30 pts x combo multiplier
- **Combo multipliers**: 1x (default), 2x (combo 5+), 3x (combo 10+), 5x (combo 20+)
- Combo resets on obstacle hit

### Level Progression

| Level | Name            | Unlocks At | Base Speed | New Obstacles              |
|-------|-----------------|------------|------------|----------------------------|
| 1     | Robot City      | Score 0    | 1.0        | Ground, Lane Blocker, Platform, Bar |
| 2     | Robot Factory   | Score 500  | 1.4        | + Tall                     |
| 3     | Robot Wasteland | Score 1500 | 2.5        | + Flying, Double Blocker   |

Speed ramps up continuously within each level. Spawn intervals decrease over 60 seconds.

---

## Technical Notes

- **Collision detection** only fires when obstacles are at "collision depth" (0.75-1.10 in depth_z)
- **Player hitbox** is 70% of visual size (forgiving)
- **Slide hitbox** reduces height from 96px to 48px
- **Frame-rate independent** via delta time scaling
- **Procedural sprite fallback** - If Jackson sprites fail to load, BootScene generates placeholder textures dynamically
- **Swipe detection** - 30px threshold, 500ms max duration
- **Touch input** ignores top 60px (HUD area)

### Jackson Sprites

Located in `public/assets/sprites/jackson/`:
- `run.png` (64x96) - Running pose, back-facing
- `jump.png` (64x96) - Jumping pose with legs tucked
- `slide.png` (80x48) - Sliding/crouching pose (wider, shorter)

### Key Config Constants (GameConfig.ts)

- Game size: 480x800
- Lanes: 3 (positioned at equal intervals)
- Jump duration: 600ms, height: 120px
- Slide duration: 500ms
- Lane switch: 150ms with easing
- Invincibility: 2 seconds after hit
- Collectible spawn rate: ~35%
