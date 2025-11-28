import Phaser from 'phaser';

export interface ParallaxLayerConfig {
  key: string;
  scrollFactor: number;
  y?: number;
  tileWidth?: number;
  tileHeight?: number;
  alpha?: number;
  tint?: number;
}

export interface ParallaxLayer {
  image: Phaser.GameObjects.TileSprite;
  scrollFactor: number;
  autoScrollSpeed?: number;
}

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private gameWidth: number;
  private gameHeight: number;

  constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }

  /**
   * Add a parallax layer from a texture key
   */
  addLayer(config: ParallaxLayerConfig): ParallaxLayer {
    const texture = this.scene.textures.get(config.key);
    const frame = texture.get();

    const tileHeight = config.tileHeight ?? frame.height;
    const y = config.y ?? this.gameHeight - tileHeight;

    const image = this.scene.add.tileSprite(
      this.gameWidth / 2,
      y + tileHeight / 2,
      this.gameWidth,
      tileHeight,
      config.key
    );

    image.setScrollFactor(0); // Fixed to camera
    image.setDepth(-100 + this.layers.length); // Background layers

    if (config.alpha !== undefined) {
      image.setAlpha(config.alpha);
    }

    if (config.tint !== undefined) {
      image.setTint(config.tint);
    }

    const layer: ParallaxLayer = {
      image,
      scrollFactor: config.scrollFactor
    };

    this.layers.push(layer);
    return layer;
  }

  /**
   * Create a simple colored gradient layer (no texture needed)
   */
  addGradientLayer(
    colors: number[],
    y: number,
    height: number,
    _scrollFactor: number
  ): void {
    const graphics = this.scene.add.graphics();
    graphics.setScrollFactor(0);
    graphics.setDepth(-100 + this.layers.length);

    const stepHeight = height / colors.length;
    colors.forEach((color, index) => {
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y + index * stepHeight, this.gameWidth, stepHeight);
    });
  }

  /**
   * Add clouds or floating elements layer
   */
  addCloudsLayer(
    _scrollFactor: number,
    autoScrollSpeed: number = 0.2,
    yPosition: number = 50
  ): void {
    const graphics = this.scene.add.graphics();
    graphics.setScrollFactor(0);
    graphics.setDepth(-90);

    // Create cloud pattern
    graphics.fillStyle(0xffffff, 0.7);

    // Draw several clouds at different positions
    const cloudPositions = [
      { x: 100, y: yPosition, size: 50 },
      { x: 300, y: yPosition + 30, size: 70 },
      { x: 550, y: yPosition - 10, size: 60 },
      { x: 750, y: yPosition + 20, size: 45 }
    ];

    cloudPositions.forEach(cloud => {
      this.drawCloud(graphics, cloud.x, cloud.y, cloud.size);
    });

    // Store for animation
    this.scene.tweens.add({
      targets: graphics,
      x: -100,
      duration: 50000 / autoScrollSpeed,
      ease: 'Linear',
      repeat: -1,
      onRepeat: () => {
        graphics.x = 0;
      }
    });
  }

  private drawCloud(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number
  ): void {
    graphics.fillCircle(x, y, size * 0.4);
    graphics.fillCircle(x + size * 0.3, y - size * 0.1, size * 0.35);
    graphics.fillCircle(x + size * 0.6, y, size * 0.3);
    graphics.fillCircle(x + size * 0.2, y + size * 0.15, size * 0.25);
  }

  /**
   * Update parallax scrolling based on camera position
   */
  update(cameraX: number, _cameraY: number): void {
    this.layers.forEach(layer => {
      // Calculate tile offset based on camera position and scroll factor
      layer.image.tilePositionX = cameraX * layer.scrollFactor;

      // Auto-scroll if enabled
      if (layer.autoScrollSpeed) {
        layer.image.tilePositionX += layer.autoScrollSpeed;
      }
    });
  }

  /**
   * Create a default MapleStory-style background
   */
  createDefaultBackground(): void {
    // Sky gradient
    this.addGradientLayer(
      [0x1e90ff, 0x87ceeb, 0xb0e0e6],
      0,
      this.gameHeight,
      0
    );

    // Clouds
    this.addCloudsLayer(0.1, 0.3, 80);
  }

  /**
   * Clean up all layers
   */
  destroy(): void {
    this.layers.forEach(layer => {
      layer.image.destroy();
    });
    this.layers = [];
  }
}
