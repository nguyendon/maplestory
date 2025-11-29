import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Player } from '../entities/Player';
import { Ladder } from '../entities/Ladder';
import { Monster } from '../entities/Monster';
import { Portal } from '../entities/Portal';
import { NPC } from '../entities/NPC';
import { CombatManager } from '../combat/CombatManager';
import { EffectsManager } from '../effects/EffectsManager';
import { HitEffectType } from '../effects/HitEffect';
import { getMonsterDefinition } from '../config/MonsterData';
import { PlayerStats } from '../systems/CharacterStats';
import { Inventory } from '../systems/Inventory';
import { getItem } from '../systems/ItemData';
import { DialogueBox } from '../ui/DialogueBox';
import { SkillBar } from '../ui/SkillBar';
import { SkillConfigUI } from '../ui/SkillConfigUI';
import { KeyboardConfigUI, ACTIONS } from '../ui/KeyboardConfigUI';
import type { ActionDefinition } from '../ui/KeyboardConfigUI';
import { getDialogue } from '../config/NPCData';
import { SkillManager } from '../skills/SkillManager';
import { SkillEffects } from '../skills/SkillEffects';
import { getSkill } from '../skills/SkillData';
import type { SkillDefinition } from '../skills/SkillData';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladders: Ladder[] = [];
  private monsters: Monster[] = [];
  private portals: Portal[] = [];
  private npcs: NPC[] = [];
  private debugText!: Phaser.GameObjects.Text;
  private playerPlatformCollider!: Phaser.Physics.Arcade.Collider;
  private combatManager!: CombatManager;
  private effectsManager!: EffectsManager;
  private hitMonstersThisAttack: Set<Monster> = new Set();

  // RPG Systems
  private playerStats!: PlayerStats;
  private inventory!: Inventory;

  // UI Systems
  private dialogueBox!: DialogueBox;
  private skillBar!: SkillBar;
  private skillConfigUI!: SkillConfigUI;
  private keyboardConfigUI!: KeyboardConfigUI;
  private nearbyNPC: NPC | null = null;
  private nearbyPortal: Portal | null = null;

  // Skill Systems
  private skillManager!: SkillManager;
  private skillEffects!: SkillEffects;
  private skillHitbox: Phaser.Geom.Rectangle | null = null;
  private skillHitData: { damage: number; skill: SkillDefinition; facingRight: boolean } | null = null;
  private hitMonstersThisSkill: Set<Monster> = new Set();

  // Action key bindings (configurable)
  private actionBindings: Map<string, ActionDefinition> = new Map();

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

    // Create player - spawn above the ground (ground is at GAME_HEIGHT - 32, player is 48 tall)
    this.player = new Player(this, 100, GAME_HEIGHT - 96);

    // Initialize RPG systems
    this.playerStats = new PlayerStats(this);
    this.inventory = new Inventory(24);

    // Set up stat events for UI
    this.setupStatsEvents();

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

    // Debug text (top-right corner)
    this.debugText = this.add.text(GAME_WIDTH - 10, 10, '', {
      font: '14px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 5 },
    });
    this.debugText.setOrigin(1, 0);

    // Initialize combat and effects managers
    this.combatManager = new CombatManager(this);
    this.effectsManager = new EffectsManager(this);

    // Create monsters
    this.createMonsters();

    // Create portals
    this.createPortals();

    // Create NPCs
    this.createNPCs();

    // Create dialogue box (UI overlay)
    this.dialogueBox = new DialogueBox(this);

    // Create skill bar (top-right corner, toggleable with TAB)
    this.skillBar = new SkillBar(this, GAME_WIDTH - 180, 35);

    // Create skill config UI (legacy - keeping for slot-based config)
    this.skillConfigUI = new SkillConfigUI(this);
    this.skillConfigUI.setSkillAssignedCallback((slotIndex, skill) => {
      this.skillBar.assignSkill(slotIndex, skill);
    });
    this.skillConfigUI.setKeyBoundCallback((slotIndex, keyCode, keyDisplay) => {
      this.skillBar.setSlotKey(slotIndex, keyCode, keyDisplay);
      this.rebindSkillKeys();
    });
    // Initialize with current skills (6 slots now)
    this.skillConfigUI.setCurrentSkills([
      getSkill('POWER_STRIKE') ?? null,
      getSkill('DOUBLE_STRIKE') ?? null,
      getSkill('SLASH_BLAST') ?? null,
      getSkill('RAGE') ?? null,
      null,
      null
    ]);

    // Create keyboard config UI (MapleStory style - full keyboard)
    this.keyboardConfigUI = new KeyboardConfigUI(this);
    this.keyboardConfigUI.setOnSkillBindingsChanged((bindings) => {
      this.applyKeyboardBindings(bindings);
    });
    this.keyboardConfigUI.setOnActionBindingsChanged((bindings) => {
      this.actionBindings = bindings;
      this.applyActionBindings();
    });

    // Set initial skill bindings
    const initialSkillBindings = new Map<string, SkillDefinition>();
    const powerStrikeInit = getSkill('POWER_STRIKE');
    const doubleStrikeInit = getSkill('DOUBLE_STRIKE');
    const slashBlastInit = getSkill('SLASH_BLAST');
    const rageInit = getSkill('RAGE');
    if (powerStrikeInit) initialSkillBindings.set('A', powerStrikeInit);
    if (doubleStrikeInit) initialSkillBindings.set('S', doubleStrikeInit);
    if (slashBlastInit) initialSkillBindings.set('D', slashBlastInit);
    if (rageInit) initialSkillBindings.set('F', rageInit);

    // Set initial action bindings
    const initialActionBindings = new Map<string, ActionDefinition>();
    initialActionBindings.set('C', ACTIONS.JUMP);
    initialActionBindings.set('Z', ACTIONS.ATTACK);
    initialActionBindings.set('X', ACTIONS.PICKUP);
    initialActionBindings.set('TAB', ACTIONS.SKILL_BAR);
    initialActionBindings.set('N', ACTIONS.INTERACT);
    this.actionBindings = initialActionBindings;

    this.keyboardConfigUI.setInitialBindings(initialSkillBindings, initialActionBindings);

    // Now set up the skill system (after keyboard config is created)
    this.setupSkillSystem();

    // Set up keyboard for dialogue/portal interaction
    this.setupInteractionKeys();

    // Listen for combat events
    this.events.on('combat:hit', this.onCombatHit, this);
    this.events.on('monster:damaged', this.onMonsterDamaged, this);
    this.events.on('monster:death', this.onMonsterDeath, this);

    // Listen for dialogue events
    this.events.on('dialogue:loadNext', (dialogueKey: string) => {
      const dialogue = getDialogue(dialogueKey);
      if (dialogue) {
        this.dialogueBox.openDialogue(dialogue);
      }
    });

    // Launch UI Scene
    this.scene.launch('UIScene');

    // Send initial stats to UI
    this.time.delayedCall(100, () => {
      this.emitPlayerStats();
    });
  }

  private setupStatsEvents(): void {
    // Forward PlayerStats events to scene events for UI
    this.playerStats.on('hpChanged', (current: number, max: number) => {
      this.events.emit('player:hp-changed', { current, max });
    });

    this.playerStats.on('mpChanged', (current: number, max: number) => {
      this.events.emit('player:mp-changed', { current, max });
    });

    this.playerStats.on('expGained', () => {
      this.emitExpUpdate();
    });

    this.playerStats.on('levelUp', (data: { newLevel: number }) => {
      this.events.emit('player:level-up', data);
      this.emitExpUpdate();
      this.emitPlayerStats();
    });
  }

  private emitPlayerStats(): void {
    this.events.emit('player:hp-changed', {
      current: this.playerStats.currentHP,
      max: this.playerStats.getMaxHP()
    });
    this.events.emit('player:mp-changed', {
      current: this.playerStats.currentMP,
      max: this.playerStats.getMaxMP()
    });
    this.emitExpUpdate();
  }

  private emitExpUpdate(): void {
    const currentLevelExp = PlayerStats.getExpForLevel(this.playerStats.level);
    const nextLevelExp = this.playerStats.getExpToNextLevel();
    const expInLevel = this.playerStats.exp - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;

    console.log(`EXP Update: ${expInLevel}/${expNeeded} (total: ${this.playerStats.exp}, need: ${nextLevelExp})`);

    this.events.emit('player:exp-changed', {
      current: expInLevel,
      max: expNeeded,
      level: this.playerStats.level
    });
  }

  private setupSkillSystem(): void {
    // Initialize skill manager
    this.skillManager = new SkillManager(this, {
      currentMP: () => this.playerStats.currentMP,
      useMP: (amount: number) => this.playerStats.useMP(amount),
      playerLevel: () => this.playerStats.level,
      getATK: () => this.playerStats.getATK() + this.skillManager.getBuffBonus('ATK')
    });

    // Initialize skill effects
    this.skillEffects = new SkillEffects(this);

    // Assign default skills to hotbar
    const powerStrike = getSkill('POWER_STRIKE');
    const doubleStrike = getSkill('DOUBLE_STRIKE');
    const slashBlast = getSkill('SLASH_BLAST');
    const rage = getSkill('RAGE');

    if (powerStrike) this.skillBar.assignSkill(0, powerStrike);
    if (doubleStrike) this.skillBar.assignSkill(1, doubleStrike);
    if (slashBlast) this.skillBar.assignSkill(2, slashBlast);
    if (rage) this.skillBar.assignSkill(3, rage);

    // Set cooldown callback
    this.skillBar.setCooldownCallback((skillId: string) => {
      const skill = getSkill(skillId);
      if (!skill) return 0;
      return this.skillManager.getCooldownPercent(skillId, skill.cooldown);
    });

    // Listen for skill events
    this.skillManager.on('skill:used', (data: {
      skill: SkillDefinition;
      type: string;
      hitbox?: Phaser.Geom.Rectangle;
      damage?: number;
      facingRight?: boolean;
    }) => {
      // Play skill effect
      this.skillEffects.playSkillEffect(
        data.skill,
        this.player.x,
        this.player.y,
        !this.player.flipX
      );
      this.skillEffects.showSkillName(data.skill, this.player.x, this.player.y);

      // Store hitbox for collision detection
      if (data.type === 'attack' && data.hitbox && data.damage !== undefined) {
        this.skillHitbox = data.hitbox;
        this.skillHitData = {
          damage: data.damage,
          skill: data.skill,
          facingRight: data.facingRight ?? true
        };
        this.hitMonstersThisSkill.clear();

        // Clear hitbox after a short duration
        this.time.delayedCall(150, () => {
          this.skillHitbox = null;
          this.skillHitData = null;
        });
      }

      // Update MP bar
      this.events.emit('player:mp-changed', {
        current: this.playerStats.currentMP,
        max: this.playerStats.getMaxMP()
      });
    });

    // Set up skill hotkeys based on current bindings
    this.rebindSkillKeys();

    // K key to open skill config (slot-based)
    this.input.keyboard?.on('keydown-K', () => {
      if (this.dialogueBox.isOpen) return;
      if (this.keyboardConfigUI.isOpen) return;
      this.skillConfigUI.toggle();
    });

    // Apply initial action bindings to player
    this.applyActionBindings();

    // ESC key to open keyboard config (MapleStory style)
    this.input.keyboard?.on('keydown-ESC', () => {
      // If dialogue is open, close it instead
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('ESC');
        return;
      }
      if (this.skillConfigUI.isOpen) {
        this.skillConfigUI.close();
        return;
      }
      if (this.keyboardConfigUI.isOpen) {
        this.keyboardConfigUI.close();
        this.skillBar.setVisible(true);
      } else {
        this.keyboardConfigUI.open();
        this.skillBar.setVisible(false);
      }
    });
  }

  private applyKeyboardBindings(bindings: Map<string, SkillDefinition>): void {
    // Update the skill bar to show bound skills
    // Find skills bound to A,S,D,F,G,H and assign them to the skill bar slots
    const slotKeys = ['A', 'S', 'D', 'F', 'G', 'H'];
    slotKeys.forEach((key, slotIndex) => {
      const skill = bindings.get(key);
      if (skill) {
        this.skillBar.assignSkill(slotIndex, skill);
      }
    });

    // Rebind all keys
    this.rebindSkillKeys();
  }

  private convertEventToKeyCode(event: KeyboardEvent): string {
    if (event.code.startsWith('Key')) {
      return event.code.replace('Key', '');
    } else if (event.code.startsWith('Digit')) {
      const num = event.code.replace('Digit', '');
      const numNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
      return numNames[parseInt(num)];
    } else if (event.code === 'Space') {
      return 'SPACE';
    } else if (event.code === 'Tab') {
      return 'TAB';
    } else if (event.code.startsWith('F') && event.code.length <= 3) {
      return event.code.toUpperCase();
    } else {
      const specialMapping: Record<string, string> = {
        'Backquote': 'BACKTICK',
        'Minus': 'MINUS',
        'Equal': 'PLUS',
        'BracketLeft': 'OPEN_BRACKET',
        'BracketRight': 'CLOSED_BRACKET',
        'Backslash': 'BACK_SLASH',
        'Semicolon': 'SEMICOLON',
        'Quote': 'QUOTES',
        'Comma': 'COMMA',
        'Period': 'PERIOD',
        'Slash': 'FORWARD_SLASH',
      };
      return specialMapping[event.code] || event.code.toUpperCase();
    }
  }

  private getKeyForAction(actionId: string): string | null {
    for (const [key, action] of this.actionBindings) {
      if (action.id === actionId) {
        return key;
      }
    }
    return null;
  }

  private applyActionBindings(): void {
    // Update player key bindings
    this.player.setKeyBindings({
      jump: this.getKeyForAction('JUMP'),
      attack: this.getKeyForAction('ATTACK'),
    });
  }

  private rebindSkillKeys(): void {
    // Use a generic key handler that checks all bindings
    if (!this.input.keyboard) return;

    // Remove old handler if exists
    this.input.keyboard.off('keydown');

    // Get bindings from both skill bar and keyboard config
    const skillBarBindings = this.skillBar.getAllKeyBindings();
    const keyboardBindings = this.keyboardConfigUI.getSkillBindings();

    // Add new handler
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      // ESC can always be used to close menus
      if (event.code === 'Escape') return; // Let the ESC handler in setupSkillSystem handle this

      if (this.dialogueBox.isOpen || this.skillConfigUI.isOpen || this.keyboardConfigUI.isOpen) return;

      const eventKeyCode = this.convertEventToKeyCode(event);

      // Check action bindings first
      const action = this.actionBindings.get(eventKeyCode);
      if (action) {
        this.handleActionKey(action.id, event);
        return;
      }

      // Check keyboard config skill bindings
      const keyboardSkill = keyboardBindings.get(eventKeyCode);
      if (keyboardSkill) {
        this.useSkillDirect(keyboardSkill);
        return;
      }

      // Then check skill bar bindings
      for (const binding of skillBarBindings) {
        if (eventKeyCode === binding.keyCode) {
          this.useSkillSlot(binding.slotIndex);
          break;
        }
      }
    });
  }

  private handleActionKey(actionId: string, event: KeyboardEvent): void {
    switch (actionId) {
      case 'SKILL_BAR':
        event.preventDefault();
        this.skillBar.setVisible(!this.skillBar.visible);
        break;
      case 'INTERACT':
        if (this.nearbyNPC) {
          const dialogue = getDialogue(this.nearbyNPC.dialogueKey);
          if (dialogue) {
            this.dialogueBox.openDialogue(dialogue);
          }
        }
        break;
      // JUMP and ATTACK are handled directly by the Player class
    }
  }

  private useSkillDirect(skill: SkillDefinition): void {
    const check = this.skillManager.canUseSkill(skill);
    if (!check.canUse) {
      return;
    }

    // Use the skill
    this.skillManager.useSkill(
      skill,
      this.player.x,
      this.player.y,
      !this.player.flipX
    );
  }

  private useSkillSlot(slotIndex: number): void {
    const skill = this.skillBar.getSkillAtSlot(slotIndex);
    if (!skill) return;

    const check = this.skillManager.canUseSkill(skill);
    if (!check.canUse) {
      if (check.reason === 'Not enough MP') {
        this.skillBar.showNotEnoughMP(slotIndex);
      }
      return;
    }

    // Highlight the slot
    this.skillBar.highlightSlot(slotIndex);

    // Use the skill
    this.skillManager.useSkill(
      skill,
      this.player.x,
      this.player.y,
      !this.player.flipX
    );
  }

  private createMonsters(): void {
    // Spawn slimes on the ground - spread across wider map
    const slimePositions = [
      { x: 400, y: GAME_HEIGHT - 100 },
      { x: 650, y: GAME_HEIGHT - 100 },
      { x: 900, y: GAME_HEIGHT - 100 },
      { x: 1100, y: GAME_HEIGHT - 100 },
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
    // Give EXP to player
    const levelsGained = this.playerStats.gainExp(data.exp);

    // Show EXP gain text
    this.effectsManager.showDamage(data.x, data.y - 40, data.exp, false);

    // Force UI update
    this.emitExpUpdate();

    // Handle level up
    if (levelsGained > 0) {
      this.events.emit('player:level-up', { newLevel: this.playerStats.level });
      this.emitPlayerStats();
    }

    // Handle item drops
    this.handleMonsterDrops(data.monster, data.x, data.y);
  }

  private handleMonsterDrops(monster: Monster, _x: number, _y: number): void {
    const definition = monster['definition'];
    if (!definition) return;

    // Meso drop
    const [minMeso, maxMeso] = definition.mesoDrop;
    const mesoAmount = Math.floor(Math.random() * (maxMeso - minMeso + 1)) + minMeso;
    if (mesoAmount > 0) {
      this.inventory.addMesos(mesoAmount);
      // Could spawn visual meso drop here
    }

    // Item drops
    if (definition.itemDrops) {
      definition.itemDrops.forEach((drop: { itemId: string; chance: number; minQuantity: number; maxQuantity: number }) => {
        if (Math.random() < drop.chance) {
          const item = getItem(drop.itemId);
          if (item) {
            const quantity = Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity;
            const overflow = this.inventory.addItem(item, quantity);
            if (overflow === 0) {
              console.log(`Obtained: ${item.name} x${quantity}`);
            }
          }
        }
      });
    }
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

    // Handle skill hitbox
    this.handleSkillHit();

    // Update skill systems
    this.skillManager.update();
    this.skillBar.update();

    // Check proximity to NPCs and portals
    this.checkNPCProximity();
    this.checkPortalProximity();

    // Update debug info
    this.debugText.setText([
      `Lv.${this.playerStats.level} | EXP: ${this.playerStats.exp}`,
      `Mesos: ${this.inventory.getMesos()}`,
      `Monsters: ${this.monsters.filter(m => !m['isDead']).length}/${this.monsters.length}`,
    ]);
  }

  private handlePlayerAttack(): void {
    const hitbox = this.player.activeHitbox;

    // Clear hit tracking when attack ends
    if (!hitbox) {
      this.hitMonstersThisAttack.clear();
      return;
    }

    const attackData = this.player.getAttackData();
    if (!attackData) return;

    // Check collision with all monster hurtboxes
    this.monsters.forEach(monster => {
      if (monster['isDead']) return;

      // Skip if already hit this monster during this attack
      if (this.hitMonstersThisAttack.has(monster)) return;

      const hurtbox = monster.getHurtbox();
      if (hurtbox.isInvincible()) return;

      // Check overlap
      const monsterBounds = hurtbox.getHurtboxBounds();
      if (Phaser.Geom.Rectangle.Overlaps(hitbox, monsterBounds)) {
        // Track this monster as hit
        this.hitMonstersThisAttack.add(monster);

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

  private handleSkillHit(): void {
    if (!this.skillHitbox || !this.skillHitData) return;

    const { damage, skill, facingRight } = this.skillHitData;
    let hitCount = 0;

    this.monsters.forEach(monster => {
      if (monster['isDead']) return;
      if (hitCount >= skill.maxTargets) return;
      if (this.hitMonstersThisSkill.has(monster)) return;

      const hurtbox = monster.getHurtbox();
      if (hurtbox.isInvincible()) return;

      const monsterBounds = hurtbox.getHurtboxBounds();
      if (Phaser.Geom.Rectangle.Overlaps(this.skillHitbox!, monsterBounds)) {
        this.hitMonstersThisSkill.add(monster);
        hitCount++;

        const isCritical = Math.random() < 0.15;
        const finalDamage = Math.floor(damage * (isCritical ? 1.5 : 1));

        const knockbackDir = facingRight ? 1 : -1;
        const knockback = {
          x: skill.knockback.x * knockbackDir,
          y: skill.knockback.y
        };

        hurtbox.takeDamage(finalDamage, knockback, isCritical);
        hurtbox.applyInvincibility(30);

        this.events.emit('combat:hit', {
          damage: finalDamage,
          x: monster.x,
          y: monster.y,
          isCritical
        });
      }
    });
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    // Ground - spans full width
    const ground = this.platforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'ground') as Phaser.Physics.Arcade.Sprite;
    ground.setScale(1).refreshBody();

    // Floating platforms (MapleStory style layout) - scaled to new resolution
    this.platforms.create(200, GAME_HEIGHT - 170, 'platform');
    this.platforms.create(500, GAME_HEIGHT - 240, 'platform');
    this.platforms.create(800, GAME_HEIGHT - 170, 'platform');
    this.platforms.create(1080, GAME_HEIGHT - 170, 'platform');
    this.platforms.create(350, GAME_HEIGHT - 340, 'platform');
    this.platforms.create(700, GAME_HEIGHT - 340, 'platform');
    this.platforms.create(1000, GAME_HEIGHT - 340, 'platform');
    this.platforms.create(550, GAME_HEIGHT - 440, 'platform');
    this.platforms.create(850, GAME_HEIGHT - 440, 'platform');
  }

  private createLadders(): void {
    // Ground to first level platforms
    this.ladders.push(new Ladder({
      scene: this,
      x: 200,
      y: GAME_HEIGHT - 100,
      height: 140,
      type: 'ladder',
    }));

    this.ladders.push(new Ladder({
      scene: this,
      x: 800,
      y: GAME_HEIGHT - 100,
      height: 140,
      type: 'rope',
    }));

    this.ladders.push(new Ladder({
      scene: this,
      x: 1080,
      y: GAME_HEIGHT - 100,
      height: 140,
      type: 'ladder',
    }));

    // First level to second level
    this.ladders.push(new Ladder({
      scene: this,
      x: 350,
      y: GAME_HEIGHT - 255,
      height: 170,
      type: 'ladder',
    }));

    this.ladders.push(new Ladder({
      scene: this,
      x: 700,
      y: GAME_HEIGHT - 255,
      height: 170,
      type: 'rope',
    }));

    // Second level to third level
    this.ladders.push(new Ladder({
      scene: this,
      x: 550,
      y: GAME_HEIGHT - 390,
      height: 100,
      type: 'ladder',
    }));

    this.ladders.push(new Ladder({
      scene: this,
      x: 850,
      y: GAME_HEIGHT - 390,
      height: 100,
      type: 'rope',
    }));
  }

  private createPortals(): void {
    // Portal on upper platform
    const portal = new Portal({
      scene: this,
      x: 550,
      y: GAME_HEIGHT - 480,
      width: 50,
      height: 70,
      targetMap: 'map2',
      targetX: 100,
      targetY: GAME_HEIGHT - 100
    });
    this.portals.push(portal);

    // Portal at right side of ground
    const portal2 = new Portal({
      scene: this,
      x: GAME_WIDTH - 100,
      y: GAME_HEIGHT - 70,
      width: 40,
      height: 60,
      targetMap: 'map2',
      targetX: 50,
      targetY: GAME_HEIGHT - 100
    });
    this.portals.push(portal2);
  }

  private createNPCs(): void {
    // Guide NPC near spawn
    const guideNPC = new NPC({
      scene: this,
      x: 180,
      y: GAME_HEIGHT - 70,
      name: 'Maple Guide',
      dialogueKey: 'guide_intro'
    });
    this.npcs.push(guideNPC);

    // Shop NPC on middle platform
    const shopNPC = new NPC({
      scene: this,
      x: 500,
      y: GAME_HEIGHT - 280,
      name: 'Shopkeeper',
      dialogueKey: 'shop_greeting'
    });
    this.npcs.push(shopNPC);
  }

  private setupInteractionKeys(): void {
    // NPC interaction is now handled via action bindings

    // Portal interaction key (UP arrow when near portal)
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.dialogueBox.isOpen) return;

      if (this.nearbyPortal && this.nearbyPortal.isActive) {
        this.usePortal(this.nearbyPortal);
      }
    });

    // Dialogue controls
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('SPACE');
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('ENTER');
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('ESC');
      }
    });

    // Arrow keys for dialogue choice selection
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('UP');
      }
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('DOWN');
      }
    });
  }

  private usePortal(portal: Portal): void {
    // For now, just show a message since we only have one map
    console.log(`Using portal to ${portal.targetMap} at (${portal.targetX}, ${portal.targetY})`);

    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    // Teleport player (within same map for demo)
    this.time.delayedCall(150, () => {
      // In a full implementation, this would transition to another scene
      // For now, just move player to demonstrate the portal works
      this.player.setPosition(portal.targetX, portal.targetY);
    });
  }

  private checkNPCProximity(): void {
    this.nearbyNPC = null;

    for (const npc of this.npcs) {
      const interactionBounds = npc.getInteractionBounds();
      const playerBounds = this.player.getBounds();

      if (Phaser.Geom.Rectangle.Overlaps(interactionBounds, playerBounds)) {
        this.nearbyNPC = npc;
        npc.showInteractionPrompt();
      } else {
        npc.hideInteractionPrompt();
      }
    }
  }

  private checkPortalProximity(): void {
    this.nearbyPortal = null;

    for (const portal of this.portals) {
      const portalBounds = portal.getBounds();
      const playerBounds = this.player.getBounds();

      if (Phaser.Geom.Rectangle.Overlaps(portalBounds, playerBounds)) {
        this.nearbyPortal = portal;
        break;
      }
    }
  }

  private createBackground(): void {
    const graphics = this.add.graphics();

    // Sky gradient (darker at top, lighter at bottom)
    const gradientHeight = GAME_HEIGHT / 3;
    graphics.fillStyle(0x1e90ff, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, gradientHeight);
    graphics.fillStyle(0x87ceeb, 1);
    graphics.fillRect(0, gradientHeight, GAME_WIDTH, gradientHeight);
    graphics.fillStyle(0xb0e0e6, 1);
    graphics.fillRect(0, gradientHeight * 2, GAME_WIDTH, gradientHeight);

    // Decorative clouds - spread across wider map
    graphics.fillStyle(0xffffff, 0.8);
    this.drawCloud(graphics, 100, 80, 60);
    this.drawCloud(graphics, 350, 120, 80);
    this.drawCloud(graphics, 600, 60, 70);
    this.drawCloud(graphics, 850, 140, 50);
    this.drawCloud(graphics, 1050, 90, 65);
    this.drawCloud(graphics, 1200, 50, 55);

    graphics.setDepth(-1);
  }

  private drawCloud(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.fillCircle(x, y, size * 0.5);
    graphics.fillCircle(x + size * 0.4, y - size * 0.1, size * 0.4);
    graphics.fillCircle(x + size * 0.8, y, size * 0.35);
    graphics.fillCircle(x + size * 0.3, y + size * 0.2, size * 0.3);
  }
}
