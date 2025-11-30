/**
 * Skill System Data Definitions
 */

import { JobId } from '../systems/JobData';

export const SkillType = {
  ATTACK: 'attack',
  BUFF: 'buff',
  PASSIVE: 'passive',
  MOBILITY: 'mobility'
} as const;
export type SkillType = typeof SkillType[keyof typeof SkillType];

export const DamageType = {
  PHYSICAL: 'physical',
  MAGICAL: 'magical',
  TRUE: 'true' // Ignores defense
} as const;
export type DamageType = typeof DamageType[keyof typeof DamageType];

export const TargetType = {
  SINGLE: 'single',
  AOE: 'aoe',
  SELF: 'self',
  LINE: 'line' // Projectile that travels
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
  job: JobId; // Which job this skill belongs to
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
  projectileSpeed?: number; // For ranged skills
  buffDuration?: number; // For buff skills, in ms
  buffEffect?: { stat: string; value: number }; // What the buff modifies
}

// ============================================
// WARRIOR SKILLS
// ============================================
export const SKILLS: Record<string, SkillDefinition> = {
  // Warrior - Attack Skills
  POWER_STRIKE: {
    id: 'POWER_STRIKE',
    name: 'Power Strike',
    description: 'A powerful single-target attack.',
    job: JobId.WARRIOR,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SINGLE,
    mpCost: 8,
    cooldown: 500,
    damage: 200,
    maxTargets: 1,
    hitbox: { width: 80, height: 60, offsetX: 50, offsetY: 0 },
    knockback: { x: 150, y: -100 },
    requiredLevel: 10,
    animation: 'slash',
    effectColor: 0xff6600
  },
  SLASH_BLAST: {
    id: 'SLASH_BLAST',
    name: 'Slash Blast',
    description: 'Slash multiple enemies in front of you.',
    job: JobId.WARRIOR,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 15,
    cooldown: 800,
    damage: 150,
    maxTargets: 6,
    hitbox: { width: 150, height: 80, offsetX: 60, offsetY: 0 },
    knockback: { x: 100, y: -80 },
    requiredLevel: 10,
    animation: 'wide_slash',
    effectColor: 0xff4444
  },
  GROUND_SMASH: {
    id: 'GROUND_SMASH',
    name: 'Ground Smash',
    description: 'Slam the ground, hitting all nearby enemies.',
    job: JobId.WARRIOR,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 25,
    cooldown: 1200,
    damage: 250,
    maxTargets: 8,
    hitbox: { width: 200, height: 100, offsetX: 0, offsetY: 20 },
    knockback: { x: 50, y: -200 },
    requiredLevel: 15,
    animation: 'smash',
    effectColor: 0xcc4400
  },
  // Warrior - Buff Skills
  RAGE: {
    id: 'RAGE',
    name: 'Rage',
    description: 'Increase attack power by 20% for 60 seconds.',
    job: JobId.WARRIOR,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 20,
    cooldown: 60000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 10,
    animation: 'buff',
    effectColor: 0xff0000,
    buffDuration: 60000,
    buffEffect: { stat: 'ATK', value: 20 }
  },
  IRON_BODY: {
    id: 'IRON_BODY',
    name: 'Iron Body',
    description: 'Increase defense by 30% for 60 seconds.',
    job: JobId.WARRIOR,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 15,
    cooldown: 60000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 12,
    animation: 'buff',
    effectColor: 0x888888,
    buffDuration: 60000,
    buffEffect: { stat: 'DEF', value: 30 }
  },

  // ============================================
  // MAGE SKILLS
  // ============================================
  MAGIC_BOLT: {
    id: 'MAGIC_BOLT',
    name: 'Magic Bolt',
    description: 'Fire a bolt of pure magic energy.',
    job: JobId.MAGE,
    type: SkillType.ATTACK,
    damageType: DamageType.MAGICAL,
    targetType: TargetType.LINE,
    mpCost: 10,
    cooldown: 400,
    damage: 180,
    maxTargets: 1,
    hitbox: { width: 30, height: 30, offsetX: 0, offsetY: 0 },
    knockback: { x: 50, y: 0 },
    requiredLevel: 10,
    animation: 'magic_bolt',
    effectColor: 0x9966ff,
    projectileSpeed: 600
  },
  FIRE_ARROW: {
    id: 'FIRE_ARROW',
    name: 'Fire Arrow',
    description: 'Launch a blazing arrow that burns enemies.',
    job: JobId.MAGE,
    type: SkillType.ATTACK,
    damageType: DamageType.MAGICAL,
    targetType: TargetType.LINE,
    mpCost: 18,
    cooldown: 600,
    damage: 250,
    maxTargets: 3,
    hitbox: { width: 40, height: 40, offsetX: 0, offsetY: 0 },
    knockback: { x: 80, y: -50 },
    requiredLevel: 12,
    animation: 'fire_arrow',
    effectColor: 0xff4400,
    projectileSpeed: 500
  },
  ICE_BEAM: {
    id: 'ICE_BEAM',
    name: 'Ice Beam',
    description: 'Freeze enemies with a beam of ice.',
    job: JobId.MAGE,
    type: SkillType.ATTACK,
    damageType: DamageType.MAGICAL,
    targetType: TargetType.LINE,
    mpCost: 22,
    cooldown: 800,
    damage: 220,
    maxTargets: 4,
    hitbox: { width: 200, height: 50, offsetX: 100, offsetY: 0 },
    knockback: { x: 30, y: 0 },
    requiredLevel: 15,
    animation: 'ice_beam',
    effectColor: 0x66ccff,
    projectileSpeed: 800
  },
  TELEPORT: {
    id: 'TELEPORT',
    name: 'Teleport',
    description: 'Instantly teleport a short distance.',
    job: JobId.MAGE,
    type: SkillType.MOBILITY,
    damageType: DamageType.MAGICAL,
    targetType: TargetType.SELF,
    mpCost: 12,
    cooldown: 500,
    damage: 0,
    maxTargets: 0,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 10,
    animation: 'teleport',
    effectColor: 0xcc66ff
  },
  MAGIC_GUARD: {
    id: 'MAGIC_GUARD',
    name: 'Magic Guard',
    description: 'Absorb damage with MP instead of HP.',
    job: JobId.MAGE,
    type: SkillType.BUFF,
    damageType: DamageType.MAGICAL,
    targetType: TargetType.SELF,
    mpCost: 5,
    cooldown: 120000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 10,
    animation: 'buff',
    effectColor: 0x6699ff,
    buffDuration: 120000,
    buffEffect: { stat: 'MAGIC_GUARD', value: 50 }
  },

  // ============================================
  // ARCHER SKILLS
  // ============================================
  DOUBLE_SHOT: {
    id: 'DOUBLE_SHOT',
    name: 'Double Shot',
    description: 'Fire two arrows in quick succession.',
    job: JobId.ARCHER,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.LINE,
    mpCost: 8,
    cooldown: 400,
    damage: 130,
    maxTargets: 2,
    hitbox: { width: 25, height: 20, offsetX: 0, offsetY: 0 },
    knockback: { x: 40, y: -20 },
    requiredLevel: 10,
    animation: 'arrow',
    effectColor: 0x66cc66,
    projectileSpeed: 700
  },
  ARROW_BOMB: {
    id: 'ARROW_BOMB',
    name: 'Arrow Bomb',
    description: 'Fire an explosive arrow that damages multiple enemies.',
    job: JobId.ARCHER,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 20,
    cooldown: 1000,
    damage: 200,
    maxTargets: 6,
    hitbox: { width: 120, height: 120, offsetX: 150, offsetY: 0 },
    knockback: { x: 100, y: -150 },
    requiredLevel: 15,
    animation: 'arrow_bomb',
    effectColor: 0xff9900,
    projectileSpeed: 500
  },
  ARROW_RAIN: {
    id: 'ARROW_RAIN',
    name: 'Arrow Rain',
    description: 'Call down a rain of arrows on enemies.',
    job: JobId.ARCHER,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 30,
    cooldown: 1500,
    damage: 180,
    maxTargets: 8,
    hitbox: { width: 250, height: 150, offsetX: 125, offsetY: -50 },
    knockback: { x: 20, y: 50 },
    requiredLevel: 18,
    animation: 'arrow_rain',
    effectColor: 0x44aa44
  },
  SOUL_ARROW: {
    id: 'SOUL_ARROW',
    name: 'Soul Arrow',
    description: 'Increase arrow damage by 15% for 90 seconds.',
    job: JobId.ARCHER,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 15,
    cooldown: 90000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 10,
    animation: 'buff',
    effectColor: 0x88ff88,
    buffDuration: 90000,
    buffEffect: { stat: 'ATK', value: 15 }
  },
  FOCUS: {
    id: 'FOCUS',
    name: 'Focus',
    description: 'Increase accuracy and critical rate.',
    job: JobId.ARCHER,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 10,
    cooldown: 60000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 12,
    animation: 'buff',
    effectColor: 0xffff66,
    buffDuration: 60000,
    buffEffect: { stat: 'CRIT', value: 15 }
  },

  // ============================================
  // THIEF SKILLS
  // ============================================
  LUCKY_SEVEN: {
    id: 'LUCKY_SEVEN',
    name: 'Lucky Seven',
    description: 'Throw two stars with high critical chance.',
    job: JobId.THIEF,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.LINE,
    mpCost: 8,
    cooldown: 350,
    damage: 160,
    maxTargets: 2,
    hitbox: { width: 20, height: 20, offsetX: 0, offsetY: 0 },
    knockback: { x: 30, y: -10 },
    requiredLevel: 10,
    animation: 'throwing_star',
    effectColor: 0x9966cc,
    projectileSpeed: 800
  },
  DOUBLE_STAB: {
    id: 'DOUBLE_STAB',
    name: 'Double Stab',
    description: 'Stab an enemy twice with your dagger.',
    job: JobId.THIEF,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SINGLE,
    mpCost: 10,
    cooldown: 450,
    damage: 190,
    maxTargets: 1,
    hitbox: { width: 60, height: 50, offsetX: 40, offsetY: 0 },
    knockback: { x: 60, y: -30 },
    requiredLevel: 10,
    animation: 'stab',
    effectColor: 0xcc66cc
  },
  DISORDER: {
    id: 'DISORDER',
    name: 'Disorder',
    description: 'Confuse enemies, reducing their attack.',
    job: JobId.THIEF,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.AOE,
    mpCost: 15,
    cooldown: 800,
    damage: 120,
    maxTargets: 4,
    hitbox: { width: 100, height: 60, offsetX: 50, offsetY: 0 },
    knockback: { x: 20, y: 0 },
    requiredLevel: 12,
    animation: 'disorder',
    effectColor: 0x663399
  },
  HASTE: {
    id: 'HASTE',
    name: 'Haste',
    description: 'Increase movement and jump speed.',
    job: JobId.THIEF,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 15,
    cooldown: 60000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 10,
    animation: 'buff',
    effectColor: 0xffcc00,
    buffDuration: 60000,
    buffEffect: { stat: 'SPEED', value: 25 }
  },
  DARK_SIGHT: {
    id: 'DARK_SIGHT',
    name: 'Dark Sight',
    description: 'Become invisible to enemies.',
    job: JobId.THIEF,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 20,
    cooldown: 30000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 15,
    animation: 'buff',
    effectColor: 0x333333,
    buffDuration: 15000,
    buffEffect: { stat: 'STEALTH', value: 100 }
  },

  // ============================================
  // BEGINNER SKILLS (Available to all)
  // ============================================
  THREE_SNAILS: {
    id: 'THREE_SNAILS',
    name: 'Three Snails',
    description: 'Throw snail shells at enemies.',
    job: JobId.BEGINNER,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.LINE,
    mpCost: 3,
    cooldown: 400,
    damage: 80,
    maxTargets: 1,
    hitbox: { width: 20, height: 20, offsetX: 0, offsetY: 0 },
    knockback: { x: 30, y: -20 },
    requiredLevel: 1,
    animation: 'throw',
    effectColor: 0x88cc88,
    projectileSpeed: 400
  },
  RECOVERY: {
    id: 'RECOVERY',
    name: 'Recovery',
    description: 'Recover a small amount of HP over time.',
    job: JobId.BEGINNER,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 5,
    cooldown: 10000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 1,
    animation: 'heal',
    effectColor: 0x88ff88,
    buffDuration: 5000,
    buffEffect: { stat: 'REGEN', value: 5 }
  },
  NIMBLE_FEET: {
    id: 'NIMBLE_FEET',
    name: 'Nimble Feet',
    description: 'Temporarily increase movement speed.',
    job: JobId.BEGINNER,
    type: SkillType.BUFF,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SELF,
    mpCost: 8,
    cooldown: 30000,
    damage: 0,
    maxTargets: 1,
    hitbox: { width: 0, height: 0, offsetX: 0, offsetY: 0 },
    knockback: { x: 0, y: 0 },
    requiredLevel: 3,
    animation: 'buff',
    effectColor: 0xffff66,
    buffDuration: 15000,
    buffEffect: { stat: 'SPEED', value: 15 }
  },
  DOUBLE_STRIKE: {
    id: 'DOUBLE_STRIKE',
    name: 'Double Strike',
    description: 'A basic two-hit combo attack.',
    job: JobId.BEGINNER,
    type: SkillType.ATTACK,
    damageType: DamageType.PHYSICAL,
    targetType: TargetType.SINGLE,
    mpCost: 5,
    cooldown: 600,
    damage: 120,
    maxTargets: 1,
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

export function getSkillsForJob(jobId: JobId): SkillDefinition[] {
  return Object.values(SKILLS).filter(skill => skill.job === jobId || skill.job === JobId.BEGINNER);
}

export function getSkillsForJobAndLevel(jobId: JobId, level: number): SkillDefinition[] {
  return Object.values(SKILLS).filter(
    skill => (skill.job === jobId || skill.job === JobId.BEGINNER) && skill.requiredLevel <= level
  );
}
