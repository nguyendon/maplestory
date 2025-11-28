/**
 * Monster Definitions
 */

export interface ItemDrop {
  itemId: string;
  chance: number; // 0-1 (e.g., 0.1 = 10%)
  minQuantity: number;
  maxQuantity: number;
}

export interface MonsterDefinition {
  name: string;
  spriteKey: string;
  width: number;
  height: number;
  maxHp: number;
  damage: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  exp: number;
  mesoDrop: [number, number];
  itemDrops: ItemDrop[];
  aggroRange: number;
  deaggroRange: number;
  respawnTime: number;
}

export const MONSTER_TYPES: Record<string, MonsterDefinition> = {
  SLIME: {
    name: 'Blue Slime',
    spriteKey: 'monster',
    width: 40,
    height: 40,
    maxHp: 50,
    damage: 5,
    defense: 2,
    speed: 30,
    attackRange: 30,
    attackCooldown: 1500,
    exp: 10,
    mesoDrop: [1, 5],
    itemDrops: [
      { itemId: 'slime_bubble', chance: 0.5, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'red_potion', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 150,
    deaggroRange: 250,
    respawnTime: 5000
  },

  MUSHROOM: {
    name: 'Orange Mushroom',
    spriteKey: 'monster',
    width: 36,
    height: 40,
    maxHp: 80,
    damage: 8,
    defense: 5,
    speed: 40,
    attackRange: 25,
    attackCooldown: 1200,
    exp: 20,
    mesoDrop: [3, 10],
    itemDrops: [
      { itemId: 'orange_mushroom_cap', chance: 0.6, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'red_potion', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'blue_potion', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 6000
  },

  SNAIL: {
    name: 'Red Snail',
    spriteKey: 'monster',
    width: 40,
    height: 28,
    maxHp: 30,
    damage: 3,
    defense: 1,
    speed: 20,
    attackRange: 20,
    attackCooldown: 2000,
    exp: 5,
    mesoDrop: [1, 3],
    itemDrops: [
      { itemId: 'red_potion', chance: 0.4, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 120,
    deaggroRange: 200,
    respawnTime: 4000
  }
};

export function getMonsterDefinition(type: string): MonsterDefinition {
  const definition = MONSTER_TYPES[type];
  if (!definition) {
    throw new Error(`Monster type "${type}" not found`);
  }
  return definition;
}
