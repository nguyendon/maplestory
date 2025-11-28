import Phaser from 'phaser';
import { Hitbox } from './Hitbox';
import type { HitboxConfig } from './Hitbox';
import { Hurtbox } from './Hurtbox';
import { DamageCalculator } from './DamageCalculator';
import type { EntityStats } from './DamageCalculator';
import { COMBAT } from '../config/constants';

export class CombatManager {
  private scene: Phaser.Scene;
  private hitboxes: Set<Hitbox> = new Set();
  private hurtboxes: Set<Hurtbox> = new Set();
  private hitboxPool: Hitbox[] = [];
  private damageCalculator: DamageCalculator;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.damageCalculator = new DamageCalculator();
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < COMBAT.HITBOX_POOL_SIZE; i++) {
      const hitbox = new Hitbox({
        scene: this.scene,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        damage: 0,
        knockback: { x: 0, y: 0 },
        owner: this.scene.add.rectangle(0, 0, 1, 1) as Phaser.GameObjects.GameObject,
        duration: 1,
      });
      hitbox.setActive(false);
      this.hitboxPool.push(hitbox);
    }
  }

  public createHitbox(config: HitboxConfig): Hitbox | null {
    const pooledHitbox = this.hitboxPool.find(hb => !hb.active);

    if (pooledHitbox) {
      pooledHitbox.reactivate(config);
      this.hitboxes.add(pooledHitbox);
      return pooledHitbox;
    }

    console.warn('Hitbox pool exhausted, creating new hitbox');
    const hitbox = new Hitbox(config);
    this.hitboxes.add(hitbox);
    return hitbox;
  }

  public registerHurtbox(hurtbox: Hurtbox): void {
    this.hurtboxes.add(hurtbox);
  }

  public unregisterHurtbox(hurtbox: Hurtbox): void {
    this.hurtboxes.delete(hurtbox);
  }

  public update(): void {
    this.hurtboxes.forEach(hurtbox => {
      hurtbox.update();
    });

    const hitboxesToRemove: Hitbox[] = [];

    this.hitboxes.forEach(hitbox => {
      const stillActive = hitbox.update();

      if (!stillActive) {
        hitboxesToRemove.push(hitbox);
        return;
      }

      this.hurtboxes.forEach(hurtbox => {
        if (hitbox.owner === hurtbox.owner) return;
        if (hitbox.hasHit(hurtbox.owner)) return;
        if (hurtbox.isInvincible()) return;

        if (this.checkCollision(hitbox, hurtbox)) {
          this.handleHit(hitbox, hurtbox);
        }
      });
    });

    hitboxesToRemove.forEach(hitbox => {
      this.hitboxes.delete(hitbox);
    });
  }

  private checkCollision(hitbox: Hitbox, hurtbox: Hurtbox): boolean {
    const hitBounds = hitbox.getHitboxBounds();
    const hurtBounds = hurtbox.getHurtboxBounds();
    return Phaser.Geom.Rectangle.Overlaps(hitBounds, hurtBounds);
  }

  private handleHit(hitbox: Hitbox, hurtbox: Hurtbox): void {
    hitbox.registerHit(hurtbox.owner);

    const attackerStats = this.getEntityStats(hitbox.owner);
    const defenderStats = this.getEntityStats(hurtbox.owner);

    const damageCalc = this.damageCalculator.calculateDamage(
      attackerStats,
      defenderStats,
      hitbox.skillMultiplier,
      hitbox.element === 'physical' ? 'physical' : 'magic'
    );

    hurtbox.takeDamage(damageCalc.damage, hitbox.knockback, damageCalc.isCritical);
    hurtbox.applyInvincibility(COMBAT.INVINCIBILITY_FRAMES);

    this.scene.events.emit('combat:hit', {
      attacker: hitbox.owner,
      defender: hurtbox.owner,
      damage: damageCalc.damage,
      isCritical: damageCalc.isCritical,
      knockback: hitbox.knockback,
      element: hitbox.element,
      position: { x: hurtbox.x, y: hurtbox.y },
    });
  }

  private getEntityStats(entity: Phaser.GameObjects.GameObject): EntityStats {
    const entityWithStats = entity as { stats?: EntityStats };

    if (entityWithStats.stats) {
      return entityWithStats.stats;
    }

    return COMBAT.DEFAULT_STATS;
  }

  public destroy(): void {
    this.hitboxes.forEach(hitbox => hitbox.destroy());
    this.hurtboxes.forEach(hurtbox => hurtbox.destroy());
    this.hitboxPool.forEach(hitbox => hitbox.destroy());

    this.hitboxes.clear();
    this.hurtboxes.clear();
    this.hitboxPool = [];
  }
}
