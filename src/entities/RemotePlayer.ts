import Phaser from 'phaser';
import type { NetworkPlayer } from '../network/NetworkManager';

/**
 * Represents another player in the game (controlled by network)
 */
export class RemotePlayer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;

  private targetX: number = 0;
  private targetY: number = 0;
  private interpolationSpeed: number = 0.2;

  public playerId: string;
  public playerName: string;
  public mapId: string;
  public currentHP: number = 100;
  public maxHP: number = 100;
  public level: number = 1;
  public job: string = 'BEGINNER';

  private readonly HEALTH_BAR_WIDTH = 50;
  private readonly HEALTH_BAR_HEIGHT = 6;

  constructor(scene: Phaser.Scene, data: NetworkPlayer) {
    super(scene, data.x, data.y);

    this.playerId = data.id;
    this.playerName = data.name;
    this.mapId = data.mapId;
    this.currentHP = data.currentHP;
    this.maxHP = data.maxHP;
    this.level = data.level;
    this.job = data.job;
    this.targetX = data.x;
    this.targetY = data.y;

    // Create sprite (using player texture)
    this.sprite = scene.add.sprite(0, 0, 'player');
    this.sprite.setOrigin(0.5, 1);
    this.add(this.sprite);

    // Create name tag
    this.nameText = scene.add.text(0, -70, this.playerName, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Create level display
    this.levelText = scene.add.text(0, -56, `Lv.${this.level}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.levelText.setOrigin(0.5, 0.5);
    this.add(this.levelText);

    // Create health bar
    this.healthBar = scene.add.graphics();
    this.add(this.healthBar);
    this.updateHealthBar();

    scene.add.existing(this);
    this.setDepth(50);

    // Set initial facing
    this.sprite.setFlipX(!data.facingRight);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barX = -this.HEALTH_BAR_WIDTH / 2;
    const barY = -48;
    const hpPercent = Math.max(0, this.currentHP / this.maxHP);

    // Background
    this.healthBar.fillStyle(0x000000, 0.7);
    this.healthBar.fillRoundedRect(barX - 1, barY - 1, this.HEALTH_BAR_WIDTH + 2, this.HEALTH_BAR_HEIGHT + 2, 2);

    // HP fill
    const fillColor = hpPercent > 0.6 ? 0x44ff44 : hpPercent > 0.3 ? 0xffff44 : 0xff4444;
    this.healthBar.fillStyle(fillColor, 1);
    const fillWidth = this.HEALTH_BAR_WIDTH * hpPercent;
    if (fillWidth > 0) {
      this.healthBar.fillRoundedRect(barX, barY, fillWidth, this.HEALTH_BAR_HEIGHT, 2);
    }
  }

  /**
   * Update from network data
   */
  updateFromNetwork(data: NetworkPlayer): void {
    this.targetX = data.x;
    this.targetY = data.y;
    this.mapId = data.mapId;

    // Update sprite facing
    this.sprite.setFlipX(!data.facingRight);

    // Update animation if different
    const animKey = `player-${data.animation}`;
    if (this.sprite.anims.exists(animKey) && this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey, true);
    }

    // Update stats display if changed
    if (this.level !== data.level) {
      this.level = data.level;
      this.levelText.setText(`Lv.${this.level}`);
    }

    if (this.currentHP !== data.currentHP || this.maxHP !== data.maxHP) {
      this.currentHP = data.currentHP;
      this.maxHP = data.maxHP;
      this.updateHealthBar();
    }

    if (this.job !== data.job) {
      this.job = data.job;
    }
  }

  /**
   * Smooth interpolation update
   */
  update(_time: number, _delta: number): void {
    // Interpolate position for smooth movement
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    // If too far away, snap directly
    if (Math.abs(dx) > 200 || Math.abs(dy) > 200) {
      this.setPosition(this.targetX, this.targetY);
    } else {
      // Smooth interpolation
      this.x += dx * this.interpolationSpeed;
      this.y += dy * this.interpolationSpeed;
    }
  }

  /**
   * Show attack effect
   */
  showAttack(skillId: string): void {
    // Flash effect
    this.sprite.setTint(0xffffaa);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });

    // Could add skill-specific effects here based on skillId
    console.log(`Remote player ${this.playerName} used skill: ${skillId}`);
  }

  /**
   * Show damage taken
   */
  showDamage(_damage: number): void {
    // Flash red
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(200, () => {
      this.sprite.clearTint();
    });

    // Could show floating damage number here
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
