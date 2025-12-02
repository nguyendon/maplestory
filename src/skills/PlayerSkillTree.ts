/**
 * PlayerSkillTree - Manages player's skill levels and SP allocation
 */

import Phaser from 'phaser';
import { JobId } from '../systems/JobData';
import { SKILLS, getSkillsForJob, getSkillAtLevel } from './SkillData';
import type { SkillDefinition } from './SkillData';
import { PlayerStats } from '../systems/CharacterStats';

/**
 * Save data for skill levels
 */
export interface SkillTreeData {
  skillLevels: Record<string, number>; // skillId -> level
}

/**
 * PlayerSkillTree tracks a player's skill levels and handles SP allocation
 */
export class PlayerSkillTree extends Phaser.Events.EventEmitter {
  private skillLevels: Map<string, number> = new Map();
  private playerStats: PlayerStats;

  constructor(playerStats: PlayerStats, data?: SkillTreeData) {
    super();
    this.playerStats = playerStats;

    if (data) {
      this.loadFromData(data);
    }
  }

  /**
   * Get current level of a skill
   */
  getSkillLevel(skillId: string): number {
    return this.skillLevels.get(skillId) ?? 0;
  }

  /**
   * Get all skill levels as a record
   */
  getAllSkillLevels(): Record<string, number> {
    const levels: Record<string, number> = {};
    this.skillLevels.forEach((level, skillId) => {
      if (level > 0) {
        levels[skillId] = level;
      }
    });
    return levels;
  }

  /**
   * Check if a skill can be leveled up
   */
  canLevelUpSkill(skillId: string): { canLevel: boolean; reason?: string } {
    const skill = SKILLS[skillId];
    if (!skill) {
      return { canLevel: false, reason: 'Skill not found' };
    }

    // Check if player has SP
    if (this.playerStats.unassignedSP <= 0) {
      return { canLevel: false, reason: 'No SP available' };
    }

    // Check level requirement
    if (this.playerStats.level < skill.requiredLevel) {
      return { canLevel: false, reason: `Requires level ${skill.requiredLevel}` };
    }

    // Check job requirement
    const playerJob = this.playerStats.job;
    if (skill.job !== JobId.BEGINNER && skill.job !== playerJob) {
      return { canLevel: false, reason: 'Wrong job class' };
    }

    // Check current level vs max level
    const currentLevel = this.getSkillLevel(skillId);
    if (currentLevel >= skill.maxLevel) {
      return { canLevel: false, reason: 'Skill is at max level' };
    }

    // Check prerequisites
    if (skill.prerequisite) {
      const prereqLevel = this.getSkillLevel(skill.prerequisite.skillId);
      if (prereqLevel < skill.prerequisite.level) {
        const prereqSkill = SKILLS[skill.prerequisite.skillId];
        const prereqName = prereqSkill?.name ?? skill.prerequisite.skillId;
        return {
          canLevel: false,
          reason: `Requires ${prereqName} Lv.${skill.prerequisite.level}`
        };
      }
    }

    return { canLevel: true };
  }

  /**
   * Level up a skill (spend 1 SP)
   */
  levelUpSkill(skillId: string): boolean {
    const { canLevel, reason } = this.canLevelUpSkill(skillId);
    if (!canLevel) {
      console.log(`Cannot level up skill ${skillId}: ${reason}`);
      return false;
    }

    // Use SP
    if (!this.playerStats.useSP(1)) {
      return false;
    }

    const currentLevel = this.getSkillLevel(skillId);
    const newLevel = currentLevel + 1;
    this.skillLevels.set(skillId, newLevel);

    const skill = SKILLS[skillId];
    this.emit('skillLevelUp', {
      skillId,
      skillName: skill.name,
      oldLevel: currentLevel,
      newLevel,
      maxLevel: skill.maxLevel
    });

    return true;
  }

  /**
   * Get effective skill stats at current level
   */
  getEffectiveSkillStats(skillId: string): {
    damage: number;
    mpCost: number;
    cooldown: number;
    buffValue?: number;
    level: number;
  } | null {
    const skill = SKILLS[skillId];
    if (!skill) return null;

    const level = this.getSkillLevel(skillId);
    const stats = getSkillAtLevel(skill, level);

    return {
      ...stats,
      level
    };
  }

  /**
   * Check if a skill is unlocked (level > 0)
   */
  isSkillUnlocked(skillId: string): boolean {
    return this.getSkillLevel(skillId) > 0;
  }

  /**
   * Check if a skill is available for the current job
   */
  isSkillAvailable(skillId: string): boolean {
    const skill = SKILLS[skillId];
    if (!skill) return false;

    const playerJob = this.playerStats.job;
    return skill.job === JobId.BEGINNER || skill.job === playerJob;
  }

  /**
   * Get all skills available to the player (based on job)
   */
  getAvailableSkills(): SkillDefinition[] {
    return getSkillsForJob(this.playerStats.job);
  }

  /**
   * Get skills organized by type for UI
   */
  getSkillsByType(): {
    attack: SkillDefinition[];
    buff: SkillDefinition[];
    passive: SkillDefinition[];
    mobility: SkillDefinition[];
  } {
    const skills = this.getAvailableSkills();
    return {
      attack: skills.filter(s => s.type === 'attack'),
      buff: skills.filter(s => s.type === 'buff'),
      passive: skills.filter(s => s.type === 'passive'),
      mobility: skills.filter(s => s.type === 'mobility')
    };
  }

  /**
   * Reset all skills (refund SP)
   * In a real game, this would cost mesos or require an item
   */
  resetSkills(): number {
    let totalSP = 0;
    this.skillLevels.forEach((level) => {
      totalSP += level;
    });

    this.skillLevels.clear();
    this.playerStats.addSP(totalSP);

    this.emit('skillsReset', { spRefunded: totalSP });
    return totalSP;
  }

  /**
   * Get total SP invested in skills
   */
  getTotalSPInvested(): number {
    let total = 0;
    this.skillLevels.forEach((level) => {
      total += level;
    });
    return total;
  }

  /**
   * Serialization
   */
  toJSON(): SkillTreeData {
    return {
      skillLevels: this.getAllSkillLevels()
    };
  }

  loadFromData(data: SkillTreeData): void {
    this.skillLevels.clear();
    if (data.skillLevels) {
      Object.entries(data.skillLevels).forEach(([skillId, level]) => {
        if (level > 0) {
          this.skillLevels.set(skillId, level);
        }
      });
    }
    this.emit('skillTreeLoaded');
  }
}
