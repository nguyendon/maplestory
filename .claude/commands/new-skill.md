# Create New Skill: $ARGUMENTS

Generate a complete skill implementation with:

## 1. Skill Data (add to `src/data/skills.json`)

```json
{
  "id": "<skill-id>",
  "name": "<Skill Name>",
  "description": "Skill description for tooltip",
  "type": "active",
  "damage": {
    "base": 150,
    "multiplier": 1.5,
    "element": "physical"
  },
  "cost": {
    "mp": 10
  },
  "cooldown": 1000,
  "frameData": {
    "startup": 4,
    "active": 6,
    "recovery": 12
  },
  "hitbox": {
    "offsetX": 30,
    "offsetY": 0,
    "width": 60,
    "height": 40
  },
  "effects": {
    "knockback": { "x": 100, "y": -50 },
    "hitstun": 15,
    "screenShake": { "intensity": 3, "duration": 100 }
  },
  "requirements": {
    "level": 1,
    "job": "beginner"
  }
}
```

## 2. Skill Implementation

Add to `src/systems/SkillSystem.ts` if custom logic needed.

## 3. Animation

Define frames in sprite sheet or generate placeholder.

## 4. Sound Effect

Note which sound to play on cast and hit.

---

Please provide the skill name, class, and any specific mechanics.
