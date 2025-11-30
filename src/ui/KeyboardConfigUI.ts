import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { getSkillsForJobAndLevel, SKILLS } from '../skills/SkillData';
import { JobId, getJob } from '../systems/JobData';
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
  INVENTORY: { id: 'INVENTORY', name: 'Inventory', color: 0x8b4513 },
  EQUIPMENT: { id: 'EQUIPMENT', name: 'Equip', color: 0x4a6fa5 },
  SAVE: { id: 'SAVE', name: 'Save', color: 0x228b22 },
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

// Tab types for organizing skills/actions
type TabType = 'beginner' | 'job1' | 'actions';

export class KeyboardConfigUI extends Phaser.GameObjects.Container {
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  private keySlots: KeySlot[] = [];
  private bindingButtons: { container: Phaser.GameObjects.Container; binding: BindingType; bg: Phaser.GameObjects.Graphics; width: number; height: number }[] = [];

  // Selection state
  private selectedBinding: BindingType | null = null;
  private selectedBindingButton: Phaser.GameObjects.Container | null = null;

  private readonly PANEL_WIDTH = 750;
  private readonly PANEL_HEIGHT = 520;
  private readonly KEY_SIZE = 40;
  private readonly KEY_SPACING = 4;

  public isOpen: boolean = false;

  private onSkillBindingsChanged: ((bindings: Map<string, SkillDefinition>) => void) | null = null;
  private onActionBindingsChanged: ((bindings: Map<string, ActionDefinition>) => void) | null = null;

  private skillBindings: Map<string, SkillDefinition> = new Map();
  private actionBindings: Map<string, ActionDefinition> = new Map();

  private currentJob: JobId = JobId.BEGINNER;
  private currentLevel: number = 1;

  // Tab system
  private currentTab: TabType = 'beginner';
  private tabs: { type: TabType; label: string; button: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics }[] = [];
  private skillsContainer!: Phaser.GameObjects.Container;
  private tabContentY: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createKeyboard();
    this.createTabs();
    this.createSkillsContainer();
    this.refreshTabContent();

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

    // Main panel - MapleStory dark brown/orange style
    this.panel = this.scene.add.graphics();

    // Outer border
    this.panel.fillStyle(0x4a3728, 1);
    this.panel.fillRoundedRect(-this.PANEL_WIDTH / 2 - 4, -this.PANEL_HEIGHT / 2 - 4, this.PANEL_WIDTH + 8, this.PANEL_HEIGHT + 8, 8);

