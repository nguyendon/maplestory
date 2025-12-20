# Sprite System Implementation Plan

## Overview
Technical documentation for the current sprite rendering and animation system.

## Architecture

### Current Implementation

```
BootScene.ts
├── preload()
│   ├── loadMonsterSprites()     // Load real sprite sheets
│   └── createPlaceholderTextures() // Generate procedural sprites
├── create()
│   ├── createAnimations()        // Player animations
│   ├── createMonsterAnimations() // Monster animations
│   └── createHitEffects()        // Combat effects
```

## Sprite Loading System

### Real Sprites (from PNG files)
Location: `assets/sprites/monsters/sheets/`

```typescript
private loadMonsterSprites(): void {
  const monsterSheets = {
    'orange_mushroom': { frameWidth: 64, frameHeight: 72 },
    'blue_mushroom': { frameWidth: 66, frameHeight: 74 },
    'horny_mushroom': { frameWidth: 72, frameHeight: 62 },
    'zombie_mushroom': { frameWidth: 68, frameHeight: 78 },
    'pig': { frameWidth: 84, frameHeight: 62 },
    'ribbon_pig': { frameWidth: 84, frameHeight: 66 },
    'snail': { frameWidth: 54, frameHeight: 42 },
  };

  for (const [name, config] of Object.entries(monsterSheets)) {
    this.load.spritesheet(name, `assets/sprites/monsters/sheets/${name}.png`, {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
    });
  }
}
```

**Sprite Sheet Format**:
- Horizontal layout (6 frames in a row)
- Frames 0-2: Idle animation
- Frames 3-5: Walk/move animation
- Alpha transparency (magenta converted)

### Procedural Sprites (generated at runtime)
Used for monsters without real sprite assets:
- Slime
- Stone Golem, Block Golem
- Evil Eye, Curse Eye
- Wild Boar, Fire Boar
- Jr. Yeti, Yeti
- Lorang, Clang, Octopus, Ligator
- Drake
- Mushmom, Zombie Mushmom

**Generation**: Canvas API used to draw pixel art at runtime.

## Animation System

### Animation Creation

```typescript
private createMonsterAnimations(): void {
  // Real sprites (6 frames: 0-2 idle, 3-5 move)
  const realSprites = [
    'orange_mushroom', 'blue_mushroom', 'horny_mushroom',
    'zombie_mushroom', 'pig', 'ribbon_pig', 'snail'
  ];

  realSprites.forEach(sprite => {
    // Idle: frames 0-2, yoyo loop
    this.anims.create({
      key: `${sprite}-idle`,
      frames: this.anims.generateFrameNumbers(sprite, { frames: [0, 1, 2] }),
      frameRate: 6,
      repeat: -1,
      yoyo: true,
    });

    // Walk: frames 3-5, loop
    this.anims.create({
      key: `${sprite}-walk`,
      frames: this.anims.generateFrameNumbers(sprite, { frames: [3, 4, 5] }),
      frameRate: 8,
      repeat: -1,
    });

    // Attack: frames 3-5 and back
    this.anims.create({
      key: `${sprite}-attack`,
      frames: this.anims.generateFrameNumbers(sprite, { frames: [3, 4, 5, 4, 3] }),
      frameRate: 12,
      repeat: 0,
    });
  });
}
```

### Animation Usage

Monsters automatically play animations based on their state:

```typescript
// In Monster.ts
update(time: number, delta: number): void {
  if (this.isAttacking) {
    this.playAnimation('attack');
  } else if (this.body.velocity.x !== 0) {
    this.playAnimation('walk');
  } else {
    this.playAnimation('idle');
  }
}
```

## Monster Entity System

### Sprite Key Resolution

```typescript
// Monster.ts constructor
const textureKey = scene.textures.exists(definition.spriteKey)
  ? definition.spriteKey
  : 'slime'; // Fallback

super(scene, x, y, textureKey);
```

**Flow**:
1. Check if real sprite exists for `definition.spriteKey`
2. If yes, use real sprite (e.g., 'orange_mushroom')
3. If no, fall back to 'slime' procedural sprite

### MonsterData Configuration

```typescript
// MonsterData.ts
export const MONSTER_TYPES: Record<string, MonsterDefinition> = {
  MUSHROOM: {
    name: 'Orange Mushroom',
    spriteKey: 'orange_mushroom',  // Maps to real sprite
    width: 36,
    height: 40,
    // ... stats
  },
  SLIME: {
    name: 'Green Slime',
    spriteKey: 'slime',  // Uses procedural sprite
    width: 40,
    height: 40,
    // ... stats
  }
};
```

