/**
 * Item Data System
 */

export const ItemType = {
  EQUIP: 'equip',
  USE: 'use',
  ETC: 'etc',
  SETUP: 'setup'
} as const;
export type ItemType = typeof ItemType[keyof typeof ItemType];

export const EquipSlot = {
  WEAPON: 'weapon',
  HAT: 'hat',
  TOP: 'top',
  BOTTOM: 'bottom',
  SHOES: 'shoes',
  GLOVES: 'gloves',
  CAPE: 'cape',
  ACCESSORY: 'accessory'
} as const;
export type EquipSlot = typeof EquipSlot[keyof typeof EquipSlot];

export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
} as const;
export type ItemRarity = typeof ItemRarity[keyof typeof ItemRarity];

export interface StatBonuses {
  STR?: number;
  DEX?: number;
  INT?: number;
  LUK?: number;
  ATK?: number;
  DEF?: number;
  HP?: number;
  MP?: number;
}

export interface BaseItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  sellPrice: number;
  icon: string;
}

export interface EquipItem extends BaseItem {
  type: typeof ItemType.EQUIP;
  slot: EquipSlot;
  stats: StatBonuses;
  levelRequirement: number;
}

export const UseEffect = {
  HEAL_HP: 'heal_hp',
  HEAL_MP: 'heal_mp',
  BUFF_ATK: 'buff_atk'
} as const;
export type UseEffect = typeof UseEffect[keyof typeof UseEffect];

export interface UseItem extends BaseItem {
  type: typeof ItemType.USE;
  effect: UseEffect;
  value: number;
  duration?: number;
}

export interface EtcItem extends BaseItem {
  type: typeof ItemType.ETC;
}

export type Item = EquipItem | UseItem | EtcItem;

export const ITEM_DATABASE: Record<string, Item> = {
  // Consumables
  'red_potion': {
    id: 'red_potion',
    name: 'Red Potion',
    description: 'Restores 50 HP',
    type: ItemType.USE,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 100,
    sellPrice: 10,
    icon: 'icon_red_potion',
    effect: UseEffect.HEAL_HP,
    value: 50
  },
  'blue_potion': {
    id: 'blue_potion',
    name: 'Blue Potion',
    description: 'Restores 30 MP',
    type: ItemType.USE,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 100,
    sellPrice: 15,
    icon: 'icon_blue_potion',
    effect: UseEffect.HEAL_MP,
    value: 30
  },

  // Equipment
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A basic training sword',
    type: ItemType.EQUIP,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    sellPrice: 50,
    icon: 'icon_wooden_sword',
    slot: EquipSlot.WEAPON,
    stats: { ATK: 5, STR: 1 },
    levelRequirement: 1
  },
  'basic_hat': {
    id: 'basic_hat',
    name: 'Basic Hat',
    description: 'Simple cloth hat',
    type: ItemType.EQUIP,
    rarity: ItemRarity.COMMON,
    stackable: false,
    maxStack: 1,
    sellPrice: 30,
    icon: 'icon_basic_hat',
    slot: EquipSlot.HAT,
    stats: { DEF: 2, HP: 10 },
    levelRequirement: 1
  },

  // ETC Items
  'slime_bubble': {
    id: 'slime_bubble',
    name: 'Slime Bubble',
    description: 'Sticky bubble from a slime',
    type: ItemType.ETC,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 200,
    sellPrice: 3,
    icon: 'icon_slime_bubble'
  },
  'orange_mushroom_cap': {
    id: 'orange_mushroom_cap',
    name: 'Orange Mushroom Cap',
    description: 'Cap from an Orange Mushroom',
    type: ItemType.ETC,
    rarity: ItemRarity.COMMON,
    stackable: true,
    maxStack: 200,
    sellPrice: 5,
    icon: 'icon_mushroom_cap'
  }
};

export function getItem(id: string): Item | null {
  return ITEM_DATABASE[id] || null;
}
