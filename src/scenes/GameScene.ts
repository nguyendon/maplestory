import Phaser from 'phaser';
import { SCENES, GAME_WIDTH } from '../config/constants';
import { Player } from '../entities/Player';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.GAME });
  }

  create(): void {
    // Create platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.platforms.create(400, 568, 'ground') as Phaser.Physics.Arcade.Sprite;
    ground.setScale(1).refreshBody();

    // Floating platforms (MapleStory style layout)
    this.platforms.create(600, 450, 'platform');
    this.platforms.create(50, 380, 'platform');
    this.platforms.create(400, 320, 'platform');
    this.platforms.create(750, 250, 'platform');
    this.platforms.create(200, 200, 'platform');
    this.platforms.create(500, 150, 'platform');

    // Create player
    this.player = new Player(this, 100, 450);

    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);

    // Add some visual flair - simple parallax background
    this.createBackground();

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      font: '14px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 5 },
    });

    // Instructions
    this.add.text(10, 560, 'Arrow keys to move, Space to jump (double jump enabled!)', {
      font: '12px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 3 },
    });
  }

  update(): void {
    this.player.update();

    // Update debug info
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.debugText.setText([
      `Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      `Velocity: (${Math.round(body.velocity.x)}, ${Math.round(body.velocity.y)})`,
      `On Ground: ${body.blocked.down || body.touching.down}`,
    ]);
  }

  private createBackground(): void {
    // Simple gradient-like background using rectangles
    const graphics = this.add.graphics();

    // Sky gradient (darker at top, lighter at bottom)
    graphics.fillStyle(0x1e90ff, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, 200);
    graphics.fillStyle(0x87ceeb, 1);
    graphics.fillRect(0, 200, GAME_WIDTH, 200);
    graphics.fillStyle(0xb0e0e6, 1);
    graphics.fillRect(0, 400, GAME_WIDTH, 136);

    // Some decorative clouds
    graphics.fillStyle(0xffffff, 0.8);
    this.drawCloud(graphics, 100, 80, 60);
    this.drawCloud(graphics, 300, 120, 80);
    this.drawCloud(graphics, 550, 60, 70);
    this.drawCloud(graphics, 700, 140, 50);

    // Send background to back
    graphics.setDepth(-1);
  }

  private drawCloud(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.fillCircle(x, y, size * 0.5);
    graphics.fillCircle(x + size * 0.4, y - size * 0.1, size * 0.4);
    graphics.fillCircle(x + size * 0.8, y, size * 0.35);
    graphics.fillCircle(x + size * 0.3, y + size * 0.2, size * 0.3);
  }
}
