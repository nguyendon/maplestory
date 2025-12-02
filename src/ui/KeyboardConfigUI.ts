import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { SKILLS } from '../skills/SkillData';
import { JobId, getJob } from '../systems/JobData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { UI_COLORS, drawPanel, drawTab, drawContentPanel, createCloseButton, getTitleStyle } from './UITheme';

export interface ActionDefinition {
  id: string;
  name: string;
  color: number;
}

export const ACTIONS: Record<string, ActionDefinition> = {
  JUMP: { id: 'JUMP', name: 'Jump', color: 0x4466aa },
  ATTACK: { id: 'ATTACK', name: 'Attack', color: 0xaa4444 },
  PICKUP: { id: 'PICKUP', name: 'Pick Up', color: 0x44aa44 },
  SKILL_BAR: { id: 'SKILL_BAR', name: 'Skills', color: 0x666688 },
  INTERACT: { id: 'INTERACT', name: 'Interact', color: 0xaa8844 },
  HP_POTION: { id: 'HP_POTION', name: 'HP Pot', color: 0xff6b6b },
  MP_POTION: { id: 'MP_POTION', name: 'MP Pot', color: 0x4ecdc4 },
  INVENTORY: { id: 'INVENTORY', name: 'Inventory', color: 0x8b4513 },
  EQUIPMENT: { id: 'EQUIPMENT', name: 'Equip', color: 0x4a6fa5 },
  STATS: { id: 'STATS', name: 'Stats', color: 0x9966cc },
  SKILL_TREE: { id: 'SKILL_TREE', name: 'Skill Tree', color: 0x66aacc },
  WORLD_MAP: { id: 'WORLD_MAP', name: 'World Map', color: 0x5a8f5a },
  MINIMAP: { id: 'MINIMAP', name: 'Minimap', color: 0x5a7f8a },
  MENU: { id: 'MENU', name: 'Menu', color: 0x6a6a8a },
  SAVE: { id: 'SAVE', name: 'Save', color: 0x228b22 },
  CHAT: { id: 'CHAT', name: 'Chat', color: 0x66cccc },
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

type TabType = 'beginner' | 'job1' | 'actions';

export class KeyboardConfigUI extends Phaser.GameObjects.Container {
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  private keySlots: KeySlot[] = [];
  private bindingButtons: { container: Phaser.GameObjects.Container; binding: BindingType; bg: Phaser.GameObjects.Graphics; width: number; height: number }[] = [];

  private selectedBinding: BindingType | null = null;
  private selectedBindingButton: Phaser.GameObjects.Container | null = null;

  private readonly PANEL_WIDTH = 660;
  private readonly PANEL_HEIGHT = 500;
  private readonly KEY_SIZE = 32;
  private readonly KEY_SPACING = 2;

  public isOpen: boolean = false;

  private onSkillBindingsChanged: ((bindings: Map<string, SkillDefinition>) => void) | null = null;
  private onActionBindingsChanged: ((bindings: Map<string, ActionDefinition>) => void) | null = null;

  private skillBindings: Map<string, SkillDefinition> = new Map();
  private actionBindings: Map<string, ActionDefinition> = new Map();

  private currentJob: JobId = JobId.BEGINNER;
  private currentLevel: number = 1;

  private currentTab: TabType = 'beginner';
  private tabs: { type: TabType; label: string; button: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics }[] = [];
  private skillsContainer!: Phaser.GameObjects.Container;
  private contentAreaY: number = 0;

  // Content panel bounds (calculated once, used everywhere)
  private contentPanelX: number = 0;
  private contentPanelY: number = 0;
  private contentPanelWidth: number = 0;
  private contentPanelHeight: number = 0;

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
    this.overlay.fillStyle(0x000000, 0.75);
    this.overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.add(this.overlay);

    // Main panel using theme
    this.panel = this.scene.add.graphics();
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 16, 'Key Configuration', getTitleStyle());
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    const closeBtn = createCloseButton(this.scene, this.PANEL_WIDTH / 2 - 20, -this.PANEL_HEIGHT / 2 + 16, () => this.close());
    this.add(closeBtn);

    // Instructions
    this.instructionText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 44,
      'Select skill/action, then click a key. Right-click to clear.', {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: UI_COLORS.textGray
      });
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);
  }

  private createKeyboard(): void {
    const startY = -this.PANEL_HEIGHT / 2 + 60;

    // Keyboard section
    const sectionLabel = this.scene.add.text(-this.PANEL_WIDTH / 2 + 20, startY, 'Keyboard', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: UI_COLORS.textGray,
      fontStyle: 'bold'
    });
    this.add(sectionLabel);

    // Keyboard rows - full QWERTY layout with punctuation
    const rows = [
      { keys: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='], codes: ['BACKTICK', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO', 'MINUS', 'PLUS'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0 },
      { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'], codes: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'OPEN_BRACKET', 'CLOSED_BRACKET', 'BACK_SLASH'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.25 },
      { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"], codes: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'SEMICOLON', 'QUOTES'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.5 },
      { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'], codes: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'COMMA', 'PERIOD', 'FORWARD_SLASH'], widths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], offset: 0.9 },
      { keys: ['Tab', 'Space', 'Ent'], codes: ['TAB', 'SPACE', 'ENTER'], widths: [1.3, 4, 1.3], offset: 1.2 }
    ];

    // 13 keys in top row = 13 * (32 + 2) - 2 = 440px
    const keyboardWidth = 13 * (this.KEY_SIZE + this.KEY_SPACING) - this.KEY_SPACING;
    const startX = -keyboardWidth / 2;
    const keyStartY = startY + 18;

    rows.forEach((row, rowIndex) => {
      let x = startX + row.offset * (this.KEY_SIZE + this.KEY_SPACING);
      const y = keyStartY + rowIndex * (this.KEY_SIZE + this.KEY_SPACING);

      row.keys.forEach((keyDisplay, keyIndex) => {
        const keyWidth = this.KEY_SIZE * row.widths[keyIndex] + (row.widths[keyIndex] - 1) * this.KEY_SPACING;
        const keyCode = row.codes[keyIndex];
        this.createKeySlot(keyCode, keyDisplay, x, y, keyWidth);
        x += keyWidth + this.KEY_SPACING;
      });
    });

    // Set content area Y for tabs (below keyboard)
    this.contentAreaY = keyStartY + 5 * (this.KEY_SIZE + this.KEY_SPACING) + 15;
  }

  private createKeySlot(keyCode: string, display: string, x: number, y: number, width: number): void {
    const graphics = this.scene.add.graphics();
    this.drawKeyBackground(graphics, x, y, width, false, null);
    this.add(graphics);

    // Key label
    const keyLabel = this.scene.add.text(x + width / 2, y + 9, display, {
      fontFamily: 'Arial',
      fontSize: display.length > 2 ? '8px' : '9px',
      color: UI_COLORS.textGray,
      fontStyle: 'bold'
    });
    keyLabel.setOrigin(0.5);
    this.add(keyLabel);

    // Binding label
    const bindingLabel = this.scene.add.text(x + width / 2, y + 24, '', {
      fontFamily: 'Arial',
      fontSize: '7px',
      color: UI_COLORS.textYellow,
      fontStyle: 'bold',
      align: 'center'
    });
    bindingLabel.setOrigin(0.5);
    this.add(bindingLabel);

    // Hit area
    const hitArea = this.scene.add.rectangle(x + width / 2, y + this.KEY_SIZE / 2, width, this.KEY_SIZE, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.add(hitArea);

    const slot: KeySlot = { key: keyCode, display, x, y, width, binding: null, graphics, keyLabel, bindingLabel, hitArea };
    this.keySlots.push(slot);

    hitArea.on('pointerover', () => {
      if (this.selectedBinding) {
        this.drawKeyBackground(graphics, x, y, width, true, slot.binding);
      }
    });

    hitArea.on('pointerout', () => {
      this.drawKeyBackground(graphics, x, y, width, false, slot.binding);
    });

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (slot.binding) {
          this.clearKeySlot(slot);
          this.updateInstruction(`Cleared [${display}]`, '#ff8888');
        }
      } else if (this.selectedBinding) {
        this.bindToKey(slot, this.selectedBinding);
        this.updateInstruction(`Assigned "${this.selectedBinding.name}" to [${display}]`, '#88ff88');
      }
    });
  }

  private drawKeyBackground(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, highlighted: boolean, binding: BindingType | null): void {
    graphics.clear();

    // Background
    if (binding) {
      const color = isSkill(binding) ? this.getSkillColor(binding) : binding.color;
      graphics.fillStyle(color, 0.8);
    } else {
      graphics.fillStyle(UI_COLORS.slotBg, 1);
    }
    graphics.fillRoundedRect(x, y, width, this.KEY_SIZE, 3);

    // Inner shadow
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillRoundedRect(x + 1, y + 1, width - 2, 4, { tl: 2, tr: 2, bl: 0, br: 0 });

    // Border
    const borderColor = highlighted ? UI_COLORS.borderGold : (binding ? 0x88aacc : UI_COLORS.slotBorder);
    graphics.lineStyle(highlighted ? 2 : 1, borderColor, 1);
    graphics.strokeRoundedRect(x, y, width, this.KEY_SIZE, 3);
  }

  private createTabs(): void {
    const tabY = this.contentAreaY;
    const tabWidth = 90;
    const tabHeight = 24;
    const tabSpacing = 4;
    const startX = -this.PANEL_WIDTH / 2 + 25;

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
        fontSize: '10px',
        color: UI_COLORS.textLight,
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

      this.drawTabButton(tab, tabWidth, tabHeight, tabDef.type === this.currentTab);
    });
  }

  private drawTabButton(tab: { type: TabType; label: string; bg: Phaser.GameObjects.Graphics }, width: number, height: number, selected: boolean): void {
    const bg = tab.bg;
    bg.clear();
    drawTab(bg, -width / 2, -height / 2, width, height, selected);
  }

  private getJobTabLabel(): string {
    if (this.currentJob === JobId.BEGINNER) return '1st Job';
    return getJob(this.currentJob).name;
  }

  private createSkillsContainer(): void {
    // Calculate content panel bounds once
    const tabHeight = 24;
    this.contentPanelX = -this.PANEL_WIDTH / 2 + 20;
    this.contentPanelY = this.contentAreaY + tabHeight + 8;
    this.contentPanelWidth = this.PANEL_WIDTH - 40;
    this.contentPanelHeight = this.PANEL_HEIGHT / 2 - this.contentPanelY - 15;

    // Content panel background - modern inset look
    const panelBg = this.scene.add.graphics();
    drawContentPanel(panelBg, this.contentPanelX, this.contentPanelY, this.contentPanelWidth, this.contentPanelHeight);
    this.add(panelBg);

    this.skillsContainer = this.scene.add.container(0, 0);
    this.add(this.skillsContainer);
  }

  private refreshTabContent(): void {
    this.skillsContainer.removeAll(true);
    this.bindingButtons = [];

    // Update tab appearances
    const tabWidth = 90;
    const tabHeight = 24;
    this.tabs.forEach(tab => {
      this.drawTabButton(tab, tabWidth, tabHeight, tab.type === this.currentTab);
      if (tab.type === 'job1') {
        const label = tab.button.list[1] as Phaser.GameObjects.Text;
        label.setText(this.getJobTabLabel());
      }
    });

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
      // Center the message in the content panel
      const centerY = this.contentPanelY + this.contentPanelHeight / 2;
      const text = this.scene.add.text(0, centerY, 'Advance to a job at level 10!', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: UI_COLORS.textGray
      });
      text.setOrigin(0.5);
      this.skillsContainer.add(text);
      return;
    }

    const skills = Object.values(SKILLS).filter(s => s.job === this.currentJob);
    this.createSkillGrid(skills);
  }

  private createSkillGrid(skills: SkillDefinition[]): void {
    const buttonWidth = 70;
    const buttonHeight = 50;
    const spacingX = 6;
    const spacingY = 6;
    const padding = 10;

    // Calculate how many buttons fit per row based on content panel width
    const availableWidth = this.contentPanelWidth - padding * 2;
    const buttonsPerRow = Math.floor((availableWidth + spacingX) / (buttonWidth + spacingX));

    // Position relative to content panel
    const startX = this.contentPanelX + padding + buttonWidth / 2;
    const startY = this.contentPanelY + padding + buttonHeight / 2;

    skills.forEach((skill, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const x = startX + col * (buttonWidth + spacingX);
      const y = startY + row * (buttonHeight + spacingY);

      const available = skill.requiredLevel <= this.currentLevel;
      this.createSkillButton(skill, x, y, buttonWidth, buttonHeight, available);
    });
  }

  private createActionButtons(): void {
    const actions = Object.values(ACTIONS);
    const buttonWidth = 70;
    const buttonHeight = 40;
    const spacingX = 6;
    const spacingY = 6;
    const padding = 10;

    // Calculate how many buttons fit per row based on content panel width
    const availableWidth = this.contentPanelWidth - padding * 2;
    const buttonsPerRow = Math.floor((availableWidth + spacingX) / (buttonWidth + spacingX));

    // Position relative to content panel
    const startX = this.contentPanelX + padding + buttonWidth / 2;
    const startY = this.contentPanelY + padding + buttonHeight / 2;

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

    // Skill icon (colored circle with type letter)
    const iconSize = 20;
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(this.getSkillColor(skill), available ? 1 : 0.4);
    iconBg.fillCircle(0, -height / 2 + 14, iconSize / 2);
    iconBg.lineStyle(1, 0xffffff, 0.3);
    iconBg.strokeCircle(0, -height / 2 + 14, iconSize / 2);
    container.add(iconBg);

    const typeIndicator = skill.type === 'buff' ? 'B' : 'A';
    const typeText = this.scene.add.text(0, -height / 2 + 14, typeIndicator, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    typeText.setOrigin(0.5);
    container.add(typeText);

    // Name (truncated)
    const displayName = skill.name.length > 8 ? skill.name.substring(0, 7) + '.' : skill.name;
    const nameText = this.scene.add.text(0, height / 2 - 18, displayName, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: available ? UI_COLORS.textWhite : UI_COLORS.textGray
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Level or MP
    const infoText = this.scene.add.text(0, height / 2 - 8, available ? `${skill.mpCost}MP` : `Lv${skill.requiredLevel}`, {
      fontFamily: 'Arial',
      fontSize: '7px',
      color: available ? '#6699ff' : '#ff6666'
    });
    infoText.setOrigin(0.5);
    container.add(infoText);

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

    const displayName = action.name.length > 8 ? action.name.substring(0, 7) + '.' : action.name;
    const nameText = this.scene.add.text(0, 0, displayName, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: UI_COLORS.textWhite,
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

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

    const baseColor = available ? this.getSkillColor(skill) : 0x333344;

    // Glow effect when selected or hovered
    if (selected) {
      bg.lineStyle(2, UI_COLORS.accentCyan, 0.5);
      bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 5);
    } else if (hovered && available) {
      bg.lineStyle(2, UI_COLORS.accentBlue, 0.4);
      bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 5);
    }

    // Background
    bg.fillStyle(baseColor, available ? 0.9 : 0.5);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    // Top highlight for depth
    if (available) {
      bg.fillStyle(0xffffff, 0.1);
      bg.fillRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height / 3, { tl: 3, tr: 3, bl: 0, br: 0 });
    }

    // Border
    const borderColor = selected ? UI_COLORS.accentCyan : (hovered ? UI_COLORS.accentBlue : UI_COLORS.borderOuter);
    bg.lineStyle(1, borderColor, selected || hovered ? 0.8 : 0.5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
  }

  private drawActionButton(bg: Phaser.GameObjects.Graphics, action: ActionDefinition, width: number, height: number, selected: boolean, hovered: boolean): void {
    bg.clear();

    // Glow effect when selected or hovered
    if (selected) {
      bg.lineStyle(2, UI_COLORS.accentCyan, 0.5);
      bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 5);
    } else if (hovered) {
      bg.lineStyle(2, UI_COLORS.accentBlue, 0.4);
      bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 5);
    }

    // Background
    bg.fillStyle(action.color, 0.85);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);

    // Top highlight
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height / 3, { tl: 3, tr: 3, bl: 0, br: 0 });

    // Border
    const borderColor = selected ? UI_COLORS.accentCyan : (hovered ? UI_COLORS.accentBlue : UI_COLORS.borderOuter);
    bg.lineStyle(1, borderColor, selected || hovered ? 0.8 : 0.5);
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

    this.updateInstruction(`Selected: ${binding.name}`, UI_COLORS.textYellow);
  }

  private updateInstruction(text: string, color: string): void {
    this.instructionText.setText(text);
    this.instructionText.setColor(color);
  }

  private getSkillColor(skill: SkillDefinition): number {
    switch (skill.job) {
      case JobId.WARRIOR: return 0x8b4513;
      case JobId.MAGE: return 0x4169e1;
      case JobId.ARCHER: return 0x228b22;
      case JobId.THIEF: return 0x663399;
      default: return 0x556b2f;
    }
  }

  private bindToKey(slot: KeySlot, binding: BindingType): void {
    // Remove from previous key
    this.keySlots.forEach(s => {
      if (s.binding && s !== slot) {
        const sameBinding = isSkill(binding) && isSkill(s.binding)
          ? s.binding.id === binding.id
          : isAction(binding) && isAction(s.binding)
            ? s.binding.id === binding.id
            : false;
        if (sameBinding) this.clearKeySlot(s);
      }
    });

    slot.binding = binding;
    const displayName = binding.name.length > 5 ? binding.name.substring(0, 4) + '.' : binding.name;
    slot.bindingLabel.setText(displayName);
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
    if (this.onSkillBindingsChanged) this.onSkillBindingsChanged(this.skillBindings);
  }

  private emitActionBindingsChanged(): void {
    if (this.onActionBindingsChanged) this.onActionBindingsChanged(this.actionBindings);
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
      if (!skill) return; // Safety check
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = skill;
        const displayName = skill.name.length > 5 ? skill.name.substring(0, 4) + '.' : skill.name;
        slot.bindingLabel.setText(displayName);
        this.drawKeyBackground(slot.graphics, slot.x, slot.y, slot.width, false, skill);
        this.skillBindings.set(keyCode, skill);
      }
    });

    actionBindings.forEach((action, keyCode) => {
      if (!action) return; // Safety check
      const slot = this.keySlots.find(s => s.key === keyCode);
      if (slot) {
        slot.binding = action;
        const displayName = action.name.length > 5 ? action.name.substring(0, 4) + '.' : action.name;
        slot.bindingLabel.setText(displayName);
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
    this.updateInstruction('Select skill/action, then click a key. Right-click to clear.', UI_COLORS.textGray);
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.selectedBinding = null;
    this.selectedBindingButton = null;
  }

  updateJobAndLevel(job: JobId, level: number): void {
    if (this.currentJob === job && this.currentLevel === level) return;

    this.currentJob = job;
    this.currentLevel = level;

    if (this.isOpen) this.refreshTabContent();

    // Clear unavailable skill bindings
    this.keySlots.forEach(slot => {
      if (slot.binding && isSkill(slot.binding)) {
        const skill = slot.binding as SkillDefinition;
        if (skill.job !== JobId.BEGINNER && skill.job !== job) {
          this.clearKeySlot(slot);
        }
      }
    });
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }
}
