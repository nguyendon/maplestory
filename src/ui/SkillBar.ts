import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';

export interface SkillSlot {
  skill: SkillDefinition | null;
  keyCode: string; // Phaser key code like 'A', 'S', 'ONE', 'SPACE', etc.
  keyDisplay: string; // Display text like 'A', 'S', '1', 'SPC'
  index: number;
}

export class SkillBar extends Phaser.GameObjects.Container {
  private slots: SkillSlot[] = [];
  private slotGraphics: Phaser.GameObjects.Graphics[] = [];
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private cooldownOverlays: Phaser.GameObjects.Graphics[] = [];
  private keyLabels: Phaser.GameObjects.Text[] = [];

  private readonly SLOT_SIZE = 44;
  private readonly SLOT_PADDING = 6;
  private readonly NUM_SLOTS = 6;

  private getCooldownPercent: ((skillId: string) => number) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createSlots();
    scene.add.existing(this);
    this.setDepth(1000);
  }

  private createSlots(): void {
    // Default keys - can be changed
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
      bg.fillStyle(0x222233, 0.9);
      bg.fillRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
      bg.lineStyle(2, 0x444466, 1);
      bg.strokeRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
      this.add(bg);
      this.slotGraphics.push(bg);

      // Cooldown overlay
      const cooldown = this.scene.add.graphics();
      cooldown.setVisible(false);
      this.add(cooldown);
      this.cooldownOverlays.push(cooldown);

      // Skill name text
      const text = this.scene.add.text(
        slotX + this.SLOT_SIZE / 2,
        this.SLOT_SIZE / 2,
        '',
        {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#ffffff',
          align: 'center'
        }
      );
      text.setOrigin(0.5);
      this.add(text);
      this.slotTexts.push(text);

      // Key label
      const keyLabel = this.scene.add.text(
        slotX + 4,
        4,
        defaultKeys[i].display,
        {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 2
        }
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

  assignSkill(slotIndex: number, skill: SkillDefinition): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    this.slots[slotIndex].skill = skill;

    // Update visual
    const text = this.slotTexts[slotIndex];
    text.setText(this.truncateSkillName(skill.name));

    // Update slot color based on skill
    const bg = this.slotGraphics[slotIndex];
    bg.clear();
    bg.fillStyle(this.getSkillSlotColor(skill), 0.9);
    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);
    bg.fillRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
    bg.lineStyle(2, 0x666688, 1);
    bg.strokeRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
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

  private getSkillSlotColor(skill: SkillDefinition): number {
    switch (skill.type) {
      case 'attack': return 0x442222;
      case 'buff': return 0x224422;
      default: return 0x222244;
    }
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

  update(): void {
    if (!this.getCooldownPercent) return;

    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.NUM_SLOTS; i++) {
      const skill = this.slots[i].skill;
      const overlay = this.cooldownOverlays[i];
      const slotX = startX + i * (this.SLOT_SIZE + this.SLOT_PADDING);

      if (skill) {
        const percent = this.getCooldownPercent(skill.id);

        if (percent > 0) {
          overlay.setVisible(true);
          overlay.clear();
          overlay.fillStyle(0x000000, 0.6);

          // Draw cooldown from bottom up
          const height = this.SLOT_SIZE * percent;
          overlay.fillRoundedRect(
            slotX + 2,
            2,
            this.SLOT_SIZE - 4,
            height,
            2
          );
        } else {
          overlay.setVisible(false);
        }
      } else {
        overlay.setVisible(false);
      }
    }
  }

  highlightSlot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    const bg = this.slotGraphics[slotIndex];
    const skill = this.slots[slotIndex].skill;
    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);

    // Flash effect
    bg.clear();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);

    this.scene.time.delayedCall(100, () => {
      bg.clear();
      bg.fillStyle(skill ? this.getSkillSlotColor(skill) : 0x222233, 0.9);
      bg.fillRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
      bg.lineStyle(2, 0x666688, 1);
      bg.strokeRoundedRect(slotX, 0, this.SLOT_SIZE, this.SLOT_SIZE, 4);
    });
  }

  showNotEnoughMP(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.NUM_SLOTS) return;

    const slotX = -((this.NUM_SLOTS * (this.SLOT_SIZE + this.SLOT_PADDING) - this.SLOT_PADDING) / 2) +
                  slotIndex * (this.SLOT_SIZE + this.SLOT_PADDING);

    const text = this.scene.add.text(
      slotX + this.SLOT_SIZE / 2,
      -10,
      'No MP!',
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    text.setOrigin(0.5);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -30,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    });
  }

  getNumSlots(): number {
    return this.NUM_SLOTS;
  }
}
