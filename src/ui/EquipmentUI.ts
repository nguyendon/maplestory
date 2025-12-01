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
  private characterPreview!: Phaser.GameObjects.Container;
  private charParts: {
    body: Phaser.GameObjects.Graphics;
    head: Phaser.GameObjects.Graphics;
    hat?: Phaser.GameObjects.Graphics;
    top?: Phaser.GameObjects.Graphics;
    bottom?: Phaser.GameObjects.Graphics;
    weapon?: Phaser.GameObjects.Graphics;
    cape?: Phaser.GameObjects.Graphics;
    gloves?: Phaser.GameObjects.Graphics;
    shoes?: Phaser.GameObjects.Graphics;
    accessory?: Phaser.GameObjects.Graphics;
  } = {} as any;

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

    // Create character preview container
    this.createCharacterPreview();

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

  private createCharacterPreview(): void {
    const baseY = -this.PANEL_HEIGHT / 2 + 125;
    this.characterPreview = this.scene.add.container(0, baseY);
    this.add(this.characterPreview);

    // Cape (behind character)
    const cape = this.scene.add.graphics();
    cape.setName('cape');
    this.characterPreview.add(cape);
    this.charParts.cape = cape;

    // Legs/bottom
    const bottom = this.scene.add.graphics();
    bottom.setName('bottom');
    this.characterPreview.add(bottom);
    this.charParts.bottom = bottom;

    // Shoes
    const shoes = this.scene.add.graphics();
    shoes.setName('shoes');
    this.characterPreview.add(shoes);
    this.charParts.shoes = shoes;

    // Body base
    const body = this.scene.add.graphics();
    body.setName('body');
    this.characterPreview.add(body);
    this.charParts.body = body;

    // Top/armor
    const top = this.scene.add.graphics();
    top.setName('top');
    this.characterPreview.add(top);
    this.charParts.top = top;

    // Gloves
    const gloves = this.scene.add.graphics();
    gloves.setName('gloves');
    this.characterPreview.add(gloves);
    this.charParts.gloves = gloves;

    // Weapon
    const weapon = this.scene.add.graphics();
    weapon.setName('weapon');
    this.characterPreview.add(weapon);
    this.charParts.weapon = weapon;

    // Head
    const head = this.scene.add.graphics();
    head.setName('head');
    this.characterPreview.add(head);
    this.charParts.head = head;

    // Hat
    const hat = this.scene.add.graphics();
    hat.setName('hat');
    this.characterPreview.add(hat);
    this.charParts.hat = hat;

    // Accessory
    const accessory = this.scene.add.graphics();
    accessory.setName('accessory');
    this.characterPreview.add(accessory);
    this.charParts.accessory = accessory;

    // Initial draw
    this.drawCharacterPreview();

    // Add idle animation
    this.scene.tweens.add({
      targets: this.characterPreview,
      y: baseY - 3,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private drawCharacterPreview(): void {
    // Draw base body (skin tone)
    const body = this.charParts.body;
    body.clear();
    body.fillStyle(0xffe0bd, 1); // Skin color

    // Torso
    body.fillRoundedRect(-12, -15, 24, 30, 3);
    // Neck
    body.fillRect(-4, -22, 8, 8);
    // Arms (base)
    body.fillRoundedRect(-22, -12, 12, 25, 2);
    body.fillRoundedRect(10, -12, 12, 25, 2);
    // Legs (base)
    body.fillRoundedRect(-10, 15, 8, 28, 2);
    body.fillRoundedRect(2, 15, 8, 28, 2);

    // Draw head
    const head = this.charParts.head;
    head.clear();
    head.fillStyle(0xffe0bd, 1);
    head.fillCircle(0, -35, 16);
    // Face features
    head.fillStyle(0x333333, 1);
    head.fillCircle(-5, -37, 2); // Left eye
    head.fillCircle(5, -37, 2);  // Right eye
    head.fillStyle(0xffb6a3, 1);
    head.fillCircle(0, -32, 1);  // Nose
    // Hair (default)
    head.fillStyle(0x4a3728, 1);
    head.fillRoundedRect(-14, -50, 28, 12, { tl: 8, tr: 8, bl: 0, br: 0 });
    head.fillRect(-14, -42, 4, 10);
    head.fillRect(10, -42, 4, 10);

    // Draw equipped items if available
    this.updateCharacterEquipment();
  }

  private updateCharacterEquipment(): void {
    if (!this.equipment) return;

    // Hat
    const hatItem = this.equipment.getSlot(EquipSlot.HAT);
    const hat = this.charParts.hat!;
    hat.clear();
    if (hatItem) {
      hat.fillStyle(0x4455aa, 1);
      hat.fillRoundedRect(-16, -58, 32, 14, { tl: 6, tr: 6, bl: 2, br: 2 });
      hat.fillStyle(0x3344aa, 1);
      hat.fillRect(-18, -46, 36, 4);
      // Hat decoration
      hat.fillStyle(0xffd700, 1);
      hat.fillCircle(0, -52, 3);
    }

    // Top/Armor
    const topItem = this.equipment.getSlot(EquipSlot.TOP);
    const top = this.charParts.top!;
    top.clear();
    if (topItem) {
      top.fillStyle(0x3366aa, 1);
      top.fillRoundedRect(-14, -16, 28, 32, 4);
      // Armor details
      top.fillStyle(0x2255aa, 1);
      top.fillRect(-14, -5, 28, 3);
      top.fillStyle(0x4477cc, 1);
      top.fillRect(-8, -14, 16, 8);
      // Sleeves
      top.fillStyle(0x3366aa, 1);
      top.fillRoundedRect(-24, -14, 14, 20, 2);
      top.fillRoundedRect(10, -14, 14, 20, 2);
    }

    // Bottom/Pants
    const bottomItem = this.equipment.getSlot(EquipSlot.BOTTOM);
    const bottom = this.charParts.bottom!;
    bottom.clear();
    if (bottomItem) {
      bottom.fillStyle(0x2244aa, 1);
      bottom.fillRect(-11, 14, 9, 30);
      bottom.fillRect(2, 14, 9, 30);
      bottom.fillRect(-11, 14, 22, 6);
      // Belt
      bottom.fillStyle(0x8b4513, 1);
      bottom.fillRect(-12, 14, 24, 4);
      bottom.fillStyle(0xffd700, 1);
      bottom.fillRect(-2, 14, 4, 4);
    }

    // Shoes
    const shoesItem = this.equipment.getSlot(EquipSlot.SHOES);
    const shoes = this.charParts.shoes!;
    shoes.clear();
    if (shoesItem) {
      shoes.fillStyle(0x8b4513, 1);
      shoes.fillRoundedRect(-12, 40, 10, 6, 2);
      shoes.fillRoundedRect(2, 40, 10, 6, 2);
      // Shoe details
      shoes.fillStyle(0x6b3503, 1);
      shoes.fillRect(-10, 43, 6, 2);
      shoes.fillRect(4, 43, 6, 2);
    }

    // Gloves
    const glovesItem = this.equipment.getSlot(EquipSlot.GLOVES);
    const gloves = this.charParts.gloves!;
    gloves.clear();
    if (glovesItem) {
      gloves.fillStyle(0x666666, 1);
      gloves.fillRoundedRect(-24, 8, 14, 8, 2);
      gloves.fillRoundedRect(10, 8, 14, 8, 2);
      // Glove cuffs
      gloves.fillStyle(0x888888, 1);
      gloves.fillRect(-22, 6, 10, 3);
      gloves.fillRect(12, 6, 10, 3);
    }

    // Cape
    const capeItem = this.equipment.getSlot(EquipSlot.CAPE);
    const cape = this.charParts.cape!;
    cape.clear();
    if (capeItem) {
      cape.fillStyle(0x882222, 0.9);
      cape.beginPath();
      cape.moveTo(-12, -16);
      cape.lineTo(-20, 40);
      cape.lineTo(20, 40);
      cape.lineTo(12, -16);
      cape.closePath();
      cape.fillPath();
      // Cape clasp
      cape.fillStyle(0xffd700, 1);
      cape.fillCircle(-10, -14, 3);
      cape.fillCircle(10, -14, 3);
      // Cape inner
      cape.fillStyle(0xcc3333, 0.6);
      cape.fillRect(-15, -10, 30, 45);
    }

    // Weapon
    const weaponItem = this.equipment.getSlot(EquipSlot.WEAPON);
    const weapon = this.charParts.weapon!;
    weapon.clear();
    if (weaponItem) {
      // Sword
      weapon.fillStyle(0xcccccc, 1);
      weapon.fillRect(-35, -25, 6, 35);
      weapon.fillStyle(0xaaaaaa, 1);
      weapon.fillRect(-35, -25, 2, 35);
      // Sword tip
      weapon.beginPath();
      weapon.moveTo(-35, -25);
      weapon.lineTo(-32, -32);
      weapon.lineTo(-29, -25);
      weapon.closePath();
      weapon.fillStyle(0xcccccc, 1);
      weapon.fillPath();
      // Handle
      weapon.fillStyle(0x8b4513, 1);
      weapon.fillRect(-36, 8, 8, 14);
      // Guard
      weapon.fillStyle(0xffd700, 1);
      weapon.fillRect(-40, 6, 16, 4);
    }

    // Accessory
    const accessoryItem = this.equipment.getSlot(EquipSlot.ACCESSORY);
    const accessory = this.charParts.accessory!;
    accessory.clear();
    if (accessoryItem) {
      // Pendant/necklace
      accessory.fillStyle(0xffd700, 0.8);
      accessory.lineStyle(2, 0xffd700, 1);
      accessory.strokeCircle(0, -18, 5);
      accessory.fillStyle(0x00bfff, 1);
      accessory.fillCircle(0, -18, 3);
    }
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

    // Update character preview
    this.updateCharacterEquipment();

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
