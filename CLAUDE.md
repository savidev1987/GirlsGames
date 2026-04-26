# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Vision

This is a collection of games designed for 10-year-old girls, built with the long-term goal of App Store publishing. Game ideas are sourced directly from kids — keep UX simple, colorful, and intuitive enough that a child can pick up and play without instructions.

## Tech Stack Decisions

Each game will be its own self-contained mini-project. When starting a new game, prefer:

- **React Native + Expo** — single codebase for iOS/Android, easiest path to App Store. Use `expo-router` for navigation between games.
- **React Native Game Engine** or plain `Animated` API for lightweight game loops.
- For 2D physics/sprites, prefer **Matter.js** (via `react-native-game-engine`) or **Reanimated 2**.

If a game concept needs a browser prototype first, use **plain HTML5 Canvas** (no build tools needed for rapid prototyping).

## Project Structure Convention

```
GirlsGames/
  app/                   # Expo Router app shell (shared across all games)
  games/
    <game-name>/         # One folder per game
      index.tsx          # Game entry point
      components/        # Game-specific components
      assets/            # Sprites, sounds, fonts for this game
  shared/
    components/          # Reusable UI (buttons, modals, score display)
    theme.ts             # Shared color palette and typography
  assets/                # Global assets (app icon, splash screen)
```

## Common Commands

These commands apply once the Expo project is initialized:

```bash
npx expo start          # Start dev server (scan QR to open on device)
npx expo start --ios    # Open in iOS Simulator
npx expo start --android
npx expo run:ios        # Build and run native iOS (requires Xcode)
npx expo run:android

npx expo install        # Add a package (keeps native deps in sync)

npm test                # Run Jest tests
npm test -- --testPathPattern=<game-name>  # Run tests for one game
npx tsc --noEmit        # Type-check without compiling
```

For HTML5 prototype games (no build step):
```bash
open games/<game-name>/index.html   # Open directly in browser
npx serve games/<game-name>         # Local server if needed
```

## Design Guidelines (Non-Negotiable)

- **Audience is 10-year-old girls.** No reading required to start playing. Buttons must be large tap targets (min 48×48pt).
- **Bright, fun color palette.** Use `shared/theme.ts` as the single source of truth for colors. Pinks, purples, teals, and warm yellows are preferred defaults.
- **No timers that punish.** Avoid mechanics that stress or shame the player. Winning should feel rewarding; losing should feel like "try again!" not failure.
- **Offline-first.** Games must work with no network connection. No login required.
- **App Store readiness.** Avoid any content, third-party SDKs, or data collection that would conflict with Apple's guidelines for apps targeting children (COPPA compliance, no third-party analytics by default).

## Adding a New Game

1. Create `games/<game-name>/` with an `index.tsx` entry point.
2. Register a route in `app/(games)/<game-name>.tsx` (Expo Router file-based routing).
3. Add a card for the game on the home screen in `app/index.tsx`.
4. Keep all game assets inside `games/<game-name>/assets/` — do not put them in the global `assets/` folder.
