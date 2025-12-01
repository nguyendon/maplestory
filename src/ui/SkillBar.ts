import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { UI_COLORS, getKeyStyle, drawTooltip } from './UITheme';

export interface SkillSlot {
  skill: SkillDefinition | null;
  keyCode: string;
  keyDisplay: string;
  index: number;
}

export class SkillBar extends Phaser.GameObjects.Container {
  private slots: SkillSlot[] = [];
  private slotGraphics: Phaser.GameObjects.Graphics[] = [];
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private cooldownOverlays: Phaser.GameObjects.Graphics[] = [];
  private cooldownTexts: Phaser.GameObjects.Text[] = [];
  private keyLabels: Phaser.GameObjects.Text[] = [];
  private backgroundPanel!: Phaser.GameObjects.Graphics;
  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  private lastHoveredSlot: number = -1;

  private readonly SLOT_SIZE = 44;
  private readonly SLOT_PADDING = 6;
  private readonly NUM_SLOTS = 6;
  private readonly PANEL_PADDING = 8;

  private getCooldownPercent: ((skillId: string) => number) | null = null;
  private getCooldownRemaining: ((skillId: string) => number) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createBackground();
    this.createSlots();
    scene.add.existing(this);
    this.setDepth(1000);

    // Make the entire skillbar interactive for tooltip detection
    this.setupContainerInteraction();
  }

  private setupContainerInteraction(): void {
    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING + this.PANEL_PADDING * 2;
    const totalHeight = this.SLOT_SIZE + this.PANEL_PADDING * 2;

    // Set up the container's interactive hitArea
    this.setSize(totalWidth, totalHeight);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-totalWidth / 2, 0, totalWidth, totalHeight),
      Phaser.Geom.Rectangle.Contains
    );

    this.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Convert pointer position to local coordinates
      const localX = pointer.x - this.x;
      const slotIndex = this.getSlotIndexFromLocalX(localX);

      if (slotIndex !== this.lastHoveredSlot) {
        this.lastHoveredSlot = slotIndex;
        if (slotIndex >= 0 && slotIndex < this.NUM_SLOTS && this.slots[slotIndex]?.skill) {
          this.showTooltip(slotIndex);
        } else {
          this.hideTooltip();
        }
      }
    });

    this.on('pointerout', () => {
      this.lastHoveredSlot = -1;
      this.hideTooltip();
    });
  }

  private getSlotIndexFromLocalX(localX: number): number {
    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.NUM_SLOTS; i++) {
      const slotX = startX + i * (this.SLOT_SIZE + this.SLOT_PADDING);
      if (localX >= slotX && localX < slotX + this.SLOT_SIZE) {
        return i;
      }
    }
    return -1;
  }

  private createBackground(): void {
    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING + this.PANEL_PADDING * 2;
    const totalHeight = this.SLOT_SIZE + this.PANEL_PADDING * 2;
    const startX = -totalWidth / 2;

    this.backgroundPanel = this.scene.add.graphics();

    // Outer shadow
    this.backgroundPanel.fillStyle(0x000000, 0.4);
    this.backgroundPanel.fillRoundedRect(startX + 2, 2, totalWidth, totalHeight, 8);

    // Main panel background
    this.backgroundPanel.fillStyle(UI_COLORS.panelBg, 0.95);
    this.backgroundPanel.fillRoundedRect(startX, 0, totalWidth, totalHeight, 8);

    // Subtle top gradient
    this.backgroundPanel.fillStyle(UI_COLORS.panelLight, 0.3);
    this.backgroundPanel.fillRoundedRect(startX + 1, 1, totalWidth - 2, totalHeight / 2, { tl: 7, tr: 7, bl: 0, br: 0 });

    // Border
    this.backgroundPanel.lineStyle(1, UI_COLORS.borderOuter, 0.6);
    this.backgroundPanel.strokeRoundedRect(startX, 0, totalWidth, totalHeight, 8);

    // Top edge highlight
    this.backgroundPanel.lineStyle(1, UI_COLORS.borderHighlight, 0.2);
    this.backgroundPanel.beginPath();
    this.backgroundPanel.moveTo(startX + 10, 1);
    this.backgroundPanel.lineTo(startX + totalWidth - 10, 1);
    this.backgroundPanel.strokePath();

    this.add(this.backgroundPanel);
  }

  private createSlots(): void {
    const defaultKeys = [
      { code: 'A', display: 'A' },
      { code: 'S', display: 'S' },
      { code: 'D', display: 'D' },
      { code: 'F', display: 'F' },
      { code: 'G', display: 'G' },
      { code: 'H', display: 'H' }
    ];

    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.NUM_SLOTS; i++) {
      const slotX = startX + i * (this.SLOT_SIZE + this.SLOT_PADDING);

      // Slot background
      const bg = this.scene.add.graphics();
      this.drawSlotBackground(bg, slotX, this.PANEL_PADDING, null);
      this.add(bg);
      this.slotGraphics.push(bg);

      // Cooldown overlay
      const cooldown = this.scene.add.graphics();
      cooldown.setVisible(false);
      this.add(cooldown);
      this.cooldownOverlays.push(cooldown);

      // Cooldown timer text (centered in slot)
      const cooldownText = this.scene.add.text(
        slotX + this.SLOT_SIZE / 2,
        this.PANEL_PADDING + this.SLOT_SIZE / 2,
        '',
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          fontStyle: 'bold'
        }
      );
      cooldownText.setOrigin(0.5);
      cooldownText.setVisible(false);
      cooldownText.setDepth(10);
      this.add(cooldownText);
      this.cooldownTexts.push(cooldownText);

      // Skill name text
      const text = this.scene.add.text(
        slotX + this.SLOT_SIZE / 2,
        this.PANEL_PADDING + this.SLOT_SIZE / 2,
        '',
        {
          fontFamily: 'Arial',
          fontSize: '9px',
          color: UI_COLORS.textWhite,
          align: 'center',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      text.setOrigin(0.5);
      this.add(text);
      this.slotTexts.push(text);

      // Key label with MapleStory styling
      const keyLabel = this.scene.add.text(
        slotX + 4,
        this.PANEL_PADDING + 3,
        defaultKeys[i].display,
        getKeyStyle()
      );
      this.add(keyLabel);
      this.keyLabels.push(keyLabel);

      // Initialize slot
      this.slots.push({
        skill: null,
        keyCode: defaultKeys[i].code,
        keyDisplay: defaultKeys[i].display,
        index: i
      });
    }
  }

  private drawSlotBackground(bg: Phaser.GameObjects.Graphics, x: number, y: number, skill: SkillDefinition | null): void {
    bg.clear();

    // Get skill type color
    let bgColor = UI_COLORS.slotBg;
    if (skill) {
      switch (skill.type) {
        case 'attack':
          bgColor = 0x3a1a1a; // Dark red for attacks
          break;
        case 'buff':
          bgColor = 0x1a3a1a; // Dark green for buffs
          break;
        default:
          bgColor = 0x1a1a3a; // Dark blue for others
      }
    }

    // Slot background
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE, 4);

    // Inner shadow (top-left darker)
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(x + 1, y + 1, this.SLOT_SIZE - 2, 3, { tl: 3, tr: 3, bl: 0, br: 0 });

    // Border
    bg.lineStyle(1, UI_COLORS.slotBorder, 1);
    bg.strokeRoundedRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE, 4);

    // Highlight on bottom-right
    bg.lineStyle(1, UI_COLORS.borderHighlight, 0.2);
    bg.beginPath();
    bg.moveTo(x + 4, y + this.SLOT_SIZE - 2);
    bg.lineTo(x + this.SLOT_SIZE - 2, y + this.SLOT_SIZE - 2);
    bg.lineTo(x + this.SLOT_SIZE - 2, y + 4);
    bg.strokePath();
  }

  assignSkill(slotIndex: number, skill: SkillDefinition): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    this.slots[slotIndex].skill = skill;

    // Update visual
    const text = this.slotTexts[slotIndex];
    text.setText(this.truncateSkillName(skill.name));

    // Update slot background
    const bg = this.slotGraphics[slotIndex];
    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);
    this.drawSlotBackground(bg, slotX, this.PANEL_PADDING, skill);
  }

  setSlotKey(slotIndex: number, keyCode: string, keyDisplay: string): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    this.slots[slotIndex].keyCode = keyCode;
    this.slots[slotIndex].keyDisplay = keyDisplay;
    this.keyLabels[slotIndex].setText(keyDisplay);
  }

  getSlotKey(slotIndex: number): { keyCode: string; keyDisplay: string } | null {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return null;
    return {
      keyCode: this.slots[slotIndex].keyCode,
      keyDisplay: this.slots[slotIndex].keyDisplay
    };
  }

  getAllKeyBindings(): { keyCode: string; slotIndex: number }[] {
    return this.slots.map(slot => ({
      keyCode: slot.keyCode,
      slotIndex: slot.index
    }));
  }

  private truncateSkillName(name: string): string {
    if (name.length <= 6) return name;
    return name.substring(0, 5) + '.';
  }

  getSkillAtSlot(slotIndex: number): SkillDefinition | null {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return null;
    return this.slots[slotIndex].skill;
  }

  getSlotByKeyCode(keyCode: string): number {
    const slot = this.slots.find(s => s.keyCode === keyCode);
    return slot ? slot.index : -1;
  }

  setCooldownCallback(callback: (skillId: string) => number): void {
    this.getCooldownPercent = callback;
  }

  setCooldownRemainingCallback(callback: (skillId: string) => number): void {
    this.getCooldownRemaining = callback;
  }

  update(): void {
    if (!this.getCooldownPercent) return;

    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.NUM_SLOTS; i++) {
      const skill = this.slots[i].skill;
      const overlay = this.cooldownOverlays[i];
      const cooldownText = this.cooldownTexts[i];
      const slotX = startX + i * (this.SLOT_SIZE + this.SLOT_PADDING);

      if (skill) {
        const percent = this.getCooldownPercent(skill.id);

        if (percent > 0) {
          overlay.setVisible(true);
          overlay.clear();
          overlay.fillStyle(0x000000, 0.7);

          // Draw cooldown from top down
          const height = (this.SLOT_SIZE - 4) * percent;
          overlay.fillRoundedRect(
            slotX + 2,
            this.PANEL_PADDING + 2,
            this.SLOT_SIZE - 4,
            height,
            2
          );

          // Border on cooldown overlay
          overlay.lineStyle(1, UI_COLORS.borderGold, 0.5);
          overlay.strokeRoundedRect(
            slotX + 2,
            this.PANEL_PADDING + 2,
            this.SLOT_SIZE - 4,
            height,
            2
          );

          // Show cooldown timer text
          if (this.getCooldownRemaining) {
            const remaining = this.getCooldownRemaining(skill.id);
            const seconds = remaining / 1000;
            cooldownText.setText(seconds >= 1 ? Math.ceil(seconds).toString() : seconds.toFixed(1));
            cooldownText.setVisible(true);
          }
        } else {
          overlay.setVisible(false);
          cooldownText.setVisible(false);
        }
      } else {
        overlay.setVisible(false);
        cooldownText.setVisible(false);
      }
    }
  }

  highlightSlot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    const bg = this.slotGraphics[slotIndex];
    const skill = this.slots[slotIndex].skill;
    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);

    // Flash effect with gold highlight
    bg.clear();
    bg.fillStyle(UI_COLORS.borderGold, 0.8);
    bg.fillRoundedRect(slotX, this.PANEL_PADDING, this.SLOT_SIZE, this.SLOT_SIZE, 4);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(slotX, this.PANEL_PADDING, this.SLOT_SIZE, this.SLOT_SIZE, 4);

    this.scene.time.delayedCall(100, () => {
      this.drawSlotBackground(bg, slotX, this.PANEL_PADDING, skill);
    });
  }

  showNotEnoughMP(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);

    const text = this.scene.add.text(
      slotX + this.SLOT_SIZE / 2,
      -5,
      'No MP!',
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    text.setOrigin(0.5);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -25,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    });
  }

  getNumSlots(): number {
    return this.NUM_SLOTS;
  }

  private showTooltip(slotIndex: number): void {
    const skill = this.slots[slotIndex]?.skill;
    if (!skill) return;

    this.hideTooltip();

    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING;
    const startX = -totalWidth / 2;
    const slotX = startX + slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);

    const tooltipWidth = 180;
    const tooltipHeight = 100;
    const tooltipX = slotX + this.SLOT_SIZE / 2 - tooltipWidth / 2;
    const tooltipY = -tooltipHeight - 10;

    this.tooltipContainer = this.scene.add.container(0, 0);

    // Background
    const bg = this.scene.add.graphics();
    drawTooltip(bg, tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    this.tooltipContainer.add(bg);

    // Skill name
    const nameText = this.scene.add.text(
      tooltipX + tooltipWidth / 2,
      tooltipY + 10,
      skill.name,
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: UI_COLORS.textGold,
        fontStyle: 'bold'
      }
    );
    nameText.setOrigin(0.5, 0);
    this.tooltipContainer.add(nameText);

    // Description
    const descText = this.scene.add.text(
      tooltipX + 8,
      tooltipY + 28,
      skill.description,
      {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: UI_COLORS.textLight,
        wordWrap: { width: tooltipWidth - 16 }
      }
    );
    this.tooltipContainer.add(descText);

    // Stats row
    const statsY = tooltipY + tooltipHeight - 28;

    // MP Cost
    const mpText = this.scene.add.text(
      tooltipX + 8,
      statsY,
      `MP: ${skill.mpCost}`,
      {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: UI_COLORS.textBlue
      }
    );
    this.tooltipContainer.add(mpText);

    // Cooldown
    const cooldownSec = skill.cooldown / 1000;
    const cdText = this.scene.add.text(
      tooltipX + 60,
      statsY,
      `CD: ${cooldownSec >= 1 ? cooldownSec + 's' : (cooldownSec * 1000) + 'ms'}`,
      {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: UI_COLORS.textGray
      }
    );
    this.tooltipContainer.add(cdText);

    // Damage (for attack skills)
    if (skill.damage > 0) {
      const dmgText = this.scene.add.text(
        tooltipX + tooltipWidth - 8,
        statsY,
        `${skill.damage}%`,
        {
          fontFamily: 'Arial',
          fontSize: '9px',
          color: '#ff6666'
        }
      );
      dmgText.setOrigin(1, 0);
      this.tooltipContainer.add(dmgText);
    }

    // Type indicator
    const typeColors: Record<string, string> = {
      attack: '#ff6666',
      buff: '#66ff66',
      mobility: '#66ccff',
      passive: '#cccccc'
    };
    const typeText = this.scene.add.text(
      tooltipX + 8,
      statsY + 12,
      skill.type.toUpperCase(),
      {
        fontFamily: 'Arial',
        fontSize: '8px',
        color: typeColors[skill.type] || '#aaaaaa',
        fontStyle: 'bold'
      }
    );
    this.tooltipContainer.add(typeText);

    // Max targets for AoE
    if (skill.maxTargets > 1) {
      const targetsText = this.scene.add.text(
        tooltipX + tooltipWidth - 8,
        statsY + 12,
        `Hits: ${skill.maxTargets}`,
        {
          fontFamily: 'Arial',
          fontSize: '8px',
          color: UI_COLORS.textGray
        }
      );
      targetsText.setOrigin(1, 0);
      this.tooltipContainer.add(targetsText);
    }

    this.add(this.tooltipContainer);
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }
}
