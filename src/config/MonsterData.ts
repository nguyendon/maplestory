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
    name: 'Green Slime',
    spriteKey: 'slime',
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
    spriteKey: 'mushroom',
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
    spriteKey: 'snail',
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
  },

  // Victoria Island Monsters
  PIG: {
    name: 'Pig',
    spriteKey: 'pig',
    width: 48,
    height: 36,
    maxHp: 60,
    damage: 7,
    defense: 3,
    speed: 35,
    attackRange: 25,
    attackCooldown: 1400,
    exp: 15,
    mesoDrop: [5, 15],
    itemDrops: [
      { itemId: 'red_potion', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 160,
    deaggroRange: 260,
    respawnTime: 5000
  },

  RIBBON_PIG: {
    name: 'Ribbon Pig',
    spriteKey: 'pig',
    width: 48,
    height: 36,
    maxHp: 100,
    damage: 12,
    defense: 5,
    speed: 40,
    attackRange: 28,
    attackCooldown: 1200,
    exp: 25,
    mesoDrop: [8, 20],
    itemDrops: [
      { itemId: 'red_potion', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'blue_potion', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 6000
  },

  BLUE_MUSHROOM: {
    name: 'Blue Mushroom',
    spriteKey: 'mushroom', // Uses orange mushroom as base with tint
    width: 36,
    height: 40,
    maxHp: 150,
    damage: 18,
    defense: 8,
    speed: 45,
    attackRange: 30,
    attackCooldown: 1100,
    exp: 40,
    mesoDrop: [15, 35],
    itemDrops: [
      { itemId: 'blue_potion', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'white_potion', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 200,
    deaggroRange: 300,
    respawnTime: 7000
  },

  STUMP: {
    name: 'Stump',
    spriteKey: 'stone_golem', // Uses golem as base
    width: 44,
    height: 48,
    maxHp: 200,
    damage: 22,
    defense: 15,
    speed: 25,
    attackRange: 35,
    attackCooldown: 1500,
    exp: 50,
    mesoDrop: [20, 45],
    itemDrops: [
      { itemId: 'red_potion', chance: 0.25, minQuantity: 1, maxQuantity: 3 },
    ],
    aggroRange: 140,
    deaggroRange: 240,
    respawnTime: 8000
  },

  EVIL_EYE: {
    name: 'Evil Eye',
    spriteKey: 'evil_eye',
    width: 40,
    height: 40,
    maxHp: 250,
    damage: 28,
    defense: 10,
    speed: 55,
    attackRange: 40,
    attackCooldown: 1000,
    exp: 65,
    mesoDrop: [25, 55],
    itemDrops: [
      { itemId: 'blue_potion', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'mana_elixir', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 220,
    deaggroRange: 320,
    respawnTime: 8000
  },

  CURSE_EYE: {
    name: 'Curse Eye',
    spriteKey: 'curse_eye',
    width: 44,
    height: 44,
    maxHp: 350,
    damage: 35,
    defense: 12,
    speed: 60,
    attackRange: 45,
    attackCooldown: 900,
    exp: 85,
    mesoDrop: [35, 70],
    itemDrops: [
      { itemId: 'mana_elixir', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 240,
    deaggroRange: 340,
    respawnTime: 9000
  },

  // Kerning City Monsters
  OCTOPUS: {
    name: 'Octopus',
    spriteKey: 'octopus',
    width: 42,
    height: 38,
    maxHp: 180,
    damage: 20,
    defense: 8,
    speed: 50,
    attackRange: 32,
    attackCooldown: 1100,
    exp: 45,
    mesoDrop: [18, 40],
    itemDrops: [
      { itemId: 'blue_potion', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 200,
    deaggroRange: 300,
    respawnTime: 7000
  },

  LIGATOR: {
    name: 'Ligator',
    spriteKey: 'ligator',
    width: 56,
    height: 32,
    maxHp: 280,
    damage: 32,
    defense: 14,
    speed: 45,
    attackRange: 40,
    attackCooldown: 1300,
    exp: 70,
    mesoDrop: [30, 60],
    itemDrops: [
      { itemId: 'white_potion', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 8000
  },

  // Perion Monsters
  FIRE_BOAR: {
    name: 'Fire Boar',
    spriteKey: 'fire_boar',
    width: 52,
    height: 44,
    maxHp: 400,
    damage: 45,
    defense: 18,
    speed: 55,
    attackRange: 38,
    attackCooldown: 1100,
    exp: 100,
    mesoDrop: [40, 80],
    itemDrops: [
      { itemId: 'red_potion', chance: 0.2, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'white_potion', chance: 0.15, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 220,
    deaggroRange: 320,
    respawnTime: 9000
  },

  WILD_BOAR: {
    name: 'Wild Boar',
    spriteKey: 'wild_boar',
    width: 56,
    height: 48,
    maxHp: 500,
    damage: 55,
    defense: 22,
    speed: 60,
    attackRange: 42,
    attackCooldown: 1000,
    exp: 130,
    mesoDrop: [50, 100],
    itemDrops: [
      { itemId: 'white_potion', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 240,
    deaggroRange: 340,
    respawnTime: 10000
  },

  STONE_GOLEM: {
    name: 'Stone Golem',
    spriteKey: 'stone_golem',
    width: 60,
    height: 64,
    maxHp: 800,
    damage: 70,
    defense: 40,
    speed: 30,
    attackRange: 45,
    attackCooldown: 1400,
    exp: 180,
    mesoDrop: [70, 140],
    itemDrops: [
      { itemId: 'elixir', chance: 0.08, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 12000
  },

  // El Nath / Orbis Monsters
  JR_YETI: {
    name: 'Jr. Yeti',
    spriteKey: 'jr_yeti',
    width: 48,
    height: 52,
    maxHp: 600,
    damage: 60,
    defense: 25,
    speed: 50,
    attackRange: 38,
    attackCooldown: 1100,
    exp: 150,
    mesoDrop: [60, 120],
    itemDrops: [
      { itemId: 'white_potion', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 200,
    deaggroRange: 300,
    respawnTime: 10000
  },

  YETI: {
    name: 'Yeti',
    spriteKey: 'yeti',
    width: 64,
    height: 72,
    maxHp: 1200,
    damage: 90,
    defense: 35,
    speed: 45,
    attackRange: 48,
    attackCooldown: 1200,
    exp: 250,
    mesoDrop: [100, 200],
    itemDrops: [
      { itemId: 'elixir', chance: 0.12, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 220,
    deaggroRange: 320,
    respawnTime: 15000
  },

  SENTINEL: {
    name: 'Sentinel',
    spriteKey: 'stone_golem', // Uses golem as base
    width: 44,
    height: 56,
    maxHp: 700,
    damage: 75,
    defense: 30,
    speed: 40,
    attackRange: 50,
    attackCooldown: 1300,
    exp: 170,
    mesoDrop: [65, 130],
    itemDrops: [
      { itemId: 'mana_elixir', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 250,
    deaggroRange: 350,
    respawnTime: 11000
  },

  // Ludibrium Monsters
  RATZ: {
    name: 'Ratz',
    spriteKey: 'snail', // Uses snail as base
    width: 40,
    height: 36,
    maxHp: 550,
    damage: 52,
    defense: 20,
    speed: 55,
    attackRange: 30,
    attackCooldown: 1000,
    exp: 120,
    mesoDrop: [45, 90],
    itemDrops: [
      { itemId: 'blue_potion', chance: 0.3, minQuantity: 1, maxQuantity: 3 },
    ],
    aggroRange: 200,
    deaggroRange: 300,
    respawnTime: 8000
  },

  BLOCK_GOLEM: {
    name: 'Block Golem',
    spriteKey: 'block_golem',
    width: 52,
    height: 56,
    maxHp: 900,
    damage: 80,
    defense: 38,
    speed: 35,
    attackRange: 42,
    attackCooldown: 1300,
    exp: 200,
    mesoDrop: [80, 160],
    itemDrops: [
      { itemId: 'elixir', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 12000
  },

  TICK: {
    name: 'Tick',
    spriteKey: 'slime', // Uses slime as base
    width: 44,
    height: 40,
    maxHp: 650,
    damage: 65,
    defense: 28,
    speed: 60,
    attackRange: 35,
    attackCooldown: 950,
    exp: 160,
    mesoDrop: [55, 110],
    itemDrops: [
      { itemId: 'mana_elixir', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 220,
    deaggroRange: 320,
    respawnTime: 9000
  },

  // Beach / Florina Beach Monsters
  LORANG: {
    name: 'Lorang',
    spriteKey: 'lorang',
    width: 48,
    height: 40,
    maxHp: 320,
    damage: 38,
    defense: 16,
    speed: 45,
    attackRange: 35,
    attackCooldown: 1150,
    exp: 80,
    mesoDrop: [32, 65],
    itemDrops: [
      { itemId: 'blue_potion', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 190,
    deaggroRange: 290,
    respawnTime: 8000
  },

  CLANG: {
    name: 'Clang',
    spriteKey: 'clang',
    width: 50,
    height: 44,
    maxHp: 420,
    damage: 48,
    defense: 20,
    speed: 50,
    attackRange: 38,
    attackCooldown: 1100,
    exp: 105,
    mesoDrop: [42, 85],
    itemDrops: [
      { itemId: 'white_potion', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 210,
    deaggroRange: 310,
    respawnTime: 9000
  },

  // Sleepywood / Ant Tunnel
  HORNY_MUSHROOM: {
    name: 'Horny Mushroom',
    spriteKey: 'mushroom', // Uses mushroom as base
    width: 44,
    height: 48,
    maxHp: 450,
    damage: 50,
    defense: 22,
    speed: 42,
    attackRange: 32,
    attackCooldown: 1200,
    exp: 110,
    mesoDrop: [45, 90],
    itemDrops: [
      { itemId: 'white_potion', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
    ],
    aggroRange: 180,
    deaggroRange: 280,
    respawnTime: 9000
  },

  ZOMBIE_MUSHROOM: {
    name: 'Zombie Mushroom',
    spriteKey: 'mushroom', // Uses mushroom with green tint
    width: 44,
    height: 48,
    maxHp: 550,
    damage: 58,
    defense: 24,
    speed: 38,
    attackRange: 34,
    attackCooldown: 1250,
    exp: 135,
    mesoDrop: [55, 110],
    itemDrops: [
      { itemId: 'mana_elixir', chance: 0.18, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 200,
    deaggroRange: 300,
    respawnTime: 10000
  },

  DRAKE: {
    name: 'Drake',
    spriteKey: 'drake',
    width: 56,
    height: 52,
    maxHp: 1000,
    damage: 85,
    defense: 32,
    speed: 55,
    attackRange: 45,
    attackCooldown: 1050,
    exp: 220,
    mesoDrop: [90, 180],
    itemDrops: [
      { itemId: 'elixir', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    ],
    aggroRange: 250,
    deaggroRange: 350,
    respawnTime: 14000
  },

  // Bosses
  MUSHMOM: {
    name: 'Mushmom',
    spriteKey: 'mushmom',
    width: 80,
    height: 88,
    maxHp: 5000,
    damage: 120,
    defense: 50,
    speed: 35,
    attackRange: 60,
    attackCooldown: 1500,
    exp: 800,
    mesoDrop: [500, 1000],
    itemDrops: [
      { itemId: 'elixir', chance: 0.5, minQuantity: 2, maxQuantity: 5 },
    ],
    aggroRange: 300,
    deaggroRange: 400,
    respawnTime: 60000
  },

  ZOMBIE_MUSHMOM: {
    name: 'Zombie Mushmom',
    spriteKey: 'zombie_mushmom',
    width: 84,
    height: 92,
    maxHp: 8000,
    damage: 150,
    defense: 60,
    speed: 30,
    attackRange: 65,
    attackCooldown: 1600,
    exp: 1200,
    mesoDrop: [800, 1600],
    itemDrops: [
      { itemId: 'elixir', chance: 0.6, minQuantity: 3, maxQuantity: 6 },
    ],
    aggroRange: 320,
    deaggroRange: 420,
    respawnTime: 90000
  }
};

export function getMonsterDefinition(type: string): MonsterDefinition {
  const definition = MONSTER_TYPES[type];
  if (!definition) {
    throw new Error(`Monster type "${type}" not found`);
  }
  return definition;
}
