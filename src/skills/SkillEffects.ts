import Phaser from 'phaser';
import type { SkillDefinition } from './SkillData';

export class SkillEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playSkillEffect(
    skill: SkillDefinition,
    x: number,
    y: number,
    facingRight: boolean
  ): void {
    switch (skill.animation) {
      case 'slash':
        this.playSlashEffect(x, y, facingRight, skill.effectColor);
        break;
      case 'wide_slash':
        this.playWideSlashEffect(x, y, facingRight, skill.effectColor);
        break;
      case 'double_slash':
        this.playDoubleSlashEffect(x, y, facingRight, skill.effectColor);
        break;
      case 'buff':
        this.playBuffEffect(x, y, skill.effectColor);
        break;
      default:
        this.playSlashEffect(x, y, facingRight, skill.effectColor);
    }
  }

  private playSlashEffect(x: number, y: number, facingRight: boolean, color: number): void {
    const graphics = this.scene.add.graphics();
    const offsetX = facingRight ? 40 : -40;

    // Draw slash arc
    graphics.lineStyle(4, color, 1);

    const startAngle = facingRight ? -0.5 : Math.PI + 0.5;
    const endAngle = facingRight ? 0.5 : Math.PI - 0.5;

    graphics.beginPath();
    graphics.arc(x + offsetX, y, 50, startAngle, endAngle, !facingRight);
    graphics.strokePath();

    // Add glow effect
    graphics.lineStyle(8, color, 0.3);
    graphics.beginPath();
    graphics.arc(x + offsetX, y, 50, startAngle, endAngle, !facingRight);
    graphics.strokePath();

    // Fade out and destroy
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      onComplete: () => graphics.destroy()
    });
  }

  private playWideSlashEffect(x: number, y: number, facingRight: boolean, color: number): void {
    const graphics = this.scene.add.graphics();
    const offsetX = facingRight ? 60 : -60;

    // Draw wide arc
    graphics.lineStyle(6, color, 1);

    const startAngle = facingRight ? -0.8 : Math.PI + 0.8;
    const endAngle = facingRight ? 0.8 : Math.PI - 0.8;

    graphics.beginPath();
    graphics.arc(x + offsetX, y, 80, startAngle, endAngle, !facingRight);
    graphics.strokePath();

    // Inner arc
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.beginPath();
    graphics.arc(x + offsetX, y, 60, startAngle, endAngle, !facingRight);
    graphics.strokePath();

    // Outer glow
    graphics.lineStyle(12, color, 0.2);
    graphics.beginPath();
    graphics.arc(x + offsetX, y, 80, startAngle, endAngle, !facingRight);
    graphics.strokePath();

    // Fade out
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.2,
      duration: 250,
      onComplete: () => graphics.destroy()
    });
  }

  private playDoubleSlashEffect(x: number, y: number, facingRight: boolean, color: number): void {
    // First slash
    this.playSlashEffect(x, y - 10, facingRight, color);

    // Second slash (delayed)
    this.scene.time.delayedCall(100, () => {
      const graphics = this.scene.add.graphics();
      const offsetX = facingRight ? 50 : -50;

      graphics.lineStyle(4, color, 1);

      const startAngle = facingRight ? -0.3 : Math.PI + 0.3;
      const endAngle = facingRight ? 0.7 : Math.PI - 0.7;

      graphics.beginPath();
      graphics.arc(x + offsetX, y + 10, 45, startAngle, endAngle, !facingRight);
      graphics.strokePath();

      this.scene.tweens.add({
        targets: graphics,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        onComplete: () => graphics.destroy()
      });
    });
  }

  private playBuffEffect(x: number, y: number, color: number): void {
    // Rising particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.graphics();
      const angle = (i / 8) * Math.PI * 2;
      const radius = 30;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 4);
      particle.setPosition(px, py);

      this.scene.tweens.add({
        targets: particle,
        y: py - 60,
        alpha: 0,
        scale: 0.5,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // Expanding ring
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(x, y, 20);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    // Flash on player
    const flash = this.scene.add.graphics();
    flash.fillStyle(color, 0.3);
    flash.fillCircle(x, y, 40);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  showSkillName(skill: SkillDefinition, x: number, y: number): void {
    const text = this.scene.add.text(x, y - 60, skill.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#' + skill.effectColor.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 90,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }
}
