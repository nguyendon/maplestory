# MapleStory Clone - Development Plan

## Project Overview

A 2D side-scrolling MMORPG clone inspired by MapleStory, built with modern web technologies for browser-based gameplay.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Game Engine** | Phaser 3 | Mature 2D engine, great docs, TypeScript support |
| **Language** | TypeScript | Type safety, better tooling, scalability |
| **Build Tool** | Vite | Fast HMR, modern bundling |
| **Backend** | Node.js + Colyseus | Real-time multiplayer framework |
| **Database** | PostgreSQL + Redis | Persistence + session/real-time data |
| **Assets** | Texture Packer + Aseprite | Sprite management and creation |

---

## Development Phases

### Phase 1: Core Engine (Foundation)
- [ ] Project setup (Vite + Phaser 3 + TypeScript)
- [ ] Basic game loop and scene management
- [ ] Tile-based map rendering system
- [ ] Camera system with map bounds
- [ ] Asset loading pipeline (sprites, audio, maps)
- [ ] Input handling (keyboard + touch support)

### Phase 2: Player Character
- [ ] Character sprite rendering with layered equipment
- [ ] Movement physics (walk, run, jump)
- [ ] Platform collision detection
- [ ] Ladder/rope climbing mechanics
- [ ] Character state machine (idle, walk, jump, attack, etc.)
- [ ] Basic animation system

### Phase 3: Combat System
- [ ] Hitbox/hurtbox system
- [ ] Basic attack mechanics
- [ ] Skill system architecture
- [ ] Damage calculation formula
- [ ] Combat effects and particles
- [ ] Knockback and invincibility frames

### Phase 4: Monsters & AI
- [ ] Monster base class
- [ ] Spawn system with respawn timers
- [ ] Basic AI behaviors (patrol, chase, attack)
- [ ] Monster stats and loot tables
- [ ] Boss mechanics (patterns, phases)
- [ ] Aggro system

### Phase 5: RPG Systems
- [ ] Character stats (STR, DEX, INT, LUK, HP, MP)
- [ ] Experience and leveling
- [ ] Inventory system
- [ ] Equipment system with stat bonuses
- [ ] Item drops and pickup
- [ ] Consumables (potions, buffs)

### Phase 6: World & Maps
- [ ] Map editor integration (Tiled)
- [ ] Portal system for map transitions
- [ ] Multiple map zones
- [ ] Background parallax layers
- [ ] Environmental hazards
- [ ] NPCs and dialogue system

### Phase 7: Skills & Classes
- [ ] Skill tree system
- [ ] Job advancement system
- [ ] Class-specific skills
- [ ] Skill effects and animations
- [ ] Cooldown management
- [ ] MP/resource costs

### Phase 8: Multiplayer (Optional)
- [ ] Server architecture with Colyseus
- [ ] Player synchronization
- [ ] Server-authoritative movement
- [ ] Chat system
- [ ] Party system
- [ ] Trading system

### Phase 9: Polish & Content
- [ ] UI/UX improvements
- [ ] Sound effects and music
- [ ] Tutorial system
- [ ] Quest system
- [ ] Achievements
- [ ] Save/load system

---

## Agent System

Specialized AI agents to accelerate development. Each agent has focused expertise and tools.

### Core Development Agents

#### `@engine` - Game Engine Specialist
**Expertise:** Phaser 3, game loops, rendering, physics, performance optimization
**Responsibilities:**
- Core engine architecture decisions
- Performance profiling and optimization
- Rendering pipeline setup
- Physics and collision systems
- Scene management

**Prompt Prefix:**
```
You are a game engine specialist focused on Phaser 3 and TypeScript.
Prioritize performance, clean architecture, and maintainability.
Always consider frame budget (16ms for 60fps).
```

---

#### `@combat` - Combat System Designer
**Expertise:** Action game mechanics, hitboxes, damage formulas, skill systems
**Responsibilities:**
- Combat feel and responsiveness
- Damage calculation balancing
- Skill design and implementation
- Hit detection accuracy
- Combat animation timing

