import Phaser from 'phaser';
import { SCENES, COLORS, PLAYER } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate placeholder graphics as textures
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start(SCENES.GAME);
  }

  private createPlaceholderTextures(): void {
    // Player texture (blue rectangle)
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(COLORS.PLAYER);
    playerGraphics.fillRect(0, 0, PLAYER.WIDTH, PLAYER.HEIGHT);
    playerGraphics.generateTexture('player', PLAYER.WIDTH, PLAYER.HEIGHT);
    playerGraphics.destroy();

    // Platform texture (brown rectangle)
    const platformGraphics = this.make.graphics({ x: 0, y: 0 });
    platformGraphics.fillStyle(COLORS.PLATFORM);
    platformGraphics.fillRect(0, 0, 200, 32);
    platformGraphics.generateTexture('platform', 200, 32);
    platformGraphics.destroy();

    // Ground texture (green rectangle)
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(COLORS.GROUND);
    groundGraphics.fillRect(0, 0, 800, 64);
    groundGraphics.generateTexture('ground', 800, 64);
    groundGraphics.destroy();

    // Monster texture (red rectangle)
    const monsterGraphics = this.make.graphics({ x: 0, y: 0 });
    monsterGraphics.fillStyle(COLORS.MONSTER);
    monsterGraphics.fillRect(0, 0, 40, 40);
    monsterGraphics.generateTexture('monster', 40, 40);
    monsterGraphics.destroy();
  }
}
