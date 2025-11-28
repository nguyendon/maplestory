/**
 * Attack Data Definitions
 * Defines frame data, hitboxes, and properties for all attacks
 */

export interface AttackHitbox {
  offset: { x: number; y: number };
  size: { width: number; height: number };
}

export interface AttackFrameData {
  startup: number;    // Frames before hitbox active
  active: number;     // Frames hitbox is active
  recovery: number;   // Frames after hitbox inactive
}

export interface AttackData {
  name: string;
  damage: number;
  knockback: { x: number; y: number };
  hitbox: AttackHitbox;
  frameData: AttackFrameData;
  animation: string;
  comboWindow: number; // Frames during recovery where next attack can be queued
}

/**
 * Player's basic 3-hit combo
 */
export const PLAYER_BASIC_COMBO: AttackData[] = [
  // First hit: Quick jab
  {
    name: 'Basic Attack 1',
    damage: 10,
    knockback: { x: 50, y: -20 },
    hitbox: {
      offset: { x: 20, y: 0 },
      size: { width: 40, height: 40 }
    },
    frameData: {
      startup: 3,
      active: 4,
      recovery: 8
    },
    animation: 'player-attack',
    comboWindow: 6
  },
  // Second hit: Stronger
  {
    name: 'Basic Attack 2',
    damage: 15,
    knockback: { x: 80, y: -30 },
    hitbox: {
      offset: { x: 25, y: 0 },
      size: { width: 50, height: 45 }
    },
    frameData: {
      startup: 4,
      active: 5,
      recovery: 10
    },
    animation: 'player-attack',
    comboWindow: 8
  },
  // Third hit: Finisher
  {
    name: 'Basic Attack 3',
    damage: 25,
    knockback: { x: 150, y: -50 },
    hitbox: {
      offset: { x: 30, y: 0 },
      size: { width: 60, height: 50 }
    },
    frameData: {
      startup: 5,
      active: 6,
      recovery: 15
    },
    animation: 'player-attack',
    comboWindow: 0
  }
];

/**
 * Aerial attack
 */
export const PLAYER_AERIAL_ATTACK: AttackData = {
  name: 'Aerial Attack',
  damage: 12,
  knockback: { x: 60, y: -80 },
  hitbox: {
    offset: { x: 20, y: 10 },
    size: { width: 45, height: 45 }
  },
  frameData: {
    startup: 4,
    active: 5,
    recovery: 12
  },
  animation: 'player-attack',
  comboWindow: 0
};
