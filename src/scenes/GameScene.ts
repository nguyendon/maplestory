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
import { InventoryUI } from '../ui/InventoryUI';
import { EquipmentUI } from '../ui/EquipmentUI';
import { Equipment } from '../systems/Equipment';
import { ItemType, EquipSlot, type EquipItem, type Item } from '../systems/ItemData';
import { DroppedItem } from '../entities/DroppedItem';

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

  // Dropped items
  private droppedItems: DroppedItem[] = [];

  // RPG Systems
  private playerStats!: PlayerStats;
  private inventory!: Inventory;
  private equipment!: Equipment;

  // UI Systems
  private dialogueBox!: DialogueBox;
  private skillBar!: SkillBar;
  private skillConfigUI!: SkillConfigUI;
  private keyboardConfigUI!: KeyboardConfigUI;
  private inventoryUI!: InventoryUI;
  private equipmentUI!: EquipmentUI;
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
    this.equipment = new Equipment();

    // Give player starting potions
    this.giveStarterItems();

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

    // Create inventory UI
    this.inventoryUI = new InventoryUI(this);
    this.inventoryUI.setInventory(this.inventory);
    this.inventoryUI.setOnItemUse((slotIndex) => {
      const result = this.inventory.useItem(slotIndex, this.playerStats);
      if (result.success) {
        this.showPotionEffect(result.effect, result.value);
        this.inventoryUI.refresh();
        this.events.emit('player:hp-changed', {
          current: this.playerStats.currentHP,
          max: this.playerStats.getMaxHP()
        });
        this.events.emit('player:mp-changed', {
          current: this.playerStats.currentMP,
          max: this.playerStats.getMaxMP()
        });
      } else {
        this.showPotionMessage(result.message, false);
      }
    });
    this.inventoryUI.setOnItemEquip((slotIndex) => {
      this.equipItemFromInventory(slotIndex);
    });

    // Create equipment UI
    this.equipmentUI = new EquipmentUI(this);
    this.equipmentUI.setEquipment(this.equipment);
    this.equipmentUI.setOnUnequip((slot) => {
      this.unequipItem(slot);
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
    initialActionBindings.set('ONE', ACTIONS.HP_POTION);
    initialActionBindings.set('TWO', ACTIONS.MP_POTION);
    initialActionBindings.set('I', ACTIONS.INVENTORY);
    initialActionBindings.set('E', ACTIONS.EQUIPMENT);
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
      getATK: () => {
        const baseATK = this.playerStats.getATK();
        const equipATK = this.equipment.getTotalStats().ATK || 0;
        const buffATK = this.skillManager.getBuffBonus('ATK');
        return baseATK + equipATK + buffATK;
      }
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
      if (this.inventoryUI.isOpen || this.equipmentUI.isOpen) {
        this.inventoryUI.close();
        this.equipmentUI.close();
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
      case 'HP_POTION':
        this.usePotion('red_potion');
        break;
      case 'MP_POTION':
        this.usePotion('blue_potion');
        break;
      case 'INVENTORY':
        this.inventoryUI.toggle();
        // Also toggle equipment UI with inventory
        if (this.inventoryUI.isOpen) {
          this.equipmentUI.open();
        } else {
          this.equipmentUI.close();
        }
        break;
      case 'EQUIPMENT':
        this.equipmentUI.toggle();
        // Also toggle inventory UI with equipment
        if (this.equipmentUI.isOpen) {
          this.inventoryUI.open();
        } else {
          this.inventoryUI.close();
        }
        break;
      case 'PICKUP':
        this.tryPickupItems();
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

  private handleMonsterDrops(monster: Monster, x: number, y: number): void {
    const definition = monster['definition'];
    if (!definition) return;

    let dropIndex = 0;

    // Meso drop
    const [minMeso, maxMeso] = definition.mesoDrop;
    const mesoAmount = Math.floor(Math.random() * (maxMeso - minMeso + 1)) + minMeso;
    if (mesoAmount > 0) {
      const offsetX = (dropIndex - 0.5) * 25;
      this.spawnDrop(x + offsetX, y, undefined, 0, mesoAmount);
      dropIndex++;
    }

    // Item drops
    if (definition.itemDrops) {
      definition.itemDrops.forEach((drop: { itemId: string; chance: number; minQuantity: number; maxQuantity: number }) => {
        if (Math.random() < drop.chance) {
          const item = getItem(drop.itemId);
          if (item) {
            const quantity = Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) + drop.minQuantity;
            const offsetX = (dropIndex - 0.5) * 25;
            this.spawnDrop(x + offsetX, y, item, quantity, 0);
            dropIndex++;
          }
        }
      });
    }
  }

  private spawnDrop(x: number, y: number, item?: Item, quantity?: number, mesos?: number): void {
    const drop = new DroppedItem({
      scene: this,
      x,
      y,
      item,
      quantity,
      mesos
    });
    this.droppedItems.push(drop);
  }

  private tryPickupItems(): void {
    const playerBounds = this.player.getBounds();
    const pickedUp: DroppedItem[] = [];

    for (const drop of this.droppedItems) {
      if (!drop.canBePickedUp()) continue;

      const dropBounds = drop.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, dropBounds)) {
        if (drop.isMesoDrop()) {
          // Pickup mesos
          const mesos = drop.getMesos();
          drop.pickup(this.player.x, this.player.y, () => {
            this.inventory.addMesos(mesos);
            this.showPickupMessage(`+${mesos} mesos`, 0xffd700);
            if (this.inventoryUI.isOpen) {
              this.inventoryUI.refresh();
            }
          });
          pickedUp.push(drop);
        } else {
          // Pickup item
          const item = drop.getItem();
          const quantity = drop.getQuantity();
          if (item) {
            // Check if inventory has space
            if (this.inventory.isFull() && !item.stackable) {
              this.showPickupMessage('Inventory full!', 0xff6666);
              continue;
            }

            drop.pickup(this.player.x, this.player.y, () => {
              const overflow = this.inventory.addItem(item, quantity);
              if (overflow === 0) {
                const msg = quantity > 1 ? `${item.name} x${quantity}` : item.name;
                this.showPickupMessage(`+${msg}`, 0x88ff88);
              }
              if (this.inventoryUI.isOpen) {
                this.inventoryUI.refresh();
              }
            });
            pickedUp.push(drop);
          }
        }
      }
    }

    // Remove picked up items from array
    this.droppedItems = this.droppedItems.filter(d => !pickedUp.includes(d));
  }

  private showPickupMessage(message: string, color: number): void {
    const colorStr = '#' + color.toString(16).padStart(6, '0');
    const text = this.add.text(this.player.x, this.player.y - 40, message, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: colorStr,
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);
    text.setDepth(101);

    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
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

    // Update player stats (HP/MP regeneration)
    this.playerStats.update(delta);

    // Check proximity to NPCs and portals
    this.checkNPCProximity();
    this.checkPortalProximity();

    // Clean up destroyed drops
    this.droppedItems = this.droppedItems.filter(d => d.active);

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
    // Create a beautiful gradient sky
    const skyCanvas = this.textures.createCanvas('sky-bg', GAME_WIDTH, GAME_HEIGHT);
    if (skyCanvas) {
      const ctx = skyCanvas.context;

      // Gradient sky - sunset/dawn style
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, '#1a1a2e');      // Deep blue at top
      gradient.addColorStop(0.3, '#16213e');    // Dark blue
      gradient.addColorStop(0.5, '#0f3460');    // Medium blue
      gradient.addColorStop(0.7, '#e94560');    // Pink/orange horizon
      gradient.addColorStop(0.85, '#ff9a3c');   // Orange
      gradient.addColorStop(1, '#ffd93d');      // Yellow at bottom

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Add stars at the top
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const starX = Math.random() * GAME_WIDTH;
        const starY = Math.random() * (GAME_HEIGHT * 0.4);
        const starSize = Math.random() * 2 + 1;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      skyCanvas.refresh();
    }

    const sky = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky-bg');
    sky.setDepth(-100);

    // Distant mountains (back layer)
    this.createMountainLayer(-80, 0x2d3436, 0.8);

    // Middle mountains
    this.createMountainLayer(-60, 0x636e72, 0.6);

    // Front hills
    this.createHillLayer(-40, 0x74b9ff, 0.4);

    // Clouds layer
    this.createCloudLayer();

    // Decorative trees in background
    this.createTreeLayer();
  }

  private createMountainLayer(depth: number, color: number, heightMultiplier: number): void {
    const graphics = this.add.graphics();
    graphics.setDepth(depth);

    const baseY = GAME_HEIGHT * 0.6;
    const points: { x: number; y: number }[] = [];

    // Generate mountain peaks
    points.push({ x: 0, y: GAME_HEIGHT });

    for (let x = 0; x <= GAME_WIDTH; x += 50) {
      const noise = Math.sin(x * 0.01) * 50 + Math.sin(x * 0.02) * 30 + Math.sin(x * 0.005) * 80;
      const y = baseY - noise * heightMultiplier;
      points.push({ x, y });
    }

    points.push({ x: GAME_WIDTH, y: GAME_HEIGHT });

    graphics.fillStyle(color, 0.6);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (const point of points) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  private createHillLayer(depth: number, color: number, heightMultiplier: number): void {
    const graphics = this.add.graphics();
    graphics.setDepth(depth);

    const baseY = GAME_HEIGHT * 0.75;

    graphics.fillStyle(color, 0.3);
    graphics.beginPath();
    graphics.moveTo(0, GAME_HEIGHT);

    for (let x = 0; x <= GAME_WIDTH; x += 30) {
      const noise = Math.sin(x * 0.015) * 40 + Math.sin(x * 0.008) * 60;
      const y = baseY - noise * heightMultiplier;
      graphics.lineTo(x, y);
    }

    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT);
    graphics.closePath();
    graphics.fillPath();
  }

  private createCloudLayer(): void {
    // Create fluffy clouds
    const cloudPositions = [
      { x: 100, y: 80, size: 60 },
      { x: 300, y: 120, size: 80 },
      { x: 550, y: 60, size: 70 },
      { x: 800, y: 100, size: 50 },
      { x: 1000, y: 70, size: 65 },
      { x: 1200, y: 130, size: 55 },
    ];

    cloudPositions.forEach(cloud => {
      const cloudContainer = this.add.container(cloud.x, cloud.y);
      cloudContainer.setDepth(-50);

      const graphics = this.add.graphics();

      // Cloud shadow
      graphics.fillStyle(0xdfe6e9, 0.5);
      graphics.fillCircle(4, 4, cloud.size * 0.5);
      graphics.fillCircle(cloud.size * 0.4 + 4, cloud.size * -0.1 + 4, cloud.size * 0.4);
      graphics.fillCircle(cloud.size * 0.8 + 4, 4, cloud.size * 0.35);

      // Main cloud
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillCircle(0, 0, cloud.size * 0.5);
      graphics.fillCircle(cloud.size * 0.4, cloud.size * -0.1, cloud.size * 0.4);
      graphics.fillCircle(cloud.size * 0.8, 0, cloud.size * 0.35);
      graphics.fillCircle(cloud.size * 0.3, cloud.size * 0.15, cloud.size * 0.3);
      graphics.fillCircle(cloud.size * 0.6, cloud.size * 0.1, cloud.size * 0.25);

      cloudContainer.add(graphics);

      // Gentle floating animation
      this.tweens.add({
        targets: cloudContainer,
        y: cloud.y - 10,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }

  private createTreeLayer(): void {
    const treePositions = [50, 180, 400, 600, 900, 1100, 1250];

    treePositions.forEach(x => {
      const treeY = GAME_HEIGHT - 90;
      const graphics = this.add.graphics();
      graphics.setDepth(-20);

      // Tree trunk
      graphics.fillStyle(0x5d4037, 1);
      graphics.fillRect(x - 6, treeY, 12, 30);

      // Tree foliage (layered circles)
      const foliageColor = 0x27ae60;
      const foliageDark = 0x1e8449;

      graphics.fillStyle(foliageDark, 0.8);
      graphics.fillCircle(x, treeY - 15, 25);
      graphics.fillCircle(x - 15, treeY, 20);
      graphics.fillCircle(x + 15, treeY, 20);

      graphics.fillStyle(foliageColor, 0.9);
      graphics.fillCircle(x, treeY - 20, 22);
      graphics.fillCircle(x - 12, treeY - 5, 18);
      graphics.fillCircle(x + 12, treeY - 5, 18);

      // Highlight
      graphics.fillStyle(0x2ecc71, 0.7);
      graphics.fillCircle(x - 5, treeY - 25, 10);
    });
  }

  private giveStarterItems(): void {
    // Give player starting potions
    const redPotion = getItem('red_potion');
    const bluePotion = getItem('blue_potion');

    if (redPotion) {
      this.inventory.addItem(redPotion, 10);
    }
    if (bluePotion) {
      this.inventory.addItem(bluePotion, 10);
    }

    // Give some starting mesos
    this.inventory.addMesos(500);
  }

  /**
   * Use a potion from inventory by item ID
   */
  private usePotion(itemId: string): void {
    const result = this.inventory.useItemById(itemId, this.playerStats);

    if (result.success) {
      // Show visual feedback
      this.showPotionEffect(result.effect, result.value);

      // Update UI
      this.events.emit('player:hp-changed', {
        current: this.playerStats.currentHP,
        max: this.playerStats.getMaxHP()
      });
      this.events.emit('player:mp-changed', {
        current: this.playerStats.currentMP,
        max: this.playerStats.getMaxMP()
      });

      // Refresh inventory UI if open
      if (this.inventoryUI.isOpen) {
        this.inventoryUI.refresh();
      }
    } else {
      // Show error message
      this.showPotionMessage(result.message, false);
    }
  }

  private showPotionEffect(effect?: string, value?: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;

    // Determine color based on effect type
    let color = 0x00ff00;
    let message = '';

    if (effect === 'heal_hp') {
      color = 0xff6b6b;
      message = `+${value} HP`;
    } else if (effect === 'heal_mp') {
      color = 0x4ecdc4;
      message = `+${value} MP`;
    } else if (effect === 'buff_atk') {
      color = 0xffd93d;
      message = `ATK UP!`;
    }

    // Create healing particles
    this.createHealingParticles(playerX, playerY, color);

    // Show floating text
    this.showPotionMessage(message, true);
  }

  private createHealingParticles(x: number, y: number, color: number): void {
    // Create sparkle particles rising up
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      const offsetX = (Math.random() - 0.5) * 40;
      const startY = y + 10;

      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.fillStyle(0xffffff, 0.8);
      particle.fillCircle(-1, -1, 1.5);

      particle.setPosition(x + offsetX, startY);
      particle.setDepth(100);

      // Animate particle floating up and fading
      this.tweens.add({
        targets: particle,
        y: startY - 60 - Math.random() * 30,
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        duration: 800 + Math.random() * 400,
        delay: i * 50,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // Create a brief glow effect around player
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, 0, 30);
    glow.setPosition(x, y);
    glow.setDepth(99);

    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 2 },
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => glow.destroy()
    });
  }

  private showPotionMessage(message: string, success: boolean): void {
    const text = this.add.text(this.player.x, this.player.y - 50, message, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: success ? '#ffffff' : '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(101);

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  /**
   * Equip an item from inventory
   */
  private equipItemFromInventory(slotIndex: number): void {
    const slot = this.inventory.getSlot(slotIndex);
    if (!slot || !slot.item || slot.item.type !== ItemType.EQUIP) {
      return;
    }

    const equipItem = slot.item as EquipItem;

    // Check level requirement
    const check = this.equipment.canEquip(equipItem, this.playerStats.level);
    if (!check.canEquip) {
      this.showPotionMessage(check.reason || 'Cannot equip', false);
      return;
    }

    // Remove from inventory
    this.inventory.removeItem(slotIndex, 1);

    // Equip and get any previously equipped item
    const previousItem = this.equipment.equip(equipItem);

    // Add previous item back to inventory if there was one
    if (previousItem) {
      const overflow = this.inventory.addItem(previousItem, 1);
      if (overflow > 0) {
        // Inventory full, swap failed - put the new item back
        this.equipment.unequip(equipItem.slot);
        this.inventory.addItem(equipItem, 1);
        if (previousItem) {
          this.equipment.equip(previousItem);
        }
        this.showPotionMessage('Inventory full', false);
        return;
      }
    }

    // Show equip effect
    this.showEquipEffect(equipItem.name);

    // Refresh UIs
    this.inventoryUI.refresh();
    this.equipmentUI.refresh();
  }

  /**
   * Unequip an item to inventory
   */
  private unequipItem(slot: EquipSlot): void {
    const item = this.equipment.getSlot(slot);
    if (!item) {
      return;
    }

    // Check if inventory has space
    if (this.inventory.isFull()) {
      this.showPotionMessage('Inventory full', false);
      return;
    }

    // Unequip
    const unequipped = this.equipment.unequip(slot);
    if (unequipped) {
      this.inventory.addItem(unequipped, 1);
      this.showPotionMessage(`Unequipped ${unequipped.name}`, true);
    }

    // Refresh UIs
    this.inventoryUI.refresh();
    this.equipmentUI.refresh();
  }

  private showEquipEffect(itemName: string): void {
    // Show floating text
    const text = this.add.text(this.player.x, this.player.y - 60, `Equipped ${itemName}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#88ff88',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(101);

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });

    // Sparkle effect
    for (let i = 0; i < 6; i++) {
      const sparkle = this.add.graphics();
      const angle = (i / 6) * Math.PI * 2;
      const radius = 25;

      sparkle.fillStyle(0xffff88, 1);
      sparkle.fillCircle(0, 0, 4);
      sparkle.fillStyle(0xffffff, 0.8);
      sparkle.fillCircle(-1, -1, 2);
      sparkle.setPosition(
        this.player.x + Math.cos(angle) * radius,
        this.player.y + Math.sin(angle) * radius
      );
      sparkle.setDepth(100);

      this.tweens.add({
        targets: sparkle,
        x: sparkle.x + Math.cos(angle) * 20,
        y: sparkle.y + Math.sin(angle) * 20,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        delay: i * 50,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }
}
