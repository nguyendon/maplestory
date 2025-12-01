import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { PlayerStats } from '../systems/CharacterStats';
import type { BaseStats } from '../systems/CharacterStats';
import {
  UI_COLORS,
  drawPanel,
  drawDivider,
  createCloseButton,
  getTitleStyle,
  getBodyStyle,
  getLabelStyle,
} from './UITheme';

interface StatRowUI {
  stat: keyof BaseStats;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  plusBtn: Phaser.GameObjects.Container;
}

export class StatsUI extends Phaser.GameObjects.Container {
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;

  private playerStats: PlayerStats | null = null;

  // Basic info
  private levelText!: Phaser.GameObjects.Text;
  private jobText!: Phaser.GameObjects.Text;
  private expText!: Phaser.GameObjects.Text;
  private apText!: Phaser.GameObjects.Text;

  // Base stats rows
  private statRows: StatRowUI[] = [];

  // Derived stats
  private hpText!: Phaser.GameObjects.Text;
  private mpText!: Phaser.GameObjects.Text;
  private atkText!: Phaser.GameObjects.Text;
  private matkText!: Phaser.GameObjects.Text;
  private defText!: Phaser.GameObjects.Text;
  private critText!: Phaser.GameObjects.Text;

  private readonly PANEL_WIDTH = 220;
  private readonly PANEL_HEIGHT = 360;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createBasicInfo();
    this.createBaseStats();
    this.createDerivedStats();

