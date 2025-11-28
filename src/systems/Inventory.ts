/**
 * Inventory System
 */

import type { Item } from './ItemData';

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
}
