import Phaser from 'phaser';
import type { SkillDefinition } from '../skills/SkillData';
import { SKILLS } from '../skills/SkillData';
import { JobId } from '../systems/JobData';

interface SkillEntry {
  container: Phaser.GameObjects.Container;
  skill: SkillDefinition;
  levelText: Phaser.GameObjects.Text;
  level: number;
}

export class SkillConfigUI extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;
  private skillEntries: SkillEntry[] = [];
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollMask!: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private currentJob: JobId = JobId.BEGINNER;
  private playerLevel: number = 1;
  private skillLevels: Map<string, number> = new Map();
  private availableSkillPoints: number = 0;
  private skillPointsText!: Phaser.GameObjects.Text;

  private readonly PANEL_WIDTH = 320;
  private readonly PANEL_HEIGHT = 420;
  private readonly SKILL_ROW_HEIGHT = 50;
  private readonly CONTENT_PADDING = 15;
  private readonly HEADER_HEIGHT = 80;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 640, 360); // Center of 1280x720

    this.createPanel();
    this.createSkillList();

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

    // Main panel - dark theme
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x1a1a2e, 0.98);
    this.background.fillRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 8);
    this.background.lineStyle(2, 0x3a3a5a, 1);
    this.background.strokeRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT, 8);
    this.add(this.background);

    // Title bar
    const titleBar = this.scene.add.graphics();
    titleBar.fillStyle(0x252540, 1);
    titleBar.fillRoundedRect(-this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, 40, { tl: 8, tr: 8, bl: 0, br: 0 });
    this.add(titleBar);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 20, 'Skills', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    this.closeButton = this.scene.add.text(this.PANEL_WIDTH / 2 - 20, -this.PANEL_HEIGHT / 2 + 20, 'X', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888',
      fontStyle: 'bold'
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#ffffff'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#888888'));
    this.closeButton.on('pointerdown', () => this.close());
    this.add(this.closeButton);

    // Skill Points display
    this.skillPointsText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + this.CONTENT_PADDING,
      -this.PANEL_HEIGHT / 2 + 55,
      'SP: 0',
      {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ffcc00'
      }
    );
    this.add(this.skillPointsText);
  }

  private createSkillList(): void {
    // Create scroll container
    this.scrollContainer = this.scene.add.container(0, 0);
    this.add(this.scrollContainer);

    // Create mask for scrolling
    const maskX = -this.PANEL_WIDTH / 2 + this.CONTENT_PADDING;
    const maskY = -this.PANEL_HEIGHT / 2 + this.HEADER_HEIGHT;
    const maskWidth = this.PANEL_WIDTH - this.CONTENT_PADDING * 2;
    const maskHeight = this.PANEL_HEIGHT - this.HEADER_HEIGHT - this.CONTENT_PADDING;

    this.scrollMask = this.scene.add.graphics();
    this.scrollMask.fillStyle(0xffffff);
    this.scrollMask.fillRect(maskX + 640, maskY + 360, maskWidth, maskHeight);
    this.scrollMask.setVisible(false); // Hide the mask graphics - only used for masking

    const mask = this.scrollMask.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Enable scroll with mouse wheel
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (!this.isOpen) return;
      this.scroll(deltaY * 0.5);
    });

    this.rebuildSkillList();
  }

  private rebuildSkillList(): void {
    // Clear existing entries
    this.scrollContainer.removeAll(true);
    this.skillEntries = [];

    // Get skills for current job
    const skills = Object.values(SKILLS).filter(
      skill => skill.job === this.currentJob || skill.job === JobId.BEGINNER
    );

    const startY = -this.PANEL_HEIGHT / 2 + this.HEADER_HEIGHT + 10;
    const rowWidth = this.PANEL_WIDTH - this.CONTENT_PADDING * 2 - 10;

    skills.forEach((skill, index) => {
      const y = startY + index * this.SKILL_ROW_HEIGHT;
      const entry = this.createSkillRow(skill, 0, y, rowWidth);
      this.skillEntries.push(entry);
      this.scrollContainer.add(entry.container);
    });

    // Calculate max scroll
    const contentHeight = skills.length * this.SKILL_ROW_HEIGHT;
    const viewHeight = this.PANEL_HEIGHT - this.HEADER_HEIGHT - this.CONTENT_PADDING;
    this.maxScrollY = Math.max(0, contentHeight - viewHeight);
    this.scrollY = 0;
  }

  private createSkillRow(skill: SkillDefinition, x: number, y: number, width: number): SkillEntry {
    const container = this.scene.add.container(x, y);
    const currentLevel = this.skillLevels.get(skill.id) || 0;
    const maxLevel = 20; // Max skill level

    // Row background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x252540, 0.8);
    bg.fillRoundedRect(-width / 2, -this.SKILL_ROW_HEIGHT / 2 + 5, width, this.SKILL_ROW_HEIGHT - 10, 4);
    container.add(bg);

    // Skill icon placeholder (colored square based on type)
    const iconSize = 32;
    const iconX = -width / 2 + 20;
    const icon = this.scene.add.graphics();
    icon.fillStyle(this.getSkillColor(skill), 1);
    icon.fillRoundedRect(iconX, -iconSize / 2, iconSize, iconSize, 4);
    icon.lineStyle(1, 0x444466, 1);
    icon.strokeRoundedRect(iconX, -iconSize / 2, iconSize, iconSize, 4);
    container.add(icon);

    // Type indicator letter
    const typeLabel = skill.type === 'attack' ? 'A' : skill.type === 'buff' ? 'B' : skill.type === 'mobility' ? 'M' : 'P';
    const typeText = this.scene.add.text(iconX + iconSize / 2, 0, typeLabel, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    typeText.setOrigin(0.5);
    container.add(typeText);

    // Skill name
    const nameX = iconX + iconSize + 12;
    const nameText = this.scene.add.text(nameX, -8, skill.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    });
    container.add(nameText);

    // Required level
    const reqText = this.scene.add.text(nameX, 8, `Req Lv. ${skill.requiredLevel}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888'
    });
    container.add(reqText);

    // Level display
    const levelX = width / 2 - 45;
    const levelText = this.scene.add.text(levelX, 0, `${currentLevel}/${maxLevel}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: currentLevel > 0 ? '#88ff88' : '#666666'
    });
    levelText.setOrigin(0.5);
    container.add(levelText);

    // Plus button to add skill points
    const plusBtn = this.scene.add.text(width / 2 - 15, 0, '+', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#666666',
      fontStyle: 'bold'
    });
    plusBtn.setOrigin(0.5);
    container.add(plusBtn);

    // Make plus button interactive if player meets requirements
    if (this.playerLevel >= skill.requiredLevel) {
      plusBtn.setColor('#88ff88');
      plusBtn.setInteractive({ useHandCursor: true });
      plusBtn.on('pointerover', () => plusBtn.setColor('#aaffaa'));
      plusBtn.on('pointerout', () => plusBtn.setColor('#88ff88'));
      plusBtn.on('pointerdown', () => this.addSkillPoint(skill.id));
    }

    // Hover effect for row
    const hitArea = this.scene.add.rectangle(0, 0, width, this.SKILL_ROW_HEIGHT - 10, 0x000000, 0);
    hitArea.setInteractive();
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x353560, 0.9);
      bg.fillRoundedRect(-width / 2, -this.SKILL_ROW_HEIGHT / 2 + 5, width, this.SKILL_ROW_HEIGHT - 10, 4);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x252540, 0.8);
      bg.fillRoundedRect(-width / 2, -this.SKILL_ROW_HEIGHT / 2 + 5, width, this.SKILL_ROW_HEIGHT - 10, 4);
    });
    container.add(hitArea);

    return {
      container,
      skill,
      levelText,
      level: currentLevel
    };
  }

  private addSkillPoint(skillId: string): void {
    if (this.availableSkillPoints <= 0) return;

    const currentLevel = this.skillLevels.get(skillId) || 0;
    const maxLevel = 20;

    if (currentLevel >= maxLevel) return;

    this.skillLevels.set(skillId, currentLevel + 1);
    this.availableSkillPoints--;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.skillPointsText.setText(`SP: ${this.availableSkillPoints}`);

    // Update all skill level displays
    this.skillEntries.forEach(entry => {
      const level = this.skillLevels.get(entry.skill.id) || 0;
      entry.levelText.setText(`${level}/20`);
      entry.levelText.setColor(level > 0 ? '#88ff88' : '#666666');
      entry.level = level;
    });
  }

  private scroll(deltaY: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScrollY);
    this.scrollContainer.y = -this.scrollY;
  }

  private getSkillColor(skill: SkillDefinition): number {
    switch (skill.type) {
      case 'attack': return 0x664444;
      case 'buff': return 0x446644;
      case 'mobility': return 0x444466;
      default: return 0x555555;
    }
  }

  setJobAndLevel(job: JobId, level: number): void {
    this.currentJob = job;
    this.playerLevel = level;
    this.rebuildSkillList();
  }

  setSkillPoints(points: number): void {
    this.availableSkillPoints = points;
    this.updateDisplay();
  }

  setSkillLevels(levels: Map<string, number>): void {
    this.skillLevels = new Map(levels);
    this.updateDisplay();
  }

  getSkillLevels(): Map<string, number> {
    return new Map(this.skillLevels);
  }

  open(): void {
    this.isOpen = true;
    this.setVisible(true);
    this.scrollY = 0;
    this.scrollContainer.y = 0;
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Legacy methods for compatibility - these are no-ops now
  setSkillAssignedCallback(_callback: (slotIndex: number, skill: SkillDefinition) => void): void {
    // No longer used
  }

  setKeyBoundCallback(_callback: (slotIndex: number, keyCode: string, keyDisplay: string) => void): void {
    // No longer used
  }

  setCurrentSkills(_skills: (SkillDefinition | null)[]): void {
    // No longer used
  }

  setCurrentKeys(_keys: { keyCode: string; keyDisplay: string }[]): void {
    // No longer used
  }
}
