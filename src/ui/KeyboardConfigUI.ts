import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { SKILLS } from '../skills/SkillData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

// Action definitions for non-skill bindings
export interface ActionDefinition {
  id: string;
  name: string;
  color: number;
}

export const ACTIONS: Record<string, ActionDefinition> = {
  JUMP: { id: 'JUMP', name: 'Jump', color: 0x4466aa },
  ATTACK: { id: 'ATTACK', name: 'Attack', color: 0xaa4444 },
  PICKUP: { id: 'PICKUP', name: 'Pick Up', color: 0x44aa44 },
  SKILL_BAR: { id: 'SKILL_BAR', name: 'Skill Bar', color: 0x666688 },
  INTERACT: { id: 'INTERACT', name: 'Interact', color: 0xaa8844 },
  HP_POTION: { id: 'HP_POTION', name: 'HP Potion', color: 0xff6b6b },
  MP_POTION: { id: 'MP_POTION', name: 'MP Potion', color: 0x4ecdc4 },
};

type BindingType = SkillDefinition | ActionDefinition;

interface KeySlot {
  key: string;
  display: string;
  x: number;
  y: number;
  width: number;
  binding: BindingType | null;
  graphics: Phaser.GameObjects.Graphics;
  keyLabel: Phaser.GameObjects.Text;
  bindingLabel: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
}

function isSkill(binding: BindingType): binding is SkillDefinition {
  return 'mpCost' in binding;
}

function isAction(binding: BindingType): binding is ActionDefinition {
  return !('mpCost' in binding);
}

export class KeyboardConfigUI extends Phaser.GameObjects.Container {
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  private keySlots: KeySlot[] = [];
  private bindingButtons: { container: Phaser.GameObjects.Container; binding: BindingType; bg: Phaser.GameObjects.Graphics }[] = [];

  // Selection state
  private selectedBinding: BindingType | null = null;
  private selectedBindingButton: Phaser.GameObjects.Container | null = null;

  private readonly PANEL_WIDTH = 700;
  private readonly PANEL_HEIGHT = 500;
  private readonly KEY_SIZE = 44;
  private readonly KEY_SPACING = 6;

  public isOpen: boolean = false;

  private onSkillBindingsChanged: ((bindings: Map<string, SkillDefinition>) => void) | null = null;
  private onActionBindingsChanged: ((bindings: Map<string, ActionDefinition>) => void) | null = null;

  private skillBindings: Map<string, SkillDefinition> = new Map();
  private actionBindings: Map<string, ActionDefinition> = new Map();

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createKeyboard();
    this.createBindingPalettes();