**Prompt Prefix:**
```
You are a combat system designer for a 2D action RPG.
Focus on game feel, responsiveness, and satisfying feedback.
Consider frame data, hitbox precision, and balance.
```

---

#### `@ai` - Monster AI Programmer
**Expertise:** Behavior trees, state machines, pathfinding, boss patterns
**Responsibilities:**
- Monster behavior implementation
- Boss fight design
- Difficulty balancing
- Spawn system logic
- Aggro and threat mechanics

**Prompt Prefix:**
```
You are an AI programmer specializing in game enemy behavior.
Design engaging, fair, and varied enemy patterns.
Use state machines or behavior trees for complex behaviors.
```

---

#### `@rpg` - RPG Systems Designer
**Expertise:** Stats, progression, economy, loot, balance
**Responsibilities:**
- Character stat formulas
- Level progression curves
- Item and equipment design
- Economy balancing
- Drop rate tuning

**Prompt Prefix:**
```
You are an RPG systems designer with expertise in progression and balance.
Design systems that feel rewarding without being exploitable.
Use spreadsheets and formulas for balance calculations.
```

---

#### `@ui` - UI/UX Specialist
**Expertise:** Game UI, menus, HUD, inventory interfaces, accessibility
**Responsibilities:**
- HUD design and implementation
- Menu systems
- Inventory UI
- Dialogue boxes
- Accessibility features

**Prompt Prefix:**
```
You are a game UI/UX specialist.
Design intuitive, responsive interfaces that don't interrupt gameplay.
Consider accessibility, mobile support, and visual clarity.
```

---

#### `@network` - Multiplayer Engineer
**Expertise:** Colyseus, WebSockets, state sync, lag compensation, security
**Responsibilities:**
- Server architecture
- Client-server synchronization
- Lag compensation techniques
- Anti-cheat considerations
- Database schema design

**Prompt Prefix:**
```
You are a multiplayer game engineer specializing in real-time sync.
Prioritize server authority, lag compensation, and security.
Design for scalability and cheating prevention.
```

---

#### `@artist` - Asset & Animation Guide
**Expertise:** Pixel art, sprite sheets, animation principles, asset pipelines
**Responsibilities:**
- Art style guidelines
- Sprite sheet organization
- Animation timing recommendations
- Asset optimization
- Texture atlas management

**Prompt Prefix:**
```
You are a pixel art and animation specialist for 2D games.
Guide asset creation with proper dimensions, palettes, and animation principles.
Optimize for web delivery and texture atlas efficiency.
```

---

#### `@audio` - Sound Designer
**Expertise:** Game audio, sound effects, music integration, Web Audio API
**Responsibilities:**
- Sound effect recommendations
- Music system implementation
- Audio mixing and ducking
- Spatial audio for gameplay
- Performance optimization

**Prompt Prefix:**
```
You are a game audio specialist.
Design audio that enhances gameplay feedback and atmosphere.
Optimize for web delivery and consider browser audio limitations.
```

---

### Utility Agents

#### `@reviewer` - Code Review Agent
**Purpose:** Review code for bugs, performance issues, and best practices
```
Review this code for:
- Performance issues (especially in game loops)
- Memory leaks (event listeners, object pooling)
- Type safety issues
- Potential bugs
- Code organization
```

---

#### `@tester` - Test Generation Agent
**Purpose:** Generate unit and integration tests
```
Generate tests for game systems with focus on:
- Edge cases in physics/collision
- State machine transitions
- Damage calculations
- Inventory operations
```

---

#### `@docs` - Documentation Agent
**Purpose:** Generate and maintain documentation
```
Document game systems with:
- API references
- Architecture diagrams (mermaid)
- Usage examples
- Configuration options
```

---

## Skills Library

Reusable prompts for common game dev tasks.

### `/skill:sprite-setup`
```
Set up a new sprite with:
1. Texture atlas loading
2. Animation definitions
3. State machine integration
4. Origin point configuration
```

