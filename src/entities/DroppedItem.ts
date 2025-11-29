import Phaser from 'phaser';
import { type Item, ItemType } from '../systems/ItemData';

export interface DroppedItemConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  item?: Item;
  quantity?: number;
  mesos?: number;
}

export class DroppedItem extends Phaser.GameObjects.Container {
  private item: Item | null;
  private quantity: number;
  private mesos: number;
  private graphic!: Phaser.GameObjects.Graphics;
  private quantityText?: Phaser.GameObjects.Text;
  private glowTween?: Phaser.Tweens.Tween;
  private floatTween?: Phaser.Tweens.Tween;
  private despawnTimer?: Phaser.Time.TimerEvent;

  private static readonly DESPAWN_TIME = 60000; // 60 seconds
  private static readonly PICKUP_DELAY = 500; // Can't pickup immediately

  private canPickup: boolean = false;
  private isBeingPickedUp: boolean = false;

  constructor(config: DroppedItemConfig) {
    super(config.scene, config.x, config.y);

    this.item = config.item || null;
    this.quantity = config.quantity || 1;
    this.mesos = config.mesos || 0;

    this.createVisual();
    this.setupAnimations();
    this.setupDespawn();

    // Delay before can be picked up
    this.scene.time.delayedCall(DroppedItem.PICKUP_DELAY, () => {
      this.canPickup = true;
    });

    this.scene.add.existing(this);
    this.setDepth(5);
  }

  private createVisual(): void {
    this.graphic = this.scene.add.graphics();

    if (this.mesos > 0) {
      this.drawMesoDrop();
    } else if (this.item) {
      this.drawItemDrop();
    }

    this.add(this.graphic);

    // Add quantity text for stackable items
    if (this.item && this.quantity > 1) {
      this.quantityText = this.scene.add.text(8, 8, this.quantity.toString(), {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      });
      this.quantityText.setOrigin(1, 1);
      this.add(this.quantityText);
    }
  }

  private drawMesoDrop(): void {
    // Gold coin bag for mesos
    const size = this.mesos >= 100 ? 14 : this.mesos >= 10 ? 12 : 10;

    // Bag shape
    this.graphic.fillStyle(0x8b6914, 1);
    this.graphic.fillRoundedRect(-size / 2, -size / 2 + 2, size, size - 2, 3);

    // Bag top (tied part)
    this.graphic.fillStyle(0x8b6914, 1);
    this.graphic.fillRect(-3, -size / 2 - 2, 6, 4);

    // Gold coins visible
    this.graphic.fillStyle(0xffd700, 1);
    this.graphic.fillCircle(-2, 2, 4);
    this.graphic.fillCircle(2, 0, 4);

    // Coin shine
    this.graphic.fillStyle(0xffec8b, 1);
    this.graphic.fillCircle(-3, 0, 1.5);
    this.graphic.fillCircle(1, -2, 1.5);

    // Bag tie
    this.graphic.fillStyle(0x654321, 1);
    this.graphic.fillRect(-4, -size / 2, 8, 2);
  }

  private drawItemDrop(): void {
    if (!this.item) return;

    const size = 16;
    const halfSize = size / 2;

    // Background glow based on rarity
    const rarityColors: Record<string, number> = {
      'common': 0x888888,
      'uncommon': 0x00ff00,
      'rare': 0x00bfff,
      'epic': 0x9932cc,
      'legendary': 0xffa500
    };

    const glowColor = rarityColors[this.item.rarity] || 0x888888;
    this.graphic.fillStyle(glowColor, 0.3);
    this.graphic.fillCircle(0, 0, halfSize + 4);

    // Draw item based on type
    switch (this.item.type) {
      case ItemType.USE:
        this.drawPotionDrop(halfSize);
        break;
      case ItemType.EQUIP:
        this.drawEquipDrop(halfSize);
        break;
      case ItemType.ETC:
        this.drawEtcDrop(halfSize);
        break;
      default:
        this.graphic.fillStyle(0x888888, 1);
        this.graphic.fillRect(-halfSize / 2, -halfSize / 2, halfSize, halfSize);
    }
  }

  private drawPotionDrop(halfSize: number): void {
    let potionColor = 0xff6666;
    let highlightColor = 0xffaaaa;

    if (this.item!.id.includes('blue') || this.item!.id.includes('mana')) {
      potionColor = 0x6666ff;
      highlightColor = 0xaaaaff;
    } else if (this.item!.id.includes('white')) {
      potionColor = 0xeeeeee;
      highlightColor = 0xffffff;
    } else if (this.item!.id === 'elixir') {
      potionColor = 0xaa66ff;
      highlightColor = 0xddaaff;
    }

    // Bottle
    this.graphic.fillStyle(0x88ccff, 0.7);
    this.graphic.fillRoundedRect(-halfSize * 0.35, -halfSize * 0.2, halfSize * 0.7, halfSize * 0.9, 2);

    // Neck
    this.graphic.fillRect(-halfSize * 0.2, -halfSize * 0.5, halfSize * 0.4, halfSize * 0.3);

    // Cork
    this.graphic.fillStyle(0x8b4513, 1);
    this.graphic.fillRect(-halfSize * 0.2, -halfSize * 0.65, halfSize * 0.4, halfSize * 0.15);

    // Liquid
    this.graphic.fillStyle(potionColor, 1);
    this.graphic.fillRoundedRect(-halfSize * 0.3, -halfSize * 0.05, halfSize * 0.6, halfSize * 0.7, 2);

    // Highlight
    this.graphic.fillStyle(highlightColor, 0.6);
    this.graphic.fillRect(-halfSize * 0.2, 0, halfSize * 0.1, halfSize * 0.3);
  }

