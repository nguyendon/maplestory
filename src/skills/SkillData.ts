/**
 * Skill System Data Definitions
 */

export const SkillType = {
  ATTACK: 'attack',
  BUFF: 'buff',
  PASSIVE: 'passive'
} as const;
export type SkillType = typeof SkillType[keyof typeof SkillType];

export const DamageType = {
  PHYSICAL: 'physical',
  MAGICAL: 'magical'
} as const;
export type DamageType = typeof DamageType[keyof typeof DamageType];

export const TargetType = {
  SINGLE: 'single',
  AOE: 'aoe',
  SELF: 'self'
} as const;
export type TargetType = typeof TargetType[keyof typeof TargetType];

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff';
  value: number;
  duration?: number; // For buffs/debuffs, in milliseconds
  stat?: string; // For buffs, which stat to modify
}

export interface SkillHitbox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  damageType: DamageType;
  targetType: TargetType;
  mpCost: number;
  cooldown: number; // In milliseconds
  damage: number; // Base damage multiplier (100 = 100% of ATK)
  maxTargets: number;
  hitbox: SkillHitbox;
  knockback: { x: number; y: number };
  requiredLevel: number;
  animation: string;
  effectColor: number;
}

// Warrior Skills
export const SKILLS: Record<string, SkillDefinition> = {
  POWER_STRIKE: {
    id: 'POWER_STRIKE',
    name: 'Power Strike',
    description: 'A powerful single-target attack.',
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SINGLE,
    mpCost: 8,
    cooldown: 500,
    damage: 180,
    maxTargets: 1,
    hitbox: { width: 80, height: 60, offsetX: 50, offsetY: 0 },
    knockback: { x: 150, y: -100 },
    requiredLevel: 1,
    animation: 'slash',
    effectColor: 0xff6600
  },
  SLASH_BLAST: {
    id: 'SLASH_BLAST',
    name: 'Slash Blast',
    description: 'Slash multiple enemies in front of you.',
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 15,
    cooldown: 800,
    damage: 140,
    maxTargets: 4,
    hitbox: { width: 150, height: 80, offsetX: 60, offsetY: 0 },
    knockback: { x: 100, y: -80 },
    requiredLevel: 1,
    animation: 'wide_slash',
    effectColor: 0xff4444
  },
  RAGE: {
    id: 'RAGE',
    name: 'Rage',
    description: 'Increase attack power temporarily.',
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 20,
    cooldown: 30000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 1,
    animation: 'buff',
    effectColor: 0xff0000
  },
  DOUBLE_STRIKE: {
    id: 'DOUBLE_STRIKE',
    name: 'Double Strike',
    description: 'Strike twice in rapid succession.',
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SINGLE,
    mpCost: 12,
    cooldown: 600,
    damage: 120, // Per hit, hits twice
    maxTargets: 2,
    hitbox: { width: 70, height: 50, offsetX: 45, offsetY: 0 },
    knockback: { x: 80, y: -50 },
    requiredLevel: 1,
    animation: 'double_slash',
    effectColor: 0xffaa00
  }
};

export function getSkill(id: string): SkillDefinition | undefined {
  return SKILLS[id];
}

export function getSkillsForLevel(level: number): SkillDefinition[] {
  return Object.values(SKILLS).filter(skill => skill.requiredLevel <= level);
}
