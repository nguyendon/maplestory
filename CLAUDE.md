# Claude Code Instructions

## Project Overview

This is a browser-based MapleStory clone built with Phaser 3, TypeScript, and Vite.

## Key Files

- **`plan.md`** - Master development plan with phases, agents, and skills
- **`src/`** - Game source code (TypeScript)
- **`assets/`** - Sprites, audio, tilesets
- **`server/`** - Multiplayer server (Phase 8, optional)

## Permissions

- **Git commits**: Allowed - commit meaningful changes with clear messages
- **Git push**: Allowed - push to origin/main when changes are stable
- **File creation**: Allowed - follow the file structure in plan.md
- **Package installation**: Allowed - use npm for dependencies

## Development Commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
```

## Code Standards

- Use TypeScript strict mode
- Follow Phaser 3 best practices
- Use object pooling for frequently created/destroyed objects (bullets, particles, damage numbers)
- Keep game loop code under 16ms budget for 60fps
- Prefer composition over inheritance for game entities

## Agent System

When working on specific systems, adopt the relevant agent persona from plan.md:
- `@engine` - Core Phaser/rendering work
- `@combat` - Combat mechanics and skills
- `@ai` - Monster behavior and boss patterns
- `@rpg` - Stats, inventory, progression
- `@ui` - HUD and menu interfaces
- `@network` - Multiplayer features
- `@artist` - Asset guidance
- `@audio` - Sound implementation

## Git Workflow

1. Make focused commits for each logical change
2. Use conventional commit messages:
   - `feat: add player jump mechanics`
   - `fix: resolve collision detection bug`
   - `refactor: extract combat system to separate class`
   - `docs: update plan with Phase 2 details`
3. Push when a feature or fix is complete and working

## Current Phase

Check plan.md for current development phase and active tasks.
