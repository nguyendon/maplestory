import Phaser from 'phaser';
import { COLORS } from '../config/constants';

export type LadderType = 'ladder' | 'rope';

export interface LadderConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  height: number;
  type?: LadderType;
  width?: number;
}

/**
 * Ladder/Rope entity for climbing mechanics
 * Acts as a trigger zone (non-solid) that players can grab and climb
 */
export class Ladder extends Phaser.Physics.Arcade.Sprite {
  public ladderType: LadderType;
  public ladderHeight: number;
  public ladderWidth: number;

  private topY: number;
  private bottomY: number;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(config: LadderConfig) {
    const { scene, x, y, height, type = 'ladder', width = 20 } = config;

    super(scene, x, y, '__DEFAULT');

    this.ladderType = type;
    this.ladderHeight = height;
    this.ladderWidth = width;

    // Calculate bounds (y is center)
    this.topY = y - height / 2;
    this.bottomY = y + height / 2;

    // Add to scene with static physics body
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Configure as trigger zone
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(width, height);

    // Make sprite invisible (we draw our own graphics)
    this.setVisible(false);

    // Draw visual
    this.graphics = scene.add.graphics();
    this.drawLadder();
  }

  public isWithinRange(y: number): boolean {
    return y >= this.topY && y <= this.bottomY;
  }

  public getTopY(): number {
    return this.topY;
  }

  public getBottomY(): number {
    return this.bottomY;
  }

  public getCenterX(): number {
    return this.x;
  }

  private drawLadder(): void {
    if (this.ladderType === 'ladder') {
      // Brown ladder with rungs
      this.graphics.lineStyle(2, COLORS.LADDER, 1);

      // Side rails
      this.graphics.strokeRect(
        this.x - this.ladderWidth / 2,
        this.topY,
        2,
        this.ladderHeight
      );
      this.graphics.strokeRect(
        this.x + this.ladderWidth / 2 - 2,
        this.topY,
        2,
        this.ladderHeight
      );

      // Rungs every 16 pixels
      for (let y = this.topY; y <= this.bottomY; y += 16) {
        this.graphics.strokeRect(
          this.x - this.ladderWidth / 2,
          y,
          this.ladderWidth,
          2
        );
      }
    } else {
      // Rope with knots
      this.graphics.lineStyle(3, COLORS.ROPE, 1);
      this.graphics.strokeRect(this.x - 1.5, this.topY, 3, this.ladderHeight);

      // Knots every 24 pixels
      this.graphics.fillStyle(COLORS.LADDER, 1);
      for (let y = this.topY; y <= this.bottomY; y += 24) {
        this.graphics.fillCircle(this.x, y, 4);
      }
    }
  }

  destroy(fromScene?: boolean): void {
    this.graphics.destroy();
    super.destroy(fromScene);
  }
}
