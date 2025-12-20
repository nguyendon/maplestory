# MapleStory Clone - Master Plan

## Project Overview
A browser-based 2D MMORPG inspired by MapleStory, built with Phaser 3, TypeScript, and Vite.

## Project Status
- **Phase**: Early Development
- **Current Focus**: Asset Management & Sprite System
- **Last Updated**: 2024-12-02

## Architecture
```
┌─────────────────────────────────────────┐
│          Client (Browser)               │
│  Phaser 3 + TypeScript + Vite          │
│  - Game scenes & rendering              │
│  - Player input & controls              │
│  - UI/HUD systems                       │
│  - Asset management                     │
└─────────────────────────────────────────┘
                   │
                   │ WebSocket
                   ▼
┌─────────────────────────────────────────┐
│      Server (Optional - Phase 8)        │
│  Colyseus + TypeScript                  │
│  - Room management                      │
│  - State synchronization                │
│  - Combat validation                    │
└─────────────────────────────────────────┘
```

## Development Phases

### Phase 1: Core Engine ✅
- [x] Phaser 3 setup with TypeScript
- [x] Player movement & physics
- [x] Basic platforming mechanics
- [x] Camera follow system

### Phase 2: Combat System ✅
- [x] Basic attack mechanics
- [x] Skill system framework
- [x] Damage calculation
- [x] Visual feedback (hit effects)

### Phase 3: Monster AI ✅
- [x] Basic AI behavior (idle, patrol, aggro)
- [x] Aggro/deaggro system
- [x] Monster spawning
- [x] Multiple monster types

### Phase 4: RPG Systems ✅
- [x] Player stats (HP, MP, EXP)
- [x] Level progression
- [x] Equipment system
- [x] Inventory management
- [x] Item drops & looting

### Phase 5: Asset Management 🔄 (Current)
- [x] Sprite extraction from MapleStory sprite sheets
- [x] Animated monster sprites (7 types)
- [x] Magenta-to-alpha transparency conversion
- [ ] WZ file format parsing (educational)
- [ ] Asset pipeline optimization
- [ ] Sprite atlas generation

### Phase 6: World & Content
- [ ] Multiple maps/zones
- [ ] NPCs & dialogue system
- [ ] Quest system
- [ ] Towns & safe zones
- [ ] Portal system

### Phase 7: Advanced Features
- [ ] Party system
- [ ] Trading system
- [ ] Chat system
- [ ] Sound & music
- [ ] Advanced UI polish

### Phase 8: Multiplayer (Optional)
- [ ] Server setup (Colyseus)
- [ ] Player synchronization
- [ ] Authoritative server logic
- [ ] Anti-cheat measures

## Sub-Plans

Detailed plans for specific areas:

1. **[Asset Extraction & Management](./asset-extraction.md)**
   - WZ file format research
   - Sprite extraction pipeline
   - Asset organization

2. **[Sprite System](./sprite-system.md)**
   - Current sprite implementation
   - Animation framework
   - Performance optimization

3. **[Game Systems](./game-systems.md)**
   - Combat mechanics
   - RPG progression
   - AI behaviors

4. **[Multiplayer Architecture](./multiplayer.md)**
   - Server design (future)
   - State synchronization
   - Networking strategy

## Current Priorities

1. **Asset Pipeline** - Improve sprite extraction and management
2. **Content Creation** - Add more monsters, maps, and items
3. **Polish** - Refine existing systems before adding new features

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3 |
| Language | TypeScript (strict mode) |
| Build Tool | Vite |
| Server (future) | Colyseus |
| Runtime | Node.js 24.x |

## Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- Follow Phaser 3 best practices
- Use object pooling for performance-critical objects
- Keep game loop under 16ms budget (60fps)
- Prefer composition over inheritance

### Git Workflow
- Commit logical changes with clear messages
- Use conventional commits (feat/fix/refactor/docs)
- Push when features are complete and tested

### Performance Targets
- 60fps gameplay on modern browsers
- < 100MB memory usage for client
- < 2s initial load time

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MapleStory Sprite Resource](https://www.spriters-resource.com/pc_computer/maplestory/)

## Next Steps

See individual plan files for detailed implementation steps:
- Start with [Asset Extraction Plan](./asset-extraction.md) for WZ parsing
- Review [Sprite System Plan](./sprite-system.md) for current sprite work