    // Main panel background
    this.panel.fillStyle(0x2a2218, 0.98);
    this.panel.fillRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 6);

    // Inner highlight
    this.panel.lineStyle(2, 0x6a5738, 1);
    this.panel.strokeRoundedRect(-this.PANEL_WIDTH / 2 + 2, -this.PANEL_HEIGHT / 2 + 2, this.PANEL_WIDTH - 4, this.PANEL_HEIGHT - 4, 4);
    this.add(this.panel);

    // Title bar
    const titleBar = this.scene.add.graphics();
    titleBar.fillStyle(0x4a3728, 1);
    titleBar.fillRect(-this.PANEL_WIDTH / 2 + 10, -this.PANEL_HEIGHT / 2 + 10, this.PANEL_WIDTH - 20, 30);
    this.add(titleBar);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 25, 'KEY CONFIGURATION', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    this.closeButton = this.scene.add.text(this.PANEL_WIDTH / 2 - 25, -this.PANEL_HEIGHT / 2 + 25, 'X', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ff6666',
      fontStyle: 'bold'
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#ff9999'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#ff6666'));
    this.closeButton.on('pointerdown', () => this.close());
    this.add(this.closeButton);

    // Instructions
    this.instructionText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 52,
      'Click a skill/action, then click a key to assign. Right-click key to clear.', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#aaaaaa'
    });
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);
  }

  private createKeyboard(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 75;

    // Keyboard section label
    const keyboardLabel = this.scene.add.text(-this.PANEL_WIDTH / 2 + 20, startY - 5, 'KEYBOARD', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#888888',
      fontStyle: 'bold'
    });
    this.add(keyboardLabel);

    // Keyboard rows - QWERTY layout (compact)
    const rows = [
      { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], codes: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0 },
      { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], codes: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.2 },
      { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], codes: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.4 },
      { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], codes: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], widths: [1, 1, 1, 1, 1, 1, 1], offset: 0.8 },
      { keys: ['TAB', 'SPACE'], codes: ['TAB', 'SPACE'], widths: [1.2, 4], offset: 1.5 }
    ];

    const keyboardWidth = 10 * (this.KEY_SIZE + this.KEY_SPACING);
    const startX = -keyboardWidth / 2;
    const keyStartY = startY + 15;

    rows.forEach((row, rowIndex) => {
      let x = startX + (row.offset || 0) * (this.KEY_SIZE + this.KEY_SPACING);
      const y = keyStartY + rowIndex * (this.KEY_SIZE + this.KEY_SPACING);

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
    const keyLabel = this.scene.add.text(x + width / 2, y + 10, display, {
      fontFamily: 'Arial',
      fontSize: display.length > 3 ? '8px' : '10px',
      color: '#666666',
      fontStyle: 'bold'
    });
    keyLabel.setOrigin(0.5);
    this.add(keyLabel);

    // Binding label at bottom
    const bindingLabel = this.scene.add.text(x + width / 2, y + 26, '', {
      fontFamily: 'Arial',
      fontSize: '8px',
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
        const name = this.selectedBinding.name;
        this.instructionText.setText(`Assign "${name}" to [${display}]`);
        this.instructionText.setColor('#ffff00');
      }
    });

    hitArea.on('pointerout', () => {
      this.drawKeyBackground(graphics, x, y, width, false, slot.binding);
      if (this.selectedBinding) {
        const name = this.selectedBinding.name;
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
          const name = this.selectedBinding.name;
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
      graphics.fillStyle(0x3a3228, 1);
    }
    graphics.fillRoundedRect(x, y, width, this.KEY_SIZE, 3);

    const borderColor = highlighted ? 0xffff00 : (binding ? 0x88aacc : 0x5a4a38);
    graphics.lineStyle(highlighted ? 2 : 1, borderColor, 1);
    graphics.strokeRoundedRect(x, y, width, this.KEY_SIZE, 3);
  }

  private createTabs(): void {
    this.tabContentY = this.PANEL_HEIGHT / 2 - 185;
    const tabY = this.tabContentY - 30;
    const tabWidth = 100;
    const tabHeight = 25;
    const tabSpacing = 5;
    const startX = -this.PANEL_WIDTH / 2 + 20;

    const tabDefs: { type: TabType; label: string }[] = [
      { type: 'beginner', label: 'Beginner' },
      { type: 'job1', label: this.getJobTabLabel() },
      { type: 'actions', label: 'Actions' }
    ];

    tabDefs.forEach((tabDef, index) => {
      const x = startX + index * (tabWidth + tabSpacing) + tabWidth / 2;
      const container = this.scene.add.container(x, tabY);

      const bg = this.scene.add.graphics();
      container.add(bg);

      const label = this.scene.add.text(0, 0, tabDef.label, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      label.setOrigin(0.5);
      container.add(label);

      const hitArea = this.scene.add.rectangle(0, 0, tabWidth, tabHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      this.add(container);

      const tab = { type: tabDef.type, label: tabDef.label, button: container, bg };
      this.tabs.push(tab);

      hitArea.on('pointerdown', () => {
        this.currentTab = tabDef.type;
        this.refreshTabContent();
      });

      this.drawTab(tab, tabWidth, tabHeight, tabDef.type === this.currentTab);
    });
  }

  private drawTab(tab: { type: TabType; label: string; bg: Phaser.GameObjects.Graphics }, width: number, height: number, selected: boolean): void {
    const bg = tab.bg;
    bg.clear();

    if (selected) {
      bg.fillStyle(0x4a3728, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, { tl: 4, tr: 4, bl: 0, br: 0 });
      bg.lineStyle(2, 0xffd700, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, { tl: 4, tr: 4, bl: 0, br: 0 });
    } else {
      bg.fillStyle(0x2a2218, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, { tl: 4, tr: 4, bl: 0, br: 0 });
      bg.lineStyle(1, 0x5a4a38, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, { tl: 4, tr: 4, bl: 0, br: 0 });
    }
  }

  private getJobTabLabel(): string {
    if (this.currentJob === JobId.BEGINNER) {
      return '1st Job';
    }
    const jobDef = getJob(this.currentJob);
    return jobDef.name;
  }

  private createSkillsContainer(): void {
    // Container panel for skills/actions
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x1a1810, 1);
    panelBg.fillRect(-this.PANEL_WIDTH / 2 + 15, this.tabContentY - 5, this.PANEL_WIDTH - 30, 160);
    panelBg.lineStyle(1, 0x4a3a28, 1);
    panelBg.strokeRect(-this.PANEL_WIDTH / 2 + 15, this.tabContentY - 5, this.PANEL_WIDTH - 30, 160);
    this.add(panelBg);

    this.skillsContainer = this.scene.add.container(0, 0);
    this.add(this.skillsContainer);
  }

  private refreshTabContent(): void {
    // Clear existing buttons
    this.skillsContainer.removeAll(true);
    this.bindingButtons = this.bindingButtons.filter(b => !this.skillsContainer.exists(b.container));
    this.bindingButtons = [];

    // Update tab appearances
    const tabWidth = 100;
    const tabHeight = 25;
    this.tabs.forEach(tab => {
      this.drawTab(tab, tabWidth, tabHeight, tab.type === this.currentTab);
      // Update job tab label
      if (tab.type === 'job1') {
        const label = tab.button.list[1] as Phaser.GameObjects.Text;
        label.setText(this.getJobTabLabel());
      }
    });

    // Populate based on current tab
    switch (this.currentTab) {
      case 'beginner':
        this.createBeginnerSkillButtons();
        break;
      case 'job1':
        this.createJobSkillButtons();
        break;
      case 'actions':
        this.createActionButtons();
        break;
    }
  }

  private createBeginnerSkillButtons(): void {
    const skills = Object.values(SKILLS).filter(s => s.job === JobId.BEGINNER);
    this.createSkillGrid(skills);
  }

  private createJobSkillButtons(): void {
    if (this.currentJob === JobId.BEGINNER) {
      // Show a message that no job skills are available
      const text = this.scene.add.text(0, this.tabContentY + 70, 'Advance to a job at level 10 to unlock job skills!', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#888888'
      });
      text.setOrigin(0.5);
      this.skillsContainer.add(text);
      return;
    }

    const skills = Object.values(SKILLS).filter(s => s.job === this.currentJob);
    this.createSkillGrid(skills);
  }

  private createSkillGrid(skills: SkillDefinition[]): void {
    const buttonWidth = 95;
    const buttonHeight = 45;
    const spacingX = 8;
    const spacingY = 8;
    const buttonsPerRow = 7;
    const startX = -this.PANEL_WIDTH / 2 + 25 + buttonWidth / 2;
    const startY = this.tabContentY + 10 + buttonHeight / 2;

    skills.forEach((skill, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const x = startX + col * (buttonWidth + spacingX);
      const y = startY + row * (buttonHeight + spacingY);

      // Check if skill is available at current level
      const available = skill.requiredLevel <= this.currentLevel;
      this.createSkillButton(skill, x, y, buttonWidth, buttonHeight, available);
    });
  }

  private createActionButtons(): void {
    const actions = Object.values(ACTIONS);
    const buttonWidth = 85;
    const buttonHeight = 40;
    const spacingX = 8;
    const spacingY = 8;
    const buttonsPerRow = 5;
    const startX = -this.PANEL_WIDTH / 2 + 25 + buttonWidth / 2;
    const startY = this.tabContentY + 10 + buttonHeight / 2;

    actions.forEach((action, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const x = startX + col * (buttonWidth + spacingX);
      const y = startY + row * (buttonHeight + spacingY);
      this.createActionButton(action, x, y, buttonWidth, buttonHeight);
    });
  }

  private createSkillButton(skill: SkillDefinition, x: number, y: number, width: number, height: number, available: boolean): void {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    this.drawSkillButton(bg, skill, width, height, false, false, available);
    container.add(bg);

    // Skill icon placeholder (colored box based on type)
    const iconSize = 24;
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(this.getSkillColor(skill), 1);
    iconBg.fillRoundedRect(-iconSize/2, -height/2 + 4, iconSize, iconSize, 3);
    iconBg.lineStyle(1, 0xffffff, 0.3);
    iconBg.strokeRoundedRect(-iconSize/2, -height/2 + 4, iconSize, iconSize, 3);
    container.add(iconBg);

    // Skill type indicator
    const typeIndicator = skill.type === 'buff' ? 'B' : skill.type === 'attack' ? 'A' : 'M';
    const typeText = this.scene.add.text(0, -height/2 + 16, typeIndicator, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    typeText.setOrigin(0.5);
    container.add(typeText);

    // Name
    const nameText = this.scene.add.text(0, height/2 - 16, skill.name, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: available ? '#ffffff' : '#666666',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Level requirement if not available
    if (!available) {
      const lvlText = this.scene.add.text(0, height/2 - 6, `Lv.${skill.requiredLevel}`, {
        fontFamily: 'Arial',
        fontSize: '8px',
        color: '#ff6666'
      });
      lvlText.setOrigin(0.5);
      container.add(lvlText);
    } else {
      // MP cost
      const mpText = this.scene.add.text(0, height/2 - 6, `${skill.mpCost} MP`, {
        fontFamily: 'Arial',
        fontSize: '8px',
        color: '#6699ff'
      });
      mpText.setOrigin(0.5);
      container.add(mpText);
    }

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: available });
    container.add(hitArea);

    this.bindingButtons.push({ container, binding: skill, bg, width, height });
    this.skillsContainer.add(container);

    if (available) {
      hitArea.on('pointerover', () => {
        if (this.selectedBinding !== skill) {
          this.drawSkillButton(bg, skill, width, height, false, true, true);
        }
      });

      hitArea.on('pointerout', () => {
        if (this.selectedBinding !== skill) {
          this.drawSkillButton(bg, skill, width, height, false, false, true);
        }
      });

      hitArea.on('pointerdown', () => {
        this.selectBinding(skill, container, bg, width, height);
      });
    }
  }

  private createActionButton(action: ActionDefinition, x: number, y: number, width: number, height: number): void {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    this.drawActionButton(bg, action, width, height, false, false);
    container.add(bg);

    // Name
    const nameText = this.scene.add.text(0, 0, action.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    this.bindingButtons.push({ container, binding: action, bg, width, height });
    this.skillsContainer.add(container);

    hitArea.on('pointerover', () => {
      if (this.selectedBinding !== action) {
        this.drawActionButton(bg, action, width, height, false, true);
      }
    });

    hitArea.on('pointerout', () => {
      if (this.selectedBinding !== action) {
        this.drawActionButton(bg, action, width, height, false, false);
      }
    });

    hitArea.on('pointerdown', () => {
      this.selectBinding(action, container, bg, width, height);
    });
  }

  private drawSkillButton(bg: Phaser.GameObjects.Graphics, skill: SkillDefinition, width: number, height: number, selected: boolean, hovered: boolean, available: boolean): void {
    bg.clear();

    const baseColor = available ? this.getSkillColor(skill) : 0x2a2a2a;
    const alpha = available ? 1 : 0.5;
    bg.fillStyle(selected ? 0x445566 : baseColor, alpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    const borderColor = selected ? 0xffd700 : (hovered ? 0xaaaaff : (available ? 0x666666 : 0x333333));
    const borderWidth = selected ? 2 : 1;
    bg.lineStyle(borderWidth, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
  }

  private drawActionButton(bg: Phaser.GameObjects.Graphics, action: ActionDefinition, width: number, height: number, selected: boolean, hovered: boolean): void {
    bg.clear();

    bg.fillStyle(selected ? 0x445566 : action.color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    const borderColor = selected ? 0xffd700 : (hovered ? 0xaaaaff : 0x666666);
    const borderWidth = selected ? 2 : 1;
    bg.lineStyle(borderWidth, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
  }

  private selectBinding(binding: BindingType, container: Phaser.GameObjects.Container, bg: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Deselect previous
    if (this.selectedBindingButton) {
      const prev = this.bindingButtons.find(b => b.container === this.selectedBindingButton);
      if (prev) {
        if (isSkill(prev.binding)) {
          const available = (prev.binding as SkillDefinition).requiredLevel <= this.currentLevel;
          this.drawSkillButton(prev.bg, prev.binding as SkillDefinition, prev.width, prev.height, false, false, available);
        } else {
          this.drawActionButton(prev.bg, prev.binding as ActionDefinition, prev.width, prev.height, false, false);
        }
      }
    }

    this.selectedBinding = binding;
    this.selectedBindingButton = container;

    if (isSkill(binding)) {
      this.drawSkillButton(bg, binding, width, height, true, false, true);
    } else {
      this.drawActionButton(bg, binding as ActionDefinition, width, height, true, false);
    }

    this.instructionText.setText(`Selected: ${binding.name} - Click a key to assign`);
    this.instructionText.setColor('#ffff00');
  }

  private getSkillColor(skill: SkillDefinition): number {
    // Color based on job
    switch (skill.job) {
      case JobId.WARRIOR: return 0x8b4513;
      case JobId.MAGE: return 0x4169e1;
      case JobId.ARCHER: return 0x228b22;
      case JobId.THIEF: return 0x663399;
      default: return 0x556b2f; // Beginner - olive
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
    slot.bindingLabel.setText(binding.name.substring(0, 5));
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

  clearAllBindings(): void {
    this.keySlots.forEach(slot => {
      slot.binding = null;
      slot.bindingLabel.setText('');
      this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, null);
    });
    this.skillBindings.clear();
    this.actionBindings.clear();
  }

  setInitialBindings(skillBindings: Map<string, SkillDefinition>, actionBindings: Map<string, ActionDefinition>): void {
    this.clearAllBindings();

    skillBindings.forEach((skill, keyCode) => {
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = skill;
        slot.bindingLabel.setText(skill.name.substring(0, 5));
        this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, skill);
        this.skillBindings.set(keyCode, skill);
      }
    });

    actionBindings.forEach((action, keyCode) => {
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = action;
        slot.bindingLabel.setText(action.name.substring(0, 5));
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
    this.refreshTabContent();
    this.instructionText.setText('Click a skill/action, then click a key to assign. Right-click key to clear.');
    this.instructionText.setColor('#aaaaaa');
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.selectedBinding = null;
    this.selectedBindingButton = null;
  }

  updateJobAndLevel(job: JobId, level: number): void {
    const jobChanged = this.currentJob !== job;
    const levelChanged = this.currentLevel !== level;

    if (!jobChanged && !levelChanged) return;

    this.currentJob = job;
    this.currentLevel = level;

    // Refresh the current tab to update available skills
    if (this.isOpen) {
      this.refreshTabContent();
    }

    // Clear any skill bindings that are no longer available
    const availableSkills = getSkillsForJobAndLevel(job, level);
    const availableSkillIds = new Set(availableSkills.map(s => s.id));

    this.keySlots.forEach(slot => {
      if (slot.binding && isSkill(slot.binding)) {
        if (!availableSkillIds.has(slot.binding.id)) {
          this.clearKeySlot(slot);
        }
      }
    });
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
