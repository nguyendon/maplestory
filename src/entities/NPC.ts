import Phaser from 'phaser';

export interface NPCConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  name: string;
  spriteKey?: string;
  dialogueKey: string;
  width?: number;
  height?: number;
}

export class NPC extends Phaser.GameObjects.Container {
  private npcGraphics: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private interactionPrompt: Phaser.GameObjects.Text;
  private floatTween: Phaser.Tweens.Tween | null = null;

  public npcName: string;
  public dialogueKey: string;
  public npcWidth: number;
  public npcHeight: number;
  public isInteractable: boolean = true;

  constructor(config: NPCConfig) {
    super(config.scene, config.x, config.y);

    this.npcName = config.name;
    this.dialogueKey = config.dialogueKey;
    this.npcWidth = config.width ?? 32;
    this.npcHeight = config.height ?? 48;

    // Create NPC graphics (placeholder)
    this.npcGraphics = config.scene.add.graphics();
    this.drawNPC();
    this.add(this.npcGraphics);

    // Name label above NPC
    this.nameText = config.scene.add.text(0, -this.npcHeight / 2 - 25, this.npcName, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Interaction prompt (hidden by default)
    this.interactionPrompt = config.scene.add.text(0, -this.npcHeight / 2 - 45, 'Press [N]', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 }
    });
    this.interactionPrompt.setOrigin(0.5);
    this.interactionPrompt.setVisible(false);
    this.add(this.interactionPrompt);

    config.scene.add.existing(this);

    // Add floating animation
    this.startFloatAnimation();
  }

  private drawNPC(): void {
    this.npcGraphics.clear();

    // Body
    this.npcGraphics.fillStyle(0x8b4513, 1); // Brown robe
    this.npcGraphics.fillRoundedRect(
      -this.npcWidth / 2,
      -this.npcHeight / 2 + 15,
      this.npcWidth,
      this.npcHeight - 15,
      4
    );

    // Head
    this.npcGraphics.fillStyle(0xffdbac, 1); // Skin color
    this.npcGraphics.fillCircle(0, -this.npcHeight / 2 + 10, 12);

    // Eyes
    this.npcGraphics.fillStyle(0x000000, 1);
    this.npcGraphics.fillCircle(-4, -this.npcHeight / 2 + 8, 2);
    this.npcGraphics.fillCircle(4, -this.npcHeight / 2 + 8, 2);

    // Hair
    this.npcGraphics.fillStyle(0x4a3728, 1);
    this.npcGraphics.fillEllipse(0, -this.npcHeight / 2 + 2, 20, 10);
  }

  private startFloatAnimation(): void {
    this.floatTween = this.scene.tweens.add({
      targets: this.nameText,
      y: this.nameText.y - 3,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  public showInteractionPrompt(): void {
    this.interactionPrompt.setVisible(true);
  }

  public hideInteractionPrompt(): void {
    this.interactionPrompt.setVisible(false);
  }

  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.npcWidth / 2,
      this.y - this.npcHeight / 2,
      this.npcWidth,
      this.npcHeight
    );
  }

  public getInteractionBounds(): Phaser.Geom.Rectangle {
    // Larger area for interaction detection
    const padding = 20;
    return new Phaser.Geom.Rectangle(
      this.x - this.npcWidth / 2 - padding,
      this.y - this.npcHeight / 2 - padding,
      this.npcWidth + padding * 2,
      this.npcHeight + padding * 2
    );
  }

  public destroy(): void {
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    super.destroy();
  }
}
