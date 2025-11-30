/**
 * Job System Data Definitions
 * Defines job classes, their stat bonuses, and skill requirements
 */

export const JobId = {
  BEGINNER: 'BEGINNER',
  WARRIOR: 'WARRIOR',
  MAGE: 'MAGE',
  ARCHER: 'ARCHER',
  THIEF: 'THIEF'
} as const;
export type JobId = typeof JobId[keyof typeof JobId];

export interface JobDefinition {
  id: JobId;
  name: string;
  description: string;
  primaryStat: 'STR' | 'DEX' | 'INT' | 'LUK';
  secondaryStat: 'STR' | 'DEX' | 'INT' | 'LUK';
  hpPerLevel: number;
  mpPerLevel: number;
  baseATKMultiplier: number;
  baseMATKMultiplier: number;
  requiredLevel: number;
  skillIds: string[];
  color: number; // UI color for the job
}

export const JOBS: Record<JobId, JobDefinition> = {
  [JobId.BEGINNER]: {
    id: JobId.BEGINNER,
    name: 'Beginner',
    description: 'A new adventurer just starting their journey.',
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    hpPerLevel: 20,
    mpPerLevel: 14,
    baseATKMultiplier: 1.0,
    baseMATKMultiplier: 1.0,
    requiredLevel: 1,
    skillIds: [], // Beginners have no class skills
    color: 0xaaaaaa
  },
  [JobId.WARRIOR]: {
    id: JobId.WARRIOR,
    name: 'Warrior',
    description: 'A mighty fighter specializing in close combat and high defense.',
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    hpPerLevel: 28,
    mpPerLevel: 10,
    baseATKMultiplier: 1.3,
    baseMATKMultiplier: 0.6,
    requiredLevel: 10,
    skillIds: ['POWER_STRIKE', 'SLASH_BLAST', 'RAGE', 'GROUND_SMASH', 'IRON_BODY'],
    color: 0xff6600
  },
  [JobId.MAGE]: {
    id: JobId.MAGE,
    name: 'Mage',
    description: 'A master of magic who wields devastating elemental spells.',
    primaryStat: 'INT',
    secondaryStat: 'LUK',
    hpPerLevel: 14,
    mpPerLevel: 28,
    baseATKMultiplier: 0.6,
    baseMATKMultiplier: 1.4,
    requiredLevel: 10,
    skillIds: ['MAGIC_BOLT', 'FIRE_ARROW', 'ICE_BEAM', 'TELEPORT', 'MAGIC_GUARD'],
    color: 0x6699ff
  },
  [JobId.ARCHER]: {
    id: JobId.ARCHER,
    name: 'Archer',
    description: 'A skilled marksman who attacks from a distance with deadly precision.',
    primaryStat: 'DEX',
    secondaryStat: 'STR',
    hpPerLevel: 20,
    mpPerLevel: 16,
    baseATKMultiplier: 1.2,
    baseMATKMultiplier: 0.7,
    requiredLevel: 10,
    skillIds: ['DOUBLE_SHOT', 'ARROW_BOMB', 'SOUL_ARROW', 'ARROW_RAIN', 'FOCUS'],
    color: 0x66cc66
  },
  [JobId.THIEF]: {
    id: JobId.THIEF,
    name: 'Thief',
    description: 'A swift assassin who strikes with speed and critical precision.',
    primaryStat: 'LUK',
    secondaryStat: 'DEX',
    hpPerLevel: 18,
    mpPerLevel: 18,
    baseATKMultiplier: 1.1,
    baseMATKMultiplier: 0.8,
    requiredLevel: 10,
    skillIds: ['LUCKY_SEVEN', 'DISORDER', 'DOUBLE_STAB', 'HASTE', 'DARK_SIGHT'],
    color: 0x9966cc
  }
};

export function getJob(id: JobId): JobDefinition {
  return JOBS[id];
}

export function getAvailableJobs(level: number): JobDefinition[] {
  return Object.values(JOBS).filter(job => job.requiredLevel <= level);
}

export function canAdvanceToJob(currentJob: JobId, targetJob: JobId, level: number): boolean {
  // Can only advance from Beginner
  if (currentJob !== JobId.BEGINNER) return false;
  // Can't become a beginner
  if (targetJob === JobId.BEGINNER) return false;
  // Must meet level requirement
  return level >= JOBS[targetJob].requiredLevel;
}
