import { COMBAT } from '../config/constants';

export interface EntityStats {
  STR: number;
  DEX: number;
  INT: number;
  LUK: number;
  ATK: number;
  MATK: number;
  DEF: number;
  critChance: number;
  critMultiplier: number;
}

export interface DamageCalculation {
  damage: number;
  isCritical: boolean;
}

export class DamageCalculator {
  /**
   * Calculate damage using MapleStory-style formula
   *
   * Physical: (STR * 0.9 + DEX * 0.1) * (ATK / 100) * skillMultiplier * random(0.85, 1.0)
   * Magic: (INT * 0.9 + LUK * 0.1) * (MATK / 100) * skillMultiplier * random(0.85, 1.0)
   * Defense reduction: damage * (1 - DEF / (DEF + 100))
   */
  public calculateDamage(
    attacker: EntityStats,
    defender: EntityStats,
    skillMultiplier: number = 1.0,
    damageType: 'physical' | 'magic' = 'physical'
  ): DamageCalculation {
    let baseDamage: number;

    if (damageType === 'physical') {
      const statValue = (attacker.STR * 0.9) + (attacker.DEX * 0.1);
      baseDamage = statValue * (attacker.ATK / 100) * skillMultiplier;
    } else {
      const statValue = (attacker.INT * 0.9) + (attacker.LUK * 0.1);
      baseDamage = statValue * (attacker.MATK / 100) * skillMultiplier;
    }

    // Apply variance (85% - 100%)
    const variance = COMBAT.DAMAGE_VARIANCE.MIN + Math.random() * (COMBAT.DAMAGE_VARIANCE.MAX - COMBAT.DAMAGE_VARIANCE.MIN);
    baseDamage *= variance;

    // Check for critical hit
    const isCritical = Math.random() < attacker.critChance;
    if (isCritical) {
      baseDamage *= attacker.critMultiplier;
    }

    // Apply defense reduction
    const defenseReduction = 1 - (defender.DEF / (defender.DEF + COMBAT.DEF_CONSTANT));
    const finalDamage = Math.floor(baseDamage * defenseReduction);

    return {
      damage: Math.max(1, finalDamage),
      isCritical,
    };
  }

  public calculateKnockback(
    baseKnockback: { x: number; y: number },
    damageDealt: number,
    knockbackScale: number = 1.0
  ): { x: number; y: number } {
    const damageScale = 1 + (damageDealt / 1000);

    return {
      x: baseKnockback.x * knockbackScale * damageScale,
      y: baseKnockback.y * knockbackScale * damageScale,
    };
  }

  public getElementalModifier(
    attackElement: 'physical' | 'fire' | 'ice' | 'lightning',
    defenseElement?: 'physical' | 'fire' | 'ice' | 'lightning'
  ): number {
    if (!defenseElement || attackElement === 'physical') return 1.0;

    const weaknesses: Record<string, string> = {
      fire: 'ice',
      ice: 'lightning',
      lightning: 'fire',
    };

    if (weaknesses[attackElement] === defenseElement) {
      return 1.5;
    }

    if (weaknesses[defenseElement] === attackElement) {
      return 0.75;
    }

    return 1.0;
  }
}
