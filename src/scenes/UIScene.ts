import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

interface StatusBar {
  background: Phaser.GameObjects.Graphics;
  fill: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  currentValue: number;
  maxValue: number;
}

export default class UIScene extends Phaser.Scene {
  private hpBar!: StatusBar;
  private mpBar!: StatusBar;
  private expBar!: StatusBar;
  private levelText!: Phaser.GameObjects.Text;

  private readonly BAR_WIDTH = 180;
  private readonly BAR_HEIGHT = 22;
  private readonly BAR_PADDING = 10;
  private readonly EXP_BAR_HEIGHT = 12;

  private readonly HP_COLOR = 0xe74c3c;
  private readonly MP_COLOR = 0x3498db;
  private readonly EXP_COLOR = 0xf1c40f;
  private readonly BG_COLOR = 0x2c3e50;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // HP bar
    this.hpBar = this.createStatusBar(
      this.BAR_PADDING,
      this.BAR_PADDING,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      this.HP_COLOR
    );

    // MP bar
    this.mpBar = this.createStatusBar(
      this.BAR_PADDING,
      this.BAR_PADDING * 2 + this.BAR_HEIGHT,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      this.MP_COLOR
    );

    // EXP bar at bottom
    this.expBar = this.createStatusBar(
      this.BAR_PADDING,
      GAME_HEIGHT - this.BAR_PADDING - this.EXP_BAR_HEIGHT,
      GAME_WIDTH - this.BAR_PADDING * 2,
      this.EXP_BAR_HEIGHT,
      this.EXP_COLOR
    );

    // Level text
    this.levelText = this.add.text(
      this.BAR_PADDING + this.BAR_WIDTH + 15,
      this.BAR_PADDING,
      'Lv.1',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }
    );

    // Set up event listeners
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.on('player:hp-changed', this.handleHPChanged, this);
      gameScene.events.on('player:mp-changed', this.handleMPChanged, this);
      gameScene.events.on('player:exp-changed', this.handleEXPChanged, this);
      gameScene.events.on('player:level-up', this.handleLevelUp, this);
    }

    // Initialize
    this.updateHP(100, 100);
    this.updateMP(50, 50);
    this.updateEXP(0, 100, 1);
  }

  private createStatusBar(
    x: number,
    y: number,
    width: number,
    height: number,
    _fillColor: number
  ): StatusBar {
    const background = this.add.graphics();
    background.fillStyle(this.BG_COLOR, 0.8);
    background.fillRoundedRect(x, y, width, height, 4);
    background.lineStyle(2, 0x34495e, 1);
    background.strokeRoundedRect(x, y, width, height, 4);

    const fill = this.add.graphics();

    const text = this.add.text(x + width / 2, y + height / 2, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    return {
      background,
      fill,
      text,
      currentValue: 0,
      maxValue: 100
    };
  }

  private updateBar(
    bar: StatusBar,
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number,
    fillColor: number,
    showText: boolean = true
  ): void {
    bar.currentValue = current;
    bar.maxValue = max;

    bar.fill.clear();
    const fillWidth = Math.max(0, (current / max) * (width - 4));
    if (fillWidth > 0) {
      bar.fill.fillStyle(fillColor, 1);
      bar.fill.fillRoundedRect(x + 2, y + 2, fillWidth, height - 4, 3);
    }

    if (showText) {
      bar.text.setText(`${Math.floor(current)}/${max}`);
    }
  }

  public updateHP(current: number, max: number): void {
    this.updateBar(
      this.hpBar,
      this.BAR_PADDING,
      this.BAR_PADDING,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      current,
      max,
      this.HP_COLOR
    );
  }

  public updateMP(current: number, max: number): void {
    this.updateBar(
      this.mpBar,
      this.BAR_PADDING,
      this.BAR_PADDING * 2 + this.BAR_HEIGHT,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      current,
      max,
      this.MP_COLOR
    );
  }

  public updateEXP(current: number, max: number, level: number): void {
    this.updateBar(
      this.expBar,
      this.BAR_PADDING,
      GAME_HEIGHT - this.BAR_PADDING - this.EXP_BAR_HEIGHT,
      GAME_WIDTH - this.BAR_PADDING * 2,
      this.EXP_BAR_HEIGHT,
      current,
      max,
      this.EXP_COLOR,
      false
    );

    this.levelText.setText(`Lv.${level}`);

    const percentage = max > 0 ? ((current / max) * 100).toFixed(1) : '0.0';
    this.expBar.text.setText(`${percentage}%`);
    this.expBar.text.setPosition(
      GAME_WIDTH / 2,
      GAME_HEIGHT - this.BAR_PADDING - this.EXP_BAR_HEIGHT / 2
    );
  }

  public showLevelUp(): void {
    const levelUpText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'LEVEL UP!',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#f1c40f',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);

    this.cameras.main.flash(500, 255, 215, 0);

    this.tweens.add({
      targets: levelUpText,
      scale: { from: 0, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 2000,
      ease: 'Back.easeOut',
      onComplete: () => levelUpText.destroy()
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

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.off('player:hp-changed', this.handleHPChanged, this);
      gameScene.events.off('player:mp-changed', this.handleMPChanged, this);
      gameScene.events.off('player:exp-changed', this.handleEXPChanged, this);
      gameScene.events.off('player:level-up', this.handleLevelUp, this);
    }
  }
}
