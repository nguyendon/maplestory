/**
 * BuffIndicatorUI - Displays active buffs with countdown timers
 * Shows buff icons below the skill bar with remaining duration
 */

import Phaser from 'phaser';
import { UI_COLORS } from './UITheme';
import { SKILLS, type SkillDefinition } from '../skills/SkillData';
import type { ActiveBuff } from '../skills/SkillManager';

interface BuffDisplay {
  buff: ActiveBuff;
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Graphics;
  timerText: Phaser.GameObjects.Text;
  progressBar: Phaser.GameObjects.Graphics;
  skill: SkillDefinition;
  totalDuration: number;
}

export class BuffIndicatorUI extends Phaser.GameObjects.Container {
  private buffDisplays: Map<string, BuffDisplay> = new Map();
  private readonly ICON_SIZE = 36;
  private readonly ICON_SPACING = 6;
  private readonly MAX_BUFFS = 8;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(1000);
  }

  /**
   * Add a new buff indicator
   */
  addBuff(buff: ActiveBuff): void {
    // Remove existing buff of same skill if present
    if (this.buffDisplays.has(buff.skillId)) {
      this.removeBuff(buff.skillId);
    }

    const skill = SKILLS[buff.skillId];
    if (!skill) return;

    const index = this.buffDisplays.size;
    if (index >= this.MAX_BUFFS) return;

    const xPos = index * (this.ICON_SIZE + this.ICON_SPACING);
    const container = this.scene.add.container(xPos, 0);

    // Background with skill color
    const icon = this.scene.add.graphics();
    this.drawBuffIcon(icon, skill, false);
    container.add(icon);

    // Buff letter/abbreviation
    const abbrev = this.getBuffAbbreviation(skill);
    const letterText = this.scene.add.text(this.ICON_SIZE / 2, this.ICON_SIZE / 2 - 4, abbrev, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    letterText.setOrigin(0.5);
    container.add(letterText);

    // Progress bar (circular timer effect simulated with bottom bar)
    const progressBar = this.scene.add.graphics();
    container.add(progressBar);

    // Timer text
    const timerText = this.scene.add.text(this.ICON_SIZE / 2, this.ICON_SIZE + 2, '', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: UI_COLORS.textCyan,
      stroke: '#000000',
      strokeThickness: 2
    });
    timerText.setOrigin(0.5, 0);
    container.add(timerText);

    // Tooltip on hover
    const hitArea = this.scene.add.rectangle(
      this.ICON_SIZE / 2,
      this.ICON_SIZE / 2,
      this.ICON_SIZE,
      this.ICON_SIZE,
      0x000000, 0
    );
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      this.drawBuffIcon(icon, skill, true);
      this.showTooltip(skill, buff, xPos);
    });
    hitArea.on('pointerout', () => {
      this.drawBuffIcon(icon, skill, false);
      this.hideTooltip();
    });
    container.add(hitArea);

    this.add(container);

    const totalDuration = buff.endTime - Date.now();
    this.buffDisplays.set(buff.skillId, {
      buff,
      container,
      icon,
      timerText,
      progressBar,
      skill,
      totalDuration
    });
  }

  /**
   * Remove a buff indicator
   */
  removeBuff(skillId: string): void {
    const display = this.buffDisplays.get(skillId);
    if (display) {
      // Fade out animation
      this.scene.tweens.add({
        targets: display.container,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => {
          display.container.destroy();
          this.buffDisplays.delete(skillId);
          this.repositionBuffs();
        }
      });
    }
  }

  /**
   * Update all buff timers
   */
  update(): void {
    const now = Date.now();
    const expiredBuffs: string[] = [];

    this.buffDisplays.forEach((display, skillId) => {
      const remaining = display.buff.endTime - now;

      if (remaining <= 0) {
        expiredBuffs.push(skillId);
        return;
      }

      // Update timer text
      const seconds = Math.ceil(remaining / 1000);
      if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        display.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        display.timerText.setText(`${seconds}s`);
      }

      // Flash when about to expire
      if (seconds <= 5) {
        display.timerText.setColor('#ff6666');
        // Pulse effect
        if (seconds <= 3 && Math.floor(now / 500) % 2 === 0) {
          display.container.setAlpha(0.6);
        } else {
          display.container.setAlpha(1);
        }
      } else {
        display.timerText.setColor(UI_COLORS.textCyan);
        display.container.setAlpha(1);
      }

      // Update progress bar
      const progress = remaining / display.totalDuration;
      this.drawProgressBar(display.progressBar, progress, display.skill.effectColor || 0x66ff66);
    });

    // Remove expired buffs
    expiredBuffs.forEach(skillId => this.removeBuff(skillId));
  }

  /**
   * Sync with current active buffs from SkillManager
   */
  syncBuffs(activeBuffs: ActiveBuff[]): void {
    // Add new buffs
    activeBuffs.forEach(buff => {
      if (!this.buffDisplays.has(buff.skillId)) {
        this.addBuff(buff);
      } else {
        // Update existing buff's end time
        const display = this.buffDisplays.get(buff.skillId);
        if (display) {
          display.buff = buff;
        }
      }
    });

    // Remove buffs that are no longer active
    const activeIds = new Set(activeBuffs.map(b => b.skillId));
    this.buffDisplays.forEach((_, skillId) => {
      if (!activeIds.has(skillId)) {
        this.removeBuff(skillId);
      }
    });
  }

  private drawBuffIcon(graphics: Phaser.GameObjects.Graphics, skill: SkillDefinition, hovered: boolean): void {
    graphics.clear();

    const color = skill.effectColor || 0x66ff66;
    const size = this.ICON_SIZE;
    const radius = 4;

    // Glow on hover
    if (hovered) {
      graphics.lineStyle(2, color, 0.6);
      graphics.strokeRoundedRect(-1, -1, size + 2, size + 2, radius + 1);
    }

    // Background
    graphics.fillStyle(UI_COLORS.panelBg, 0.9);
    graphics.fillRoundedRect(0, 0, size, size, radius);

    // Colored overlay based on buff type
    graphics.fillStyle(color, 0.3);
    graphics.fillRoundedRect(0, 0, size, size, radius);

    // Inner border
    graphics.lineStyle(1, color, 0.6);
    graphics.strokeRoundedRect(0, 0, size, size, radius);

    // Shine effect
    graphics.fillStyle(0xffffff, 0.1);
    graphics.fillRoundedRect(2, 2, size - 4, size / 3, { tl: radius - 1, tr: radius - 1, bl: 0, br: 0 });
  }

  private drawProgressBar(graphics: Phaser.GameObjects.Graphics, progress: number, color: number): void {
    graphics.clear();

    const width = this.ICON_SIZE;
    const height = 3;
    const y = this.ICON_SIZE - height - 2;
    const radius = 1;

    // Background
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRoundedRect(2, y, width - 4, height, radius);

    // Progress fill
    const fillWidth = Math.max(2, (width - 4) * progress);
    graphics.fillStyle(color, 0.9);
    graphics.fillRoundedRect(2, y, fillWidth, height, radius);
  }

  private getBuffAbbreviation(skill: SkillDefinition): string {
    // Common abbreviations for known buffs
    const abbrevMap: Record<string, string> = {
      'RAGE': 'RG',
      'IRON_BODY': 'IB',
      'MAGIC_GUARD': 'MG',
      'MEDITATION': 'MD',
      'FOCUS': 'FC',
      'HASTE': 'HS',
      'DARK_SIGHT': 'DS'
    };

    return abbrevMap[skill.id] || skill.name.substring(0, 2).toUpperCase();
  }

  private repositionBuffs(): void {
    let index = 0;
    this.buffDisplays.forEach(display => {
      const targetX = index * (this.ICON_SIZE + this.ICON_SPACING);
      this.scene.tweens.add({
        targets: display.container,
        x: targetX,
        duration: 150,
        ease: 'Power2'
      });
      index++;
    });
  }

  private tooltipContainer: Phaser.GameObjects.Container | null = null;

  private showTooltip(skill: SkillDefinition, buff: ActiveBuff, xPos: number): void {
    this.hideTooltip();

    const tooltipWidth = 160;
    const tooltipHeight = 70;
    const tooltipX = xPos + this.ICON_SIZE / 2 - tooltipWidth / 2;
    const tooltipY = -tooltipHeight - 8;

    this.tooltipContainer = this.scene.add.container(tooltipX, tooltipY);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.panelBg, 0.95);
    bg.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);
    bg.lineStyle(1, skill.effectColor || UI_COLORS.accentBlue, 0.6);
    bg.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);
    this.tooltipContainer.add(bg);

    // Skill name
    const nameText = this.scene.add.text(tooltipWidth / 2, 10, skill.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: UI_COLORS.textGold,
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5, 0);
    this.tooltipContainer.add(nameText);

    // Buff effect
    const effectText = this.scene.add.text(tooltipWidth / 2, 28, `+${buff.value} ${buff.stat}`, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#88ff88'
    });
    effectText.setOrigin(0.5, 0);
    this.tooltipContainer.add(effectText);

    // Time remaining
    const remaining = Math.ceil((buff.endTime - Date.now()) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s remaining` : `${secs}s remaining`;
    const timeText = this.scene.add.text(tooltipWidth / 2, 46, timeStr, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: UI_COLORS.textGray
    });
    timeText.setOrigin(0.5, 0);
    this.tooltipContainer.add(timeText);

    this.add(this.tooltipContainer);
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }

  /**
   * Clear all buff displays
   */
  clearAll(): void {
    this.buffDisplays.forEach(display => {
      display.container.destroy();
    });
    this.buffDisplays.clear();
    this.hideTooltip();
  }
}
