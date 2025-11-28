// Game dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Player constants with tuned movement feel
export const PLAYER = {
  // Dimensions
  WIDTH: 32,
  HEIGHT: 48,

  // Ground movement - snappy and responsive
  SPEED: 200,
  GROUND_ACCEL: 1600,
  GROUND_DECEL: 1400,

  // Air movement - reduced control for floatier feel
  AIR_SPEED: 200,
  AIR_ACCEL: 1200,
  AIR_DECEL: 800,

  // Jumping - MapleStory-style floaty jumps
  JUMP_VELOCITY: -400,
  DOUBLE_JUMP_VELOCITY: -350,
  MAX_FALL_SPEED: 500,

  // Jump feel improvements
  COYOTE_TIME: 100,         // ms - grace period after leaving platform
  JUMP_BUFFER: 100,         // ms - queue jump before landing
  JUMP_CUT_MULTIPLIER: 0.5, // release early = shorter jump

  // Climbing
  CLIMB_SPEED: 100,
  CLIMB_SNAP_DISTANCE: 30,
} as const;

// Physics
export const PHYSICS = {
  GRAVITY: 1200,
} as const;

// Colors for placeholder graphics
export const COLORS = {
  PLAYER: 0x4a90d9,
  PLATFORM: 0x8b4513,
  GROUND: 0x228b22,
  MONSTER: 0xff4444,
  LADDER: 0x8b4513,
  ROPE: 0xd2691e,
} as const;

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  GAME: 'GameScene',
  UI: 'UIScene',
} as const;

// Animation frame rates
export const ANIM = {
  IDLE_FPS: 2,
  WALK_FPS: 8,
  JUMP_FPS: 6,
  FALL_FPS: 6,
  ATTACK_FPS: 12,
  CLIMB_FPS: 6,
} as const;

// Player states
export type PlayerState =
  | 'IDLE'
  | 'WALK'
  | 'JUMP'
  | 'FALL'
  | 'ATTACK'
  | 'CLIMB_IDLE'
  | 'CLIMB_UP'
  | 'CLIMB_DOWN';
