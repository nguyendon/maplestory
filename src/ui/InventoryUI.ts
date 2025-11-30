import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Inventory, type InventorySlot } from '../systems/Inventory';
import { ItemType, type Item, type EquipItem, type UseItem } from '../systems/ItemData';
import {
  UI_COLORS,
  drawPanel,
  drawSlot,
  drawTooltip,
  drawCoinIcon,
  drawDivider,
  createCloseButton,
  getTitleStyle,
  getRarityColor,
} from './UITheme';

export class InventoryUI extends Phaser.GameObjects.Container {
  private panel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;

  private slotContainers: Phaser.GameObjects.Container[] = [];
  private tooltip!: Phaser.GameObjects.Container;
  private mesosText!: Phaser.GameObjects.Text;

  private inventory: Inventory | null = null;
  private onItemUse: ((slotIndex: number) => void) | null = null;
  private onItemEquip: ((slotIndex: number) => void) | null = null;

  private readonly PANEL_WIDTH = 280;
  private readonly PANEL_HEIGHT = 340;
  private readonly SLOT_SIZE = 36;
  private readonly SLOT_SPACING = 4;
  private readonly SLOTS_PER_ROW = 6;
  private readonly PADDING = 15;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createSlots();
    this.createTooltip();

    scene.add.existing(this);
    this.setDepth(2500);
    this.setVisible(false);
  }

  private createPanel(): void {
    // Main panel background
    this.panel = this.scene.add.graphics();
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title text
    this.titleText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 15,
      -this.PANEL_HEIGHT / 2 + 9,
      'Inventory',
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

    // Mesos display area
    const mesosY = this.PANEL_HEIGHT / 2 - 35;

    // Mesos icon
    const coinGraphics = this.scene.add.graphics();
    drawCoinIcon(coinGraphics, -this.PANEL_WIDTH / 2 + 25, mesosY, 14);
    this.add(coinGraphics);

    this.mesosText = this.scene.add.text(
      -this.PANEL_WIDTH / 2 + 40,
      mesosY - 7,
      '0 mesos',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: UI_COLORS.textGold
      }
    );
    this.add(this.mesosText);

    // Divider above mesos
    const dividerGraphics = this.scene.add.graphics();
    drawDivider(dividerGraphics, -this.PANEL_WIDTH / 2 + 10, mesosY - 20, this.PANEL_WIDTH - 20);
    this.add(dividerGraphics);
  }

  private createSlots(): void {
    const startX = -this.PANEL_WIDTH / 2 + this.PADDING + this.SLOT_SIZE / 2;
    const startY = -this.PANEL_HEIGHT / 2 + 45 + this.SLOT_SIZE / 2;

    for (let i = 0; i < 24; i++) {
      const row = Math.floor(i / this.SLOTS_PER_ROW);
      const col = i % this.SLOTS_PER_ROW;

      const x = startX + col * (this.SLOT_SIZE + this.SLOT_SPACING);
      const y = startY + row * (this.SLOT_SIZE + this.SLOT_SPACING);

      const slotContainer = this.createSlot(i, x, y);
      this.slotContainers.push(slotContainer);
      this.add(slotContainer);
    }
  }

  private createSlot(index: number, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Slot background
    const bg = this.scene.add.graphics();
    drawSlot(bg, 0, 0, this.SLOT_SIZE, false, true);
    container.add(bg);

    // Item icon placeholder
    const icon = this.scene.add.graphics();
    icon.setName('icon');
    container.add(icon);

    // Quantity text
    const quantityText = this.scene.add.text(
      this.SLOT_SIZE / 2 - 4,
      this.SLOT_SIZE / 2 - 4,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    quantityText.setOrigin(1, 1);
    quantityText.setName('quantity');
    container.add(quantityText);

    // Hit area for interaction
    const hitArea = this.scene.add.rectangle(0, 0, this.SLOT_SIZE, this.SLOT_SIZE, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.setData('slotIndex', index);

    hitArea.on('pointerover', () => {
      bg.clear();
      drawSlot(bg, 0, 0, this.SLOT_SIZE, true, !this.inventory?.getSlot(index)?.item);
      this.showTooltip(index, x, y);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      drawSlot(bg, 0, 0, this.SLOT_SIZE, false, !this.inventory?.getSlot(index)?.item);
      this.hideTooltip();
    });

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (this.onItemUse) {
          this.onItemUse(index);
        }
      } else if (pointer.leftButtonDown()) {
        const slot = this.inventory?.getSlot(index);
        if (slot?.item?.type === ItemType.EQUIP && this.onItemEquip) {
          this.onItemEquip(index);
        }
      }
    });

    container.add(hitArea);
    container.setData('bg', bg);

    return container;
  }

  private createTooltip(): void {
    this.tooltip = this.scene.add.container(0, 0);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(2600);
    this.scene.add.existing(this.tooltip);
  }

  private showTooltip(slotIndex: number, slotX: number, slotY: number): void {
    if (!this.inventory) return;

    const slot = this.inventory.getSlot(slotIndex);
    if (!slot || !slot.item) {
      this.hideTooltip();
      return;
    }

    const item = slot.item;
    this.tooltip.removeAll(true);

    // Build tooltip content
    const lines: { text: string; color: string; size: number; bold?: boolean }[] = [];

    // Item name with rarity color
    lines.push({
      text: item.name,
      color: getRarityColor(item.rarity),
      size: 13,
      bold: true
    });

    // Item type
    const typeLabels: Record<string, string> = {
      [ItemType.EQUIP]: 'Equipment',
      [ItemType.USE]: 'Consumable',
      [ItemType.ETC]: 'Etc',
      [ItemType.SETUP]: 'Setup'
    };
    lines.push({ text: typeLabels[item.type] || item.type, color: UI_COLORS.textGray, size: 10 });

    // Description
    lines.push({ text: item.description, color: UI_COLORS.textWhite, size: 11 });

    // Equipment stats
    if (item.type === ItemType.EQUIP) {
      const equip = item as EquipItem;
      lines.push({ text: '', color: '#ffffff', size: 6 });

      if (equip.stats.ATK) lines.push({ text: `ATK: +${equip.stats.ATK}`, color: '#ff6b6b', size: 11 });
      if (equip.stats.DEF) lines.push({ text: `DEF: +${equip.stats.DEF}`, color: '#6bb5ff', size: 11 });
      if (equip.stats.STR) lines.push({ text: `STR: +${equip.stats.STR}`, color: '#ffcc66', size: 11 });
      if (equip.stats.DEX) lines.push({ text: `DEX: +${equip.stats.DEX}`, color: '#66ff99', size: 11 });
      if (equip.stats.INT) lines.push({ text: `INT: +${equip.stats.INT}`, color: '#66ccff', size: 11 });
      if (equip.stats.LUK) lines.push({ text: `LUK: +${equip.stats.LUK}`, color: '#ff99ff', size: 11 });
      if (equip.stats.HP) lines.push({ text: `HP: +${equip.stats.HP}`, color: '#ff8888', size: 11 });
      if (equip.stats.MP) lines.push({ text: `MP: +${equip.stats.MP}`, color: '#88ccff', size: 11 });

      lines.push({ text: `Req. Level: ${equip.levelRequirement}`, color: UI_COLORS.textGray, size: 10 });
      lines.push({ text: '', color: '#ffffff', size: 4 });
      lines.push({ text: 'Click to equip', color: UI_COLORS.textYellow, size: 10 });
    }

    // Use item info
    if (item.type === ItemType.USE) {
      const useItem = item as UseItem;
      if (useItem.duration) {
        lines.push({ text: `Duration: ${useItem.duration}s`, color: UI_COLORS.textGray, size: 10 });
      }
      lines.push({ text: '', color: '#ffffff', size: 4 });
      lines.push({ text: 'Right-click to use', color: UI_COLORS.textYellow, size: 10 });
    }

    // Sell price
    lines.push({ text: '', color: '#ffffff', size: 4 });
    lines.push({ text: `Sell: ${item.sellPrice} mesos`, color: UI_COLORS.textGold, size: 10 });

    // Calculate tooltip dimensions
    let maxWidth = 0;
    let totalHeight = 10;

    lines.forEach(line => {
      const tempText = this.scene.add.text(0, 0, line.text, {
        fontFamily: 'Arial',
        fontSize: `${line.size}px`
      });
      maxWidth = Math.max(maxWidth, tempText.width);
      totalHeight += line.size + 3;
      tempText.destroy();
    });

    const tooltipWidth = Math.max(120, maxWidth + 20);
    const tooltipHeight = totalHeight + 10;

    // Background
    const bg = this.scene.add.graphics();
    drawTooltip(bg, 0, 0, tooltipWidth, tooltipHeight);
    this.tooltip.add(bg);

    // Text content
    let yOffset = 8;
    lines.forEach(line => {
      if (line.text) {
        const text = this.scene.add.text(10, yOffset, line.text, {
          fontFamily: 'Arial',
          fontSize: `${line.size}px`,
          color: line.color,
          fontStyle: line.bold ? 'bold' : 'normal',
          wordWrap: { width: tooltipWidth - 20 }
        });
        this.tooltip.add(text);
      }
      yOffset += line.size + 3;
    });

    // Position tooltip
    const worldX = this.x + slotX;
    const worldY = this.y + slotY;

    let tooltipX = worldX + this.SLOT_SIZE / 2 + 10;
    let tooltipY = worldY - tooltipHeight / 2;

    if (tooltipX + tooltipWidth > GAME_WIDTH - 10) {
      tooltipX = worldX - this.SLOT_SIZE / 2 - tooltipWidth - 10;
    }
    if (tooltipY < 10) {
      tooltipY = 10;
    }
    if (tooltipY + tooltipHeight > GAME_HEIGHT - 10) {
      tooltipY = GAME_HEIGHT - tooltipHeight - 10;
    }

    this.tooltip.setPosition(tooltipX, tooltipY);
    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltip.setVisible(false);
  }

  setInventory(inventory: Inventory): void {
    this.inventory = inventory;
    this.refresh();
  }

  setOnItemEquip(callback: (slotIndex: number) => void): void {
    this.onItemEquip = callback;
  }

  setOnItemUse(callback: (slotIndex: number) => void): void {
    this.onItemUse = callback;
  }

  refresh(): void {
    if (!this.inventory) return;

    const slots = this.inventory.getAllSlots();

    slots.forEach((slot, index) => {
      this.updateSlot(index, slot);
    });

    this.mesosText.setText(`${this.inventory.getMesos().toLocaleString()} mesos`);
  }

  private updateSlot(index: number, slot: InventorySlot): void {
    const container = this.slotContainers[index];
    if (!container) return;

    const icon = container.getByName('icon') as Phaser.GameObjects.Graphics;
    const quantityText = container.getByName('quantity') as Phaser.GameObjects.Text;

    icon.clear();

    if (slot.item) {
      this.drawItemIcon(icon, slot.item);

      if (slot.quantity > 1) {
        quantityText.setText(slot.quantity.toString());
      } else {
        quantityText.setText('');
      }
    } else {
      quantityText.setText('');
    }
  }

  private drawItemIcon(graphics: Phaser.GameObjects.Graphics, item: Item): void {
    const size = this.SLOT_SIZE - 8;
    const halfSize = size / 2;

    switch (item.type) {
      case ItemType.USE:
        this.drawPotionIcon(graphics, item, halfSize);
        break;
      case ItemType.EQUIP:
        this.drawEquipIcon(graphics, item as EquipItem, halfSize);
        break;
      case ItemType.ETC:
        this.drawEtcIcon(graphics, item, halfSize);
        break;
      default:
        graphics.fillStyle(0x666666, 1);
        graphics.fillRect(-halfSize, -halfSize, size, size);
    }
  }

  private drawPotionIcon(graphics: Phaser.GameObjects.Graphics, item: Item, halfSize: number): void {
    let potionColor = 0xff6666;
    let highlightColor = 0xffaaaa;

    if (item.id.includes('blue') || item.id.includes('mana')) {
      potionColor = 0x6666ff;
      highlightColor = 0xaaaaff;
    } else if (item.id.includes('white')) {
      potionColor = 0xeeeeee;
      highlightColor = 0xffffff;
    } else if (item.id === 'elixir') {
      potionColor = 0xaa66ff;
      highlightColor = 0xddaaff;
    }

    // Bottle shape
    graphics.fillStyle(0x88ccff, 0.6);
    graphics.fillRoundedRect(-halfSize * 0.4, -halfSize * 0.3, halfSize * 0.8, halfSize * 1.2, 3);

    // Bottle neck
    graphics.fillStyle(0x88ccff, 0.6);
    graphics.fillRect(-halfSize * 0.2, -halfSize * 0.7, halfSize * 0.4, halfSize * 0.4);

    // Cork
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(-halfSize * 0.25, -halfSize * 0.85, halfSize * 0.5, halfSize * 0.2);

    // Liquid
    graphics.fillStyle(potionColor, 1);
    graphics.fillRoundedRect(-halfSize * 0.35, -halfSize * 0.1, halfSize * 0.7, halfSize * 0.95, 2);

    // Highlight
    graphics.fillStyle(highlightColor, 0.5);
    graphics.fillRect(-halfSize * 0.25, -halfSize * 0.05, halfSize * 0.15, halfSize * 0.4);
  }

  private drawEquipIcon(graphics: Phaser.GameObjects.Graphics, item: EquipItem, halfSize: number): void {
    const slot = item.slot;

    if (slot === 'weapon') {
      graphics.fillStyle(0xaaaaaa, 1);
      graphics.fillRect(-halfSize * 0.15, -halfSize * 0.8, halfSize * 0.3, halfSize * 1.2);
      graphics.fillStyle(0x8b4513, 1);
      graphics.fillRect(-halfSize * 0.25, halfSize * 0.3, halfSize * 0.5, halfSize * 0.4);
      graphics.fillStyle(0xffd700, 1);
      graphics.fillRect(-halfSize * 0.4, halfSize * 0.2, halfSize * 0.8, halfSize * 0.15);
    } else if (slot === 'hat') {
      graphics.fillStyle(0x4444aa, 1);
      graphics.fillRoundedRect(-halfSize * 0.6, -halfSize * 0.3, halfSize * 1.2, halfSize * 0.8, 4);
      graphics.fillRect(-halfSize * 0.8, halfSize * 0.3, halfSize * 1.6, halfSize * 0.2);
    } else {
      graphics.fillStyle(0x666688, 1);
      graphics.fillRoundedRect(-halfSize * 0.5, -halfSize * 0.5, halfSize, halfSize, 4);
    }
  }

  private drawEtcIcon(graphics: Phaser.GameObjects.Graphics, item: Item, halfSize: number): void {
    if (item.id.includes('slime')) {
      graphics.fillStyle(0x66cc66, 0.8);
      graphics.fillCircle(0, 0, halfSize * 0.6);
      graphics.fillStyle(0x88ff88, 0.6);
      graphics.fillCircle(-halfSize * 0.2, -halfSize * 0.2, halfSize * 0.2);
    } else if (item.id.includes('mushroom')) {
      graphics.fillStyle(0xff8844, 1);
      graphics.fillCircle(0, -halfSize * 0.1, halfSize * 0.5);
      graphics.fillStyle(0xffaa66, 1);
      graphics.fillCircle(-halfSize * 0.15, -halfSize * 0.25, halfSize * 0.15);
    } else {
      graphics.fillStyle(0x888888, 1);
      graphics.fillCircle(0, 0, halfSize * 0.5);
    }
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
