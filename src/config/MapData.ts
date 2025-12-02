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

export type BackgroundTheme =
  | 'field' | 'town' | 'forest' | 'dungeon' | 'night'
  | 'beach' | 'snow' | 'desert' | 'urban' | 'sky' | 'lava' | 'underwater';

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

  // ============================================
  // ELLINIA - Magic Forest Town
  // ============================================
  'ellinia_town': {
    id: 'ellinia_town',
    name: 'Ellinia',
    backgroundTheme: 'forest',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Tree house platforms
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 250, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 250, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 180, type: 'platform' },
      // Upper tree level
      { x: 350, y: GAME_HEIGHT - 420, type: 'platform' },
      { x: 600, y: GAME_HEIGHT - 480, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 420, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
      { x: 700, y: GAME_HEIGHT - 185, height: 250, type: 'rope' },
      { x: 1150, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
      { x: 450, y: GAME_HEIGHT - 335, height: 200, type: 'rope' },
      { x: 950, y: GAME_HEIGHT - 335, height: 200, type: 'rope' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ellinia_forest',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
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
      { x: 500, y: GAME_HEIGHT - 70, name: 'Grendel the Really Old', dialogueKey: 'magician_job' },
      { x: 800, y: GAME_HEIGHT - 70, name: 'Arwen', dialogueKey: 'shop_greeting' },
    ],
  },

  'ellinia_forest': {
    id: 'ellinia_forest',
    name: 'Ellinia Tree Dungeon',
    backgroundTheme: 'forest',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 340, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'rope' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'rope' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'rope' },
      { x: 450, y: GAME_HEIGHT - 280, height: 180, type: 'rope' },
      { x: 950, y: GAME_HEIGHT - 280, height: 180, type: 'rope' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'EVIL_EYE' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'CURSE_EYE' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'EVIL_EYE' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'CURSE_EYE' },
      { x: 450, y: GAME_HEIGHT - 260, monsterId: 'EVIL_EYE' },
      { x: 950, y: GAME_HEIGHT - 260, monsterId: 'CURSE_EYE' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ellinia_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // KERNING CITY - Urban Thief Town
  // ============================================
  'kerning_city': {
    id: 'kerning_city',
    name: 'Kerning City',
    backgroundTheme: 'urban',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Building ledges
      { x: 150, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 400, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 180, type: 'platform' },
      // Rooftops
      { x: 300, y: GAME_HEIGHT - 350, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 350, type: 'platform' },
      { x: 1050, y: GAME_HEIGHT - 380, type: 'platform' },
    ],
    ladders: [
      { x: 150, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 650, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 400, y: GAME_HEIGHT - 285, height: 180, type: 'ladder' },
      { x: 900, y: GAME_HEIGHT - 285, height: 180, type: 'ladder' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'kerning_swamp',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
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
      { x: 600, y: GAME_HEIGHT - 70, name: 'Dark Lord', dialogueKey: 'thief_job' },
      { x: 400, y: GAME_HEIGHT - 70, name: 'JM', dialogueKey: 'shop_greeting' },
    ],
  },

  'kerning_swamp': {
    id: 'kerning_swamp',
    name: 'Kerning City Swamp',
    backgroundTheme: 'night',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 150, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'OCTOPUS' },
      { x: 500, y: GAME_HEIGHT - 100, monsterId: 'LIGATOR' },
      { x: 750, y: GAME_HEIGHT - 100, monsterId: 'OCTOPUS' },
      { x: 1000, y: GAME_HEIGHT - 100, monsterId: 'LIGATOR' },
      { x: 450, y: GAME_HEIGHT - 240, monsterId: 'OCTOPUS' },
      { x: 950, y: GAME_HEIGHT - 240, monsterId: 'LIGATOR' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'kerning_city',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // PERION - Warrior Mountain Town
  // ============================================
  'perion_town': {
    id: 'perion_town',
    name: 'Perion',
    backgroundTheme: 'desert',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Rocky outcrops
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 220, type: 'platform' },
      // Mountain ledges
      { x: 350, y: GAME_HEIGHT - 350, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 400, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 350, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 500, y: GAME_HEIGHT - 285, height: 180, type: 'ladder' },
      { x: 1100, y: GAME_HEIGHT - 285, height: 180, type: 'ladder' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'perion_field',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
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
      { x: 600, y: GAME_HEIGHT - 70, name: 'Dances with Balrog', dialogueKey: 'warrior_job' },
      { x: 900, y: GAME_HEIGHT - 70, name: 'Blacksmith', dialogueKey: 'shop_greeting' },
    ],
  },

  'perion_field': {
    id: 'perion_field',
    name: 'Wild Boar Land',
    backgroundTheme: 'desert',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 340, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'WILD_BOAR' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'FIRE_BOAR' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'WILD_BOAR' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'FIRE_BOAR' },
      { x: 350, y: GAME_HEIGHT - 380, monsterId: 'STONE_GOLEM' },
      { x: 800, y: GAME_HEIGHT - 380, monsterId: 'STONE_GOLEM' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'perion_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // SLEEPYWOOD - Dark Dungeon
  // ============================================
  'sleepywood': {
    id: 'sleepywood',
    name: 'Sleepywood',
    backgroundTheme: 'dungeon',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 240, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 240, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ant_tunnel',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
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
      { x: 600, y: GAME_HEIGHT - 70, name: 'Sabitrama', dialogueKey: 'shop_greeting' },
    ],
  },

  'ant_tunnel': {
    id: 'ant_tunnel',
    name: 'Ant Tunnel',
    backgroundTheme: 'dungeon',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 320, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 320, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 90, height: 160, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 260, height: 180, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 260, height: 180, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'HORNY_MUSHROOM' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'ZOMBIE_MUSHROOM' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'HORNY_MUSHROOM' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'ZOMBIE_MUSHROOM' },
      { x: 350, y: GAME_HEIGHT - 360, monsterId: 'DRAKE' },
      { x: 800, y: GAME_HEIGHT - 360, monsterId: 'DRAKE' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'sleepywood',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // FLORINA BEACH - Tropical Beach
  // ============================================
  'florina_beach': {
    id: 'florina_beach',
    name: 'Florina Beach',
    backgroundTheme: 'beach',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 250, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 550, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 850, y: GAME_HEIGHT - 150, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 180, type: 'platform' },
    ],
    ladders: [
      { x: 250, y: GAME_HEIGHT - 90, height: 160, type: 'rope' },
      { x: 850, y: GAME_HEIGHT - 90, height: 160, type: 'rope' },
    ],
    monsters: [
      { x: 400, y: GAME_HEIGHT - 100, monsterId: 'LORANG' },
      { x: 650, y: GAME_HEIGHT - 100, monsterId: 'CLANG' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'LORANG' },
      { x: 1150, y: GAME_HEIGHT - 100, monsterId: 'CLANG' },
      { x: 550, y: GAME_HEIGHT - 220, monsterId: 'LORANG' },
      { x: 1100, y: GAME_HEIGHT - 220, monsterId: 'CLANG' },
    ],
    portals: [
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
    npcs: [],
  },

  // ============================================
  // ORBIS - Sky City (Ossyria)
  // ============================================
  'orbis_town': {
    id: 'orbis_town',
    name: 'Orbis',
    backgroundTheme: 'sky',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Floating cloud platforms
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 250, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 250, type: 'platform' },
      // Higher levels
      { x: 350, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 450, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 380, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
      { x: 800, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
      { x: 500, y: GAME_HEIGHT - 315, height: 180, type: 'rope' },
      { x: 1100, y: GAME_HEIGHT - 315, height: 180, type: 'rope' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'orbis_tower',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'el_nath_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 600, y: GAME_HEIGHT - 70, name: 'Athena Pierce', dialogueKey: 'bowman_job' },
      { x: 400, y: GAME_HEIGHT - 70, name: 'Orbis Guide', dialogueKey: 'guide_intro' },
    ],
  },

  'orbis_tower': {
    id: 'orbis_tower',
    name: 'Orbis Tower',
    backgroundTheme: 'sky',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 340, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'SENTINEL' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'SENTINEL' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'SENTINEL' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'SENTINEL' },
      { x: 350, y: GAME_HEIGHT - 380, monsterId: 'SENTINEL' },
      { x: 800, y: GAME_HEIGHT - 380, monsterId: 'SENTINEL' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'orbis_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // EL NATH - Snow Mountain (Ossyria)
  // ============================================
  'el_nath_town': {
    id: 'el_nath_town',
    name: 'El Nath',
    backgroundTheme: 'snow',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Icy platforms
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 240, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 240, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 900, y: GAME_HEIGHT - 380, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 500, y: GAME_HEIGHT - 310, height: 180, type: 'ladder' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'el_nath_field',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'orbis_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 600, y: GAME_HEIGHT - 70, name: 'Alcaster', dialogueKey: 'shop_greeting' },
      { x: 400, y: GAME_HEIGHT - 70, name: 'Pedro', dialogueKey: 'guide_intro' },
    ],
  },

  'el_nath_field': {
    id: 'el_nath_field',
    name: 'Ice Valley',
    backgroundTheme: 'snow',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 340, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'JR_YETI' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'YETI' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'JR_YETI' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'YETI' },
      { x: 350, y: GAME_HEIGHT - 380, monsterId: 'YETI' },
      { x: 800, y: GAME_HEIGHT - 380, monsterId: 'YETI' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'el_nath_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // LUDIBRIUM - Toy City (Ossyria)
  // ============================================
  'ludibrium_town': {
    id: 'ludibrium_town',
    name: 'Ludibrium',
    backgroundTheme: 'sky',
    isSafeZone: true,
    playerSpawn: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      // Toy block platforms
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 500, y: GAME_HEIGHT - 250, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 1100, y: GAME_HEIGHT - 250, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 380, type: 'platform' },
      { x: 650, y: GAME_HEIGHT - 450, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 380, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 500, y: GAME_HEIGHT - 315, height: 180, type: 'ladder' },
      { x: 1100, y: GAME_HEIGHT - 315, height: 180, type: 'ladder' },
    ],
    monsters: [],
    portals: [
      {
        x: GAME_WIDTH - 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ludibrium_field',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'el_nath_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 600, y: GAME_HEIGHT - 70, name: 'Marcel', dialogueKey: 'shop_greeting' },
      { x: 400, y: GAME_HEIGHT - 70, name: 'Ludi Guide', dialogueKey: 'guide_intro' },
    ],
  },

  'ludibrium_field': {
    id: 'ludibrium_field',
    name: 'Toy Factory',
    backgroundTheme: 'sky',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 450, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 700, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 950, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1150, y: GAME_HEIGHT - 160, type: 'platform' },
      { x: 350, y: GAME_HEIGHT - 340, type: 'platform' },
      { x: 800, y: GAME_HEIGHT - 340, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 1150, y: GAME_HEIGHT - 95, height: 175, type: 'ladder' },
      { x: 450, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
      { x: 950, y: GAME_HEIGHT - 280, height: 180, type: 'ladder' },
    ],
    monsters: [
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'RATZ' },
      { x: 550, y: GAME_HEIGHT - 100, monsterId: 'BLOCK_GOLEM' },
      { x: 800, y: GAME_HEIGHT - 100, monsterId: 'TICK' },
      { x: 1050, y: GAME_HEIGHT - 100, monsterId: 'RATZ' },
      { x: 350, y: GAME_HEIGHT - 380, monsterId: 'BLOCK_GOLEM' },
      { x: 800, y: GAME_HEIGHT - 380, monsterId: 'TICK' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ludibrium_town',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [],
  },

  // ============================================
  // BOSS MAPS
  // ============================================
  'mushmom_forest': {
    id: 'mushmom_forest',
    name: 'Mushmom Forest',
    backgroundTheme: 'forest',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 600, y: GAME_HEIGHT - 200, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 180, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
      { x: 1000, y: GAME_HEIGHT - 105, height: 185, type: 'rope' },
    ],
    monsters: [
      { x: 600, y: GAME_HEIGHT - 100, monsterId: 'MUSHMOM' },
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'MUSHROOM' },
    ],
    portals: [
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
    npcs: [],
  },

  'zombie_mushmom_cave': {
    id: 'zombie_mushmom_cave',
    name: 'Zombie Mushmom Cave',
    backgroundTheme: 'dungeon',
    playerSpawn: { x: 100, y: GAME_HEIGHT - 96 },
    platforms: [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, type: 'ground', scale: 1 },
      { x: 200, y: GAME_HEIGHT - 180, type: 'platform' },
      { x: 600, y: GAME_HEIGHT - 220, type: 'platform' },
      { x: 1000, y: GAME_HEIGHT - 180, type: 'platform' },
    ],
    ladders: [
      { x: 200, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
      { x: 1000, y: GAME_HEIGHT - 105, height: 185, type: 'ladder' },
    ],
    monsters: [
      { x: 600, y: GAME_HEIGHT - 100, monsterId: 'ZOMBIE_MUSHMOM' },
      { x: 300, y: GAME_HEIGHT - 100, monsterId: 'ZOMBIE_MUSHROOM' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'ZOMBIE_MUSHROOM' },
    ],
    portals: [
      {
        x: 50,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'ant_tunnel',
        targetX: GAME_WIDTH - 100,
        targetY: GAME_HEIGHT - 100,
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
