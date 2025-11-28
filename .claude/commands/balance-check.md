# Balance Analysis

Analyze the current game balance by checking:

## 1. DPS Calculations

Calculate damage per second for each skill at various levels:

```typescript
// For each skill, calculate:
const dps = (baseDamage * multiplier * attackSpeed) / cooldown;
```

Compare DPS across:
- Different skills at same level
- Same skill at different levels
- Different classes

## 2. Time to Kill (TTK)

Calculate how long it takes to kill monsters:

```typescript
const ttk = monsterHP / playerDPS;
```

Target TTK:
- Normal mobs: 2-5 seconds
- Elite mobs: 15-30 seconds
- Bosses: 2-5 minutes

## 3. Experience Curve

Verify leveling feels right:

```typescript
const timeToLevel = xpRequired / (xpPerMob * mobsPerMinute);
```

Target time per level:
- Levels 1-10: 5-10 minutes each
- Levels 11-30: 15-30 minutes each
- Levels 31-50: 30-60 minutes each

## 4. Economy Check

- Gold income vs potion costs
- Equipment prices vs drop rates
- Is grinding required? How much?

## 5. Stat Distribution

- Are all stats useful?
- Is there a "best build"?
- Do different classes feel different?

---

Read the current data files and provide a balance report with recommendations.
