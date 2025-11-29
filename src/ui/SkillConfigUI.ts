import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { SKILLS } from '../skills/SkillData';

export class SkillConfigUI extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;
  private skillSlots: { graphics: Phaser.GameObjects.Graphics; skillText: Phaser.GameObjects.Text; keyText: Phaser.GameObjects.Text; skill: SkillDefinition | null; keyCode: string; keyDisplay: string }[] = [];
  private availableSkillButtons: Phaser.GameObjects.Container[] = [];
  private selectedSkill: SkillDefinition | null = null;
  private selectedSlotForKeyBind: number = -1;
  private instructionText!: Phaser.GameObjects.Text;
  private waitingForKeyText!: Phaser.GameObjects.Text;

  private readonly PANEL_WIDTH = 500;
  private readonly PANEL_HEIGHT = 380;
  private readonly SLOT_SIZE = 60;
  private readonly NUM_SLOTS = 6;

  public isOpen: boolean = false;

  private onSkillAssigned: ((slotIndex: number, skill: SkillDefinition) => void) | null = null;
  private onKeyBound: ((slotIndex: number, keyCode: string, keyDisplay: string) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 640, 360); // Center of 1280x720

    this.createPanel();
    this.createHotkeySlots();
    this.createSkillList();
    this.setupKeyListener();

    scene.add.existing(this);
    this.setDepth(2000);
    this.setVisible(false);
  }

  private createPanel(): void {
    // Semi-transparent background overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(-640, -360, 1280, 720);
    this.add(overlay);

    // Main panel
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 10);
    this.background.lineStyle(3, 0x4a4a6a, 1);
    this.background.strokeRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 10);
    this.add(this.background);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 25, 'SKILL CONFIGURATION', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    this.closeButton = this.scene.add.text(this.PANEL_WIDTH / 2 - 25, -this.PANEL_HEIGHT / 2 + 20, 'X', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ff4444',
      fontStyle: 'bold'
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#ff6666'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#ff4444'));
    this.closeButton.on('pointerdown', () => this.close());
    this.add(this.closeButton);

    // Instructions
    this.instructionText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 55, 'Click skill → Click slot to assign | Right-click slot → Press key to bind', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#aaaaaa'
    });
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);

    // Waiting for key text (hidden by default)
    this.waitingForKeyText = this.scene.add.text(0, 0, 'Press any key...', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffff00',
      backgroundColor: '#000000cc',
      padding: { x: 20, y: 10 }
    });
    this.waitingForKeyText.setOrigin(0.5);
    this.waitingForKeyText.setVisible(false);
    this.add(this.waitingForKeyText);
  }

  private createHotkeySlots(): void {
    const defaultKeys = [
      { code: 'A', display: 'A' },
      { code: 'S', display: 'S' },
      { code: 'D', display: 'D' },
      { code: 'F', display: 'F' },
      { code: 'G', display: 'G' },
      { code: 'H', display: 'H' }
    ];

    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + 10) - 10;
    const startX = -totalWidth / 2 + this.SLOT_SIZE / 2;
    const slotY = -this.PANEL_HEIGHT / 2 + 120;

    // Label
    const label = this.scene.add.text(0, slotY - 30, 'HOTKEY SLOTS (Right-click to change key)', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#888888'
    });
    label.setOrigin(0.5);
    this.add(label);

    for (let i = 0; i < this.NUM_SLOTS; i++) {
      const slotX = startX + i * (this.SLOT_SIZE + 10);

      // Slot background
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x333344, 1);
      graphics.fillRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
      graphics.lineStyle(2, 0x555577, 1);
      graphics.strokeRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
      this.add(graphics);

      // Key label (editable)
      const keyText = this.scene.add.text(slotX, slotY - this.SLOT_SIZE / 2 + 12, defaultKeys[i].display, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffff00',
        fontStyle: 'bold'
      });
      keyText.setOrigin(0.5);
      this.add(keyText);

      // Skill name text
      const skillText = this.scene.add.text(slotX, slotY + 10, '', {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ffffff',
        align: 'center'
      });
      skillText.setOrigin(0.5);
      this.add(skillText);

      // Make slot interactive
      const hitArea = this.scene.add.rectangle(slotX, slotY, this.SLOT_SIZE, this.SLOT_SIZE, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          this.startKeyBinding(i);
        } else {
          this.onSlotClick(i);
        }
      });
      hitArea.on('pointerover', () => this.highlightSlot(i, true));
      hitArea.on('pointerout', () => this.highlightSlot(i, false));
      this.add(hitArea);

      this.skillSlots.push({
        graphics,
        skillText,
        keyText,
        skill: null,
        keyCode: defaultKeys[i].code,
        keyDisplay: defaultKeys[i].display
      });
    }
  }

  private createSkillList(): void {
    const skills = Object.values(SKILLS);
    const startY = -this.PANEL_HEIGHT / 2 + 210;
    const skillsPerRow = 4;
    const skillButtonWidth = 100;
    const skillButtonHeight = 60;
    const padding = 15;

    // Label
    const label = this.scene.add.text(0, startY - 30, 'AVAILABLE SKILLS (Click to select)', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#888888'
    });
    label.setOrigin(0.5);
    this.add(label);

    skills.forEach((skill, index) => {
      const row = Math.floor(index / skillsPerRow);
      const col = index % skillsPerRow;

      const totalWidth = skillsPerRow * (skillButtonWidth + padding) - padding;
      const startX = -totalWidth / 2 + skillButtonWidth / 2;

      const x = startX + col * (skillButtonWidth + padding);
      const y = startY + row * (skillButtonHeight + padding);

      const button = this.createSkillButton(skill, x, y, skillButtonWidth, skillButtonHeight);
      this.availableSkillButtons.push(button);
      this.add(button);
    });
  }

  private createSkillButton(skill: SkillDefinition, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(this.getSkillColor(skill), 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(2, 0x666688, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    container.add(bg);

    // Skill name
    const nameText = this.scene.add.text(0, -8, skill.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
      align: 'center'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // MP cost
    const mpText = this.scene.add.text(0, 10, `${skill.mpCost} MP`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#6699ff'
    });
    mpText.setOrigin(0.5);
    container.add(mpText);

    // Make interactive
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.onSkillClick(skill, container));
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(this.getSkillColor(skill), 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.lineStyle(3, 0xffff00, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(this.getSkillColor(skill), 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.lineStyle(2, this.selectedSkill === skill ? 0xffff00 : 0x666688, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    });
    container.add(hitArea);

    container.setData('skill', skill);
    container.setData('bg', bg);
    container.setData('width', width);
    container.setData('height', height);

    return container;
  }

  private setupKeyListener(): void {
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.isOpen) return;
      if (this.selectedSlotForKeyBind === -1) return;

      // Get key display name
      const keyDisplay = this.getKeyDisplayName(event.code, event.key);
      const keyCode = this.getPhaserKeyCode(event.code);

      if (keyCode) {
        this.bindKeyToSlot(this.selectedSlotForKeyBind, keyCode, keyDisplay);
        this.selectedSlotForKeyBind = -1;
        this.waitingForKeyText.setVisible(false);
      }
    });
  }

  private getKeyDisplayName(code: string, key: string): string {
    // Special keys
    const specialKeys: Record<string, string> = {
      'Space': 'SPC',
      'ShiftLeft': 'LSH',
      'ShiftRight': 'RSH',
      'ControlLeft': 'LCT',
      'ControlRight': 'RCT',
      'AltLeft': 'LAL',
      'AltRight': 'RAL',
      'Tab': 'TAB',
      'CapsLock': 'CAP',
      'Escape': 'ESC',
      'Backquote': '`',
      'Minus': '-',
      'Equal': '=',
      'BracketLeft': '[',
      'BracketRight': ']',
      'Backslash': '\\',
      'Semicolon': ';',
      'Quote': "'",
      'Comma': ',',
      'Period': '.',
      'Slash': '/',
    };

    if (specialKeys[code]) return specialKeys[code];

    // Number keys
    if (code.startsWith('Digit')) return code.replace('Digit', '');

    // Numpad
    if (code.startsWith('Numpad')) return 'N' + code.replace('Numpad', '');

    // Letter keys
    if (code.startsWith('Key')) return code.replace('Key', '');

    // Function keys
    if (code.startsWith('F') && code.length <= 3) return code;

    return key.toUpperCase().substring(0, 3);
  }

  private getPhaserKeyCode(code: string): string | null {
    // Convert browser key code to Phaser key code
    const mapping: Record<string, string> = {
      'Space': 'SPACE',
      'ShiftLeft': 'SHIFT',
      'ShiftRight': 'SHIFT',
      'ControlLeft': 'CTRL',
      'ControlRight': 'CTRL',
      'AltLeft': 'ALT',
      'AltRight': 'ALT',
      'Tab': 'TAB',
      'Escape': 'ESC',
      'Backquote': 'BACKTICK',
      'Minus': 'MINUS',
      'Equal': 'PLUS',
      'BracketLeft': 'OPEN_BRACKET',
      'BracketRight': 'CLOSED_BRACKET',
      'Backslash': 'BACK_SLASH',
      'Semicolon': 'SEMICOLON',
      'Quote': 'QUOTES',
      'Comma': 'COMMA',
      'Period': 'PERIOD',
      'Slash': 'FORWARD_SLASH',
    };

    if (mapping[code]) return mapping[code];

    // Number keys
    if (code.startsWith('Digit')) {
      const num = code.replace('Digit', '');
      const numNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
      return numNames[parseInt(num)];
    }

    // Letter keys
    if (code.startsWith('Key')) return code.replace('Key', '');

    // Function keys
    if (code.startsWith('F') && code.length <= 3) return code;

    return null;
  }

  private startKeyBinding(slotIndex: number): void {
    this.selectedSlotForKeyBind = slotIndex;
    this.waitingForKeyText.setVisible(true);
    this.instructionText.setText(`Press any key for slot ${slotIndex + 1}...`);
    this.instructionText.setColor('#ffff00');
  }

  private bindKeyToSlot(slotIndex: number, keyCode: string, keyDisplay: string): void {
    const slot = this.skillSlots[slotIndex];
    slot.keyCode = keyCode;
    slot.keyDisplay = keyDisplay;
    slot.keyText.setText(keyDisplay);

    if (this.onKeyBound) {
      this.onKeyBound(slotIndex, keyCode, keyDisplay);
    }

    this.instructionText.setText(`Bound "${keyDisplay}" to slot ${slotIndex + 1}`);
    this.instructionText.setColor('#88ff88');
  }

  private getSkillColor(skill: SkillDefinition): number {
    switch (skill.type) {
      case 'attack': return 0x442222;
      case 'buff': return 0x224422;
      default: return 0x222244;
    }
  }

  private onSkillClick(skill: SkillDefinition, container: Phaser.GameObjects.Container): void {
    // Deselect previous
    this.availableSkillButtons.forEach(btn => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Graphics;
      const s = btn.getData('skill') as SkillDefinition;
      const w = btn.getData('width') as number;
      const h = btn.getData('height') as number;
      bg.clear();
      bg.fillStyle(this.getSkillColor(s), 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.lineStyle(2, 0x666688, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    });

    // Select new
    this.selectedSkill = skill;
    const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
    const w = container.getData('width') as number;
    const h = container.getData('height') as number;
    bg.clear();
    bg.fillStyle(this.getSkillColor(skill), 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(3, 0xffff00, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    this.instructionText.setText(`Selected: ${skill.name} - Click a slot to assign`);
    this.instructionText.setColor('#ffff00');
  }

  private onSlotClick(slotIndex: number): void {
    if (this.selectedSkill) {
      const slot = this.skillSlots[slotIndex];
      slot.skill = this.selectedSkill;
      slot.skillText.setText(this.selectedSkill.name.substring(0, 8));

      // Update slot visual
      this.updateSlotVisual(slotIndex);

      if (this.onSkillAssigned) {
        this.onSkillAssigned(slotIndex, this.selectedSkill);
      }

      this.instructionText.setText(`Assigned ${this.selectedSkill.name} to slot ${slotIndex + 1}`);
      this.instructionText.setColor('#88ff88');

      this.selectedSkill = null;
    } else {
      this.instructionText.setText('Select a skill first, then click a slot');
      this.instructionText.setColor('#ff8888');
    }
  }

  private updateSlotVisual(slotIndex: number): void {
    const slot = this.skillSlots[slotIndex];
    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + 10) - 10;
    const startX = -totalWidth / 2 + this.SLOT_SIZE / 2;
    const slotX = startX + slotIndex * (this.SLOT_SIZE + 10);
    const slotY = -this.PANEL_HEIGHT / 2 + 120;

    slot.graphics.clear();
    slot.graphics.fillStyle(slot.skill ? this.getSkillColor(slot.skill) : 0x333344, 1);
    slot.graphics.fillRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
    slot.graphics.lineStyle(2, 0x88ff88, 1);
    slot.graphics.strokeRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
  }

  private highlightSlot(slotIndex: number, highlight: boolean): void {
    const slot = this.skillSlots[slotIndex];
    const totalWidth = this.NUM_SLOTS * (this.SLOT_SIZE + 10) - 10;
    const startX = -totalWidth / 2 + this.SLOT_SIZE / 2;
    const slotX = startX + slotIndex * (this.SLOT_SIZE + 10);
    const slotY = -this.PANEL_HEIGHT / 2 + 120;

    slot.graphics.clear();
    slot.graphics.fillStyle(slot.skill ? this.getSkillColor(slot.skill) : 0x333344, 1);
    slot.graphics.fillRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
    slot.graphics.lineStyle(2, highlight ? 0xffff00 : (slot.skill ? 0x88ff88 : 0x555577), 1);
    slot.graphics.strokeRoundedRect(slotX - this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 6);
  }

  setSkillAssignedCallback(callback: (slotIndex: number, skill: SkillDefinition) => void): void {
    this.onSkillAssigned = callback;
  }

  setKeyBoundCallback(callback: (slotIndex: number, keyCode: string, keyDisplay: string) => void): void {
    this.onKeyBound = callback;
  }

  setCurrentSkills(skills: (SkillDefinition | null)[]): void {
    skills.forEach((skill, index) => {
      if (skill && index < this.skillSlots.length) {
        this.skillSlots[index].skill = skill;
        this.skillSlots[index].skillText.setText(skill.name.substring(0, 8));
        this.updateSlotVisual(index);
      }
    });
  }

  setCurrentKeys(keys: { keyCode: string; keyDisplay: string }[]): void {
    keys.forEach((key, index) => {
      if (index < this.skillSlots.length) {
        this.skillSlots[index].keyCode = key.keyCode;
        this.skillSlots[index].keyDisplay = key.keyDisplay;
        this.skillSlots[index].keyText.setText(key.keyDisplay);
      }
    });
  }

  open(): void {
    this.isOpen = true;
    this.setVisible(true);
    this.selectedSkill = null;
    this.selectedSlotForKeyBind = -1;
    this.waitingForKeyText.setVisible(false);
    this.instructionText.setText('Click skill → Click slot to assign | Right-click slot → Press key to bind');
    this.instructionText.setColor('#aaaaaa');
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.selectedSlotForKeyBind = -1;
    this.waitingForKeyText.setVisible(false);
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