    scene.add.existing(this);
    this.setDepth(2500);
    this.setVisible(false);
  }

  private createPanel(): void {
    this.panel = this.scene.add.graphics();
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title text
    this.titleText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 15,
      -this.PANEL_HEIGHT / 2 + 9,
      'Character Stats',
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

  private createBasicInfo(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 48;
    const leftX = -this.PANEL_WIDTH / 2 + 15;
    const rightX = this.PANEL_WIDTH / 2 - 15;
    const lineHeight = 20;

    // Level
    this.levelText = this.scene.add.text(leftX, startY, 'Level: 1', getBodyStyle());
    this.add(this.levelText);

    // Job
    this.jobText = this.scene.add.text(leftX, startY + lineHeight, 'Job: Beginner', getBodyStyle());
    this.add(this.jobText);

    // EXP
    this.expText = this.scene.add.text(leftX, startY + lineHeight * 2, 'EXP: 0 / 100', getBodyStyle());
    this.add(this.expText);

    // AP Available (right-aligned with gold color)
    this.apText = this.scene.add.text(rightX, startY, 'AP: 0', {
      ...getBodyStyle(),
      color: UI_COLORS.textGold,
    });
    this.apText.setOrigin(1, 0);
    this.add(this.apText);

    // Divider after basic info
    const divider = this.scene.add.graphics();
    drawDivider(divider, leftX, startY + lineHeight * 3 + 8, this.PANEL_WIDTH - 30);
    this.add(divider);
  }

  private createBaseStats(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 125;
    const leftX = -this.PANEL_WIDTH / 2 + 15;
    const lineHeight = 28;

    // Section label
    const sectionLabel = this.scene.add.text(leftX, startY - 18, 'Base Stats', {
      ...getLabelStyle(),
      color: UI_COLORS.textCyan,
    });
    this.add(sectionLabel);

    const stats: { stat: keyof BaseStats; label: string; color: string }[] = [
      { stat: 'STR', label: 'STR', color: '#ff6666' },
      { stat: 'DEX', label: 'DEX', color: '#66ff66' },
      { stat: 'INT', label: 'INT', color: '#6699ff' },
      { stat: 'LUK', label: 'LUK', color: '#ffcc66' },
    ];

    stats.forEach((s, index) => {
      const y = startY + index * lineHeight;

      // Stat label with color
      const label = this.scene.add.text(leftX, y, s.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: s.color,
        fontStyle: 'bold',
      });
      this.add(label);

      // Stat value
      const value = this.scene.add.text(leftX + 50, y, '4', getBodyStyle());
      this.add(value);

      // Plus button
      const plusBtn = this.createPlusButton(this.PANEL_WIDTH / 2 - 35, y + 2, s.stat);
      this.add(plusBtn);

      this.statRows.push({ stat: s.stat, label, value, plusBtn });
    });

    // Divider after base stats
    const divider = this.scene.add.graphics();
    drawDivider(divider, leftX, startY + stats.length * lineHeight + 8, this.PANEL_WIDTH - 30);
    this.add(divider);
  }

  private createPlusButton(x: number, y: number, stat: keyof BaseStats): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const size = 20;

    const bg = this.scene.add.graphics();
    let isHovered = false;

    const drawBg = () => {
      bg.clear();
      const hasAP = this.playerStats && this.playerStats.unassignedAP > 0;

      if (!hasAP) {
        // Disabled state
        bg.fillStyle(UI_COLORS.panelDark, 0.5);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 3);
        bg.lineStyle(1, UI_COLORS.borderOuter, 0.3);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 3);

        // Plus sign (dimmed)
        bg.lineStyle(2, 0x555555, 0.5);
      } else if (isHovered) {
        // Hover state
        bg.lineStyle(2, UI_COLORS.accentGold, 0.5);
        bg.strokeRoundedRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2, 4);

        bg.fillStyle(UI_COLORS.buttonHover, 1);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 3);

        // Plus sign
        bg.lineStyle(2, UI_COLORS.accentGold, 1);
      } else {
        // Normal state
        bg.fillStyle(UI_COLORS.buttonNormal, 0.8);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 3);
        bg.lineStyle(1, UI_COLORS.buttonBorder, 0.6);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 3);

        // Plus sign
        bg.lineStyle(2, 0xaaaaaa, 1);
      }

      // Draw plus
      const s = 4;
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
      if (this.playerStats && this.playerStats.unassignedAP > 0) {
        this.playerStats.addStatPoint(stat);
        this.refresh();
      }
    });
    container.add(hitArea);

    // Store drawBg for refresh
    (container as any).redraw = drawBg;

    return container;
  }

  private createDerivedStats(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 250;
    const leftX = -this.PANEL_WIDTH / 2 + 15;
    const lineHeight = 18;

    // Section label
    const sectionLabel = this.scene.add.text(leftX, startY - 18, 'Derived Stats', {
      ...getLabelStyle(),
      color: UI_COLORS.textCyan,
    });
    this.add(sectionLabel);

    // HP
    this.hpText = this.scene.add.text(leftX, startY, 'HP: 100 / 100', {
      ...getBodyStyle(),
      color: UI_COLORS.hpRed,
    });
    this.add(this.hpText);

    // MP
    this.mpText = this.scene.add.text(leftX, startY + lineHeight, 'MP: 50 / 50', {
      ...getBodyStyle(),
      color: UI_COLORS.mpBlue,
    });
    this.add(this.mpText);

    // ATK
    this.atkText = this.scene.add.text(leftX, startY + lineHeight * 2, 'ATK: 10', getBodyStyle());
    this.add(this.atkText);

    // MATK
    this.matkText = this.scene.add.text(leftX + 80, startY + lineHeight * 2, 'MATK: 10', getBodyStyle());
    this.add(this.matkText);

    // DEF
    this.defText = this.scene.add.text(leftX, startY + lineHeight * 3, 'DEF: 5', getBodyStyle());
    this.add(this.defText);

    // Crit Rate
    this.critText = this.scene.add.text(leftX + 80, startY + lineHeight * 3, 'CRIT: 5%', getBodyStyle());
    this.add(this.critText);
  }

  public setPlayerStats(stats: PlayerStats): void {
    this.playerStats = stats;

    // Listen for stat changes
    stats.on('statsChanged', () => this.refresh());
    stats.on('levelUp', () => this.refresh());
    stats.on('expGained', () => this.refresh());
    stats.on('hpChanged', () => this.refresh());
    stats.on('mpChanged', () => this.refresh());
    stats.on('jobChanged', () => this.refresh());

    this.refresh();
  }

  public refresh(): void {
    if (!this.playerStats) return;

    const stats = this.playerStats;
    const jobDef = stats.getJobDefinition();

    // Basic info
    this.levelText.setText(`Level: ${stats.level}`);
    this.jobText.setText(`Job: ${jobDef.name}`);

    const expToNext = PlayerStats.getExpRequiredForLevel(stats.level);
    const expInLevel = stats.exp - PlayerStats.getExpForLevel(stats.level);
    this.expText.setText(`EXP: ${expInLevel} / ${expToNext}`);

    // AP with highlight if available
    this.apText.setText(`AP: ${stats.unassignedAP}`);
    if (stats.unassignedAP > 0) {
      this.apText.setColor(UI_COLORS.textGold);
    } else {
      this.apText.setColor(UI_COLORS.textGray);
    }

    // Base stats
    this.statRows.forEach(row => {
      row.value.setText(String(stats[row.stat]));
      // Redraw plus button to update enabled/disabled state
      if ((row.plusBtn as any).redraw) {
        (row.plusBtn as any).redraw();
      }
    });

    // Derived stats
    this.hpText.setText(`HP: ${stats.currentHP} / ${stats.getMaxHP()}`);
    this.mpText.setText(`MP: ${stats.currentMP} / ${stats.getMaxMP()}`);
    this.atkText.setText(`ATK: ${stats.getATK()}`);
    this.matkText.setText(`MATK: ${stats.getMATK()}`);
    this.defText.setText(`DEF: ${stats.getDEF()}`);
    this.critText.setText(`CRIT: ${stats.getCriticalRate().toFixed(1)}%`);
  }

  public show(): void {
    this.setVisible(true);
    this.isOpen = true;
    this.refresh();
  }

  public hide(): void {
    this.setVisible(false);
    this.isOpen = false;
  }

  public toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }
}
