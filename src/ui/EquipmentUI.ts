import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Equipment } from '../systems/Equipment';
import { EquipSlot, ItemRarity, type EquipItem } from '../systems/ItemData';

interface EquipSlotUI {
  slot: EquipSlot;
  label: string;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
}

export class EquipmentUI extends Phaser.GameObjects.Container {
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

  private equipSlots: EquipSlotUI[] = [];
  private tooltip!: Phaser.GameObjects.Container;

  private equipment: Equipment | null = null;
  private onUnequip: ((slot: EquipSlot) => void) | null = null;

  private readonly PANEL_WIDTH = 200;
  private readonly PANEL_HEIGHT = 340;
  private readonly SLOT_SIZE = 40;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    // Position to the left of inventory
    super(scene, GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2);

    this.createPanel();
    this.createEquipSlots();
    this.createStatsDisplay();
    this.createTooltip();

    scene.add.existing(this);
    this.setDepth(2500);
    this.setVisible(false);
  }

  private createPanel(): void {
    this.panel = this.scene.add.graphics();

    // Main panel background
    this.panel.fillStyle(0x1a1a2e, 0.95);
    this.panel.fillRoundedRect(
      -this.PANEL_WIDTH / 2,
      -this.PANEL_HEIGHT / 2,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      8
    );

    // Border
    this.panel.lineStyle(2, 0x4a4a6a, 1);
    this.panel.strokeRoundedRect(
      -this.PANEL_WIDTH / 2,
      -this.PANEL_HEIGHT / 2,
      this.PANEL_WIDTH,
      this.PANEL_HEIGHT,
      8
    );

    this.add(this.panel);

    // Title bar
    const titleBar = this.scene.add.graphics();
    titleBar.fillStyle(0x2a2a4a, 1);
    titleBar.fillRoundedRect(
      -this.PANEL_WIDTH / 2 + 4,
      -this.PANEL_HEIGHT / 2 + 4,
      this.PANEL_WIDTH - 8,
      28,
      { tl: 6, tr: 6, bl: 0, br: 0 }
    );
    this.add(titleBar);

    // Title text
    this.titleText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 15,
      -this.PANEL_HEIGHT / 2 + 10,
      'Equipment',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.add(this.titleText);

    // Close button
    this.closeButton = this.scene.add.text(
      this.PANEL_WIDTH / 2 - 20,
      -this.PANEL_HEIGHT / 2 + 8,
      '✕',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#888888'
      }
    );
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#ff6666'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#888888'));
    this.closeButton.on('pointerdown', () => this.close());
    this.add(this.closeButton);
  }

  private createEquipSlots(): void {
    // Character silhouette area
    const silhouette = this.scene.add.graphics();
    silhouette.fillStyle(0x0a0a1a, 0.5);
    silhouette.fillRoundedRect(-70, -this.PANEL_HEIGHT / 2 + 45, 140, 160, 6);
    this.add(silhouette);

    // Draw simple character outline
    const charOutline = this.scene.add.graphics();
    charOutline.lineStyle(1, 0x3a3a5a, 0.5);
    // Head
    charOutline.strokeCircle(0, -this.PANEL_HEIGHT / 2 + 80, 20);
    // Body
    charOutline.strokeRect(-15, -this.PANEL_HEIGHT / 2 + 100, 30, 50);
    // Arms
    charOutline.strokeRect(-35, -this.PANEL_HEIGHT / 2 + 105, 18, 35);
    charOutline.strokeRect(17, -this.PANEL_HEIGHT / 2 + 105, 18, 35);
    // Legs
    charOutline.strokeRect(-12, -this.PANEL_HEIGHT / 2 + 150, 10, 40);
    charOutline.strokeRect(2, -this.PANEL_HEIGHT / 2 + 150, 10, 40);
    this.add(charOutline);

    // Equipment slot positions (around the character)
    const slotDefs: { slot: EquipSlot; label: string; x: number; y: number }[] = [
      { slot: EquipSlot.HAT, label: 'Hat', x: 0, y: -this.PANEL_HEIGHT / 2 + 50 },
      { slot: EquipSlot.WEAPON, label: 'Weapon', x: -55, y: -this.PANEL_HEIGHT / 2 + 120 },
      { slot: EquipSlot.TOP, label: 'Top', x: 55, y: -this.PANEL_HEIGHT / 2 + 90 },
      { slot: EquipSlot.BOTTOM, label: 'Bottom', x: 55, y: -this.PANEL_HEIGHT / 2 + 140 },
      { slot: EquipSlot.GLOVES, label: 'Gloves', x: -55, y: -this.PANEL_HEIGHT / 2 + 170 },
      { slot: EquipSlot.SHOES, label: 'Shoes', x: 0, y: -this.PANEL_HEIGHT / 2 + 195 },
      { slot: EquipSlot.CAPE, label: 'Cape', x: 55, y: -this.PANEL_HEIGHT / 2 + 190 },
      { slot: EquipSlot.ACCESSORY, label: 'Acc', x: -55, y: -this.PANEL_HEIGHT / 2 + 70 },
    ];

    slotDefs.forEach(def => {
      const slotUI = this.createEquipSlot(def.slot, def.label, def.x, def.y);
      this.equipSlots.push(slotUI);
    });
  }

  private createEquipSlot(slot: EquipSlot, label: string, x: number, y: number): EquipSlotUI {
    const container = this.scene.add.container(x, y);

    // Slot background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
    bg.lineStyle(1, 0x3a3a5a, 1);
    bg.strokeRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
    container.add(bg);

    // Slot label
    const labelText = this.scene.add.text(0, this.SLOT_SIZE / 2 + 2, label, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: '#666666'
    });
    labelText.setOrigin(0.5, 0);
    container.add(labelText);

    // Item icon placeholder
    const icon = this.scene.add.graphics();
    icon.setName('icon');
    container.add(icon);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, this.SLOT_SIZE, this.SLOT_SIZE, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.setData('slot', slot);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1a1a3a, 1);
      bg.fillRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
      bg.lineStyle(2, 0x6a6aaa, 1);
      bg.strokeRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);

      this.showTooltip(slot, x, y);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0a0a1a, 1);
      bg.fillRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
      bg.lineStyle(1, 0x3a3a5a, 1);
      bg.strokeRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);

      this.hideTooltip();
    });

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        // Right-click to unequip
        if (this.onUnequip) {
          this.onUnequip(slot);
        }
      }
    });

    container.add(hitArea);
    container.setData('bg', bg);

    this.add(container);

    return { slot, label, x, y, container };
  }

  private createStatsDisplay(): void {
    // Stats section
    const statsY = this.PANEL_HEIGHT / 2 - 100;

    const statsLabel = this.scene.add.text(-this.PANEL_WIDTH / 2 + 15, statsY - 20, 'Bonus Stats', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#888888',
      fontStyle: 'bold'
    });
    this.add(statsLabel);

    this.statsText = this.scene.add.text(-this.PANEL_WIDTH / 2 + 15, statsY, '', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#aaaaaa',
      lineSpacing: 4
    });
    this.add(this.statsText);
  }

  private createTooltip(): void {
    this.tooltip = this.scene.add.container(0, 0);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(2600);
    this.scene.add.existing(this.tooltip);
  }

  private showTooltip(slot: EquipSlot, slotX: number, slotY: number): void {
    if (!this.equipment) return;

    const item = this.equipment.getSlot(slot);
    if (!item) {
      this.hideTooltip();
      return;
    }

    this.tooltip.removeAll(true);

    const rarityColors: Record<string, string> = {
      [ItemRarity.COMMON]: '#ffffff',
      [ItemRarity.UNCOMMON]: '#00ff00',
      [ItemRarity.RARE]: '#00bfff',
      [ItemRarity.EPIC]: '#9932cc',
      [ItemRarity.LEGENDARY]: '#ffa500'
    };

    const lines: { text: string; color: string; size: number; bold?: boolean }[] = [
      { text: item.name, color: rarityColors[item.rarity] || '#ffffff', size: 13, bold: true },
      { text: 'Equipped', color: '#88ff88', size: 10 },
      { text: item.description, color: '#cccccc', size: 11 },
      { text: '', color: '#ffffff', size: 4 },
    ];

    if (item.stats.ATK) lines.push({ text: `ATK: +${item.stats.ATK}`, color: '#ff6666', size: 11 });
    if (item.stats.DEF) lines.push({ text: `DEF: +${item.stats.DEF}`, color: '#6666ff', size: 11 });
    if (item.stats.STR) lines.push({ text: `STR: +${item.stats.STR}`, color: '#ffcc66', size: 11 });
    if (item.stats.DEX) lines.push({ text: `DEX: +${item.stats.DEX}`, color: '#66ff66', size: 11 });
    if (item.stats.INT) lines.push({ text: `INT: +${item.stats.INT}`, color: '#66ccff', size: 11 });
    if (item.stats.LUK) lines.push({ text: `LUK: +${item.stats.LUK}`, color: '#ff66ff', size: 11 });
    if (item.stats.HP) lines.push({ text: `HP: +${item.stats.HP}`, color: '#ff8888', size: 11 });
    if (item.stats.MP) lines.push({ text: `MP: +${item.stats.MP}`, color: '#88ccff', size: 11 });

    lines.push({ text: '', color: '#ffffff', size: 4 });
    lines.push({ text: 'Right-click to unequip', color: '#ffff66', size: 10 });

    // Calculate dimensions
    let maxWidth = 0;
    let totalHeight = 10;

    lines.forEach(line => {
      const tempText = this.scene.add.text(0, 0, line.text, { fontFamily: 'Arial', fontSize: `${line.size}px` });
      maxWidth = Math.max(maxWidth, tempText.width);
      totalHeight += line.size + 3;
      tempText.destroy();
    });

    const tooltipWidth = Math.max(130, maxWidth + 20);
    const tooltipHeight = totalHeight + 10;

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);
    bg.lineStyle(1, 0x4a4a6a, 1);
    bg.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, 6);
    this.tooltip.add(bg);

    // Text
    let yOffset = 8;
    lines.forEach(line => {
      if (line.text) {
        const text = this.scene.add.text(10, yOffset, line.text, {
          fontFamily: 'Arial',
          fontSize: `${line.size}px`,
          color: line.color,
          fontStyle: line.bold ? 'bold' : 'normal'
        });
        this.tooltip.add(text);
      }
      yOffset += line.size + 3;
    });

    // Position
    const worldX = this.x + slotX;
    const worldY = this.y + slotY;

    let tooltipX = worldX + this.SLOT_SIZE / 2 + 10;
    let tooltipY = worldY - tooltipHeight / 2;

    if (tooltipX + tooltipWidth > GAME_WIDTH - 10) {
      tooltipX = worldX - this.SLOT_SIZE / 2 - tooltipWidth - 10;
    }
    if (tooltipY < 10) tooltipY = 10;
    if (tooltipY + tooltipHeight > GAME_HEIGHT - 10) {
      tooltipY = GAME_HEIGHT - tooltipHeight - 10;
    }

    this.tooltip.setPosition(tooltipX, tooltipY);
    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltip.setVisible(false);
  }

  setEquipment(equipment: Equipment): void {
    this.equipment = equipment;
    this.refresh();
  }

  setOnUnequip(callback: (slot: EquipSlot) => void): void {
    this.onUnequip = callback;
  }

  refresh(): void {
    if (!this.equipment) return;

    // Update each slot
    this.equipSlots.forEach(slotUI => {
      const item = this.equipment!.getSlot(slotUI.slot);
      const icon = slotUI.container.getByName('icon') as Phaser.GameObjects.Graphics;
      icon.clear();

      if (item) {
        this.drawEquipIcon(icon, item, slotUI.slot);
      }
    });

    // Update stats display
    this.updateStatsDisplay();
  }

  private drawEquipIcon(graphics: Phaser.GameObjects.Graphics, _item: EquipItem, slot: EquipSlot): void {
    const size = this.SLOT_SIZE - 8;
    const halfSize = size / 2;

    switch (slot) {
      case EquipSlot.WEAPON:
        // Sword
        graphics.fillStyle(0xcccccc, 1);
        graphics.fillRect(-3, -halfSize * 0.8, 6, halfSize * 1.4);
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillRect(-5, halfSize * 0.4, 10, halfSize * 0.35);
        graphics.fillStyle(0xffd700, 1);
        graphics.fillRect(-8, halfSize * 0.25, 16, 4);
        break;

      case EquipSlot.HAT:
        graphics.fillStyle(0x4444aa, 1);
        graphics.fillRoundedRect(-halfSize * 0.7, -halfSize * 0.3, halfSize * 1.4, halfSize * 0.9, 4);
        graphics.fillRect(-halfSize * 0.9, halfSize * 0.4, halfSize * 1.8, halfSize * 0.25);
        break;

      case EquipSlot.TOP:
        graphics.fillStyle(0x3366aa, 1);
        graphics.fillRoundedRect(-halfSize * 0.6, -halfSize * 0.5, halfSize * 1.2, halfSize, 3);
        graphics.fillRect(-halfSize * 0.8, -halfSize * 0.3, halfSize * 0.3, halfSize * 0.6);
        graphics.fillRect(halfSize * 0.5, -halfSize * 0.3, halfSize * 0.3, halfSize * 0.6);
        break;

      case EquipSlot.BOTTOM:
        graphics.fillStyle(0x2244aa, 1);
        graphics.fillRect(-halfSize * 0.5, -halfSize * 0.4, halfSize * 0.4, halfSize * 0.9);
        graphics.fillRect(halfSize * 0.1, -halfSize * 0.4, halfSize * 0.4, halfSize * 0.9);
        graphics.fillRect(-halfSize * 0.5, -halfSize * 0.4, halfSize, halfSize * 0.2);
        break;

      case EquipSlot.SHOES:
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillRoundedRect(-halfSize * 0.7, -halfSize * 0.2, halfSize * 0.5, halfSize * 0.5, 2);
        graphics.fillRoundedRect(halfSize * 0.2, -halfSize * 0.2, halfSize * 0.5, halfSize * 0.5, 2);
        break;

      case EquipSlot.GLOVES:
        graphics.fillStyle(0x666666, 1);
        graphics.fillRoundedRect(-halfSize * 0.7, -halfSize * 0.3, halfSize * 0.5, halfSize * 0.6, 2);
        graphics.fillRoundedRect(halfSize * 0.2, -halfSize * 0.3, halfSize * 0.5, halfSize * 0.6, 2);
        break;

      case EquipSlot.CAPE:
        graphics.fillStyle(0x882222, 1);
        graphics.beginPath();
        graphics.moveTo(0, -halfSize * 0.5);
        graphics.lineTo(-halfSize * 0.6, halfSize * 0.5);
        graphics.lineTo(halfSize * 0.6, halfSize * 0.5);
        graphics.closePath();
        graphics.fillPath();
        break;

      case EquipSlot.ACCESSORY:
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(0, 0, halfSize * 0.4);
        graphics.fillStyle(0x00bfff, 1);
        graphics.fillCircle(0, 0, halfSize * 0.2);
        break;

      default:
        graphics.fillStyle(0x666666, 1);
        graphics.fillRect(-halfSize * 0.5, -halfSize * 0.5, size * 0.5, size * 0.5);
    }
  }

  private updateStatsDisplay(): void {
    if (!this.equipment) return;

    const stats = this.equipment.getTotalStats();
    const lines: string[] = [];

    if (stats.ATK) lines.push(`ATK: +${stats.ATK}`);
    if (stats.DEF) lines.push(`DEF: +${stats.DEF}`);
    if (stats.STR) lines.push(`STR: +${stats.STR}`);
    if (stats.DEX) lines.push(`DEX: +${stats.DEX}`);
    if (stats.INT) lines.push(`INT: +${stats.INT}`);
    if (stats.LUK) lines.push(`LUK: +${stats.LUK}`);
    if (stats.HP) lines.push(`HP: +${stats.HP}`);
    if (stats.MP) lines.push(`MP: +${stats.MP}`);

    if (lines.length === 0) {
      lines.push('No equipment bonuses');
    }

    this.statsText.setText(lines.join('\n'));
  }

  open(): void {
    this.refresh();
    this.setVisible(true);
    this.isOpen = true;
  }

  close(): void {
    this.setVisible(false);
    this.hideTooltip();
    this.isOpen = false;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
