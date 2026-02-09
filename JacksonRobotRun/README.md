# Jackson Robot Run

An endless runner game built with **Phaser 3** and **TypeScript** where the player controls Jackson, dodging robots and collecting bots in a pseudo-3D perspective.

**Author:** Cody Raffensperger
**Purpose:** Portfolio project
**Live:** [codyraffensperger.com/game](https://codyraffensperger.com/game/)

## Play It

The game is hosted on GitHub Pages at [codyraffensperger.com/game](https://codyraffensperger.com/game/) and can be installed as a mobile app on your phone (see [Installing as a Phone App](#installing-as-a-phone-app-pwa) below).

## Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Deploying to GitHub Pages

The game is served from the `game/` directory in the root of the [resume](https://github.com/CodyRaffy/resume) repository, which is deployed to GitHub Pages at codyraffensperger.com.

### Quick Deploy

```bash
npm run deploy       # Build + copy dist/ to ../game/
```

This runs `npm run build` and then copies the `dist/` output into `../game/` (the parent repo's `game/` directory). After running the script, commit and push to `master`:

```bash
cd ..
git add game/
git commit -m "Deploy latest game build"
git push origin master
```

GitHub Pages will automatically rebuild within a minute or two.

### Manual Deploy

If you prefer to do it step by step:

1. `npm run build` to produce the `dist/` folder
2. Copy the contents of `dist/` into the `../game/` directory at the repo root
3. Commit the `game/` directory changes on the `master` branch
4. Push to `origin/master` — GitHub Pages deploys automatically

## Game Overview

### Controls

| Action     | Keyboard             | Touch        |
|------------|----------------------|--------------|
| Move left  | Left arrow / A       | Swipe left   |
| Move right | Right arrow / D      | Swipe right  |
| Jump       | Up arrow / W / Space | Swipe up     |
| Slide      | Down arrow / S       | Swipe down   |

Tap fallback: tap left/right half of screen to move lanes.

### Mechanics

- **3 lanes** with pseudo-3D perspective — objects spawn at the horizon and scale up as they approach
- **7 obstacle types** — ground, tall, lane blocker, double blocker, flying, platform (jump on for bonus), bar (slide under for bonus)
- **4 collectible types** — bronze (10 pts), silver (25 pts), gold (50 pts), special (100 pts)
- **Combo system** — collect without getting hit to build multipliers (2x at 5, 3x at 10, 5x at 20)
- **3 levels** that unlock over time, each introducing new obstacles and faster speeds
- **3 lives** with 2-second invincibility after each hit
- **Themes** — choose from robots, soccer, space, and more in the customize screen
- **Custom character** — upload a photo and ML-based background removal creates a custom sprite

### Customization

The customize screen lets players:
- **Pick a theme** that changes colors, level names, and visual style
- **Upload a photo** (camera or gallery) that becomes the player character sprite, with automatic background removal powered by `@imgly/background-removal`

## Installing as a Phone App (PWA)

The game is a Progressive Web App with offline support.

### iPhone / iPad (Safari)

1. Open [codyraffensperger.com/game](https://codyraffensperger.com/game/) in **Safari**
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)

1. Open [codyraffensperger.com/game](https://codyraffensperger.com/game/) in **Chrome**
2. Tap the **three-dot menu** in the top right
3. Tap **Add to Home screen** (or **Install app**)
4. Tap **Add**

### PWA Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | Web app manifest (name, icons, display mode, theme color) |
| `public/sw.js` | Service worker for offline caching |
| `public/icons/icon-192.png` | Home screen icon (192x192) |
| `public/icons/icon-512.png` | Splash screen icon (512x512) |
| `index.html` | Contains meta tags for iOS standalone mode and links to the manifest |

## Tech Stack

- **Phaser 3.90.0** — HTML5 game framework (rendering, physics, input, scenes)
- **TypeScript 5.9.3** — Type-safe source code
- **Vite 7.3.1** — Dev server and production bundler
- **@imgly/background-removal** — Client-side ML background removal for custom character photos
- **GitHub Pages** — Hosting via the parent resume repository
