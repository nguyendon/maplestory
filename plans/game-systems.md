# Game Systems Plan

## Overview
Core gameplay systems including combat, RPG mechanics, and monster AI.

## Combat System

### Current Implementation ✅
- Basic melee attacks
- Skill system with cooldowns
- Damage calculation (ATK - DEF)
- Hit effects (visual feedback)
- Knockback on hit

### Attack Flow
```
Player Input → Skill Activation → Collision Check → Damage Calc → Apply Effects → Visual Feedback
```

### Planned Improvements
- [ ] Combo system
- [ ] Critical hits
- [ ] Status effects (poison, stun, freeze)
- [ ] Skill animations
- [ ] Projectile attacks
- [ ] AoE skills

## RPG Systems

### Character Stats ✅
- HP (Health Points)
- MP (Mana Points)
- EXP (Experience)
- Level (1-200 range)
- STR, DEX, INT, LUK (future)

### Progression ✅
- EXP gain from monsters
- Level up system
- Stat increases on level up
- HP/MP recovery on level up

### Planned Features
- [ ] Stat point allocation
- [ ] Skill points (SP)
- [ ] Job advancement system
- [ ] Equipment stats
- [ ] Buff system

## Monster AI

### Current Behaviors ✅
- Idle: Stand still or patrol
- Aggro: Chase player within range
- Attack: Melee contact damage
- Deaggro: Return to spawn when player leaves range

### AI State Machine
```
IDLE → [Player in aggro range] → CHASE → [Player in attack range] → ATTACK
CHASE → [Player out of deaggro range] → RETURN → IDLE
```

### Planned Improvements
- [ ] Patrol paths
- [ ] Jump AI for platforms
- [ ] Ranged attacks
- [ ] Boss patterns
- [ ] Group behaviors

## Inventory System ✅

### Features
- Item pickup
- Item stacking
- Equipment slots
- Item usage (potions)
- Item drops from monsters

### Planned Features
- [ ] Trading
- [ ] Item sorting
- [ ] Quick slots
- [ ] Item storage

## Next Steps
1. Add status effect system
2. Implement skill tree
3. Add boss AI patterns
4. Create more item types
