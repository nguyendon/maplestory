---
name: phaser-patterns
description: Phaser 3 best practices and patterns. Auto-activates when working with scenes, sprites, physics, or game objects.
---

# Phaser 3 Patterns

**ALWAYS follow these patterns when writing Phaser code.**

## Scene Lifecycle

```typescript
class MyScene extends Phaser.Scene {
  init(data) {}      // Receives data passed from previous scene
  preload() {}       // Load assets
  create() {}        // Set up game objects
  update(time, delta) {}  // Game loop (called every frame)
}
```

## Sprite Creation

```typescript
// Basic sprite
const sprite = this.add.sprite(x, y, 'textureKey');

// With physics
const sprite = this.physics.add.sprite(x, y, 'textureKey');
sprite.setCollideWorldBounds(true);
sprite.body.setSize(width, height);  // Hitbox size
sprite.body.setOffset(x, y);         // Hitbox offset
```

## Animation

```typescript
// Define animation
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 10,
  repeat: -1  // -1 = loop
});

// Play animation
sprite.play('walk');
sprite.anims.play('walk', true);  // true = ignore if already playing
```

## Input

```typescript
// Keyboard
this.cursors = this.input.keyboard.createCursorKeys();
if (this.cursors.left.isDown) { /* move left */ }
if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) { /* jump */ }

// Pointer/Touch
this.input.on('pointerdown', (pointer) => { /* click */ });
```

## Physics Groups

```typescript
// Static group (platforms)
this.platforms = this.physics.add.staticGroup();
this.platforms.create(400, 568, 'ground');

// Dynamic group (enemies)
this.enemies = this.physics.add.group({
  classType: Enemy,
  runChildUpdate: true
});

// Collisions
this.physics.add.collider(player, platforms);
this.physics.add.overlap(player, coins, collectCoin, null, this);
```

## Object Pooling

```typescript
// Create pool
this.bulletPool = this.add.group({
  classType: Bullet,
  maxSize: 30,
  runChildUpdate: true
});

// Get from pool
const bullet = this.bulletPool.get(x, y);
if (bullet) {
  bullet.fire(direction);
}

// Return to pool (in Bullet class)
deactivate() {
  this.setActive(false);
  this.setVisible(false);
}
```

## Tweens

```typescript
this.tweens.add({
  targets: sprite,
  x: 400,
  y: 300,
  duration: 1000,
  ease: 'Power2',
  onComplete: () => { /* done */ }
});
```

## Timers

```typescript
// Delayed call
this.time.delayedCall(1000, callback, args, this);

// Repeating timer
this.time.addEvent({
  delay: 500,
  callback: spawnEnemy,
  callbackScope: this,
  repeat: 10  // -1 for infinite
});
```

## Camera

```typescript
this.cameras.main.startFollow(player);
this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
this.cameras.main.setZoom(2);
```

## Cleanup (IMPORTANT)

```typescript
// Always clean up in destroy()
destroy() {
  this.input.off('pointerdown', this.handler);
  this.tweens.killTweensOf(this);
  this.timer?.destroy();
  super.destroy();
}
```