    scene.add.existing(this);
    this.setDepth(3000);
    this.setVisible(false);
  }

  private createPanel(): void {
    // Dark overlay
    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(0x000000, 0.7);
    this.overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.add(this.overlay);

    // Main panel
    this.panel = this.scene.add.graphics();
    this.panel.fillStyle(0x1a1a2e, 0.98);
    this.panel.fillRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 12);
    this.panel.lineStyle(3, 0x4a4a6a, 1);
    this.panel.strokeRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 12);
    this.add(this.panel);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 25, 'KEY BINDINGS', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffcc00',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    this.closeButton = this.scene.add.text(this.PANEL_WIDTH / 2 - 30, -this.PANEL_HEIGHT / 2 + 20, 'X', {
      fontFamily: 'Arial',
      fontSize: '28px',
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
    this.instructionText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 55,
      'Click an action or skill, then click a key to assign. Right-click to clear.', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#aaaaaa'
    });
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);
  }

  private createKeyboard(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 85;

    // Keyboard rows - QWERTY layout
    const rows = [
      { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], codes: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0 },
      { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], codes: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.25 },
      { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], codes: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.5 },
      { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], codes: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], widths: [1, 1, 1, 1, 1, 1, 1], offset: 1.0 },
      { keys: ['TAB', 'SPACE'], codes: ['TAB', 'SPACE'], widths: [1.5, 5], offset: 1.75 }
    ];

    const keyboardWidth = 10 * (this.KEY_SIZE + this.KEY_SPACING);
    const startX = -keyboardWidth / 2;

    rows.forEach((row, rowIndex) => {
      let x = startX + (row.offset || 0) * (this.KEY_SIZE + this.KEY_SPACING);
      const y = startY + rowIndex * (this.KEY_SIZE + this.KEY_SPACING);

      row.keys.forEach((keyDisplay, keyIndex) => {
        const keyWidth = this.KEY_SIZE * row.widths[keyIndex] + (row.widths[keyIndex] - 1) * this.KEY_SPACING;
        const keyCode = row.codes[keyIndex];

        this.createKeySlot(keyCode, keyDisplay, x, y, keyWidth);
        x += keyWidth + this.KEY_SPACING;
      });
    });
  }

  private createKeySlot(keyCode: string, display: string, x: number, y: number, width: number): void {
    const graphics = this.scene.add.graphics();
    this.drawKeyBackground(graphics, x, y, width, false, null);
    this.add(graphics);

    // Key label at top of key
    const keyLabel = this.scene.add.text(x + width / 2, y + 12, display, {
      fontFamily: 'Arial',
      fontSize: display.length > 3 ? '10px' : '12px',
      color: '#666666',
      fontStyle: 'bold'
    });
    keyLabel.setOrigin(0.5);
    this.add(keyLabel);

    // Binding label at bottom
    const bindingLabel = this.scene.add.text(x + width / 2, y + 30, '', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#ffcc00',
      fontStyle: 'bold',
      align: 'center'
    });
    bindingLabel.setOrigin(0.5);
    this.add(bindingLabel);

    // Hit area for clicking
    const hitArea = this.scene.add.rectangle(x + width / 2, y + this.KEY_SIZE / 2, width, this.KEY_SIZE, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.add(hitArea);

    const slot: KeySlot = {
      key: keyCode,
      display,
      x,
      y,
      width,
      binding: null,
      graphics,
      keyLabel,
      bindingLabel,
      hitArea
    };
    this.keySlots.push(slot);

    // Hover effect
    hitArea.on('pointerover', () => {
      if (this.selectedBinding) {
        this.drawKeyBackground(graphics, x, y, width, true, slot.binding);
        const name = isSkill(this.selectedBinding) ? this.selectedBinding.name : this.selectedBinding.name;
        this.instructionText.setText(`Assign "${name}" to [${display}]`);
        this.instructionText.setColor('#ffff00');
      }
    });

    hitArea.on('pointerout', () => {
      this.drawKeyBackground(graphics, x, y, width, false, slot.binding);
      if (this.selectedBinding) {
        const name = isSkill(this.selectedBinding) ? this.selectedBinding.name : this.selectedBinding.name;
        this.instructionText.setText(`Selected: ${name} - Click a key to assign`);
      }
    });

    // Click to assign or right-click to clear
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (slot.binding) {
          this.clearKeySlot(slot);
          this.instructionText.setText(`Cleared [${display}]`);
          this.instructionText.setColor('#ff8888');
        }
      } else {
        if (this.selectedBinding) {
          this.bindToKey(slot, this.selectedBinding);
          const name = isSkill(this.selectedBinding) ? this.selectedBinding.name : this.selectedBinding.name;
          this.instructionText.setText(`Assigned "${name}" to [${display}]`);
          this.instructionText.setColor('#88ff88');
        } else {
          this.instructionText.setText('Select an action or skill first');
          this.instructionText.setColor('#ff8888');
        }
      }
    });
  }

  private drawKeyBackground(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, highlighted: boolean, binding: BindingType | null): void {
    graphics.clear();

    if (binding) {
      const color = isSkill(binding) ? this.getSkillColor(binding) : binding.color;
      graphics.fillStyle(color, 1);
    } else {
      graphics.fillStyle(0x2a2a3a, 1);
    }
    graphics.fillRoundedRect(x, y, width, this.KEY_SIZE, 4);

    const borderColor = highlighted ? 0xffff00 : (binding ? 0x88aacc : 0x444466);
    graphics.lineStyle(2, borderColor, 1);
    graphics.strokeRoundedRect(x, y, width, this.KEY_SIZE, 4);
  }

  private createBindingPalettes(): void {
    // Actions section (2 rows now with potions)
    const actionsY = this.PANEL_HEIGHT / 2 - 140;
    this.createActionButtons(actionsY);

    // Skills section (adjusted for 2 rows of actions)
    const skillsY = this.PANEL_HEIGHT / 2 - 50;
    this.createSkillButtons(skillsY);
  }

  private createActionButtons(y: number): void {
    const actions = Object.values(ACTIONS);

    const label = this.scene.add.text(-this.PANEL_WIDTH / 2 + 20, y - 25, 'ACTIONS', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#888888',
      fontStyle: 'bold'
    });
    this.add(label);

    const buttonWidth = 75;
    const buttonHeight = 32;
    const spacing = 8;
    const buttonsPerRow = 5;
    const startX = -this.PANEL_WIDTH / 2 + 20 + buttonWidth / 2;

    actions.forEach((action, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const x = startX + col * (buttonWidth + spacing);
      const rowY = y + row * (buttonHeight + spacing);
      this.createBindingButton(action, x, rowY, buttonWidth, buttonHeight);
    });
  }

  private createSkillButtons(y: number): void {
    const skills = Object.values(SKILLS);

    const label = this.scene.add.text(-this.PANEL_WIDTH / 2 + 20, y - 25, 'SKILLS', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#888888',
      fontStyle: 'bold'
    });
    this.add(label);

    const buttonWidth = 100;
    const buttonHeight = 40;
    const spacing = 10;
    const startX = -this.PANEL_WIDTH / 2 + 20 + buttonWidth / 2;

    skills.forEach((skill, index) => {
      const x = startX + index * (buttonWidth + spacing);
      this.createBindingButton(skill, x, y, buttonWidth, buttonHeight);
    });
  }

  private createBindingButton(binding: BindingType, x: number, y: number, width: number, height: number): void {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    this.drawBindingButton(bg, binding, width, height, false);
    container.add(bg);

    // Name
    const nameText = this.scene.add.text(0, isSkill(binding) ? -5 : 0, binding.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // MP cost for skills
    if (isSkill(binding)) {
      const mpText = this.scene.add.text(0, 10, `${binding.mpCost} MP`, {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#6699ff'
      });
      mpText.setOrigin(0.5);
      container.add(mpText);
    }

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    this.bindingButtons.push({ container, binding, bg });
    this.add(container);

    hitArea.on('pointerover', () => {
      if (this.selectedBinding !== binding) {
        this.drawBindingButton(bg, binding, width, height, false, true);
      }
    });

    hitArea.on('pointerout', () => {
      if (this.selectedBinding !== binding) {
        this.drawBindingButton(bg, binding, width, height, false, false);
      }
    });

    hitArea.on('pointerdown', () => {
      this.selectBinding(binding, container, bg, width, height);
    });
  }

  private drawBindingButton(bg: Phaser.GameObjects.Graphics, binding: BindingType, width: number, height: number, selected: boolean, hovered: boolean = false): void {
    bg.clear();

    const baseColor = isSkill(binding) ? this.getSkillColor(binding) : binding.color;
    bg.fillStyle(selected ? 0x445566 : baseColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

    const borderColor = selected ? 0xffff00 : (hovered ? 0xaaaaff : 0x666688);
    const borderWidth = selected ? 3 : 2;
    bg.lineStyle(borderWidth, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
  }

  private selectBinding(binding: BindingType, container: Phaser.GameObjects.Container, bg: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Deselect previous
    if (this.selectedBindingButton) {
      const prev = this.bindingButtons.find(b => b.container === this.selectedBindingButton);
      if (prev) {
        const prevWidth = isSkill(prev.binding) ? 100 : 80;
        const prevHeight = isSkill(prev.binding) ? 40 : 35;
        this.drawBindingButton(prev.bg, prev.binding, prevWidth, prevHeight, false);
      }
    }

    this.selectedBinding = binding;
    this.selectedBindingButton = container;
    this.drawBindingButton(bg, binding, width, height, true);

    this.instructionText.setText(`Selected: ${binding.name} - Click a key to assign`);
    this.instructionText.setColor('#ffff00');
  }

  private getSkillColor(skill: SkillDefinition): number {
    switch (skill.type) {
      case 'attack': return 0x553333;
      case 'buff': return 0x335533;
      default: return 0x333355;
    }
  }

  private bindToKey(slot: KeySlot, binding: BindingType): void {
    // Remove binding from previous key if bound elsewhere
    this.keySlots.forEach(s => {
      if (s.binding && s !== slot) {
        const sameBinding = isSkill(binding) && isSkill(s.binding)
          ? s.binding.id === binding.id
          : isAction(binding) && isAction(s.binding)
            ? s.binding.id === binding.id
            : false;
        if (sameBinding) {
          this.clearKeySlot(s);
        }
      }
    });

    slot.binding = binding;
    slot.bindingLabel.setText(binding.name.substring(0, 6));
    this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, binding);

    if (isSkill(binding)) {
      this.skillBindings.set(slot.key, binding);
      this.emitSkillBindingsChanged();
    } else {
      this.actionBindings.set(slot.key, binding);
      this.emitActionBindingsChanged();
    }
  }

  private clearKeySlot(slot: KeySlot): void {
    if (slot.binding) {
      if (isSkill(slot.binding)) {
        this.skillBindings.delete(slot.key);
        this.emitSkillBindingsChanged();
      } else {
        this.actionBindings.delete(slot.key);
        this.emitActionBindingsChanged();
      }
    }

    slot.binding = null;
    slot.bindingLabel.setText('');
    this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, null);
  }

  private emitSkillBindingsChanged(): void {
    if (this.onSkillBindingsChanged) {
      this.onSkillBindingsChanged(this.skillBindings);
    }
  }

  private emitActionBindingsChanged(): void {
    if (this.onActionBindingsChanged) {
      this.onActionBindingsChanged(this.actionBindings);
    }
  }

  setOnSkillBindingsChanged(callback: (bindings: Map<string, SkillDefinition>) => void): void {
    this.onSkillBindingsChanged = callback;
  }

  setOnActionBindingsChanged(callback: (bindings: Map<string, ActionDefinition>) => void): void {
    this.onActionBindingsChanged = callback;
  }

  setInitialBindings(skillBindings: Map<string, SkillDefinition>, actionBindings: Map<string, ActionDefinition>): void {
    skillBindings.forEach((skill, keyCode) => {
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = skill;
        slot.bindingLabel.setText(skill.name.substring(0, 6));
        this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, skill);
        this.skillBindings.set(keyCode, skill);
      }
    });

    actionBindings.forEach((action, keyCode) => {
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = action;
        slot.bindingLabel.setText(action.name.substring(0, 6));
        this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, action);
        this.actionBindings.set(keyCode, action);
      }
    });
  }

  getSkillBindings(): Map<string, SkillDefinition> {
    return new Map(this.skillBindings);
  }

  getActionBindings(): Map<string, ActionDefinition> {
    return new Map(this.actionBindings);
  }

  open(): void {
    this.isOpen = true;
    this.setVisible(true);
    this.selectedBinding = null;
    this.selectedBindingButton = null;
    this.bindingButtons.forEach(b => {
      const width = isSkill(b.binding) ? 100 : 80;
      const height = isSkill(b.binding) ? 40 : 35;
      this.drawBindingButton(b.bg, b.binding, width, height, false);
    });
    this.instructionText.setText('Click an action or skill, then click a key to assign. Right-click to clear.');
    this.instructionText.setColor('#aaaaaa');
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.selectedBinding = null;
    this.selectedBindingButton = null;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
