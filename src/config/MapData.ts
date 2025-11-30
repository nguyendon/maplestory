/**
 * Map Data Definitions
 * Defines all map layouts: platforms, ladders, monsters, portals, NPCs
 */

import { GAME_WIDTH, GAME_HEIGHT } from './constants';

// ============================================
// Types
// ============================================

export interface PlatformData {
  x: number;
  y: number;
  type: 'ground' | 'platform';
  scale?: number;
}

export interface LadderData {
  x: number;
  y: number;
  height: number;
  type: 'ladder' | 'rope';
}

export interface MonsterSpawnData {
  x: number;
  y: number;
  monsterId: string;
}

export interface PortalData {
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

export interface NPCData {
  x: number;
  y: number;
  name: string;
  dialogueKey: string;
}

export type BackgroundTheme = 'field' | 'town' | 'forest' | 'dungeon' | 'night';

export interface MapDefinition {
  id: string;
  name: string;
  bgm?: string;
  backgroundTheme: BackgroundTheme;
  isSafeZone?: boolean; // No monster spawns, no combat
  platforms: PlatformData[];
  ladders: LadderData[];
  monsters: MonsterSpawnData[];
  portals: PortalData[];
  npcs: NPCData[];
  playerSpawn: { x: number; y: number };
}

// ============================================
// Map Definitions
// ============================================

export const MAPS: Record<string, MapDefinition> = {
  // ============================================
  // Henesys Town (Safe Zone)
  // ============================================
  'henesys_town': {
    id: 'henesys_town',
    name: 'Henesys Town',
    backgroundTheme: 'town',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Town buildings - platforms at different heights
      { x: 150, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 180, type: 'platform' },
      // Upper walkway
      { x: 250, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 320, type: 'platform' },
    ],
    ladders: [
      { x: 150, y: GAME_HEIGHT - 105, height: 190, type: 'ladder' },
      { x: 1100, y: GAME_HEIGHT - 105, height: 190, type: 'ladder' },
      { x: 250, y: GAME_HEIGHT - 250, height: 180, type: 'ladder' },
      { x: 1000, y: GAME_HEIGHT - 250, height: 180, type: 'ladder' },
    ],
    monsters: [], // Safe zone - no monsters
    portals: [
      // East exit to Hunting Ground
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_field',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      // West exit to Forest
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'forest_path',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 400, y: GAME_HEIGHT - 70, name: 'Chief Stan', dialogueKey: 'chief_stan' },
      { x: 700, y: GAME_HEIGHT - 70, name: 'Healer', dialogueKey: 'healer_greeting' },
      { x: 250, y: GAME_HEIGHT - 220, name: 'Merchant', dialogueKey: 'shop_greeting' },
      { x: 1000, y: GAME_HEIGHT - 220, name: 'Job Instructor', dialogueKey: 'job_instructor' },
    ],
  },

  // ============================================
  // Henesys Hunting Ground
  // ============================================
  'henesys_field': {
    id: 'henesys_field',
    name: 'Henesys Hunting Ground',
    backgroundTheme: 'field',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground - spans full width
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Floating platforms
      { x: 200, y: GAME_HEIGHT - 170, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 240, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 170, type: 'platform' },
      { x: 1080, y: GAME_HEIGHT - 170, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 440, type: 'platform' },
      { x: 850, y: GAME_HEIGHT - 440, type: 'platform' },
    ],
    ladders: [
      // Ground to first level (platforms at GAME_HEIGHT - 170)
      // Ladder center at -100, height 180 → top at -100 - 90 = -190, extends 20 above platform
      { x: 200, y: GAME_HEIGHT - 100, height: 180, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 100, height: 180, type: 'rope' },
      { x: 1080, y: GAME_HEIGHT - 100, height: 180, type: 'ladder' },
      // First level to second level (platforms at GAME_HEIGHT - 340)
      { x: 350, y: GAME_HEIGHT - 255, height: 210, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 255, height: 210, type: 'rope' },
      // Second level to third level (platforms at GAME_HEIGHT - 440)
      { x: 550, y: GAME_HEIGHT - 390, height: 140, type: 'ladder' },
      { x: 850, y: GAME_HEIGHT - 390, height: 140, type: 'rope' },
    ],
    monsters: [
      { x: 400, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 650, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
    ],
    portals: [
      // Portal to deeper field
      {
        x: 550,
        y: GAME_HEIGHT - 480,
        width: 50,
        height: 70,
        targetMap: 'henesys_field_2',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      // East exit to field 2
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_field_2',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      // West exit to town
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 180, y: GAME_HEIGHT - 70, name: 'Maple Guide', dialogueKey: 'guide_intro' },
      { x: 500, y: GAME_HEIGHT - 280, name: 'Shopkeeper', dialogueKey: 'shop_greeting' },
    ],
  },

  // ============================================
  // Henesys Outskirts
  // ============================================
  'henesys_field_2': {
    id: 'henesys_field_2',
    name: 'Henesys Outskirts',
    backgroundTheme: 'field',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Different platform layout - more horizontal
      { x: 150, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 750, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 150, type: 'platform' },
      // Upper level
      { x: 250, y: GAME_HEIGHT - 280, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 280, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 280, type: 'platform' },
      { x: 850, y: GAME_HEIGHT - 280, type: 'platform' },
      { x: 1050, y: GAME_HEIGHT - 280, type: 'platform' },
    ],
    ladders: [
      // Ground to first level (platforms at GAME_HEIGHT - 150)
      { x: 150, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 550, y: GAME_HEIGHT - 90, height: 160, type: 'rope' },
      { x: 950, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      // First to upper level (platforms at GAME_HEIGHT - 280)
      { x: 250, y: GAME_HEIGHT - 215, height: 170, type: 'ladder' },
      { x: 650, y: GAME_HEIGHT - 215, height: 170, type: 'rope' },
      { x: 1050, y: GAME_HEIGHT - 215, height: 170, type: 'ladder' },
    ],
    monsters: [
      // Snails on ground (easier)
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'SNAIL' },
      { x: 600, y: GAME_HEIGHT - 100, monsterId: 'SNAIL' },
      { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SNAIL' },
      // Mushrooms on ground (medium)
      { x: 450, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 950, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      // Mushrooms on platforms (harder to reach)
      { x: 350, y: GAME_HEIGHT - 190, monsterId: 'MUSHROOM' },
      { x: 750, y: GAME_HEIGHT - 190, monsterId: 'MUSHROOM' },
    ],
    portals: [
      // West exit back to field 1
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_field',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
      // East exit to dungeon
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'dungeon_entrance',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: GAME_WIDTH - 150, y: GAME_HEIGHT - 70, name: 'Wanderer', dialogueKey: 'guide_intro' },
    ],
  },

  // ============================================
  // Forest Path (West of Town)
  // ============================================
  'forest_path': {
    id: 'forest_path',
    name: 'Ellinia Forest Path',
    backgroundTheme: 'forest',
    playerSpawn: { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Tree branch platforms - uneven heights like a forest
      { x: 200, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 400, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 600, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 180, type: 'platform' },
      // Higher branches
      { x: 300, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 350, type: 'platform' },
      { x: 750, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 340, type: 'platform' },
      // Top canopy
      { x: 450, y: GAME_HEIGHT - 480, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 500, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 90, height: 160, type: 'rope' },
      { x: 600, y: GAME_HEIGHT - 95, height: 170, type: 'rope' },
      { x: 1000, y: GAME_HEIGHT - 105, height: 190, type: 'rope' },
      { x: 400, y: GAME_HEIGHT - 260, height: 160, type: 'rope' },
      { x: 800, y: GAME_HEIGHT - 300, height: 200, type: 'rope' },
      { x: 550, y: GAME_HEIGHT - 415, height: 170, type: 'rope' },
    ],
    monsters: [
      // Green mushrooms in forest
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 500, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 700, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      // Slimes on higher platforms
      { x: 400, y: GAME_HEIGHT - 240, monsterId: 'SLIME' },
      { x: 800, y: GAME_HEIGHT - 260, monsterId: 'SLIME' },
    ],
    portals: [
      // East exit to town
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_town',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      // West exit to deeper forest
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'forest_deep',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 700, y: GAME_HEIGHT - 540, name: 'Fairy', dialogueKey: 'fairy_greeting' },
    ],
  },

  // ============================================
  // Deep Forest (Harder monsters)
  // ============================================
  'forest_deep': {
    id: 'forest_deep',
    name: 'Deep Forest',
    backgroundTheme: 'forest',
    playerSpawn: { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Dense tree platforms
      { x: 150, y: GAME_HEIGHT - 140, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 140, type: 'platform' },
      { x: 750, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 180, type: 'platform' },
      // Mid level
      { x: 250, y: GAME_HEIGHT - 300, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 280, type: 'platform' },
      { x: 750, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 290, type: 'platform' },
      // High canopy
      { x: 400, y: GAME_HEIGHT - 420, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 450, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 430, type: 'platform' },
    ],
    ladders: [
      { x: 150, y: GAME_HEIGHT - 85, height: 155, type: 'rope' },
      { x: 550, y: GAME_HEIGHT - 85, height: 155, type: 'rope' },
      { x: 950, y: GAME_HEIGHT - 95, height: 175, type: 'rope' },
      { x: 350, y: GAME_HEIGHT - 240, height: 160, type: 'rope' },
      { x: 750, y: GAME_HEIGHT - 260, height: 160, type: 'rope' },
      { x: 500, y: GAME_HEIGHT - 365, height: 190, type: 'rope' },
      { x: 900, y: GAME_HEIGHT - 360, height: 180, type: 'rope' },
    ],
    monsters: [
      // Stronger monsters
      { x: 250, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 450, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 650, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 850, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      // On platforms
      { x: 350, y: GAME_HEIGHT - 220, monsterId: 'SLIME' },
      { x: 750, y: GAME_HEIGHT - 240, monsterId: 'SLIME' },
      { x: 1150, y: GAME_HEIGHT - 220, monsterId: 'SLIME' },
    ],
    portals: [
      // East exit back to forest path
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'forest_path',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // Dungeon Entrance
  // ============================================
  'dungeon_entrance': {
    id: 'dungeon_entrance',
    name: 'Dungeon Entrance',
    backgroundTheme: 'dungeon',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground - stone floor
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Stone platforms
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      // Upper ledges
      { x: 300, y: GAME_HEIGHT - 330, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 360, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 330, type: 'platform' },
      { x: 1050, y: GAME_HEIGHT - 360, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 280, height: 200, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 280, height: 200, type: 'ladder' },
    ],
    monsters: [
      // Tougher monsters in dungeon
      { x: 350, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 850, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      // On platforms
      { x: 450, y: GAME_HEIGHT - 240, monsterId: 'SLIME' },
      { x: 950, y: GAME_HEIGHT - 240, monsterId: 'SLIME' },
    ],
    portals: [
      // West exit back to outskirts
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_field_2',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
      // Deeper into dungeon (upper area)
      {
        x: 550,
        y: GAME_HEIGHT - 400,
        width: 50,
        height: 70,
        targetMap: 'dungeon_depths',
        targetX: GAME_WIDTH / 2,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 150, y: GAME_HEIGHT - 70, name: 'Guard', dialogueKey: 'dungeon_guard' },
    ],
  },

  // ============================================
  // Dungeon Depths (Night theme - darker)
  // ============================================
  'dungeon_depths': {
    id: 'dungeon_depths',
    name: 'Dungeon Depths',
    backgroundTheme: 'night',
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      // Ground
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Scattered stone platforms
      { x: 150, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 400, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 170, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 190, type: 'platform' },
      // Mid level
      { x: 250, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 350, type: 'platform' },
      { x: 850, y: GAME_HEIGHT - 330, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 360, type: 'platform' },
      // Upper area
      { x: 400, y: GAME_HEIGHT - 470, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 500, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 480, type: 'platform' },
    ],
    ladders: [
      { x: 150, y: GAME_HEIGHT - 105, height: 195, type: 'ladder' },
      { x: 650, y: GAME_HEIGHT - 115, height: 215, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 110, height: 205, type: 'ladder' },
      { x: 400, y: GAME_HEIGHT - 260, height: 200, type: 'ladder' },
      { x: 900, y: GAME_HEIGHT - 250, height: 200, type: 'ladder' },
      { x: 550, y: GAME_HEIGHT - 425, height: 190, type: 'ladder' },
      { x: 1000, y: GAME_HEIGHT - 420, height: 160, type: 'ladder' },
    ],
    monsters: [
      // Many monsters in the depths
      { x: 250, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 450, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 650, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 850, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      // On platforms
      { x: 400, y: GAME_HEIGHT - 190, monsterId: 'MUSHROOM' },
      { x: 900, y: GAME_HEIGHT - 210, monsterId: 'MUSHROOM' },
      { x: 550, y: GAME_HEIGHT - 390, monsterId: 'SLIME' },
      { x: 850, y: GAME_HEIGHT - 370, monsterId: 'SLIME' },
    ],
    portals: [
      // Exit back to dungeon entrance
      {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 70,
        width: 50,
        height: 70,
        targetMap: 'dungeon_entrance',
        targetX: 550,
        targetY: GAME_HEIGHT - 400,
      },
    ],
    npcs: [],
  },
};

// ============================================
// Helper Functions
// ============================================

export function getMap(mapId: string): MapDefinition | undefined {
  return MAPS[mapId];
}

export function getDefaultMap(): MapDefinition {
  return MAPS['henesys_field'];
}
