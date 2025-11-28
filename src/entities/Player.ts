import Phaser from 'phaser';
import { PLAYER } from '../config/constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canDoubleJump: boolean = false;
  private hasDoubleJumped: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
    body.setOffset(2, 2);

    // Set up input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Reset double jump when landing
    if (onGround) {
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
    }

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.setVelocityX(-PLAYER.SPEED);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(PLAYER.SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump logic (with double jump)
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      if (onGround) {
        this.setVelocityY(PLAYER.JUMP_VELOCITY);
        this.canDoubleJump = true;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.setVelocityY(PLAYER.JUMP_VELOCITY);
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
      }
    }

    // Down key for fast fall or dropping through platforms (future)
    if (this.cursors.down.isDown && !onGround) {
      this.setVelocityY(Math.min(body.velocity.y + 50, 600));
    }
  }
}
