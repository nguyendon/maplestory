import Phaser from 'phaser';
import { PLAYER, PHYSICS } from '../config/constants';
import type { PlayerState } from '../config/constants';
import { StateMachine } from '../components/StateMachine';
import { Ladder } from './Ladder';

/**
 * Player entity with state machine, animations, and climbing support
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private stateMachine: StateMachine;
  private currentState: PlayerState = 'IDLE';

  // Jump mechanics
  private lastGroundedTime: number = 0;
  private lastJumpPressTime: number = 0;
  private isJumping: boolean = false;
  private jumpKeyWasDown: boolean = false;
  private hasDoubleJumped: boolean = false;

  // Climbing
  private currentLadder: Ladder | null = null;
  private nearbyLadders: Set<Ladder> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

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
    }

    // State machine
    this.stateMachine = new StateMachine();
    this.setupStates();
    this.stateMachine.setState('IDLE');
  }

  update(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Update coyote time
    if (onGround) {
      this.lastGroundedTime = time;
      this.hasDoubleJumped = false;
      this.isJumping = false;
    }

    // Update state machine
    this.stateMachine.update();

    // Handle variable jump height (cut jump when releasing)
    this.handleJumpCut();

    // Update animation based on state
    this.updateAnimation(onGround);
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
    return this.currentState.startsWith('CLIMB');
  }

  public getCurrentState(): PlayerState {
    return this.currentState;
  }

  // === STATE MACHINE SETUP ===

  private setupStates(): void {
    const self = this;

    this.stateMachine
      .addState({
        name: 'IDLE',
        onEnter: () => {
          self.currentState = 'IDLE';
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
          self.currentState = 'WALK';
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
          self.currentState = 'JUMP';
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
          self.currentState = 'FALL';
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
          self.currentState = 'CLIMB_IDLE';
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
              self.releaseLadder();
              self.stateMachine.setState('IDLE');
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
          self.currentState = 'CLIMB_UP';
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
              self.y = self.currentLadder.getTopY();
              self.releaseLadder();
              self.stateMachine.setState('IDLE');
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
          self.currentState = 'CLIMB_DOWN';
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
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
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
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space!);

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
    const jumpKeyDown = this.cursors.space?.isDown ?? false;
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
    const animKey = `player-${this.currentState.toLowerCase().replace('_', '-')}`;

    // Only play if animation exists and isn't already playing
    if (this.anims.exists(animKey)) {
      this.play(animKey, true);
    }
  }

  destroy(fromScene?: boolean): void {
    this.nearbyLadders.clear();
    this.currentLadder = null;
    super.destroy(fromScene);
  }
}
