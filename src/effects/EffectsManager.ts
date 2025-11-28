import Phaser from 'phaser';
import { ObjectPool } from './ObjectPool';
import { DamageNumber, DamageType } from './DamageNumber';
import { HitEffect, HitEffectType } from './HitEffect';

export class EffectsManager {
  private damageNumberPool: ObjectPool<DamageNumber>;
  private hitEffectPool: ObjectPool<HitEffect>;

  private activeDamageNumbers: DamageNumber[] = [];
  private activeHitEffects: HitEffect[] = [];

  constructor(scene: Phaser.Scene) {

    this.damageNumberPool = new ObjectPool<DamageNumber>(
      scene,
      () => new DamageNumber(scene),
      {
        onAcquire: (obj) => {
          this.activeDamageNumbers.push(obj);
        },
        onRelease: (obj) => {
          obj.reset();
          const index = this.activeDamageNumbers.indexOf(obj);
          if (index > -1) {
            this.activeDamageNumbers.splice(index, 1);
          }
        }
      }
    );

    this.hitEffectPool = new ObjectPool<HitEffect>(
      scene,
      () => new HitEffect(scene),
      {
        onAcquire: (obj) => {
          this.activeHitEffects.push(obj);
        },
        onRelease: (obj) => {
          obj.reset();
          const index = this.activeHitEffects.indexOf(obj);
          if (index > -1) {
            this.activeHitEffects.splice(index, 1);
          }
        }
      }
    );

    this.damageNumberPool.preWarm(20);
    this.hitEffectPool.preWarm(10);
  }

  showDamage(x: number, y: number, damage: number, isCritical: boolean = false): void {
    const damageNumber = this.damageNumberPool.get();
    const type = isCritical ? DamageType.CRITICAL : DamageType.NORMAL;
    damageNumber.spawn(x, y, damage, type);
  }

  showPlayerDamage(x: number, y: number, damage: number): void {
    const damageNumber = this.damageNumberPool.get();
    damageNumber.spawn(x, y, damage, DamageType.PLAYER_DAMAGE);
  }

  showHitEffect(x: number, y: number, type: HitEffectType = HitEffectType.PHYSICAL): void {
    const hitEffect = this.hitEffectPool.get();
    hitEffect.spawn(x, y, type);
  }

  update(delta: number): void {
    for (let i = this.activeDamageNumbers.length - 1; i >= 0; i--) {
      const damageNumber = this.activeDamageNumbers[i];
      damageNumber.update(delta);

      if (!damageNumber.active) {
        this.damageNumberPool.release(damageNumber);
      }
    }

    for (let i = this.activeHitEffects.length - 1; i >= 0; i--) {
      const hitEffect = this.activeHitEffects[i];
      hitEffect.update(delta);

      if (!hitEffect.active) {
        this.hitEffectPool.release(hitEffect);
      }
    }
  }

  getStats(): {
    damageNumbers: { available: number; active: number; total: number };
    hitEffects: { available: number; active: number; total: number };
  } {
    return {
      damageNumbers: this.damageNumberPool.getStats(),
      hitEffects: this.hitEffectPool.getStats()
    };
  }

  destroy(): void {
    this.damageNumberPool.destroy();
    this.hitEffectPool.destroy();
    this.activeDamageNumbers = [];
    this.activeHitEffects = [];
  }
}
