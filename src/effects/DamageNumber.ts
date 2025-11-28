import Phaser from 'phaser';

export const DamageType = {
  NORMAL: 'normal',
  CRITICAL: 'critical',
  PLAYER_DAMAGE: 'player'
} as const;

export type DamageType = typeof DamageType[keyof typeof DamageType];

export class DamageNumber extends Phaser.GameObjects.Text {
  private velocity: Phaser.Math.Vector2;
  private lifespan: number = 0;
  private maxLifespan: number = 1000;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setDepth(1000);
    this.velocity = new Phaser.Math.Vector2();
    this.setActive(false);
    this.setVisible(false);
  }

  spawn(x: number, y: number, damage: number, type: DamageType): void {
    this.x = x + Phaser.Math.Between(-10, 10);
    this.y = y;

    this.setText(Math.floor(damage).toString());

    switch (type) {
      case DamageType.CRITICAL:
        this.setColor('#ffff00');
        this.setFontSize(20);
        this.setScale(1.2);
        break;
      case DamageType.PLAYER_DAMAGE:
        this.setColor('#ff4444');
        this.setFontSize(16);
        this.setScale(1.0);
        break;
      case DamageType.NORMAL:
      default:
        this.setColor('#ffffff');
        this.setFontSize(16);
        this.setScale(1.0);
        break;
    }

    if (damage > 1000) {
      this.setFontSize(parseInt(this.style.fontSize as string) + 4);
    }
    if (damage > 10000) {
      this.setFontSize(parseInt(this.style.fontSize as string) + 4);
    }

    const angle = Phaser.Math.DegToRad(-90 + Phaser.Math.Between(-15, 15));
    this.velocity.set(Math.cos(angle) * 30, Math.sin(angle) * 80);

    this.lifespan = 0;
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
  }

  update(delta: number): void {
    if (!this.active) return;

    this.lifespan += delta;

    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);

    this.velocity.y += 120 * (delta / 1000);
    this.velocity.x *= 0.95;

    const fadeStart = this.maxLifespan * 0.5;
    if (this.lifespan > fadeStart) {
      const fadeProgress = (this.lifespan - fadeStart) / (this.maxLifespan - fadeStart);
      this.setAlpha(1 - fadeProgress);
    }

    if (this.lifespan >= this.maxLifespan) {
      this.setActive(false);
      this.setVisible(false);
    }
  }

  reset(): void {
    this.lifespan = 0;
    this.velocity.set(0, 0);
    this.setAlpha(1);
    this.setScale(1);
  }
}
