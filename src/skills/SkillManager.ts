import Phaser from 'phaser';
import type { SkillDefinition } from './SkillData';
import { SkillType, DamageType } from './SkillData';
import { JobId } from '../systems/JobData';

export interface ActiveBuff {
  skillId: string;
  stat: string;
  value: number;
  endTime: number;
}

export interface SkillResult {
  success: boolean;
  reason?: string;
  damage?: number;
  hitbox?: Phaser.Geom.Rectangle;
}

export class SkillManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private cooldowns: Map<string, number> = new Map();
  private activeBuffs: ActiveBuff[] = [];
  private currentMP: () => number;
  private useMP: (amount: number) => boolean;
  private playerLevel: () => number;
  private playerJob: () => JobId;
  private getATK: () => number;
  private getMATK: () => number;

  constructor(
    scene: Phaser.Scene,
    options: {
      currentMP: () => number;
      useMP: (amount: number) => boolean;
      playerLevel: () => number;
      playerJob: () => JobId;
      getATK: () => number;
      getMATK: () => number;
    }
  ) {
    super();
    this.scene = scene;
    this.currentMP = options.currentMP;
    this.useMP = options.useMP;
    this.playerLevel = options.playerLevel;
    this.playerJob = options.playerJob;
    this.getATK = options.getATK;
    this.getMATK = options.getMATK;
  }

  canUseSkill(skill: SkillDefinition): { canUse: boolean; reason?: string } {
    // Check job requirement (Beginner skills can be used by anyone)
    const currentJob = this.playerJob();
    if (skill.job !== JobId.BEGINNER && skill.job !== currentJob) {
      return { canUse: false, reason: `Requires ${skill.job} job` };
    }

    // Check level requirement
    if (this.playerLevel() < skill.requiredLevel) {
      return { canUse: false, reason: `Requires level ${skill.requiredLevel}` };
    }

    // Check MP
    if (this.currentMP() < skill.mpCost) {
      return { canUse: false, reason: 'Not enough MP' };
    }

    // Check cooldown
    const cooldownEnd = this.cooldowns.get(skill.id) || 0;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      return { canUse: false, reason: `Cooldown: ${remaining}s` };
    }

    return { canUse: true };
  }

  useSkill(
    skill: SkillDefinition,
    playerX: number,
    playerY: number,
    facingRight: boolean
  ): SkillResult {
    const check = this.canUseSkill(skill);
    if (!check.canUse) {
      return { success: false, reason: check.reason };
    }

    // Consume MP
    if (!this.useMP(skill.mpCost)) {
      return { success: false, reason: 'Not enough MP' };
    }

    // Set cooldown
    this.cooldowns.set(skill.id, Date.now() + skill.cooldown);

    // Handle different skill types
    if (skill.type === SkillType.BUFF) {
      this.applyBuff(skill);
      this.emit('skill:used', { skill, type: 'buff' });
      return { success: true };
    }

    // Calculate damage for attack skills based on damage type
    const baseStat = skill.damageType === DamageType.MAGICAL ? this.getMATK() : this.getATK();
    const baseDamage = baseStat * (skill.damage / 100);
    const variance = 0.9 + Math.random() * 0.2;
    const damage = Math.floor(baseDamage * variance);

    // Calculate hitbox position
    const hitboxX = facingRight
      ? playerX + skill.hitbox.offsetX
      : playerX - skill.hitbox.offsetX - skill.hitbox.width;
    const hitboxY = playerY + skill.hitbox.offsetY - skill.hitbox.height / 2;

    const hitbox = new Phaser.Geom.Rectangle(
      hitboxX,
      hitboxY,
      skill.hitbox.width,
      skill.hitbox.height
    );

    this.emit('skill:used', {
      skill,
      type: 'attack',
      hitbox,
      damage,
      facingRight
    });

    return { success: true, damage, hitbox };
  }

  private applyBuff(skill: SkillDefinition): void {
    // Use buffEffect and buffDuration from skill definition if available
    if (!skill.buffEffect || !skill.buffDuration) {
      console.warn(`Buff skill ${skill.id} missing buffEffect or buffDuration`);
      return;
    }

    const duration = skill.buffDuration;
    const buff: ActiveBuff = {
      skillId: skill.id,
      stat: skill.buffEffect.stat,
      value: skill.buffEffect.value,
      endTime: Date.now() + duration
    };

    // Remove existing buff of same type
    this.activeBuffs = this.activeBuffs.filter(b => b.skillId !== skill.id);
    this.activeBuffs.push(buff);

    this.emit('buff:applied', buff);

    // Schedule buff removal
    this.scene.time.delayedCall(duration, () => {
      this.activeBuffs = this.activeBuffs.filter(b => b.skillId !== skill.id);
      this.emit('buff:expired', buff);
    });
  }

  getBuffBonus(stat: string): number {
    const now = Date.now();
    return this.activeBuffs
      .filter(buff => buff.stat === stat && buff.endTime > now)
      .reduce((total, buff) => total + buff.value, 0);
  }

  getCooldownRemaining(skillId: string): number {
    const cooldownEnd = this.cooldowns.get(skillId) || 0;
    return Math.max(0, cooldownEnd - Date.now());
  }

  getCooldownPercent(skillId: string, totalCooldown: number): number {
    const remaining = this.getCooldownRemaining(skillId);
    if (remaining <= 0) return 0;
    return remaining / totalCooldown;
  }

  update(): void {
    // Clean up expired buffs
    const now = Date.now();
    this.activeBuffs = this.activeBuffs.filter(buff => buff.endTime > now);
  }

  getActiveBuffs(): ActiveBuff[] {
    return [...this.activeBuffs];
  }
}
