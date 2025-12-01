import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import UIScene from '../scenes/UIScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#87CEEB', // Sky blue
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false, // Set to true for debugging
    },
  },
  scene: [BootScene, GameScene, UIScene],
  // Disable pixelArt mode for crisp UI text and graphics
  // Sprites will still render fine, just with linear filtering
  pixelArt: false,
  roundPixels: false,
  antialias: true,
};
