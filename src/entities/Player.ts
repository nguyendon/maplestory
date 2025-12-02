import Phaser from 'phaser';
import { PLAYER, PHYSICS, COMBAT, INPUT } from '../config/constants';
import type { PlayerState } from '../config/constants';
import { StateMachine } from '../components/StateMachine';
import { Ladder } from './Ladder';
import { PLAYER_BASIC_COMBO, PLAYER_AERIAL_ATTACK } from '../combat/AttackData';
import type { AttackData } from '../combat/AttackData';

/**
 * Player entity with state machine, animations, and climbing support
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private stateMachine: StateMachine;
  private _currentState: PlayerState = 'IDLE';

  // Name tag above player
  private nameText: Phaser.GameObjects.Text | null = null;
  private playerName: string = '';

  // Jump mechanics
  private lastGroundedTime: number = 0;
  private lastJumpPressTime: number = 0;
  private isJumping: boolean = false;
  private jumpKeyWasDown: boolean = false;
  private hasDoubleJumped: boolean = false;

  // Climbing
  private currentLadder: Ladder | null = null;
  private nearbyLadders: Set<Ladder> = new Set();

  // Attack system
  private currentComboIndex: number = 0;
  private attackFrameTimer: number = 0;
  private attackPhase: 'startup' | 'active' | 'recovery' | null = null;
  private comboResetTimer: number = 0;
  private canQueueCombo: boolean = false;
  private comboQueued: boolean = false;
  private currentAttackData: AttackData | null = null;
  public activeHitbox: Phaser.Geom.Rectangle | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Explicitly set origin to center (matches RemotePlayer)
    this.setOrigin(0.5, 0.5);

    // Configure physics
    this.setCollideWorldBounds(true);
    this.setGravityY(PHYSICS.GRAVITY);
    this.setMaxVelocity(PLAYER.SPEED, PLAYER.MAX_FALL_SPEED);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
    body.setOffset(2, 2);

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.attackKey = scene.input.keyboard.addKey(INPUT.ATTACK);
      this.jumpKey = scene.input.keyboard.addKey('C'); // Default jump key, can be changed via setKeyBindings
    }

    // State machine
    this.stateMachine = new StateMachine();
    this.setupStates();
    this.stateMachine.setState('IDLE');
  }

  update(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Update coyote time
    if (onGround) {
      this.lastGroundedTime = time;
      this.hasDoubleJumped = false;
      this.isJumping = false;
    }

    // Update combo reset timer
    this.updateComboTimer(delta);

    // Check for attack input
    this.handleAttackInput();

    // Update attack frames
    this.updateAttackFrames(delta);

    // Update state machine
    this.stateMachine.update();

    // Handle variable jump height (cut jump when releasing)
    this.handleJumpCut();

    // Update animation based on state
    this.updateAnimation(onGround);

    // Update name tag position to follow player
    this.updateNameTag();
  }

  /**
   * Set the player's display name
   */
  setPlayerName(name: string): void {
    this.playerName = name;

    if (!this.nameText) {
      this.nameText = this.scene.add.text(this.x, this.y - 40, name, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#00ff00', // Green for local player
        stroke: '#000000',
        strokeThickness: 3,
      });
      this.nameText.setOrigin(0.5, 0.5);
      this.nameText.setDepth(100);
    } else {
      this.nameText.setText(name);
    }
  }

  /**
   * Update name tag position
   */
  private updateNameTag(): void {
    if (this.nameText) {
      this.nameText.setPosition(this.x, this.y - 40);
    }
  }

  // === ATTACK METHODS ===

  private handleAttackInput(): void {
    if (!this.attackKey || !Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      return;
    }

    // Cannot attack while climbing
    if (this.isClimbing()) {
      return;
    }

    // If already attacking, try to queue next combo
    if (this._currentState === 'ATTACK') {
      if (this.canQueueCombo && !this.comboQueued) {
        this.comboQueued = true;
      }
      return;
    }

    // Start new attack
    this.startAttack();
  }

  private startAttack(): void {
    const isAerial = !this.isOnGround();

    if (isAerial) {
      this.currentAttackData = PLAYER_AERIAL_ATTACK;
      this.currentComboIndex = 0;
    } else {
      this.currentAttackData = PLAYER_BASIC_COMBO[this.currentComboIndex];
    }

    this._currentState = 'ATTACK';
    this.attackPhase = 'startup';
    this.attackFrameTimer = 0;
    this.canQueueCombo = false;
    this.comboQueued = false;
    this.activeHitbox = null;

    // Stop horizontal movement
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    // Play attack animation
    this.play(this.currentAttackData.animation, true);

    // Reset combo timer
    this.comboResetTimer = COMBAT.COMBO_RESET_TIME;
  }

  private updateAttackFrames(delta: number): void {
    if (this._currentState !== 'ATTACK' || !this.currentAttackData) {
      return;
    }

    this.attackFrameTimer += delta;
    const frameData = this.currentAttackData.frameData;
    const frameTime = COMBAT.FRAME_TIME;

    if (this.attackPhase === 'startup') {
      if (this.attackFrameTimer >= frameData.startup * frameTime) {
        this.attackPhase = 'active';
        this.attackFrameTimer = 0;
        this.createHitbox();
      }
    } else if (this.attackPhase === 'active') {
      if (this.attackFrameTimer >= frameData.active * frameTime) {
        this.attackPhase = 'recovery';
        this.attackFrameTimer = 0;
        this.activeHitbox = null;
      }
    } else if (this.attackPhase === 'recovery') {
      const comboWindowStart = (frameData.recovery - this.currentAttackData.comboWindow) * frameTime;

      if (this.attackFrameTimer >= comboWindowStart && this.currentAttackData.comboWindow > 0) {
        this.canQueueCombo = true;
      }

      if (this.attackFrameTimer >= frameData.recovery * frameTime) {
        this.endAttack();
      }
    }
  }

  private createHitbox(): void {
    if (!this.currentAttackData) return;

    const hitboxData = this.currentAttackData.hitbox;
    const direction = this.flipX ? -1 : 1;

    const hitboxX = this.x + (hitboxData.offset.x * direction);
    const hitboxY = this.y + hitboxData.offset.y;

    this.activeHitbox = new Phaser.Geom.Rectangle(
      hitboxX - hitboxData.size.width / 2,
      hitboxY - hitboxData.size.height / 2,
      hitboxData.size.width,
      hitboxData.size.height
    );
  }

  private endAttack(): void {
    if (this.comboQueued && this.currentComboIndex < COMBAT.MAX_COMBO_COUNT - 1) {
      this.currentComboIndex++;
      this.startAttack();
    } else {
      this._currentState = 'IDLE';
      this.attackPhase = null;
      this.currentAttackData = null;
      this.activeHitbox = null;
      this.canQueueCombo = false;
      this.comboQueued = false;
      this.stateMachine.setState('IDLE');
    }
  }

  private updateComboTimer(delta: number): void {
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= delta;

      if (this.comboResetTimer <= 0) {
        this.currentComboIndex = 0;
      }
    }
  }

  public isAttacking(): boolean {
    return this._currentState === 'ATTACK';
  }

  public getAttackData(): AttackData | null {
    return this.currentAttackData;
  }

  // === LADDER METHODS ===

  public addNearbyLadder(ladder: Ladder): void {
    this.nearbyLadders.add(ladder);
  }

  public removeNearbyLadder(ladder: Ladder): void {
    this.nearbyLadders.delete(ladder);
    if (this.currentLadder === ladder) {
      this.releaseLadder();
    }
  }

  private canGrabLadder(): Ladder | null {
    for (const ladder of this.nearbyLadders) {
      const distance = Math.abs(this.x - ladder.getCenterX());
      if (distance <= PLAYER.CLIMB_SNAP_DISTANCE) {
        return ladder;
      }
    }
    return null;
  }

  private grabLadder(ladder: Ladder): void {
    this.currentLadder = ladder;
    this.x = ladder.getCenterX();

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
  }

  private releaseLadder(): void {
    this.currentLadder = null;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
  }

  public isClimbing(): boolean {
    return this._currentState.startsWith('CLIMB');
  }

  public getCurrentState(): PlayerState {
    return this._currentState;
  }

  public get currentState(): PlayerState {
    return this._currentState;
  }

  public get facingRight(): boolean {
    return !this.flipX;
  }

  // === STATE MACHINE SETUP ===

  private setupStates(): void {
    const self = this;

    this.stateMachine
      .addState({
        name: 'IDLE',
        onEnter: () => {
          self._currentState = 'IDLE';
          const body = self.body as Phaser.Physics.Arcade.Body;
          body.setVelocityX(0);
        },
        onUpdate: () => {
          if (self.tryGrabLadder()) return;
          if (self.tryJump()) return;
          if (self.tryMove()) return;
          if (self.checkFalling()) return;
        },
      })
      .addState({
        name: 'WALK',
        onEnter: () => {
          self._currentState = 'WALK';
        },
        onUpdate: () => {
          if (self.tryGrabLadder()) return;
          if (self.tryJump()) return;

          self.handleHorizontalMovement(true);

          const body = self.body as Phaser.Physics.Arcade.Body;
          if (Math.abs(body.velocity.x) < 1) {
            self.stateMachine.setState('IDLE');
            return;
          }

          if (self.checkFalling()) return;
        },
      })
      .addState({
        name: 'JUMP',
        onEnter: () => {
          self._currentState = 'JUMP';
        },
        onUpdate: () => {
          self.handleHorizontalMovement(false);

          const body = self.body as Phaser.Physics.Arcade.Body;
          if (body.velocity.y > 0) {
            self.stateMachine.setState('FALL');
          }
        },
      })
      .addState({
        name: 'FALL',
        onEnter: () => {
          self._currentState = 'FALL';
        },
        onUpdate: () => {
          if (self.tryGrabLadder()) return;

          self.handleHorizontalMovement(false);

          const body = self.body as Phaser.Physics.Arcade.Body;
          if (body.blocked.down || body.touching.down) {
            if (Math.abs(body.velocity.x) > 1) {
              self.stateMachine.setState('WALK');
            } else {
              self.stateMachine.setState('IDLE');
            }
          }
        },
      })
      .addState({
        name: 'CLIMB_IDLE',
        onEnter: () => {
          self._currentState = 'CLIMB_IDLE';
          const body = self.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(0, 0);
        },
        onUpdate: () => {
          if (!self.currentLadder) {
            self.releaseLadder();
            self.stateMachine.setState('FALL');
            return;
          }

          if (self.tryJumpOffLadder()) return;

          if (self.cursors.up?.isDown) {
            if (self.y <= self.currentLadder.getTopY()) {
              // Position player so feet are above the platform
              // Player center needs to be at platform level minus half player height
              const body = self.body as Phaser.Physics.Arcade.Body;
              self.y = self.currentLadder.getTopY() - body.halfHeight - 5;
              self.releaseLadder();
              body.setVelocityY(0);
              self.stateMachine.setState('FALL');
              return;
            }
            self.stateMachine.setState('CLIMB_UP');
          } else if (self.cursors.down?.isDown) {
            if (self.y >= self.currentLadder.getBottomY()) {
              self.releaseLadder();
              self.stateMachine.setState(self.isOnGround() ? 'IDLE' : 'FALL');
              return;
            }
            self.stateMachine.setState('CLIMB_DOWN');
          }
        },
      })
      .addState({
        name: 'CLIMB_UP',
        onEnter: () => {
          self._currentState = 'CLIMB_UP';
        },
        onUpdate: () => {
          if (!self.currentLadder) {
            self.releaseLadder();
            self.stateMachine.setState('FALL');
            return;
          }

          if (self.tryJumpOffLadder()) return;

          if (self.cursors.up?.isDown) {
            if (self.y <= self.currentLadder.getTopY()) {
              // Position player so feet are above the platform
              const body = self.body as Phaser.Physics.Arcade.Body;
              self.y = self.currentLadder.getTopY() - body.halfHeight - 5;
              self.releaseLadder();
              body.setVelocityY(0);
              self.stateMachine.setState('FALL');
              return;
            }
            const body = self.body as Phaser.Physics.Arcade.Body;
            body.setVelocityY(-PLAYER.CLIMB_SPEED);
          } else if (self.cursors.down?.isDown) {
            self.stateMachine.setState('CLIMB_DOWN');
          } else {
            self.stateMachine.setState('CLIMB_IDLE');
          }
        },
        onExit: () => {
          const body = self.body as Phaser.Physics.Arcade.Body;
          body.setVelocityY(0);
        },
      })
      .addState({
        name: 'CLIMB_DOWN',
        onEnter: () => {
          self._currentState = 'CLIMB_DOWN';
        },
        onUpdate: () => {
          if (!self.currentLadder) {
            self.releaseLadder();
            self.stateMachine.setState('FALL');
            return;
          }

          if (self.tryJumpOffLadder()) return;

          if (self.cursors.down?.isDown) {
            if (self.y >= self.currentLadder.getBottomY()) {
              self.y = self.currentLadder.getBottomY();
              self.releaseLadder();
              self.stateMachine.setState(self.isOnGround() ? 'IDLE' : 'FALL');
              return;
            }
            const body = self.body as Phaser.Physics.Arcade.Body;
            body.setVelocityY(PLAYER.CLIMB_SPEED);
          } else if (self.cursors.up?.isDown) {
            self.stateMachine.setState('CLIMB_UP');
          } else {
            self.stateMachine.setState('CLIMB_IDLE');
          }
        },
        onExit: () => {
          const body = self.body as Phaser.Physics.Arcade.Body;
          body.setVelocityY(0);
        },
      });
  }

  // === HELPER METHODS ===

  private isOnGround(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  private tryGrabLadder(): boolean {
    if (this.cursors.up?.isDown) {
      const ladder = this.canGrabLadder();
      if (ladder && ladder.isWithinRange(this.y)) {
        this.grabLadder(ladder);
        this.stateMachine.setState('CLIMB_IDLE');
        return true;
      }
    }
    return false;
  }

  private tryJumpOffLadder(): boolean {
    if (this.jumpKey && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      this.releaseLadder();

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (this.cursors.left?.isDown) {
        body.setVelocityX(-PLAYER.SPEED);
      } else if (this.cursors.right?.isDown) {
        body.setVelocityX(PLAYER.SPEED);
      }
      body.setVelocityY(PLAYER.DOUBLE_JUMP_VELOCITY);

      this.stateMachine.setState('JUMP');
      return true;
    }
    return false;
  }

  private tryJump(): boolean {
    const time = this.scene.time.now;
    const jumpPressed = this.jumpKey ? Phaser.Input.Keyboard.JustDown(this.jumpKey) : false;

    if (jumpPressed) {
      this.lastJumpPressTime = time;
    }

    // Check coyote time and jump buffer
    const inCoyoteTime = (time - this.lastGroundedTime) < PLAYER.COYOTE_TIME;
    const jumpBuffered = (time - this.lastJumpPressTime) < PLAYER.JUMP_BUFFER;
    const onGround = this.isOnGround();

    if (jumpPressed || jumpBuffered) {
      if (onGround || inCoyoteTime) {
        this.performJump(PLAYER.JUMP_VELOCITY);
        this.lastJumpPressTime = 0;
        this.stateMachine.setState('JUMP');
        return true;
      } else if (!this.hasDoubleJumped) {
        this.performJump(PLAYER.DOUBLE_JUMP_VELOCITY);
        this.hasDoubleJumped = true;
        this.lastJumpPressTime = 0;
        this.stateMachine.setState('JUMP');
        return true;
      }
    }

    return false;
  }

  private performJump(velocity: number): void {
    this.setVelocityY(velocity);
    this.isJumping = true;
    this.jumpKeyWasDown = true;
  }

  private handleJumpCut(): void {
    const jumpKeyDown = this.jumpKey?.isDown ?? false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const movingUp = body.velocity.y < 0;

    if (this.isJumping && !jumpKeyDown && this.jumpKeyWasDown && movingUp) {
      body.setVelocityY(body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
      this.isJumping = false;
    }

    this.jumpKeyWasDown = jumpKeyDown;
  }

  private tryMove(): boolean {
    if (this.cursors.left?.isDown || this.cursors.right?.isDown) {
      this.stateMachine.setState('WALK');
      return true;
    }
    return false;
  }

  private checkFalling(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 0 && !this.isOnGround()) {
      this.stateMachine.setState('FALL');
      return true;
    }
    return false;
  }

  private handleHorizontalMovement(onGround: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const currentVelX = body.velocity.x;
    const delta = this.scene.game.loop.delta / 1000;

    const accel = onGround ? PLAYER.GROUND_ACCEL : PLAYER.AIR_ACCEL;
    const decel = onGround ? PLAYER.GROUND_DECEL : PLAYER.AIR_DECEL;
    const maxSpeed = onGround ? PLAYER.SPEED : PLAYER.AIR_SPEED;

    if (this.cursors.left?.isDown) {
      const newVel = Math.max(currentVelX - accel * delta, -maxSpeed);
      body.setVelocityX(newVel);
      this.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      const newVel = Math.min(currentVelX + accel * delta, maxSpeed);
      body.setVelocityX(newVel);
      this.setFlipX(false);
    } else {
      // Decelerate
      if (Math.abs(currentVelX) > 0) {
        const decelAmount = decel * delta;
        if (Math.abs(currentVelX) < decelAmount) {
          body.setVelocityX(0);
        } else {
          body.setVelocityX(
            currentVelX > 0 ? currentVelX - decelAmount : currentVelX + decelAmount
          );
        }
      }
    }
  }

  private updateAnimation(_onGround: boolean): void {
    const animKey = `player-${this._currentState.toLowerCase().replace('_', '-')}`;

    // Only play if animation exists and isn't already playing
    if (this.anims.exists(animKey)) {
      this.play(animKey, true);
    }
  }

  /**
   * Set custom key bindings for player actions
   */
  public setKeyBindings(bindings: { jump?: string | null; attack?: string | null }): void {
    if (!this.scene.input.keyboard) return;

    if (bindings.jump !== undefined && bindings.jump !== null) {
      // Remove old key listener
      if (this.jumpKey) {
        this.jumpKey.destroy();
      }
      this.jumpKey = this.scene.input.keyboard.addKey(bindings.jump);
    }

    if (bindings.attack !== undefined && bindings.attack !== null) {
      // Remove old key listener
      if (this.attackKey) {
        this.attackKey.destroy();
      }
      this.attackKey = this.scene.input.keyboard.addKey(bindings.attack);
    }
  }

  clearNearbyLadders(): void {
    this.nearbyLadders.clear();
    if (this.currentLadder) {
      // Re-enable gravity if we were climbing
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      this.currentLadder = null;
      // Reset to idle state if we were climbing
      if (this.isClimbing()) {
        this._currentState = 'IDLE';
        this.stateMachine.setState('IDLE');
      }
    }
  }

  destroy(fromScene?: boolean): void {
    this.nearbyLadders.clear();
    this.currentLadder = null;
    super.destroy(fromScene);
  }
}
