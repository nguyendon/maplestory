/**
 * Inventory System
 */

import { type Item, type UseItem, ItemType, UseEffect } from './ItemData';
import type { PlayerStats } from './CharacterStats';

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export class Inventory {
  private slots: InventorySlot[];
  private size: number;
  private mesos: number;

  constructor(size: number = 24) {
    this.size = size;
    this.mesos = 0;
    this.slots = [];

    for (let i = 0; i < size; i++) {
      this.slots.push({ item: null, quantity: 0 });
    }
  }

  /**
   * Add item to inventory
   * @returns Number of items that couldn't be added (overflow)
   */
  addItem(item: Item, quantity: number = 1): number {
    if (quantity <= 0) return 0;

    let remaining = quantity;

    // Stack with existing items first
    if (item.stackable) {
      for (let i = 0; i < this.size && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot.item && slot.item.id === item.id) {
          const spaceInSlot = item.maxStack - slot.quantity;
          const toAdd = Math.min(spaceInSlot, remaining);
          if (toAdd > 0) {
            slot.quantity += toAdd;
            remaining -= toAdd;
          }
        }
      }
    }

    // Add to empty slots
    while (remaining > 0) {
      const emptyIndex = this.findEmptySlot();
      if (emptyIndex === -1) return remaining;

      const toAdd = item.stackable ? Math.min(remaining, item.maxStack) : 1;
      this.slots[emptyIndex] = { item, quantity: toAdd };
      remaining -= toAdd;
    }

    return 0;
  }

  removeItem(slotIndex: number, quantity: number = 1): boolean {
    if (slotIndex < 0 || slotIndex >= this.size) return false;

    const slot = this.slots[slotIndex];
    if (!slot.item || slot.quantity < quantity) return false;

    slot.quantity -= quantity;
    if (slot.quantity <= 0) {
      slot.item = null;
      slot.quantity = 0;
    }

    return true;
  }

  getSlot(index: number): InventorySlot | null {
    if (index < 0 || index >= this.size) return null;
    return this.slots[index];
  }

  findItemById(itemId: string): number {
    for (let i = 0; i < this.size; i++) {
      if (this.slots[i].item?.id === itemId) return i;
    }
    return -1;
  }

  getItemCount(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item?.id === itemId) total += slot.quantity;
    }
    return total;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }

  getMesos(): number {
    return this.mesos;
  }

  addMesos(amount: number): void {
    if (amount > 0) this.mesos += amount;
  }

  removeMesos(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.mesos < amount) return false;
    this.mesos -= amount;
    return true;
  }

  getSize(): number {
    return this.size;
  }

  getEmptySlotCount(): number {
    return this.slots.filter(s => !s.item).length;
  }

  isFull(): boolean {
    return this.getEmptySlotCount() === 0;
  }

  private findEmptySlot(): number {
    for (let i = 0; i < this.size; i++) {
      if (!this.slots[i].item) return i;
    }
    return -1;
  }

  /**
   * Use a consumable item from a specific slot
   * @returns true if item was successfully used
   */
  useItem(slotIndex: number, playerStats: PlayerStats): { success: boolean; message: string; effect?: string; value?: number } {
    const slot = this.getSlot(slotIndex);
    if (!slot || !slot.item) {
      return { success: false, message: 'No item in slot' };
    }

    if (slot.item.type !== ItemType.USE) {
      return { success: false, message: 'Item cannot be used' };
    }

    const useItem = slot.item as UseItem;
    let effectValue = 0;
    let effectMessage = '';

    switch (useItem.effect) {
      case UseEffect.HEAL_HP: {
        const maxHP = playerStats.getMaxHP();
        const currentHP = playerStats.currentHP;

        if (currentHP >= maxHP) {
          return { success: false, message: 'HP is already full' };
        }

        // Negative value means percentage healing
        if (useItem.value < 0) {
          effectValue = Math.floor(maxHP * Math.abs(useItem.value) / 100);
        } else {
          effectValue = useItem.value;
        }

        const healed = playerStats.healHP(effectValue);
        effectMessage = `Recovered ${healed} HP`;
        break;
      }

      case UseEffect.HEAL_MP: {
        const maxMP = playerStats.getMaxMP();
        const currentMP = playerStats.currentMP;

        if (currentMP >= maxMP) {
          return { success: false, message: 'MP is already full' };
        }

        // Negative value means percentage healing
        if (useItem.value < 0) {
          effectValue = Math.floor(maxMP * Math.abs(useItem.value) / 100);
        } else {
          effectValue = useItem.value;
        }

        const restored = playerStats.restoreMP(effectValue);
        effectMessage = `Recovered ${restored} MP`;
        break;
      }

      case UseEffect.BUFF_ATK: {
        // TODO: Implement buff system
        effectMessage = `ATK increased by ${useItem.value} for ${useItem.duration}s`;
        break;
      }

      default:
        return { success: false, message: 'Unknown item effect' };
    }

    // Remove the item from inventory
    this.removeItem(slotIndex, 1);

    return {
      success: true,
      message: effectMessage,
      effect: useItem.effect,
      value: effectValue
    };
  }

  /**
   * Use a consumable item by its ID (finds first matching item)
   */
  useItemById(itemId: string, playerStats: PlayerStats): { success: boolean; message: string; effect?: string; value?: number } {
    const slotIndex = this.findItemById(itemId);
    if (slotIndex === -1) {
      return { success: false, message: `No ${itemId} in inventory` };
    }
    return this.useItem(slotIndex, playerStats);
  }

  /**
   * Get all consumable items for quick-use slots
   */
  getConsumables(): { slotIndex: number; item: UseItem; quantity: number }[] {
    const consumables: { slotIndex: number; item: UseItem; quantity: number }[] = [];

    for (let i = 0; i < this.size; i++) {
      const slot = this.slots[i];
      if (slot.item && slot.item.type === ItemType.USE) {
        consumables.push({
          slotIndex: i,
          item: slot.item as UseItem,
          quantity: slot.quantity
        });
      }
    }

    return consumables;
  }

  getAllSlots(): InventorySlot[] {
    return [...this.slots];
  }
}