### `/skill:new-monster`
```
Create a new monster with:
1. Stats definition (HP, ATK, DEF, EXP, drops)
2. Sprite and animations
3. AI behavior (patrol/chase/attack)
4. Spawn configuration
```

### `/skill:new-skill`
```
Create a new player skill with:
1. Skill data (damage, MP cost, cooldown)
2. Animation and effects
3. Hitbox configuration
4. Sound effects
```

### `/skill:new-map`
```
Create a new map with:
1. Tiled map setup
2. Collision layers
3. Portal connections
4. Monster spawn points
5. Background layers
```

### `/skill:balance-check`
```
Analyze game balance for:
1. DPS calculations at different levels
2. Time-to-kill metrics
3. Experience curve analysis
4. Item stat distribution
```

---

## File Structure

```
maplestory/
├── src/
│   ├── main.ts                 # Entry point
│   ├── config/
│   │   ├── game.config.ts      # Phaser config
│   │   └── constants.ts        # Game constants
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading
│   │   ├── MenuScene.ts        # Main menu
│   │   ├── GameScene.ts        # Main gameplay
│   │   └── UIScene.ts          # HUD overlay
│   ├── entities/
│   │   ├── Player.ts           # Player class
│   │   ├── Monster.ts          # Base monster
│   │   └── NPC.ts              # NPC class
│   ├── systems/
│   │   ├── CombatSystem.ts     # Combat logic
│   │   ├── InventorySystem.ts  # Inventory management
│   │   ├── SkillSystem.ts      # Skill handling
│   │   └── QuestSystem.ts      # Quest tracking
│   ├── components/
│   │   ├── StateMachine.ts     # FSM for entities
│   │   ├── Hitbox.ts           # Collision component
│   │   └── Stats.ts            # RPG stats
│   ├── ui/
│   │   ├── HUD.ts              # Health/MP bars
│   │   ├── Inventory.ts        # Inventory UI
│   │   └── Dialogue.ts         # Dialogue box
│   ├── data/
│   │   ├── monsters.json       # Monster definitions
│   │   ├── items.json          # Item database
│   │   ├── skills.json         # Skill definitions
│   │   └── maps.json           # Map metadata
│   └── utils/
│       ├── math.ts             # Math helpers
│       ├── pool.ts             # Object pooling
│       └── debug.ts            # Debug tools
├── assets/
│   ├── sprites/                # Character/monster sprites
│   ├── tilesets/               # Map tilesets
│   ├── audio/                  # Sound effects & music
│   └── ui/                     # UI elements
├── server/                     # Multiplayer server (Phase 8)
│   ├── src/
│   │   ├── rooms/
│   │   └── schemas/
│   └── package.json
├── tools/                      # Development tools
│   └── map-converter.ts        # Tiled map processing
├── tests/
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── plan.md
```

---

## Quick Start Commands

```bash
# Initialize project
npm create vite@latest . -- --template vanilla-ts
npm install phaser@3

# Development
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

## Resources

### Documentation
- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [Colyseus Docs](https://docs.colyseus.io/)
- [Tiled Map Editor](https://www.mapeditor.org/)

### Asset Sources (Free)
- [OpenGameArt](https://opengameart.org/)
- [itch.io Game Assets](https://itch.io/game-assets/free)
- [Kenney Assets](https://kenney.nl/assets)

### Tutorials
- [Phaser 3 Platformer Tutorial](https://phaser.io/tutorials/making-your-first-phaser-3-game)
- [Building an MMO with Colyseus](https://learn.colyseus.io/)

---

## Next Steps

1. **Initialize the project** with Vite + Phaser + TypeScript
2. **Create a basic scene** with a placeholder character
3. **Implement movement** and platform collision
4. **Add a single monster** with basic AI
5. **Iterate** from there!

---

## Notes

- Start simple, iterate often
- Playtest early and frequently
- Don't aim for MapleStory feature parity - focus on fun core loop
- Art can come later - use colored rectangles or free assets initially
- Multiplayer adds 10x complexity - save for later unless essential
