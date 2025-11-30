import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

interface StatusBar {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  fill: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  currentValue: number;
  maxValue: number;
}

export default class UIScene extends Phaser.Scene {
  private hpBar!: StatusBar;
  private mpBar!: StatusBar;
  private expBar!: StatusBar;
  private levelText!: Phaser.GameObjects.Text;
  private statusFrame!: Phaser.GameObjects.Graphics;
  private miniMapContainer!: Phaser.GameObjects.Container;
  private mapTitleText!: Phaser.GameObjects.Text;

  private readonly BAR_WIDTH = 160;
  private readonly BAR_HEIGHT = 18;
  private readonly EXP_BAR_HEIGHT = 16;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Create main status frame (MapleStory style)
    this.createStatusFrame();

    // HP bar with heart icon
    this.hpBar = this.createFancyBar(58, 28, this.BAR_WIDTH, this.BAR_HEIGHT, 'hp');

    // MP bar with star icon
    this.mpBar = this.createFancyBar(58, 52, this.BAR_WIDTH, this.BAR_HEIGHT, 'mp');

    // Player name
    this.add.text(120, 8, 'Adventurer', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);

    // Level display
    this.levelText = this.add.text(15, 35, 'Lv.1', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    });

    // EXP bar at bottom (full width, sleek)
    this.expBar = this.createExpBar();

    // Mini-map frame placeholder (top-right)
    this.createMiniMapFrame();

    // M key to toggle minimap
    this.input.keyboard?.on('keydown-M', () => {
      this.miniMapContainer.setVisible(!this.miniMapContainer.visible);
    });

    // Set up event listeners
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.on('player:hp-changed', this.handleHPChanged, this);
      gameScene.events.on('player:mp-changed', this.handleMPChanged, this);
      gameScene.events.on('player:exp-changed', this.handleEXPChanged, this);
      gameScene.events.on('player:level-up', this.handleLevelUp, this);
      gameScene.events.on('map:changed', this.handleMapChanged, this);
    }

    // Initialize
    this.updateHP(100, 100);
    this.updateMP(50, 50);
    this.updateEXP(0, 100, 1);
  }

  private createStatusFrame(): void {
    this.statusFrame = this.add.graphics();

    // Outer frame with gradient effect
    const frameX = 5;
    const frameY = 5;
    const frameW = 230;
    const frameH = 75;

    // Shadow
    this.statusFrame.fillStyle(0x000000, 0.5);
    this.statusFrame.fillRoundedRect(frameX + 3, frameY + 3, frameW, frameH, 8);

    // Main background gradient simulation
    this.statusFrame.fillStyle(0x1a1a2e, 0.95);
    this.statusFrame.fillRoundedRect(frameX, frameY, frameW, frameH, 8);

    // Inner panel
    this.statusFrame.fillStyle(0x0f0f1a, 0.9);
    this.statusFrame.fillRoundedRect(frameX + 4, frameY + 4, frameW - 8, frameH - 8, 6);

    // Decorative border
    this.statusFrame.lineStyle(2, 0x4a4a6a, 1);
    this.statusFrame.strokeRoundedRect(frameX, frameY, frameW, frameH, 8);

    // Inner highlight
    this.statusFrame.lineStyle(1, 0x6a6a8a, 0.5);
    this.statusFrame.strokeRoundedRect(frameX + 2, frameY + 2, frameW - 4, frameH - 4, 7);

    // Top accent line
    this.statusFrame.lineStyle(2, 0xf1c40f, 0.8);
    this.statusFrame.beginPath();
    this.statusFrame.moveTo(frameX + 20, frameY);
    this.statusFrame.lineTo(frameX + frameW - 20, frameY);
    this.statusFrame.strokePath();
  }

  private createFancyBar(x: number, y: number, width: number, height: number, type: 'hp' | 'mp'): StatusBar {
    const container = this.add.container(x, y);

    // Background with inner shadow
    const background = this.add.graphics();
    background.fillStyle(0x0a0a0a, 1);
    background.fillRoundedRect(0, 0, width, height, 4);
    background.lineStyle(1, 0x3a3a4a, 1);
    background.strokeRoundedRect(0, 0, width, height, 4);

    // Inner shadow gradient
    background.fillStyle(0x000000, 0.3);
    background.fillRect(2, 2, width - 4, 4);

    container.add(background);

    // Glow effect (animated)
    const glow = this.add.graphics();
    container.add(glow);

    // Fill bar
    const fill = this.add.graphics();
    container.add(fill);

    // Icon
    const icon = this.add.graphics();
    this.drawBarIcon(icon, -22, height / 2, type);
    container.add(icon);

    // Text
    const text = this.add.text(width / 2, height / 2, '100/100', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(text);

    return {
      container,
      background,
      fill,
      glow,
      icon,
      text,
      currentValue: 100,
      maxValue: 100
    };
  }

  private drawBarIcon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, type: 'hp' | 'mp'): void {
    if (type === 'hp') {
      // Heart icon
      graphics.fillStyle(0xff4757, 1);
      graphics.fillCircle(x - 4, y - 2, 5);
      graphics.fillCircle(x + 4, y - 2, 5);
      graphics.fillTriangle(x - 8, y, x + 8, y, x, y + 8);

      // Highlight
      graphics.fillStyle(0xff6b7a, 1);
      graphics.fillCircle(x - 5, y - 3, 2);
    } else {
      // Star/magic icon
      graphics.fillStyle(0x3498db, 1);
      this.drawStar(graphics, x, y, 5, 8, 4);

      // Glow
      graphics.fillStyle(0x5dade2, 0.5);
      graphics.fillCircle(x, y, 6);
    }
  }

  private drawStar(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outer: number, inner: number): void {
    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  private createExpBar(): StatusBar {
    const barY = GAME_HEIGHT - 22;
    const barX = 10;
    const barWidth = GAME_WIDTH - 20;
    const barHeight = this.EXP_BAR_HEIGHT;

    const container = this.add.container(barX, barY);

    // Background
    const background = this.add.graphics();
    background.fillStyle(0x1a1a2e, 0.9);
    background.fillRoundedRect(0, 0, barWidth, barHeight, 4);
    background.lineStyle(2, 0x4a4a6a, 1);
    background.strokeRoundedRect(0, 0, barWidth, barHeight, 4);
    container.add(background);

    // Glow
    const glow = this.add.graphics();
    container.add(glow);

    // Fill
    const fill = this.add.graphics();
    container.add(fill);

    // Icon (unused for EXP)
    const icon = this.add.graphics();

    // EXP text
    const text = this.add.text(barWidth / 2, barHeight / 2, '0.0%', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(text);

    // "EXP" label
    const label = this.add.text(8, barHeight / 2, 'EXP', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    container.add(label);

    return {
      container,
      background,
      fill,
      glow,
      icon,
      text,
      currentValue: 0,
      maxValue: 100
    };
  }

  private createMiniMapFrame(): void {
    const mapW = 150;
    const mapH = 100;
    const mapX = GAME_WIDTH - mapW - 10;
    const mapY = 10;

    // Create container for all minimap elements
    this.miniMapContainer = this.add.container(0, 0);

    const frame = this.add.graphics();

    // Shadow
    frame.fillStyle(0x000000, 0.4);
    frame.fillRoundedRect(mapX + 2, mapY + 2, mapW, mapH, 6);

    // Background
    frame.fillStyle(0x1a1a2e, 0.85);
    frame.fillRoundedRect(mapX, mapY, mapW, mapH, 6);

    // Border
    frame.lineStyle(2, 0x4a4a6a, 1);
    frame.strokeRoundedRect(mapX, mapY, mapW, mapH, 6);

    // Mini-map "content" placeholder
    frame.fillStyle(0x2d3436, 0.6);
    frame.fillRoundedRect(mapX + 4, mapY + 20, mapW - 8, mapH - 24, 4);

    // Title bar
    frame.fillStyle(0x0f0f1a, 0.9);
    frame.fillRoundedRect(mapX + 2, mapY + 2, mapW - 4, 16, { tl: 4, tr: 4, bl: 0, br: 0 });

    this.miniMapContainer.add(frame);

    // Map title
    this.mapTitleText = this.add.text(mapX + mapW / 2, mapY + 10, 'Henesys Hunting Ground', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.miniMapContainer.add(this.mapTitleText);

    // Player dot on mini-map
    const playerDot = this.add.graphics();
    playerDot.fillStyle(0x00ff00, 1);
    playerDot.fillCircle(mapX + mapW / 2, mapY + mapH / 2 + 10, 3);
    this.miniMapContainer.add(playerDot);

    // Pulse animation for player dot
    this.tweens.add({
      targets: playerDot,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  private updateFancyBar(
    bar: StatusBar,
    current: number,
    max: number,
    fillColor: number,
    glowColor: number,
    width: number,
    height: number
  ): void {
    bar.currentValue = current;
    bar.maxValue = max;

    const fillWidth = Math.max(0, (current / max) * (width - 4));

    bar.fill.clear();
    bar.glow.clear();

    if (fillWidth > 0) {
      // Glow effect
      bar.glow.fillStyle(glowColor, 0.3);
      bar.glow.fillRoundedRect(2, 2, fillWidth, height - 4, 3);

      // Main fill with gradient effect (lighter top)
      bar.fill.fillStyle(fillColor, 1);
      bar.fill.fillRoundedRect(2, 2, fillWidth, height - 4, 3);

      // Top highlight
      bar.fill.fillStyle(0xffffff, 0.2);
      bar.fill.fillRect(4, 3, fillWidth - 4, 3);

      // Animated shine effect
      bar.fill.fillStyle(0xffffff, 0.1);
      const shineOffset = (Date.now() / 20) % (width + 40) - 20;
      bar.fill.fillRect(Math.max(2, shineOffset), 2, 15, height - 4);
    }

    bar.text.setText(`${Math.floor(current)}/${max}`);
  }

  public updateHP(current: number, max: number): void {
    this.updateFancyBar(this.hpBar, current, max, 0xe74c3c, 0xff6b6b, this.BAR_WIDTH, this.BAR_HEIGHT);
  }

  public updateMP(current: number, max: number): void {
    this.updateFancyBar(this.mpBar, current, max, 0x3498db, 0x5dade2, this.BAR_WIDTH, this.BAR_HEIGHT);
  }

  public updateEXP(current: number, max: number, level: number): void {
    const barWidth = GAME_WIDTH - 20;

    this.expBar.currentValue = current;
    this.expBar.maxValue = max;

    const fillWidth = Math.max(0, (current / max) * (barWidth - 4));

    this.expBar.fill.clear();
    if (fillWidth > 0) {
      // Gold gradient fill
      this.expBar.fill.fillStyle(0xf39c12, 1);
      this.expBar.fill.fillRoundedRect(2, 2, fillWidth, this.EXP_BAR_HEIGHT - 4, 3);

      // Top highlight
      this.expBar.fill.fillStyle(0xf1c40f, 1);
      this.expBar.fill.fillRect(4, 3, fillWidth - 4, 4);

      // Shine
      this.expBar.fill.fillStyle(0xffffff, 0.15);
      this.expBar.fill.fillRect(4, 3, fillWidth - 4, 2);
    }

    const percentage = max > 0 ? ((current / max) * 100).toFixed(2) : '0.00';
    this.expBar.text.setText(`${percentage}%`);

    this.levelText.setText(`Lv.${level}`);
  }

  public showLevelUp(): void {
    // Level up effect - more dramatic
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Glow circle
    const glow = this.add.graphics();
    glow.fillStyle(0xf1c40f, 0.3);
    glow.fillCircle(0, 0, 100);
    container.add(glow);

    // Main text
    const levelUpText = this.add.text(0, -20, 'LEVEL UP!', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(levelUpText);

    // Subtitle
    const subText = this.add.text(0, 25, 'Congratulations!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(subText);

    // Sparkle particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spark = this.add.graphics();
      spark.fillStyle(0xffffff, 1);
      this.drawStar(spark, 0, 0, 4, 6, 3);
      spark.setPosition(Math.cos(angle) * 80, Math.sin(angle) * 80);
      container.add(spark);

      this.tweens.add({
        targets: spark,
        x: Math.cos(angle) * 150,
        y: Math.sin(angle) * 150,
        alpha: 0,
        duration: 1000,
        ease: 'Quad.easeOut'
      });
    }

    this.cameras.main.flash(500, 255, 215, 0);

    // Animate out
    this.tweens.add({
      targets: container,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 2500,
      ease: 'Back.easeOut',
      onComplete: () => container.destroy()
    });

    this.tweens.add({
      targets: glow,
      scale: { from: 0.5, to: 3 },
      alpha: { from: 0.5, to: 0 },
      duration: 1500,
      ease: 'Quad.easeOut'
    });
  }

  private handleHPChanged(data: { current: number; max: number }): void {
    this.updateHP(data.current, data.max);
  }

  private handleMPChanged(data: { current: number; max: number }): void {
    this.updateMP(data.current, data.max);
  }

  private handleEXPChanged(data: { current: number; max: number; level: number }): void {
    this.updateEXP(data.current, data.max, data.level);
  }

  private handleLevelUp(): void {
    this.showLevelUp();
  }

  private handleMapChanged(data: { mapName: string }): void {
    this.mapTitleText.setText(data.mapName);
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.off('player:hp-changed', this.handleHPChanged, this);
      gameScene.events.off('player:mp-changed', this.handleMPChanged, this);
      gameScene.events.off('player:exp-changed', this.handleEXPChanged, this);
      gameScene.events.off('player:level-up', this.handleLevelUp, this);
      gameScene.events.off('map:changed', this.handleMapChanged, this);
    }
  }

  // Menu state getters/setters for save/load
  public isMinimapVisible(): boolean {
    return this.miniMapContainer?.visible ?? true;
  }

  public setMinimapVisible(visible: boolean): void {
    if (this.miniMapContainer) {
      this.miniMapContainer.setVisible(visible);
    }
  }
}
