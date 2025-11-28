import Phaser from 'phaser';

export const HitEffectType = {
  PHYSICAL: 'physical',
  MAGIC: 'magic'
} as const;

export type HitEffectType = typeof HitEffectType[keyof typeof HitEffectType];

export class HitEffect extends Phaser.GameObjects.Sprite {
  private lifespan: number = 0;
  private maxLifespan: number = 300;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'hit-effect-physical');

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setDepth(999);
    this.setActive(false);
    this.setVisible(false);
  }

  spawn(x: number, y: number, type: HitEffectType): void {
    this.x = x;
    this.y = y;
    this.lifespan = 0;

    if (type === HitEffectType.PHYSICAL) {
      this.setTexture('hit-effect-physical');
      this.setTint(0xffffff);
    } else {
      this.setTexture('hit-effect-magic');
      this.setTint(0x88ccff);
    }

    this.setScale(0.5);
    this.setAlpha(1);
    this.setAngle(Phaser.Math.Between(0, 360));

    this.setActive(true);
    this.setVisible(true);

    const animKey = type === HitEffectType.PHYSICAL ? 'hit-physical' : 'hit-magic';
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
    }
  }

  update(delta: number): void {
    if (!this.active) return;

    this.lifespan += delta;

    const progress = this.lifespan / this.maxLifespan;
    this.setScale(0.5 + progress * 0.5);
    this.setAlpha(1 - progress);

    if (this.lifespan >= this.maxLifespan) {
      this.setActive(false);
      this.setVisible(false);
    }
  }

  reset(): void {
    this.lifespan = 0;
    this.setScale(1);
    this.setAlpha(1);
    this.setAngle(0);
    this.clearTint();
    if (this.anims) {
      this.stop();
    }
  }
}
