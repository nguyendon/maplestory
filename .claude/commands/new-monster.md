# Create New Monster: $ARGUMENTS

Generate a complete monster implementation with:

## 1. Monster Data (add to `src/data/monsters.json`)

```json
{
  "id": "<monster-id>",
  "name": "<Monster Name>",
  "stats": {
    "hp": 100,
    "atk": 10,
    "def": 5,
    "exp": 25,
    "level": 1
  },
  "ai": {
    "aggroRange": 200,
    "attackRange": 40,
    "patrolSpeed": 30,
    "chaseSpeed": 60,
    "attackCooldown": 1500
  },
  "drops": [
    { "itemId": "meso", "chance": 1.0, "min": 10, "max": 30 },
    { "itemId": "potion_hp_small", "chance": 0.3 }
  ],
  "sprite": {
    "key": "<monster-id>",
    "width": 40,
    "height": 40
  }
}
```

## 2. Monster Class (create `src/entities/monsters/<MonsterName>.ts`)

Extend the base Monster class with unique behavior if needed.

## 3. Sprite Generation (add to `BootScene.ts`)

Generate placeholder texture in `createPlaceholderTextures()`.

## 4. Spawn Configuration

Add spawn points to the appropriate map data.

---

Please provide the monster name and any specific requirements (behavior, stats, etc.)
