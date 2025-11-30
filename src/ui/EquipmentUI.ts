import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Equipment } from '../systems/Equipment';
import { EquipSlot, type EquipItem } from '../systems/ItemData';
import {
  UI_COLORS,
  drawPanel,
  drawSlot,
  drawTooltip,
  drawDivider,
  createCloseButton,
  getTitleStyle,
  getLabelStyle,
  getRarityColor,
} from './UITheme';

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
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title text
    this.titleText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 15,
      -this.PANEL_HEIGHT / 2 + 9,
      'Equipment',
      getTitleStyle()
    );
    this.add(this.titleText);

    // Close button
    const closeBtn = createCloseButton(
      this.scene,
      this.PANEL_WIDTH / 2 - 15,
      -this.PANEL_HEIGHT / 2 + 16,
      () => this.close()
    );
    this.add(closeBtn);
  }

  private createEquipSlots(): void {
    // Character silhouette area with better styling
    const silhouetteArea = this.scene.add.graphics();
    silhouetteArea.fillStyle(UI_COLORS.slotBg, 0.6);
    silhouetteArea.fillRoundedRect(-70, -this.PANEL_HEIGHT / 2 + 40, 140, 165, 6);
    silhouetteArea.lineStyle(1, UI_COLORS.slotBorder, 0.5);
    silhouetteArea.strokeRoundedRect(-70, -this.PANEL_HEIGHT / 2 + 40, 140, 165, 6);
    this.add(silhouetteArea);

    // Draw improved character outline
    const charOutline = this.scene.add.graphics();
    charOutline.lineStyle(2, UI_COLORS.borderHighlight, 0.4);

    // Head (circle)
    charOutline.strokeCircle(0, -this.PANEL_HEIGHT / 2 + 80, 18);
    // Neck
    charOutline.strokeRect(-5, -this.PANEL_HEIGHT / 2 + 98, 10, 8);
    // Body (torso)
    charOutline.beginPath();
    charOutline.moveTo(-18, -this.PANEL_HEIGHT / 2 + 106);
    charOutline.lineTo(-22, -this.PANEL_HEIGHT / 2 + 150);
    charOutline.lineTo(22, -this.PANEL_HEIGHT / 2 + 150);
    charOutline.lineTo(18, -this.PANEL_HEIGHT / 2 + 106);
    charOutline.closePath();
    charOutline.strokePath();
    // Arms
    charOutline.strokeRect(-38, -this.PANEL_HEIGHT / 2 + 108, 14, 35);
    charOutline.strokeRect(24, -this.PANEL_HEIGHT / 2 + 108, 14, 35);
    // Legs
    charOutline.strokeRect(-16, -this.PANEL_HEIGHT / 2 + 150, 12, 42);
    charOutline.strokeRect(4, -this.PANEL_HEIGHT / 2 + 150, 12, 42);
    this.add(charOutline);

    // Equipment slot positions
    const slotDefs: { slot: EquipSlot; label: string; x: number; y: number }[] = [
      { slot: EquipSlot.HAT, label: 'Hat', x: 0, y: -this.PANEL_HEIGHT / 2 + 48 },
      { slot: EquipSlot.WEAPON, label: 'Weapon', x: -58, y: -this.PANEL_HEIGHT / 2 + 120 },
      { slot: EquipSlot.TOP, label: 'Top', x: 58, y: -this.PANEL_HEIGHT / 2 + 90 },
      { slot: EquipSlot.BOTTOM, label: 'Bottom', x: 58, y: -this.PANEL_HEIGHT / 2 + 140 },
      { slot: EquipSlot.GLOVES, label: 'Gloves', x: -58, y: -this.PANEL_HEIGHT / 2 + 168 },
      { slot: EquipSlot.SHOES, label: 'Shoes', x: 0, y: -this.PANEL_HEIGHT / 2 + 198 },
      { slot: EquipSlot.CAPE, label: 'Cape', x: 58, y: -this.PANEL_HEIGHT / 2 + 190 },
      { slot: EquipSlot.ACCESSORY, label: 'Acc', x: -58, y: -this.PANEL_HEIGHT / 2 + 72 },
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
    drawSlot(bg, 0, 0, this.SLOT_SIZE, false, true);
    container.add(bg);

    // Slot label
    const labelText = this.scene.add.text(0, this.SLOT_SIZE / 2 + 2, label, getLabelStyle());
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
      drawSlot(bg, 0, 0, this.SLOT_SIZE, true, !this.equipment?.getSlot(slot));
      this.showTooltip(slot, x, y);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      drawSlot(bg, 0, 0, this.SLOT_SIZE, false, !this.equipment?.getSlot(slot));
      this.hideTooltip();
    });

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
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
    const statsY = this.PANEL_HEIGHT / 2 - 100;

    // Divider
    const dividerGraphics = this.scene.add.graphics();
    drawDivider(dividerGraphics, -this.PANEL_WIDTH / 2 + 10, statsY - 25, this.PANEL_WIDTH - 20);
    this.add(dividerGraphics);

    const statsLabel = this.scene.add.text(-this.PANEL_WIDTH / 2 + 15, statsY - 18, 'Bonus Stats', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: UI_COLORS.textGold,
      fontStyle: 'bold'
    });
    this.add(statsLabel);

    this.statsText = this.scene.add.text(-this.PANEL_WIDTH / 2 + 15, statsY + 2, '', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: UI_COLORS.textWhite,
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

    const lines: { text: string; color: string; size: number; bold?: boolean }[] = [
      { text: item.name, color: getRarityColor(item.rarity), size: 13, bold: true },
      { text: 'Equipped', color: '#88ff88', size: 10 },
      { text: item.description, color: UI_COLORS.textWhite, size: 11 },
      { text: '', color: '#ffffff', size: 4 },
    ];

    if (item.stats.ATK) lines.push({ text: `ATK: +${item.stats.ATK}`, color: '#ff6b6b', size: 11 });
    if (item.stats.DEF) lines.push({ text: `DEF: +${item.stats.DEF}`, color: '#6bb5ff', size: 11 });
    if (item.stats.STR) lines.push({ text: `STR: +${item.stats.STR}`, color: '#ffcc66', size: 11 });
    if (item.stats.DEX) lines.push({ text: `DEX: +${item.stats.DEX}`, color: '#66ff99', size: 11 });
    if (item.stats.INT) lines.push({ text: `INT: +${item.stats.INT}`, color: '#66ccff', size: 11 });
    if (item.stats.LUK) lines.push({ text: `LUK: +${item.stats.LUK}`, color: '#ff99ff', size: 11 });
    if (item.stats.HP) lines.push({ text: `HP: +${item.stats.HP}`, color: '#ff8888', size: 11 });
    if (item.stats.MP) lines.push({ text: `MP: +${item.stats.MP}`, color: '#88ccff', size: 11 });

    lines.push({ text: '', color: '#ffffff', size: 4 });
    lines.push({ text: 'Right-click to unequip', color: UI_COLORS.textYellow, size: 10 });

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
    drawTooltip(bg, 0, 0, tooltipWidth, tooltipHeight);
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
