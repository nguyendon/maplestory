/**
 * Save/Load System with pluggable storage providers
 */

import { type CharacterStatsData } from './CharacterStats';
import { type EquipmentData } from './Equipment';

// ============================================
// Save Data Interfaces
// ============================================

export const SAVE_VERSION = 1;

export interface InventorySaveData {
  slots: { itemId: string | null; quantity: number }[];
  mesos: number;
}

export interface KeyBindingsSaveData {
  skills: Record<string, string>;  // keyCode -> skillId
  actions: Record<string, string>; // keyCode -> actionId
}

export interface MapStateSaveData {
  mapId: string;
  playerX: number;
  playerY: number;
}

export interface MenuStateSaveData {
  minimapVisible: boolean;
  skillBarVisible: boolean;
}

export interface SaveData {
  version: number;
  timestamp: number;
  character: CharacterStatsData;
  inventory: InventorySaveData;
  equipment: EquipmentData;
  keyBindings?: KeyBindingsSaveData;
  mapState?: MapStateSaveData;
  menuState?: MenuStateSaveData;
}

// ============================================
// Storage Provider Interface
// ============================================

export interface StorageProvider {
  save(key: string, data: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ============================================
// LocalStorage Provider
// ============================================

export class LocalStorageProvider implements StorageProvider {
  async save(key: string, data: string): Promise<void> {
    try {
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Save failed: Storage quota exceeded or unavailable');
    }
  }

  async load(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
}

// ============================================
// Save Manager
// ============================================

export class SaveManager {
  private storage: StorageProvider;
  private saveKey: string;

  constructor(storage: StorageProvider, saveKey: string = 'maplestory_save') {
    this.storage = storage;
    this.saveKey = saveKey;
  }

  /**
   * Save game state
   */
  async save(data: SaveData): Promise<{ success: boolean; error?: string }> {
    try {
      // Add metadata
      const saveData: SaveData = {
        ...data,
        version: SAVE_VERSION,
        timestamp: Date.now()
      };

      const json = JSON.stringify(saveData);
      await this.storage.save(this.saveKey, json);

      console.log('Game saved successfully');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Save failed:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Load game state
   */
  async load(): Promise<{ success: boolean; data?: SaveData; error?: string }> {
    try {
      const json = await this.storage.load(this.saveKey);

      if (!json) {
        return { success: false, error: 'No save data found' };
      }

      const data = JSON.parse(json) as SaveData;

      // Version check and migration
      if (data.version !== SAVE_VERSION) {
        const migrated = this.migrate(data);
        if (!migrated) {
          return { success: false, error: 'Save data version incompatible' };
        }
        return { success: true, data: migrated };
      }

      console.log('Game loaded successfully');
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Load failed:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Check if save exists
   */
  async hasSave(): Promise<boolean> {
    return this.storage.exists(this.saveKey);
  }

  /**
   * Delete save data
   */
  async deleteSave(): Promise<void> {
    await this.storage.delete(this.saveKey);
    console.log('Save data deleted');
  }

  /**
   * Migrate old save data to current version
   */
  private migrate(data: SaveData): SaveData | null {
    // Future: Add migration logic for version changes
    // For now, we only have version 1
    console.warn(`Attempting to migrate save from version ${data.version} to ${SAVE_VERSION}`);

    // Example migration pattern:
    // if (data.version === 1 && SAVE_VERSION === 2) {
    //   data = this.migrateV1toV2(data);
    // }

    // If we can't migrate, return null
    if (data.version > SAVE_VERSION) {
      console.error('Save data is from a newer version');
      return null;
    }

    // Mark as current version after migration
    data.version = SAVE_VERSION;
    return data;
  }

  /**
   * Get save info without loading full data
   */
  async getSaveInfo(): Promise<{ exists: boolean; timestamp?: number; level?: number } | null> {
    try {
      const json = await this.storage.load(this.saveKey);
      if (!json) return { exists: false };

      const data = JSON.parse(json) as SaveData;
      return {
        exists: true,
        timestamp: data.timestamp,
        level: data.character.level
      };
    } catch {
      return null;
    }
  }
}

// ============================================
// Default instance with localStorage
// ============================================

export const defaultSaveManager = new SaveManager(new LocalStorageProvider());
