/**
 * Equipment System Types
 */

export const EquipSlot = {
  WEAPON: 'weapon',
  HAT: 'hat',
  TOP: 'top',
  BOTTOM: 'bottom',
  SHOES: 'shoes',
  GLOVES: 'gloves',
  CAPE: 'cape',
  FACE: 'face',
  HAIR: 'hair',
  SHIELD: 'shield',
  ACCESSORY_1: 'accessory1',
  ACCESSORY_2: 'accessory2',
  ACCESSORY_3: 'accessory3',
} as const;

export type EquipSlot = typeof EquipSlot[keyof typeof EquipSlot];

export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export type ItemRarity = typeof ItemRarity[keyof typeof ItemRarity];

// Render order (higher = on top)
export const EQUIPMENT_LAYERS: Record<EquipSlot, number> = {
  [EquipSlot.CAPE]: 0,
  [EquipSlot.BOTTOM]: 10,
  [EquipSlot.SHOES]: 20,
  [EquipSlot.TOP]: 30,
  [EquipSlot.GLOVES]: 40,
  [EquipSlot.FACE]: 50,
  [EquipSlot.HAIR]: 60,
  [EquipSlot.HAT]: 70,
  [EquipSlot.SHIELD]: 80,
  [EquipSlot.WEAPON]: 90,
  [EquipSlot.ACCESSORY_1]: 100,
  [EquipSlot.ACCESSORY_2]: 101,
  [EquipSlot.ACCESSORY_3]: 102,
};

export interface EquipmentStats {
  STR?: number;
  DEX?: number;
  INT?: number;
  LUK?: number;
  HP?: number;
  MP?: number;
  ATK?: number;
  DEF?: number;
  ACC?: number;
  EVA?: number;
  CRIT?: number;
  moveSpeed?: number;
  attackSpeed?: number;
  dropRate?: number;
}

export interface EquipRequirements {
  level?: number;
  STR?: number;
  DEX?: number;
  INT?: number;
  LUK?: number;
  jobClass?: string[];
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: EquipSlot;
  rarity: ItemRarity;
  spriteKey: string;
  animPrefix?: string;
  stats: EquipmentStats;
  requirements: EquipRequirements;
  buyPrice?: number;
  sellPrice: number;
  upgradeSlots?: number;
}

export type EquipmentSlots = {
  [key in EquipSlot]: Equipment | null;
};
