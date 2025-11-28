import Phaser from 'phaser';
import { SCENES, GAME_WIDTH } from '../config/constants';
import { Player } from '../entities/Player';
import { Ladder } from '../entities/Ladder';
import { Monster } from '../entities/Monster';
import { CombatManager } from '../combat/CombatManager';
import { EffectsManager } from '../effects/EffectsManager';
import { HitEffectType } from '../effects/HitEffect';
import { getMonsterDefinition } from '../config/MonsterData';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladders: Ladder[] = [];
  private monsters: Monster[] = [];
  private debugText!: Phaser.GameObjects.Text;
  private playerPlatformCollider!: Phaser.Physics.Arcade.Collider;
  private combatManager!: CombatManager;
  private effectsManager!: EffectsManager;

  constructor() {
    super({ key: SCENES.GAME });
  }

  create(): void {
    // Create background first
    this.createBackground();

    // Create platforms
    this.createPlatforms();

    // Create ladders
    this.createLadders();

    // Create player
    this.player = new Player(this, 100, 450);

    // Set up collisions - store reference so we can disable during climbing
    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms);

    // Set up ladder overlaps
    this.ladders.forEach(ladder => {
      this.physics.add.overlap(
        this.player,
        ladder,
        () => this.player.addNearbyLadder(ladder),
        undefined,
        this
      );
    });

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      font: '14px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 5 },
    });

    // Instructions
    this.add.text(10, 560, 'Arrows: Move | Space: Jump | Z: Attack | Up: Climb', {
      font: '12px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 3 },
    });

    // Initialize combat and effects managers
    this.combatManager = new CombatManager(this);
    this.effectsManager = new EffectsManager(this);

    // Create monsters
    this.createMonsters();

    // Listen for combat events
    this.events.on('combat:hit', this.onCombatHit, this);
    this.events.on('monster:damaged', this.onMonsterDamaged, this);
    this.events.on('monster:death', this.onMonsterDeath, this);
  }

  private createMonsters(): void {
    // Spawn slimes on the ground
    const slimePositions = [
      { x: 300, y: 500 },
      { x: 500, y: 500 },
      { x: 700, y: 500 },
    ];

    slimePositions.forEach(pos => {
      const monster = new Monster(
        this,
        pos.x,
        pos.y,
        'SLIME',
        getMonsterDefinition('SLIME')
      );
      monster.setTarget(this.player);
      this.monsters.push(monster);

      // Add collision with platforms
      this.physics.add.collider(monster, this.platforms);

      // Register hurtbox with combat manager
      this.combatManager.registerHurtbox(monster.getHurtbox());
    });
  }

  private onCombatHit(data: { damage: number; x: number; y: number; isCritical: boolean }): void {
    // Show damage number
    this.effectsManager.showDamage(data.x, data.y - 20, data.damage, data.isCritical);

    // Show hit effect
    this.effectsManager.showHitEffect(data.x, data.y, HitEffectType.PHYSICAL);
  }

  private onMonsterDamaged(_data: { monster: Monster; damage: number; x: number; y: number }): void {
    // Additional effects for monster damage
    this.cameras.main.shake(50, 0.002);
  }

  private onMonsterDeath(data: { monster: Monster; exp: number; x: number; y: number }): void {
    // Show exp gain (future: add to player)
    console.log(`+${data.exp} EXP`);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    // Disable platform collision while climbing so player can pass through
    this.playerPlatformCollider.active = !this.player.isClimbing();

    // Check if player left ladder zones
    this.ladders.forEach(ladder => {
      const ladderBody = ladder.body as Phaser.Physics.Arcade.StaticBody;
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

      // Simple distance check for ladder overlap
      const dx = Math.abs(this.player.x - ladder.x);
      const dy = Math.abs(this.player.y - ladder.y);
      const overlapping = dx < (playerBody.width / 2 + ladderBody.width / 2) &&
                          dy < (playerBody.height / 2 + ladderBody.height / 2);

      if (!overlapping) {
        this.player.removeNearbyLadder(ladder);
      }
    });

    // Update monsters
    this.monsters.forEach(monster => {
      monster.update(delta);
    });

    // Update combat system
    this.combatManager.update();

    // Update effects
    this.effectsManager.update(delta);

    // Handle player attack hitbox
    this.handlePlayerAttack();

    // Update debug info
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.debugText.setText([
      `State: ${this.player.getCurrentState()}`,
      `Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      `Velocity: (${Math.round(body.velocity.x)}, ${Math.round(body.velocity.y)})`,
      `Monsters: ${this.monsters.filter(m => !m['isDead']).length}/${this.monsters.length}`,
    ]);
  }

  private handlePlayerAttack(): void {
    const hitbox = this.player.activeHitbox;
    if (!hitbox) return;

    const attackData = this.player.getAttackData();
    if (!attackData) return;

    // Check collision with all monster hurtboxes
    this.monsters.forEach(monster => {
      if (monster['isDead']) return;

      const hurtbox = monster.getHurtbox();
      if (hurtbox.isInvincible()) return;

      // Check overlap
      const monsterBounds = hurtbox.getHurtboxBounds();
      if (Phaser.Geom.Rectangle.Overlaps(hitbox, monsterBounds)) {
        // Calculate damage
        const baseDamage = attackData.damage;
        const variance = 0.9 + Math.random() * 0.2;
        const isCritical = Math.random() < 0.1;
        const damage = Math.floor(baseDamage * variance * (isCritical ? 1.5 : 1));

        // Apply knockback direction based on player facing
        const knockbackDir = this.player.flipX ? -1 : 1;
        const knockback = {
          x: attackData.knockback.x * knockbackDir,
          y: attackData.knockback.y,
        };

        // Apply damage
        hurtbox.takeDamage(damage, knockback, isCritical);
        hurtbox.applyInvincibility(30); // 30 frames i-frames

        // Emit hit event for effects
        this.events.emit('combat:hit', {
          damage,
          x: monster.x,
          y: monster.y,
          isCritical,
        });
      }
    });
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.platforms.create(400, 568, 'ground') as Phaser.Physics.Arcade.Sprite;
    ground.setScale(1).refreshBody();

    // Floating platforms (MapleStory style layout)
    this.platforms.create(150, 450, 'platform');
    this.platforms.create(400, 380, 'platform');
    this.platforms.create(650, 450, 'platform');
    this.platforms.create(250, 280, 'platform');
    this.platforms.create(550, 280, 'platform');
    this.platforms.create(400, 180, 'platform');
  }

  private createLadders(): void {
    // Ground (y=568) to left platform (y=450)
    // Ladder should go from ground level to ABOVE platform (so player lands on it)
    // Top of ladder at y=420 (above platform), bottom at y=550 (above ground)
    this.ladders.push(new Ladder({
      scene: this,
      x: 150,
      y: 485,        // Center of ladder
      height: 130,   // From y=420 to y=550
      type: 'ladder',
    }));

    // Ground to right platform (y=450)
    this.ladders.push(new Ladder({
      scene: this,
      x: 650,
      y: 485,
      height: 130,
      type: 'rope',
    }));

    // Left platform (y=450) to upper-left platform (y=280)
    // topY needs to be above 280, bottomY near 450
    // y=355, height=190 → topY=260, bottomY=450
    this.ladders.push(new Ladder({
      scene: this,
      x: 200,
      y: 355,
      height: 190,
      type: 'ladder',
    }));

    // Right platform (y=450) to upper-right platform (y=280)
    // Same calculation: topY=260, bottomY=450
    this.ladders.push(new Ladder({
      scene: this,
      x: 600,
      y: 355,
      height: 190,
      type: 'rope',
    }));

    // Middle platform (y=380) to top platform (y=180)
    // topY needs to be above 180, bottomY near 380
    // y=270, height=220 → topY=160, bottomY=380
    this.ladders.push(new Ladder({
      scene: this,
      x: 400,
      y: 270,
      height: 220,
      type: 'ladder',
    }));

    // Upper-left platform (y=280) to top platform (y=180)
    // topY needs to be above 180, bottomY near 280
    // y=220, height=120 → topY=160, bottomY=280
    this.ladders.push(new Ladder({
      scene: this,
      x: 300,
      y: 220,
      height: 120,
      type: 'ladder',
    }));
  }

  private createBackground(): void {
    const graphics = this.add.graphics();

    // Sky gradient (darker at top, lighter at bottom)
    graphics.fillStyle(0x1e90ff, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, 200);
    graphics.fillStyle(0x87ceeb, 1);
    graphics.fillRect(0, 200, GAME_WIDTH, 200);
    graphics.fillStyle(0xb0e0e6, 1);
    graphics.fillRect(0, 400, GAME_WIDTH, 200);

    // Decorative clouds
    graphics.fillStyle(0xffffff, 0.8);
    this.drawCloud(graphics, 100, 80, 60);
    this.drawCloud(graphics, 300, 120, 80);
    this.drawCloud(graphics, 550, 60, 70);
    this.drawCloud(graphics, 700, 140, 50);

    graphics.setDepth(-1);
  }

  private drawCloud(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.fillCircle(x, y, size * 0.5);
    graphics.fillCircle(x + size * 0.4, y - size * 0.1, size * 0.4);
    graphics.fillCircle(x + size * 0.8, y, size * 0.35);
    graphics.fillCircle(x + size * 0.3, y + size * 0.2, size * 0.3);
  }
}
