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

export interface MapDefinition {
  id: string;
  name: string;
  bgm?: string;
  background: {
    type: 'gradient' | 'image';
    config?: Record<string, unknown>;
  };
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
  'henesys_field': {
    id: 'henesys_field',
    name: 'Henesys Hunting Ground',
    background: {
      type: 'gradient',
    },
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
      // Ground to first level
      { x: 200, y: GAME_HEIGHT - 100, height: 140, type: 'ladder' },
      { x: 800, y: GAME_HEIGHT - 100, height: 140, type: 'rope' },
      { x: 1080, y: GAME_HEIGHT - 100, height: 140, type: 'ladder' },
      // First level to second level
      { x: 350, y: GAME_HEIGHT - 255, height: 170, type: 'ladder' },
      { x: 700, y: GAME_HEIGHT - 255, height: 170, type: 'rope' },
      // Second level to third level
      { x: 550, y: GAME_HEIGHT - 390, height: 100, type: 'ladder' },
      { x: 850, y: GAME_HEIGHT - 390, height: 100, type: 'rope' },
    ],
    monsters: [
      { x: 400, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 650, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 900, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
      { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SLIME' },
    ],
    portals: [
      {
        x: 550,
        y: GAME_HEIGHT - 480,
        width: 50,
        height: 70,
        targetMap: 'henesys_field_2',
        targetX: 100,
        targetY: GAME_HEIGHT - 100,
      },
      {
        x: GAME_WIDTH - 100,
        y: GAME_HEIGHT - 70,
        width: 40,
        height: 60,
        targetMap: 'henesys_field_2',
        targetX: 50,
        targetY: GAME_HEIGHT - 100,
      },
    ],
    npcs: [
      { x: 180, y: GAME_HEIGHT - 70, name: 'Maple Guide', dialogueKey: 'guide_intro' },
      { x: 500, y: GAME_HEIGHT - 280, name: 'Shopkeeper', dialogueKey: 'shop_greeting' },
    ],
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
