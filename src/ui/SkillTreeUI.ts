/**
 * SkillTreeUI - Display and manage skill tree for job advancement
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { PlayerStats } from '../systems/CharacterStats';
import { PlayerSkillTree } from '../skills/PlayerSkillTree';
import { SKILLS, getSkillAtLevel } from '../skills/SkillData';
import type { SkillDefinition } from '../skills/SkillData';
import { getJob } from '../systems/JobData';
import {
  UI_COLORS,
  drawPanel,
  drawDivider,
  drawContentPanel,
  drawTab,
  createCloseButton,
  getTitleStyle,
  getBodyStyle,
  getLabelStyle,
  drawProgressBar,
} from './UITheme';

interface SkillSlotUI {
  skill: SkillDefinition;
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  plusBtn: Phaser.GameObjects.Container | null;
}

type TabType = 'attack' | 'buff' | 'all';

export class SkillTreeUI extends Phaser.GameObjects.Container {
  private panel!: Phaser.GameObjects.Graphics;
  private playerStats: PlayerStats | null = null;
  private skillTree: PlayerSkillTree | null = null;

  // Header
  private titleText!: Phaser.GameObjects.Text;
  private jobText!: Phaser.GameObjects.Text;
  private spText!: Phaser.GameObjects.Text;

  // Tab system
  private tabs: Map<TabType, Phaser.GameObjects.Container> = new Map();
  private currentTab: TabType = 'all';
  private tabGraphics!: Phaser.GameObjects.Graphics;

  // Skill slots
  private skillSlots: SkillSlotUI[] = [];
  private skillContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScrollY: number = 0;

  // Tooltip
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipGraphics!: Phaser.GameObjects.Graphics;
  private tooltipTexts: Phaser.GameObjects.Text[] = [];

  private readonly PANEL_WIDTH = 320;
  private readonly PANEL_HEIGHT = 400;
  private readonly SKILL_SLOT_HEIGHT = 52;
  private readonly SKILL_AREA_HEIGHT = 280;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createHeader();
    this.createTabs();
    this.createSkillArea();
    this.createTooltip();

    scene.add.existing(this);
    this.setDepth(2500);
    this.setVisible(false);
  }

  private createPanel(): void {
    this.panel = this.scene.add.graphics();
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title
    this.titleText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 15,
      -this.PANEL_HEIGHT / 2 + 9,
      'Skill Tree',
      getTitleStyle()
    );
    this.add(this.titleText);

    // Close button
    const closeBtn = createCloseButton(
      this.scene,
      this.PANEL_WIDTH / 2 - 18,
      -this.PANEL_HEIGHT / 2 + 17,
      () => this.hide()
    );
    this.add(closeBtn);
  }

  private createHeader(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 48;
    const leftX = -this.PANEL_WIDTH / 2 + 15;
    const rightX = this.PANEL_WIDTH / 2 - 15;

    // Job name
    this.jobText = this.scene.add.text(leftX, startY, 'Job: Beginner', getBodyStyle());
    this.add(this.jobText);

    // SP available (right-aligned, gold color)
    this.spText = this.scene.add.text(rightX, startY, 'SP: 0', {
      ...getBodyStyle(),
      color: UI_COLORS.textGold,
    });
    this.spText.setOrigin(1, 0);
    this.add(this.spText);

    // Divider
    const divider = this.scene.add.graphics();
    drawDivider(divider, leftX, startY + 25, this.PANEL_WIDTH - 30);
    this.add(divider);
  }

  private createTabs(): void {
    const tabY = -this.PANEL_HEIGHT / 2 + 80;
    const tabWidth = 90;
    const tabHeight = 26;
    const spacing = 5;
    const startX = -this.PANEL_WIDTH / 2 + 15;

    this.tabGraphics = this.scene.add.graphics();
    this.add(this.tabGraphics);

    const tabTypes: { type: TabType; label: string }[] = [
      { type: 'all', label: 'All Skills' },
      { type: 'attack', label: 'Attack' },
      { type: 'buff', label: 'Buff' },
    ];

    tabTypes.forEach((tab, index) => {
      const x = startX + index * (tabWidth + spacing);
      const container = this.scene.add.container(x, tabY);

      // Tab text
      const text = this.scene.add.text(tabWidth / 2, tabHeight / 2, tab.label, {
        ...getLabelStyle(),
        fontSize: '11px',
        color: this.currentTab === tab.type ? UI_COLORS.textWhite : UI_COLORS.textGray,
      });
      text.setOrigin(0.5, 0.5);
      container.add(text);

      // Hit area
      const hitArea = this.scene.add.rectangle(tabWidth / 2, tabHeight / 2, tabWidth, tabHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.selectTab(tab.type));
      container.add(hitArea);

      this.tabs.set(tab.type, container);
      this.add(container);
    });

    this.drawTabs();
  }

  private drawTabs(): void {
    this.tabGraphics.clear();
    const tabY = -this.PANEL_HEIGHT / 2 + 80;
    const tabWidth = 90;
    const tabHeight = 26;
    const spacing = 5;
    const startX = -this.PANEL_WIDTH / 2 + 15;

    let index = 0;
    for (const [type, container] of this.tabs) {
      const x = startX + index * (tabWidth + spacing);
      drawTab(this.tabGraphics, x, tabY, tabWidth, tabHeight, type === this.currentTab);

      // Update text color
      const text = container.list[0] as Phaser.GameObjects.Text;
      text.setColor(type === this.currentTab ? UI_COLORS.textWhite : UI_COLORS.textGray);

      index++;
    }
  }

  private selectTab(tab: TabType): void {
    if (this.currentTab === tab) return;
    this.currentTab = tab;
    this.drawTabs();
    this.refreshSkills();
  }

  private createSkillArea(): void {
    const areaY = -this.PANEL_HEIGHT / 2 + 115;
    const areaX = -this.PANEL_WIDTH / 2 + 10;
    const areaWidth = this.PANEL_WIDTH - 20;

    // Content panel background
    const contentBg = this.scene.add.graphics();
    drawContentPanel(contentBg, areaX, areaY, areaWidth, this.SKILL_AREA_HEIGHT);
    this.add(contentBg);

    // Create mask for scrolling
    const maskShape = this.scene.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      GAME_WIDTH / 2 + areaX + 2,
      GAME_HEIGHT / 2 + areaY + 2,
      areaWidth - 4,
      this.SKILL_AREA_HEIGHT - 4
    );
    const mask = maskShape.createGeometryMask();

    // Skill container (scrollable)
    this.skillContainer = this.scene.add.container(areaX + 5, areaY + 5);
    this.skillContainer.setMask(mask);
    this.add(this.skillContainer);

    // Scroll handling
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
      if (this.isOpen) {
        this.scroll(deltaY * 0.5);
      }
    });
  }

  private scroll(delta: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, this.maxScrollY);
    this.skillContainer.y = -this.PANEL_HEIGHT / 2 + 120 - this.scrollY;
  }

  private createTooltip(): void {
    this.tooltip = this.scene.add.container(0, 0);
    this.tooltip.setDepth(2600);
    this.tooltip.setVisible(false);

    this.tooltipGraphics = this.scene.add.graphics();
    this.tooltip.add(this.tooltipGraphics);

    this.scene.add.existing(this.tooltip);
  }

  private showTooltip(skill: SkillDefinition, x: number, y: number): void {
    const level = this.skillTree?.getSkillLevel(skill.id) ?? 0;
    const nextLevelStats = getSkillAtLevel(skill, Math.min(level + 1, skill.maxLevel));
    const currentStats = getSkillAtLevel(skill, level);

    // Clear old tooltip texts
    this.tooltipTexts.forEach(t => t.destroy());
    this.tooltipTexts = [];

    const tooltipWidth = 200;
    let tooltipHeight = 120;
    const padding = 10;

    // Build tooltip content
    const lines: { text: string; color: string; bold?: boolean }[] = [];
    lines.push({ text: skill.name, color: UI_COLORS.textWhite, bold: true });
    lines.push({ text: `Level ${level}/${skill.maxLevel}`, color: UI_COLORS.textCyan });
    lines.push({ text: '', color: '' }); // Spacer
    lines.push({ text: skill.description, color: UI_COLORS.textLight });
    lines.push({ text: '', color: '' }); // Spacer

    if (skill.type === 'attack') {
      lines.push({ text: `Damage: ${level > 0 ? currentStats.damage : skill.damage}%`, color: UI_COLORS.textLight });
      if (level < skill.maxLevel) {
        lines.push({ text: `Next Level: ${nextLevelStats.damage}%`, color: UI_COLORS.textGold });
      }
    } else if (skill.buffEffect) {
      const buffVal = level > 0 ? (currentStats.buffValue ?? skill.buffEffect.value) : skill.buffEffect.value;
      lines.push({ text: `${skill.buffEffect.stat}: +${buffVal}%`, color: UI_COLORS.textLight });
      if (level < skill.maxLevel && nextLevelStats.buffValue !== undefined) {
        lines.push({ text: `Next Level: +${nextLevelStats.buffValue}%`, color: UI_COLORS.textGold });
      }
    }

    lines.push({ text: `MP Cost: ${level > 0 ? currentStats.mpCost : skill.mpCost}`, color: UI_COLORS.mpBlue });
    lines.push({ text: `Cooldown: ${((level > 0 ? currentStats.cooldown : skill.cooldown) / 1000).toFixed(1)}s`, color: UI_COLORS.textGray });

    // Prerequisite
    if (skill.prerequisite) {
      const prereqSkill = SKILLS[skill.prerequisite.skillId];
      const prereqName = prereqSkill?.name ?? skill.prerequisite.skillId;
      const prereqLevel = this.skillTree?.getSkillLevel(skill.prerequisite.skillId) ?? 0;
      const met = prereqLevel >= skill.prerequisite.level;
      lines.push({
        text: `Requires: ${prereqName} Lv.${skill.prerequisite.level}`,
        color: met ? '#66ff66' : '#ff6666'
      });
    }

    tooltipHeight = Math.max(120, lines.length * 16 + padding * 2);

    // Position tooltip
    let tooltipX = x + 20;
    let tooltipY = y;
    if (tooltipX + tooltipWidth > GAME_WIDTH / 2) {
      tooltipX = x - tooltipWidth - 10;
    }
    if (tooltipY + tooltipHeight > GAME_HEIGHT / 2) {
      tooltipY = GAME_HEIGHT / 2 - tooltipHeight - 10;
    }

    this.tooltip.setPosition(tooltipX, tooltipY);

    // Draw tooltip background
    this.tooltipGraphics.clear();
    this.tooltipGraphics.fillStyle(0x000000, 0.5);
    this.tooltipGraphics.fillRoundedRect(2, 2, tooltipWidth, tooltipHeight, 6);
    this.tooltipGraphics.fillStyle(UI_COLORS.panelBg, 0.98);
    this.tooltipGraphics.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);
    this.tooltipGraphics.lineStyle(1, UI_COLORS.accentBlue, 0.5);
    this.tooltipGraphics.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);

    // Add text lines
    let lineY = padding;
    lines.forEach(line => {
      if (line.text === '') {
        lineY += 8;
        return;
      }
      const text = this.scene.add.text(padding, lineY, line.text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: line.bold ? '13px' : '11px',
        color: line.color,
        fontStyle: line.bold ? 'bold' : 'normal',
        wordWrap: { width: tooltipWidth - padding * 2 }
      });
      this.tooltip.add(text);
      this.tooltipTexts.push(text);
      lineY += text.height + 2;
    });

    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltip.setVisible(false);
  }

  private createSkillSlot(skill: SkillDefinition, index: number): SkillSlotUI {
    const slotWidth = this.PANEL_WIDTH - 40;
    const slotHeight = this.SKILL_SLOT_HEIGHT;
    const y = index * (slotHeight + 4);

    const container = this.scene.add.container(0, y);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.slotBg, 0.8);
    bg.fillRoundedRect(0, 0, slotWidth, slotHeight, 4);
    bg.lineStyle(1, UI_COLORS.slotBorder, 0.5);
    bg.strokeRoundedRect(0, 0, slotWidth, slotHeight, 4);
    container.add(bg);

    // Skill icon (placeholder - colored box based on type)
    const icon = this.scene.add.graphics();
    const iconSize = 36;
    const iconX = 8;
    const iconY = (slotHeight - iconSize) / 2;
    const iconColor = this.getSkillIconColor(skill);
    icon.fillStyle(iconColor, 0.8);
    icon.fillRoundedRect(iconX, iconY, iconSize, iconSize, 4);
    icon.lineStyle(1, 0xffffff, 0.3);
    icon.strokeRoundedRect(iconX, iconY, iconSize, iconSize, 4);
    // Type indicator
    icon.fillStyle(0xffffff, 0.8);
    const typeSymbol = this.getSkillTypeSymbol(skill);
    container.add(icon);

    // Type text inside icon
    const typeText = this.scene.add.text(iconX + iconSize / 2, iconY + iconSize / 2, typeSymbol, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    typeText.setOrigin(0.5, 0.5);
    container.add(typeText);

    // Skill name
    const nameText = this.scene.add.text(52, 8, skill.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: UI_COLORS.textWhite,
      fontStyle: 'bold',
    });
    container.add(nameText);

    // Level text
    const level = this.skillTree?.getSkillLevel(skill.id) ?? 0;
    const levelText = this.scene.add.text(52, 26, `Lv. ${level}/${skill.maxLevel}`, {
      ...getLabelStyle(),
      color: level > 0 ? UI_COLORS.textCyan : UI_COLORS.textGray,
    });
    container.add(levelText);

    // Level progress bar
    const progressBar = this.scene.add.graphics();
    const progressWidth = 100;
    const progressX = 52;
    const progressY = 40;
    drawProgressBar(progressBar, progressX, progressY, progressWidth, 6, level / skill.maxLevel, UI_COLORS.accentBlue);
    container.add(progressBar);

    // Plus button
    let plusBtn: Phaser.GameObjects.Container | null = null;
    const canLevel = this.skillTree?.canLevelUpSkill(skill.id);
    plusBtn = this.createPlusButton(slotWidth - 30, slotHeight / 2, skill, canLevel?.canLevel ?? false);
    container.add(plusBtn);

    // Interactivity for tooltip
    const hitArea = this.scene.add.rectangle(slotWidth / 2, slotHeight / 2, slotWidth, slotHeight, 0x000000, 0);
    hitArea.setInteractive();
    hitArea.on('pointerover', (_pointer: Phaser.Input.Pointer) => {
      bg.clear();
      bg.fillStyle(UI_COLORS.slotHoverBg, 0.9);
      bg.fillRoundedRect(0, 0, slotWidth, slotHeight, 4);
      bg.lineStyle(1, UI_COLORS.slotHoverBorder, 0.8);
      bg.strokeRoundedRect(0, 0, slotWidth, slotHeight, 4);
    });
    hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.showTooltip(skill, pointer.x - GAME_WIDTH / 2, pointer.y - GAME_HEIGHT / 2);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(UI_COLORS.slotBg, 0.8);
      bg.fillRoundedRect(0, 0, slotWidth, slotHeight, 4);
      bg.lineStyle(1, UI_COLORS.slotBorder, 0.5);
      bg.strokeRoundedRect(0, 0, slotWidth, slotHeight, 4);
      this.hideTooltip();
    });
    container.add(hitArea);

    this.skillContainer.add(container);

    return { skill, container, icon, levelText, nameText, plusBtn };
  }

  private getSkillIconColor(skill: SkillDefinition): number {
    switch (skill.type) {
      case 'attack': return 0xff4444;
      case 'buff': return 0x44ff44;
      case 'passive': return 0xffcc44;
      case 'mobility': return 0x44aaff;
      default: return 0x888888;
    }
  }

  private getSkillTypeSymbol(skill: SkillDefinition): string {
    switch (skill.type) {
      case 'attack': return '\u2694'; // Swords
      case 'buff': return '\u2b06'; // Up arrow
      case 'passive': return '\u2605'; // Star
      case 'mobility': return '\u279a'; // Arrow
      default: return '?';
    }
  }

  private createPlusButton(x: number, y: number, skill: SkillDefinition, _enabled: boolean): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const size = 24;

    const bg = this.scene.add.graphics();
    let isHovered = false;

    const drawBg = () => {
      bg.clear();
      const canLevel = this.skillTree?.canLevelUpSkill(skill.id);
      const isEnabled = canLevel?.canLevel ?? false;

      if (!isEnabled) {
        // Disabled state
        bg.fillStyle(UI_COLORS.panelDark, 0.5);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
        bg.lineStyle(1, UI_COLORS.borderOuter, 0.3);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 4);
        bg.lineStyle(2, 0x555555, 0.5);
      } else if (isHovered) {
        // Hover state
        bg.lineStyle(2, UI_COLORS.accentGold, 0.6);
        bg.strokeRoundedRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2, 5);
        bg.fillStyle(UI_COLORS.buttonHover, 1);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
        bg.lineStyle(2, UI_COLORS.accentGold, 1);
      } else {
        // Normal state
        bg.fillStyle(UI_COLORS.buttonNormal, 0.9);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
        bg.lineStyle(1, UI_COLORS.buttonBorder, 0.6);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 4);
        bg.lineStyle(2, 0xaaaaaa, 1);
      }

      // Draw plus sign
      const s = 5;
      bg.beginPath();
      bg.moveTo(-s, 0);
      bg.lineTo(s, 0);
      bg.moveTo(0, -s);
      bg.lineTo(0, s);
      bg.strokePath();
    };

    drawBg();
    container.add(bg);

    const hitArea = this.scene.add.rectangle(0, 0, size, size, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      isHovered = true;
      drawBg();
    });
    hitArea.on('pointerout', () => {
      isHovered = false;
      drawBg();
    });
    hitArea.on('pointerdown', () => {
      if (this.skillTree?.canLevelUpSkill(skill.id).canLevel) {
        this.skillTree.levelUpSkill(skill.id);
        this.refresh();
      }
    });
    container.add(hitArea);

    (container as any).redraw = drawBg;

    return container;
  }

  public setPlayerStats(stats: PlayerStats, skillTree: PlayerSkillTree): void {
    this.playerStats = stats;
    this.skillTree = skillTree;

    // Listen for changes
    stats.on('statsChanged', () => this.refresh());
    stats.on('levelUp', () => this.refresh());
    stats.on('spChanged', () => this.refresh());
    stats.on('jobChanged', () => this.refreshSkills());
    skillTree.on('skillLevelUp', () => this.refresh());

    this.refreshSkills();
  }

  private refreshSkills(): void {
    // Clear existing skill slots
    this.skillSlots.forEach(slot => slot.container.destroy());
    this.skillSlots = [];

    if (!this.skillTree || !this.playerStats) return;

    // Get skills for current job
    let skills = this.skillTree.getAvailableSkills();

    // Filter by tab
    if (this.currentTab === 'attack') {
      skills = skills.filter(s => s.type === 'attack');
    } else if (this.currentTab === 'buff') {
      skills = skills.filter(s => s.type === 'buff' || s.type === 'passive' || s.type === 'mobility');
    }

    // Sort: job-specific first, then by required level
    skills.sort((a, b) => {
      const aIsJob = a.job === this.playerStats!.job;
      const bIsJob = b.job === this.playerStats!.job;
      if (aIsJob !== bIsJob) return aIsJob ? -1 : 1;
      return a.requiredLevel - b.requiredLevel;
    });

    // Create skill slots
    skills.forEach((skill, index) => {
      const slot = this.createSkillSlot(skill, index);
      this.skillSlots.push(slot);
    });

    // Update max scroll
    const totalHeight = skills.length * (this.SKILL_SLOT_HEIGHT + 4);
    this.maxScrollY = Math.max(0, totalHeight - this.SKILL_AREA_HEIGHT + 10);
    this.scrollY = 0;
    this.skillContainer.y = -this.PANEL_HEIGHT / 2 + 120;

    this.refresh();
  }

  public refresh(): void {
    if (!this.playerStats || !this.skillTree) return;

    const jobDef = getJob(this.playerStats.job);

    // Update header
    this.jobText.setText(`Job: ${jobDef.name}`);

    // SP with highlight if available
    this.spText.setText(`SP: ${this.playerStats.unassignedSP}`);
    if (this.playerStats.unassignedSP > 0) {
      this.spText.setColor(UI_COLORS.textGold);
    } else {
      this.spText.setColor(UI_COLORS.textGray);
    }

    // Update skill slots
    this.skillSlots.forEach(slot => {
      const level = this.skillTree!.getSkillLevel(slot.skill.id);
      slot.levelText.setText(`Lv. ${level}/${slot.skill.maxLevel}`);
      slot.levelText.setColor(level > 0 ? UI_COLORS.textCyan : UI_COLORS.textGray);

      // Update progress bar (recreate for simplicity)
      // In a more optimized version, we'd update the existing graphics
      if (slot.plusBtn) {
        (slot.plusBtn as any).redraw?.();
      }
    });
  }

  public show(): void {
    this.setVisible(true);
    this.isOpen = true;
    this.refresh();
  }

  public hide(): void {
    this.setVisible(false);
    this.isOpen = false;
    this.hideTooltip();
  }

  public toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }
}