  private drawEquipDrop(halfSize: number): void {
    if (!this.item) return;

    if (this.item.id.includes('sword')) {
      // Sword
      this.graphic.fillStyle(0xcccccc, 1);
      this.graphic.fillRect(-2, -halfSize * 0.7, 4, halfSize * 1.2);
      this.graphic.fillStyle(0x8b4513, 1);
      this.graphic.fillRect(-3, halfSize * 0.3, 6, halfSize * 0.3);
      this.graphic.fillStyle(0xffd700, 1);
      this.graphic.fillRect(-5, halfSize * 0.2, 10, 3);
    } else if (this.item.id.includes('hat')) {
      // Hat
      this.graphic.fillStyle(0x4444aa, 1);
      this.graphic.fillRoundedRect(-halfSize * 0.6, -halfSize * 0.3, halfSize * 1.2, halfSize * 0.7, 3);
      this.graphic.fillRect(-halfSize * 0.8, halfSize * 0.2, halfSize * 1.6, halfSize * 0.2);
    } else {
      // Generic equipment
      this.graphic.fillStyle(0x666688, 1);
      this.graphic.fillRoundedRect(-halfSize * 0.5, -halfSize * 0.5, halfSize, halfSize, 3);
    }
  }

  private drawEtcDrop(halfSize: number): void {
    if (!this.item) return;

    if (this.item.id.includes('slime')) {
      // Slime bubble
      this.graphic.fillStyle(0x66cc66, 0.8);
      this.graphic.fillCircle(0, 0, halfSize * 0.6);
      this.graphic.fillStyle(0xaaffaa, 0.6);
      this.graphic.fillCircle(-halfSize * 0.2, -halfSize * 0.2, halfSize * 0.2);
    } else if (this.item.id.includes('mushroom')) {
      // Mushroom cap
      this.graphic.fillStyle(0xff8844, 1);
      this.graphic.fillCircle(0, -halfSize * 0.1, halfSize * 0.5);
      this.graphic.fillStyle(0xffaa66, 1);
      this.graphic.fillCircle(-halfSize * 0.15, -halfSize * 0.25, halfSize * 0.15);
    } else {
      // Generic etc
      this.graphic.fillStyle(0x888888, 1);
      this.graphic.fillCircle(0, 0, halfSize * 0.5);
    }
  }

  private setupAnimations(): void {
    // Initial drop animation - bounce in from above
    this.setY(this.y - 50);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      y: this.y + 50,
      alpha: 1,
      duration: 400,
      ease: 'Bounce.easeOut'
    });

    // Floating animation
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y + 3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 400
    });

    // Glow pulse for rare+ items
    if (this.item && ['rare', 'epic', 'legendary'].includes(this.item.rarity)) {
      this.glowTween = this.scene.tweens.add({
        targets: this.graphic,
        alpha: 0.7,
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private setupDespawn(): void {
    // Start blinking before despawn
    this.despawnTimer = this.scene.time.delayedCall(DroppedItem.DESPAWN_TIME - 5000, () => {
      // Blink warning
      this.scene.tweens.add({
        targets: this,
        alpha: 0.3,
        duration: 200,
        ease: 'Linear',
        yoyo: true,
        repeat: 12,
        onComplete: () => {
          this.destroy();
        }
      });
    });
  }

  canBePickedUp(): boolean {
    return this.canPickup && !this.isBeingPickedUp;
  }

  getItem(): Item | null {
    return this.item;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getMesos(): number {
    return this.mesos;
  }

  isMesoDrop(): boolean {
    return this.mesos > 0;
  }

  pickup(targetX: number, targetY: number, onComplete: () => void): void {
    if (this.isBeingPickedUp) return;
    this.isBeingPickedUp = true;

    // Stop other animations
    this.floatTween?.stop();
    this.glowTween?.stop();
    this.despawnTimer?.remove();

    // Fly to player animation
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY - 20,
      scale: 0.5,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        onComplete();
        this.destroy();
      }
    });
  }

  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 15, this.y - 15, 30, 30);
  }

  destroy(fromScene?: boolean): void {
    this.floatTween?.stop();
    this.glowTween?.stop();
    this.despawnTimer?.remove();
    super.destroy(fromScene);
  }
}
