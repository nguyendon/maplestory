import Phaser from 'phaser';
import { Hurtbox } from '../combat/Hurtbox';
import type { MonsterDefinition } from '../config/MonsterData';
import type { EntityStats } from '../combat/DamageCalculator';
import { PHYSICS } from '../config/constants';

export type MonsterState = 'IDLE' | 'PATROL' | 'CHASE' | 'ATTACK' | 'HURT' | 'DEAD';

/**
 * Monster base class
 */
export class Monster extends Phaser.Physics.Arcade.Sprite {
  public monsterType: string;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public defense: number;
  public speed: number;
  public expReward: number;
  public monsterName: string;
  public stats: EntityStats;

  protected definition: MonsterDefinition;
  protected hurtbox!: Hurtbox;
  protected currentState: MonsterState = 'IDLE';
  protected spawnX: number;
  protected spawnY: number;
  protected target: Phaser.GameObjects.GameObject | null = null;

  // Patrol
  protected patrolLeft: number;
  protected patrolRight: number;
  protected movingRight: boolean = true;
  protected pauseTimer: number = 0;

  // Combat
  protected attackCooldown: number = 0;
  protected isInvincible: boolean = false;
  protected invincibilityTimer: number = 0;
  protected isDead: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    definition: MonsterDefinition
  ) {
    super(scene, x, y, definition.spriteKey);

    this.monsterType = type;
    this.definition = definition;
    this.spawnX = x;
    this.spawnY = y;

    // Stats from definition
    this.maxHp = definition.maxHp;
    this.hp = this.maxHp;
    this.damage = definition.damage;
    this.defense = definition.defense;
    this.speed = definition.speed;
    this.expReward = definition.exp;
    this.monsterName = definition.name;

    // Patrol bounds
    this.patrolLeft = x - 100;
    this.patrolRight = x + 100;

    // EntityStats for damage calculator
    this.stats = {
      STR: definition.damage,
      DEX: 5,
      INT: 5,
      LUK: 5,
      ATK: definition.damage * 2,
      MATK: 10,
      DEF: definition.defense,
      critChance: 0.05,
      critMultiplier: 1.2,
    };

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setGravityY(PHYSICS.GRAVITY);
    body.setSize(definition.width, definition.height);

    // Create hurtbox
    this.createHurtbox();
  }

  protected createHurtbox(): void {
    this.hurtbox = new Hurtbox({
      scene: this.scene,
      owner: this,
      x: this.x,
      y: this.y,
      width: this.definition.width,
      height: this.definition.height,
      onHit: (damage, knockback, isCritical) => {
        this.takeDamage(damage, knockback, isCritical);
      },
    });
  }

  public setTarget(target: Phaser.GameObjects.GameObject | null): void {
    this.target = target;
  }

  public getHurtbox(): Hurtbox {
    return this.hurtbox;
  }

  update(delta: number): void {
    if (this.isDead) return;

    // Update hurtbox position
    this.hurtbox.setPosition(this.x, this.y);

    // Update invincibility
    if (this.isInvincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.clearTint();
      } else {
        // Flash effect
        this.setTint(Math.floor(this.invincibilityTimer / 100) % 2 === 0 ? 0xffffff : 0xff8888);
      }
    }

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // State machine
    switch (this.currentState) {
      case 'IDLE':
        this.updateIdle(delta);
        break;
      case 'PATROL':
        this.updatePatrol(delta);
        break;
      case 'CHASE':
        this.updateChase(delta);
        break;
      case 'ATTACK':
        this.updateAttack(delta);
        break;
      case 'HURT':
        this.updateHurt(delta);
        break;
    }
  }

  protected updateIdle(_delta: number): void {
    this.setVelocityX(0);
    // Transition to patrol after brief pause
    this.currentState = 'PATROL';
  }

  protected updatePatrol(delta: number): void {
    // Check for target in range
    if (this.target && this.isTargetInRange(this.definition.aggroRange)) {
      this.currentState = 'CHASE';
      return;
    }

    // Pause at ends
    if (this.pauseTimer > 0) {
      this.pauseTimer -= delta;
      this.setVelocityX(0);
      return;
    }

    // Patrol movement
    if (this.movingRight) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
      if (this.x >= this.patrolRight) {
        this.movingRight = false;
        this.pauseTimer = 500;
      }
    } else {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
      if (this.x <= this.patrolLeft) {
        this.movingRight = true;
        this.pauseTimer = 500;
      }
    }
  }

  protected updateChase(_delta: number): void {
    if (!this.target) {
      this.currentState = 'PATROL';
      return;
    }

    // Check if target left deaggro range
    if (!this.isTargetInRange(this.definition.deaggroRange)) {
      this.currentState = 'PATROL';
      return;
    }

    // Check if in attack range
    if (this.isTargetInRange(this.definition.attackRange) && this.attackCooldown <= 0) {
      this.currentState = 'ATTACK';
      return;
    }

    // Chase target
    const targetX = (this.target as Phaser.GameObjects.Sprite).x;
    if (targetX > this.x + 5) {
      this.setVelocityX(this.speed * 1.5);
      this.setFlipX(false);
    } else if (targetX < this.x - 5) {
      this.setVelocityX(-this.speed * 1.5);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }
  }

  protected updateAttack(_delta: number): void {
    this.setVelocityX(0);

    // Perform attack
    this.attackCooldown = this.definition.attackCooldown;

    // Emit attack event (CombatManager will create hitbox)
    this.scene.events.emit('monster:attack', {
      monster: this,
      x: this.x + (this.flipX ? -30 : 30),
      y: this.y,
      width: 40,
      height: 40,
      damage: this.damage,
      knockback: { x: this.flipX ? -100 : 100, y: -50 },
    });

    // Return to chase
    this.currentState = 'CHASE';
  }

  protected updateHurt(_delta: number): void {
    // Stun for brief moment then return to chase
    this.scene.time.delayedCall(300, () => {
      if (!this.isDead) {
        this.currentState = 'CHASE';
      }
    });
  }

  protected isTargetInRange(range: number): boolean {
    if (!this.target) return false;
    const targetSprite = this.target as Phaser.GameObjects.Sprite;
    const dx = targetSprite.x - this.x;
    const dy = targetSprite.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= range;
  }

  public takeDamage(amount: number, knockback: { x: number; y: number }, _isCritical: boolean): void {
    if (this.isInvincible || this.isDead) return;

    this.hp -= amount;

    // Apply knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockback.x, knockback.y);

    // Invincibility
    this.isInvincible = true;
    this.invincibilityTimer = 500;
    this.setTint(0xffffff);

    // Check death
    if (this.hp <= 0) {
      this.die();
    } else {
      this.currentState = 'HURT';
    }

    // Emit damage event for effects
    this.scene.events.emit('monster:damaged', {
      monster: this,
      damage: amount,
      x: this.x,
      y: this.y,
    });
  }

  public die(): void {
    if (this.isDead) return;

    this.isDead = true;
    this.currentState = 'DEAD';

    // Stop movement
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    // Death visual
    this.setAlpha(0.5);

    // Emit death event
    this.scene.events.emit('monster:death', {
      monster: this,
      exp: this.expReward,
      x: this.x,
      y: this.y,
    });

    // Respawn after timer
    this.scene.time.delayedCall(this.definition.respawnTime, () => {
      this.respawn();
    });
  }

  public respawn(): void {
    this.setPosition(this.spawnX, this.spawnY);
    this.hp = this.maxHp;
    this.isDead = false;
    this.isInvincible = false;
    this.currentState = 'IDLE';
    this.setAlpha(1);
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    body.setVelocity(0, 0);

    // Recreate hurtbox
    if (this.hurtbox) {
      this.hurtbox.destroy();
    }
    this.createHurtbox();
  }

  destroy(fromScene?: boolean): void {
    if (this.hurtbox) {
      this.hurtbox.destroy();
    }
    super.destroy(fromScene);
  }
}
