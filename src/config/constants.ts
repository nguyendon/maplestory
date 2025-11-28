// Game dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Player constants
export const PLAYER = {
  SPEED: 160,
  JUMP_VELOCITY: -400,
  WIDTH: 32,
  HEIGHT: 48,
} as const;

// Colors for placeholder graphics
export const COLORS = {
  PLAYER: 0x4a90d9,
  PLATFORM: 0x8b4513,
  GROUND: 0x228b22,
  MONSTER: 0xff4444,
} as const;

// Scene keys
export const SCENES = {
  BOOT: 'BootScene',
  GAME: 'GameScene',
  UI: 'UIScene',
} as const;
