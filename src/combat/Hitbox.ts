import Phaser from 'phaser';

export interface HitboxConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  knockback: { x: number; y: number };
  owner: Phaser.GameObjects.GameObject;
  duration?: number;
  element?: 'physical' | 'fire' | 'ice' | 'lightning';
  skillMultiplier?: number;
}

export class Hitbox extends Phaser.GameObjects.Zone {
  public damage: number;
  public knockback: { x: number; y: number };
  public owner: Phaser.GameObjects.GameObject;
  public element: 'physical' | 'fire' | 'ice' | 'lightning';
  public skillMultiplier: number;

  private duration: number;
  private framesActive: number = 0;
  private hitTargets: Set<Phaser.GameObjects.GameObject> = new Set();

  constructor(config: HitboxConfig) {
    super(config.scene, config.x, config.y, config.width, config.height);

    this.damage = config.damage;
    this.knockback = config.knockback;
    this.owner = config.owner;
    this.duration = config.duration ?? 1;
    this.element = config.element ?? 'physical';
    this.skillMultiplier = config.skillMultiplier ?? 1.0;

    this.scene.add.existing(this);
    this.setActive(true);
  }

  public update(): boolean {
    this.framesActive++;

    if (this.framesActive >= this.duration) {
      this.deactivate();
      return false;
    }

    return true;
  }

  public hasHit(target: Phaser.GameObjects.GameObject): boolean {
    return this.hitTargets.has(target);
  }

  public registerHit(target: Phaser.GameObjects.GameObject): void {
    this.hitTargets.add(target);
  }

  public getHitboxBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  public deactivate(): void {
    this.setActive(false);
    this.hitTargets.clear();
    this.framesActive = 0;
  }

  public reactivate(config: Partial<HitboxConfig>): void {
    if (config.x !== undefined) this.x = config.x;
    if (config.y !== undefined) this.y = config.y;
    if (config.width !== undefined) this.width = config.width;
    if (config.height !== undefined) this.height = config.height;
    if (config.damage !== undefined) this.damage = config.damage;
    if (config.knockback !== undefined) this.knockback = config.knockback;
    if (config.owner !== undefined) this.owner = config.owner;
    if (config.duration !== undefined) this.duration = config.duration;
    if (config.element !== undefined) this.element = config.element;
    if (config.skillMultiplier !== undefined) this.skillMultiplier = config.skillMultiplier;

    this.framesActive = 0;
    this.hitTargets.clear();
    this.setActive(true);
  }
}
