/**
 * Equipment System - manages equipped items and stat bonuses
 */

import Phaser from 'phaser';
import { EquipSlot, type EquipItem, type StatBonuses } from './ItemData';

export interface EquipmentSlots {
  [EquipSlot.WEAPON]: EquipItem | null;
  [EquipSlot.HAT]: EquipItem | null;
  [EquipSlot.TOP]: EquipItem | null;
  [EquipSlot.BOTTOM]: EquipItem | null;
  [EquipSlot.SHOES]: EquipItem | null;
  [EquipSlot.GLOVES]: EquipItem | null;
  [EquipSlot.CAPE]: EquipItem | null;
  [EquipSlot.ACCESSORY]: EquipItem | null;
}

export interface EquipmentData {
  weapon: string | null;
  hat: string | null;
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  gloves: string | null;
  cape: string | null;
  accessory: string | null;
}

export class Equipment extends Phaser.Events.EventEmitter {
  private slots: EquipmentSlots;

  constructor() {
    super();

    this.slots = {
      [EquipSlot.WEAPON]: null,
      [EquipSlot.HAT]: null,
      [EquipSlot.TOP]: null,
      [EquipSlot.BOTTOM]: null,
      [EquipSlot.SHOES]: null,
      [EquipSlot.GLOVES]: null,
      [EquipSlot.CAPE]: null,
      [EquipSlot.ACCESSORY]: null,
    };
  }

  /**
   * Equip an item to its designated slot
   * @returns The previously equipped item (if any) to be returned to inventory
   */
  equip(item: EquipItem): EquipItem | null {
    const slot = item.slot;
    const previousItem = this.slots[slot];

    this.slots[slot] = item;

    this.emit('equipped', { slot, item, previousItem });
    this.emit('statsChanged', this.getTotalStats());

    return previousItem;
  }

  /**
   * Unequip an item from a slot
   * @returns The unequipped item
   */
  unequip(slot: EquipSlot): EquipItem | null {
    const item = this.slots[slot];
    if (!item) return null;

    this.slots[slot] = null;

    this.emit('unequipped', { slot, item });
    this.emit('statsChanged', this.getTotalStats());

    return item;
  }

  /**
   * Get the item in a specific slot
   */
  getSlot(slot: EquipSlot): EquipItem | null {
    return this.slots[slot];
  }

  /**
   * Get all equipped items
   */
  getAllEquipped(): EquipmentSlots {
    return { ...this.slots };
  }

  /**
   * Calculate total stat bonuses from all equipped items
   */
  getTotalStats(): StatBonuses {
    const totals: StatBonuses = {
      STR: 0,
      DEX: 0,
      INT: 0,
      LUK: 0,
      ATK: 0,
      DEF: 0,
      HP: 0,
      MP: 0,
    };

    Object.values(this.slots).forEach(item => {
      if (item) {
        if (item.stats.STR) totals.STR! += item.stats.STR;
        if (item.stats.DEX) totals.DEX! += item.stats.DEX;
        if (item.stats.INT) totals.INT! += item.stats.INT;
        if (item.stats.LUK) totals.LUK! += item.stats.LUK;
        if (item.stats.ATK) totals.ATK! += item.stats.ATK;
        if (item.stats.DEF) totals.DEF! += item.stats.DEF;
        if (item.stats.HP) totals.HP! += item.stats.HP;
        if (item.stats.MP) totals.MP! += item.stats.MP;
      }
    });

    return totals;
  }

  /**
   * Check if player meets level requirement for an item
   */
  canEquip(item: EquipItem, playerLevel: number): { canEquip: boolean; reason?: string } {
    if (playerLevel < item.levelRequirement) {
      return {
        canEquip: false,
        reason: `Requires level ${item.levelRequirement}`
      };
    }
    return { canEquip: true };
  }

  /**
   * Serialize for save data
   */
  toJSON(): EquipmentData {
    return {
      weapon: this.slots[EquipSlot.WEAPON]?.id || null,
      hat: this.slots[EquipSlot.HAT]?.id || null,
      top: this.slots[EquipSlot.TOP]?.id || null,
      bottom: this.slots[EquipSlot.BOTTOM]?.id || null,
      shoes: this.slots[EquipSlot.SHOES]?.id || null,
      gloves: this.slots[EquipSlot.GLOVES]?.id || null,
      cape: this.slots[EquipSlot.CAPE]?.id || null,
      accessory: this.slots[EquipSlot.ACCESSORY]?.id || null,
    };
  }

  /**
   * Load equipment from save data
   */
  loadFromData(data: EquipmentData, getItemFn: (id: string) => EquipItem | null): void {
    const slotMapping: { key: keyof EquipmentData; slot: EquipSlot }[] = [
      { key: 'weapon', slot: EquipSlot.WEAPON },
      { key: 'hat', slot: EquipSlot.HAT },
      { key: 'top', slot: EquipSlot.TOP },
      { key: 'bottom', slot: EquipSlot.BOTTOM },
      { key: 'shoes', slot: EquipSlot.SHOES },
      { key: 'gloves', slot: EquipSlot.GLOVES },
      { key: 'cape', slot: EquipSlot.CAPE },
      { key: 'accessory', slot: EquipSlot.ACCESSORY },
    ];

    for (const { key, slot } of slotMapping) {
      const itemId = data[key];
      if (itemId) {
        const item = getItemFn(itemId);
        if (item) {
          this.slots[slot] = item;
        }
      } else {
        this.slots[slot] = null;
      }
    }

    this.emit('statsChanged', this.getTotalStats());
  }
}
