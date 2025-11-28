import Phaser from 'phaser';

export interface HurtboxConfig {
  scene: Phaser.Scene;
  owner: Phaser.GameObjects.GameObject;
  x: number;
  y: number;
  width: number;
  height: number;
  onHit?: (damage: number, knockback: { x: number; y: number }, isCritical: boolean) => void;
}

export class Hurtbox extends Phaser.GameObjects.Zone {
  public owner: Phaser.GameObjects.GameObject;
  public onHit?: (damage: number, knockback: { x: number; y: number }, isCritical: boolean) => void;

  private invincibilityFrames: number = 0;
  private maxInvincibilityFrames: number = 0;

  constructor(config: HurtboxConfig) {
    super(config.scene, config.x, config.y, config.width, config.height);

    this.owner = config.owner;
    this.onHit = config.onHit;

    this.scene.add.existing(this);
    this.setActive(true);
  }

  public update(): void {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
  }

  public isInvincible(): boolean {
    return this.invincibilityFrames > 0;
  }

  public applyInvincibility(frames: number): void {
    this.invincibilityFrames = frames;
    this.maxInvincibilityFrames = frames;
  }

  public getInvincibilityProgress(): number {
    if (this.maxInvincibilityFrames === 0) return 0;
    return this.invincibilityFrames / this.maxInvincibilityFrames;
  }

  public getHurtboxBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  public takeDamage(damage: number, knockback: { x: number; y: number }, isCritical: boolean): void {
    if (this.isInvincible()) return;

    if (this.onHit) {
      this.onHit(damage, knockback, isCritical);
    }
  }

  public reset(): void {
    this.invincibilityFrames = 0;
    this.maxInvincibilityFrames = 0;
  }
}
