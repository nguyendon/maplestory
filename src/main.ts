import Phaser from 'phaser';
import { gameConfig } from './config/game.config';

// Initialize the game
const game = new Phaser.Game(gameConfig);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export default game;
