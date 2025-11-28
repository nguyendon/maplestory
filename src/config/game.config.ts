import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#87CEEB', // Sky blue
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: true, // Set to false in production
    },
  },
  scene: [BootScene, GameScene],
  pixelArt: true,
  roundPixels: true,
};