## Performance Optimization

### Object Pooling (Not Yet Implemented)
```typescript
// Future optimization
class MonsterPool {
  private pool: Monster[] = [];
  private active: Set<Monster> = new Set();

  spawn(type: string, x: number, y: number): Monster {
    let monster = this.pool.pop();
    if (!monster) {
      monster = new Monster(/* ... */);
    }
    monster.reset(type, x, y);
    this.active.add(monster);
    return monster;
  }

  despawn(monster: Monster): void {
    monster.deactivate();
    this.active.delete(monster);
    this.pool.push(monster);
  }
}
```

### Texture Atlases (Not Yet Implemented)
Currently each sprite is a separate texture. Future:
- Combine all monster sprites into single atlas
- Reduce texture switches
- Lower GPU memory usage

## Current Limitations

### 1. Fixed Frame Counts
All real sprites must have exactly 6 frames (0-5).

**Solution**: Make frame counts configurable in metadata.

### 2. Limited Animation States
Only idle, walk, attack supported.

**Future States**:
- Hit/damaged
- Death
- Special attacks
- Emotion expressions

### 3. No Direction Variants
Sprites face one direction, flipped for other direction.

**Future**: Separate sprites for left/right facing.

### 4. Manual Frame Configuration
Frame positions defined manually in `extract-sprites.cjs`.

**Future**: Auto-detect frame boundaries.

## Improvement Roadmap

### Short Term
- [ ] Add 10+ more monster sprites
- [ ] Create sprite metadata JSON
- [ ] Add hit/death animations
- [ ] Implement sprite tinting for variants

### Medium Term
- [ ] Generate texture atlases
- [ ] Implement object pooling
- [ ] Add particle effects
- [ ] Optimize sprite sheet sizes

### Long Term
- [ ] Dynamic sprite loading per zone
- [ ] Customizable player characters
- [ ] Equipment visual changes
- [ ] Advanced animation blending

## Adding New Sprites

### Checklist
1. **Source sprite sheet** from The Spriters Resource or create original
2. **Run extraction script**:
   ```bash
   # Add sprite config to scripts/extract-sprites.cjs
   node scripts/extract-sprites.cjs
   ```
3. **Update BootScene.ts**:
   - Add to `loadMonsterSprites()` with frame dimensions
   - Sprite appears in `createMonsterAnimations()` automatically
4. **Update MonsterData.ts**:
   - Set `spriteKey` to match sprite filename
   - Adjust `width` and `height` to match sprite bounds
5. **Test in-game**:
   - Spawn monster and verify animations
   - Check collision bounds
   - Verify performance

### Example: Adding "Green Slime" Real Sprite

1. Add to extraction config:
```javascript
// scripts/extract-sprites.cjs
const spriteConfigs = {
  // ... existing sprites
  'green_slime': {
    frames: [
      { x: 5, y: 5, w: 38, h: 36 },
      { x: 48, y: 5, w: 38, h: 36 },
      { x: 91, y: 5, w: 38, h: 36 },
      { x: 5, y: 46, w: 40, h: 38 },
      { x: 48, y: 46, w: 40, h: 38 },
      { x: 91, y: 46, w: 40, h: 38 },
    ],
    frameWidth: 44,
    frameHeight: 42,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  }
};
```

2. Update BootScene:
```typescript
const monsterSheets = {
  // ... existing sprites
  'green_slime': { frameWidth: 44, frameHeight: 42 },
};
```

3. Update MonsterData:
```typescript
SLIME: {
  name: 'Green Slime',
  spriteKey: 'green_slime',  // Changed from 'slime'
  width: 40,
  height: 40,
  // ... rest unchanged
}
```

## Technical Debt

### Issues to Address
1. **Hardcoded frame configs** - Move to JSON metadata
2. **Duplicate animation code** - Create animation factory
3. **Mixed sprite types** - Separate real vs procedural handling
4. **No validation** - Add sprite validation on load
5. **Large BootScene** - Extract sprite loading to separate class

### Refactoring Plan
```typescript
// Future structure
class SpriteManager {
  loadSprites(config: SpriteConfig[]): void
  createAnimations(sprite: string): void
  validateSprite(sprite: string): boolean
}

class ProceduralSpriteGenerator {
  generateMonster(type: string): HTMLCanvasElement
  generateEffect(type: string): HTMLCanvasElement
}
```

## Resources

- [Phaser Sprite Sheets](https://photonstorm.github.io/phaser3-docs/Phaser.Textures.Parsers.SpriteSheet.html)
- [Animation Manager](https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html)
- [Texture Atlas Guide](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser3)
