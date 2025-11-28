import Phaser from 'phaser';

export interface PortalConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

export class Portal extends Phaser.GameObjects.Container {
  private portalGraphics: Phaser.GameObjects.Graphics;
  private enterText: Phaser.GameObjects.Text;
  private glowIntensity: number = 0;

  public targetMap: string;
  public targetX: number;
  public targetY: number;
  public isActive: boolean = true;
  public portalWidth: number;
  public portalHeight: number;

  constructor(config: PortalConfig) {
    super(config.scene, config.x, config.y);

    this.targetMap = config.targetMap;
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.portalWidth = config.width;
    this.portalHeight = config.height;

    // Create graphics for portal visual
    this.portalGraphics = config.scene.add.graphics();
    this.add(this.portalGraphics);

    // Create "ENTER" text
    this.enterText = config.scene.add.text(0, -this.portalHeight / 2 - 20, 'ENTER', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.enterText.setOrigin(0.5);
    this.add(this.enterText);

    config.scene.add.existing(this);

    // Start animations
    this.startAnimations();
    this.draw();
  }

  private startAnimations(): void {
    // Glow pulsing
    this.scene.tweens.add({
      targets: this,
      glowIntensity: 1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.draw()
    });

    // Text fade
    this.scene.tweens.add({
      targets: this.enterText,
      alpha: 0.5,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private draw(): void {
    this.portalGraphics.clear();

    if (!this.isActive) {
      this.portalGraphics.fillStyle(0x333333, 0.3);
      this.portalGraphics.fillEllipse(0, 0, this.portalWidth, this.portalHeight);
      return;
    }

    const radiusX = this.portalWidth / 2;
    const radiusY = this.portalHeight / 2;

    // Outer glow
    for (let i = 3; i > 0; i--) {
      const glowAlpha = (0.15 * this.glowIntensity) / i;
      this.portalGraphics.fillStyle(0x6666ff, glowAlpha);
      this.portalGraphics.fillEllipse(0, 0, radiusX * (1 + i * 0.15) * 2, radiusY * (1 + i * 0.15) * 2);
    }

    // Main portal
    this.portalGraphics.fillStyle(0x4444ff, 0.5 + this.glowIntensity * 0.2);
    this.portalGraphics.fillEllipse(0, 0, this.portalWidth, this.portalHeight);

    // Inner glow
    this.portalGraphics.fillStyle(0xaaaaff, 0.3 + this.glowIntensity * 0.3);
    this.portalGraphics.fillEllipse(0, 0, radiusX * 0.6 * 2, radiusY * 0.6 * 2);

    // Border
    this.portalGraphics.lineStyle(2, 0x9999ff, 0.8);
    this.portalGraphics.strokeEllipse(0, 0, this.portalWidth, this.portalHeight);
  }

  public activate(): void {
    this.isActive = true;
    this.enterText.setVisible(true);
    this.draw();
  }

  public deactivate(): void {
    this.isActive = false;
    this.enterText.setVisible(false);
    this.draw();
  }

  public getTargetPosition(): { x: number; y: number } {
    return { x: this.targetX, y: this.targetY };
  }

  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.portalWidth / 2,
      this.y - this.portalHeight / 2,
      this.portalWidth,
      this.portalHeight
    );
  }
}
