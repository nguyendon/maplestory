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
import { WorldMapUI } from '../ui/WorldMapUI';
import { StatsUI } from '../ui/StatsUI';
import { SkillTreeUI } from '../ui/SkillTreeUI';
import { PlayerSkillTree } from '../skills/PlayerSkillTree';
import { Equipment } from '../systems/Equipment';
import { ItemType, EquipSlot, type EquipItem, type Item } from '../systems/ItemData';
import { DroppedItem } from '../entities/DroppedItem';
import { defaultSaveManager, type SaveData } from '../systems/SaveManager';
import type UIScene from './UIScene';
import { getDefaultMap, getMap, MAPS, type MapDefinition, type BackgroundTheme } from '../config/MapData';
import { JobId, getJob } from '../systems/JobData';
import { getSkillsForJobAndLevel } from '../skills/SkillData';
import { networkManager } from '../network/NetworkManager';
import type { NetworkPlayer, NetworkMonster } from '../network/NetworkManager';
import { RemotePlayer } from '../entities/RemotePlayer';
import { ChatUI } from '../ui/ChatUI';
import { BuffIndicatorUI } from '../ui/BuffIndicatorUI';
import { executeCommand, type CommandContext } from '../systems/ChatCommands';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladders: Ladder[] = [];
  private monsters: Monster[] = [];
  private portals: Portal[] = [];
  private npcs: NPC[] = [];
  private debugText!: Phaser.GameObjects.Text;
  private debugVisible: boolean = false;
  private playerPlatformCollider!: Phaser.Physics.Arcade.Collider;
  private monsterColliders: Phaser.Physics.Arcade.Collider[] = [];
  private ladderOverlaps: Phaser.Physics.Arcade.Collider[] = [];
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
  private worldMapUI!: WorldMapUI;
  private statsUI!: StatsUI;
  private skillTreeUI!: SkillTreeUI;
  private playerSkillTree!: PlayerSkillTree;
  private chatUI!: ChatUI;
  private buffIndicatorUI!: BuffIndicatorUI;
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

  // Current map data
  private currentMap!: MapDefinition;

  // Background objects (for cleanup when changing maps)
  private backgroundObjects: Phaser.GameObjects.GameObject[] = [];

  // Transition overlay for smooth map changes
  private transitionOverlay!: Phaser.GameObjects.Graphics;
  private isTransitioning: boolean = false;

  // Multiplayer
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private isMultiplayer: boolean = false;
  private lastNetworkUpdate: number = 0;
  private networkUpdateInterval: number = 50; // 20 times per second

  constructor() {
    super({ key: SCENES.GAME });
  }

  create(): void {
    // Load map data
    this.currentMap = getDefaultMap();

    // Create background first
    this.createBackground();

    // Create platforms from map data
    this.createPlatforms();

    // Create ladders from map data
    this.createLadders();

    // Create player at map spawn point
    const spawn = this.currentMap.playerSpawn;
    this.player = new Player(this, spawn.x, spawn.y);

    // Initialize RPG systems
    this.playerStats = new PlayerStats(this);
    this.inventory = new Inventory(24);
    this.equipment = new Equipment();

    // Note: loadGame() is called after UI setup (see below)

    // Set up auto-save every 10 seconds
    this.time.addEvent({
      delay: 10000,
      callback: () => this.autoSave(),
      loop: true
    });

    // Set up stat events for UI
    this.setupStatsEvents();

    // Set up collisions - store reference so we can disable during climbing
    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms);

    // Set up ladder overlaps - store references for cleanup
    this.setupLadderOverlaps();

    // Debug text (top-right corner) - hidden by default, toggle with F3
    this.debugText = this.add.text(GAME_WIDTH - 10, 10, '', {
      font: '14px monospace',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 5 },
    });
    this.debugText.setOrigin(1, 0);
    this.debugText.setVisible(this.debugVisible);

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

    // Create buff indicator UI (top-left corner, below HP/MP bars)
    this.buffIndicatorUI = new BuffIndicatorUI(this, 15, 85);

    // Create skill config UI (skill tree / level display)
    this.skillConfigUI = new SkillConfigUI(this);
    // Set player's job and level for filtering skills
    this.skillConfigUI.setJobAndLevel(this.playerStats.job, this.playerStats.level);
    // Initialize with current SP and listen for changes
    this.skillConfigUI.setSkillPoints(this.playerStats.unassignedSP);
    this.playerStats.on('spChanged', (sp: number) => {
      this.skillConfigUI.setSkillPoints(sp);
    });

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

    // Create world map UI
    this.worldMapUI = new WorldMapUI(this);
    this.worldMapUI.setCurrentMap(this.currentMap.id);
    this.worldMapUI.setOnTeleport((mapId: string) => {
      const targetMap = MAPS[mapId];
      if (targetMap) {
        this.transitionToMap(mapId, targetMap.playerSpawn.x, targetMap.playerSpawn.y);
      }
    });

    // Create stats UI
    this.statsUI = new StatsUI(this);
    this.statsUI.setPlayerStats(this.playerStats);

    // Create skill tree system and UI
    this.playerSkillTree = new PlayerSkillTree(this.playerStats);
    this.skillTreeUI = new SkillTreeUI(this);
    this.skillTreeUI.setPlayerStats(this.playerStats, this.playerSkillTree);

    // Create chat UI and set up command handler
    this.chatUI = new ChatUI(this);
    this.chatUI.onCommand((command, args) => {
      const context: CommandContext = {
        playerStats: this.playerStats,
        skillTree: this.playerSkillTree,
        chatUI: this.chatUI,
        changeMap: (mapId: string) => {
          const targetMap = getMap(mapId);
          if (targetMap) {
            this.loadMap(mapId, targetMap.playerSpawn.x, targetMap.playerSpawn.y);
          }
        },
        changeJob: (jobId) => {
          this.playerStats.setJob(jobId);
          this.updateSkillsForJob(jobId);
          this.events.emit('job:changed', { job: jobId });
        },
      };
      executeCommand(command, args, context);
    });

    // Initialize minimap with current map data
    const uiSceneInit = this.scene.get('UIScene') as UIScene;
    if (uiSceneInit) {
      uiSceneInit.setMapData(this.currentMap);
    }

    // Set initial skill bindings (beginner skills available at level 1)
    const initialSkillBindings = new Map<string, SkillDefinition>();
    const doubleStrikeInit = getSkill('DOUBLE_STRIKE');
    const threeSnailsInit = getSkill('THREE_SNAILS');
    const recoveryInit = getSkill('RECOVERY');
    if (doubleStrikeInit) initialSkillBindings.set('A', doubleStrikeInit);
    if (threeSnailsInit) initialSkillBindings.set('S', threeSnailsInit);
    if (recoveryInit) initialSkillBindings.set('D', recoveryInit);

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
    initialActionBindings.set('S', ACTIONS.STATS);
    initialActionBindings.set('K', ACTIONS.SKILL_TREE);
    initialActionBindings.set('W', ACTIONS.WORLD_MAP);
    initialActionBindings.set('M', ACTIONS.MINIMAP);
    initialActionBindings.set('ESC', ACTIONS.MENU);
    initialActionBindings.set('F5', ACTIONS.SAVE);
    initialActionBindings.set('FORWARD_SLASH', ACTIONS.CHAT);
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
      // Handle job advancement dialogues
      if (dialogueKey.startsWith('job_confirm_')) {
        this.handleJobAdvancement(dialogueKey);
        return;
      }

      const dialogue = getDialogue(dialogueKey);
      if (dialogue) {
        this.dialogueBox.openDialogue(dialogue);
      }
    });

    // Launch UI Scene
    this.scene.launch('UIScene');

    // Create transition overlay for smooth map changes (must be on top)
    this.createTransitionOverlay();

    // Make sure GameScene's input is processed (set to top priority for interactive objects)
    this.input.setTopOnly(false);

    // Load saved game (must happen after all UI is set up)
    this.loadGame().then(loaded => {
      if (!loaded) {
        this.giveStarterItems();
      }
      // Update UI after load
      this.emitPlayerStats();
      if (this.inventoryUI) this.inventoryUI.refresh();
      if (this.equipmentUI) this.equipmentUI.refresh();
    });

    // Send initial stats to UI
    this.time.delayedCall(100, () => {
      this.emitPlayerStats();
    });

    // Setup multiplayer
    this.setupMultiplayer();
  }

  /**
   * Setup multiplayer connection and event handlers
   */
  private setupMultiplayer(): void {
    // Set up network event handlers
    networkManager.on('connected', () => {
      this.isMultiplayer = true;
      console.log('Connected to multiplayer server');
      this.showNotification('Connected to server!');

      // Set player name tag
      this.player.setPlayerName(networkManager.name);

      // Send initial stats
      const jobDef = this.playerStats.getJobDefinition();
      networkManager.sendStatsUpdate(
        this.playerStats.level,
        this.playerStats.getMaxHP(),
        jobDef.name
      );
    });

    networkManager.on('disconnected', () => {
      this.isMultiplayer = false;
      console.log('Disconnected from multiplayer server');
      this.showNotification('Disconnected from server');

      // Clean up remote players
      this.remotePlayers.forEach(rp => rp.destroy());
      this.remotePlayers.clear();
    });

    networkManager.on('connectionFailed', (error: Error) => {
      console.log('Failed to connect to server:', error);
      // Game can still be played offline
    });

    networkManager.on('playerJoined', (player: NetworkPlayer) => {
      console.log(`[GameScene] playerJoined event - player: ${player.name}, mapId: ${player.mapId}, currentMap: ${this.currentMap.id}`);
      if (player.mapId === this.currentMap.id) {
        console.log(`[GameScene] Adding remote player: ${player.name}`);
        this.addRemotePlayer(player);
      } else {
        console.log(`[GameScene] Skipping - different map (${player.mapId} vs ${this.currentMap.id})`);
      }
    });

    networkManager.on('playerUpdated', (player: NetworkPlayer) => {
      const remotePlayer = this.remotePlayers.get(player.id);
      if (remotePlayer) {
        if (player.mapId === this.currentMap.id) {
          remotePlayer.updateFromNetwork(player);
        } else {
          // Player changed maps, remove them
          remotePlayer.destroy();
          this.remotePlayers.delete(player.id);
        }
      } else if (player.mapId === this.currentMap.id) {
        // Player is on our map now, add them
        this.addRemotePlayer(player);
      }
    });

    networkManager.on('playerLeft', (player: NetworkPlayer) => {
      const remotePlayer = this.remotePlayers.get(player.id);
      if (remotePlayer) {
        remotePlayer.destroy();
        this.remotePlayers.delete(player.id);
      }
    });

    networkManager.on('playerAttack', (data: { playerId: string; skillId: string; x: number; y: number; facingRight: boolean }) => {
      const remotePlayer = this.remotePlayers.get(data.playerId);
      if (remotePlayer) {
        remotePlayer.showAttack(data.skillId);
      }
    });

    networkManager.on('playerJoinedNotification', (data: { playerName: string }) => {
      this.showNotification(`${data.playerName} joined the game`);
    });

    networkManager.on('playerLeftNotification', (data: { playerName: string }) => {
      this.showNotification(`${data.playerName} left the game`);
    });

    networkManager.on('chat', (message: { playerName: string; message: string }) => {
      this.showChatMessage(message.playerName, message.message);
    });

    // Monster sync events
    networkManager.on('monsterAdded', (data: NetworkMonster) => {
      console.log(`[Network] Monster added: ${data.id}, type: ${data.type}`);
      this.handleNetworkMonsterAdded(data);
    });

    networkManager.on('monsterUpdated', (data: NetworkMonster) => {
      this.handleNetworkMonsterUpdated(data);
    });

    networkManager.on('monsterRemoved', (data: NetworkMonster) => {
      console.log(`[Network] Monster removed: ${data.id}`);
      this.handleNetworkMonsterRemoved(data);
    });

    // Try to connect to server
    const playerName = `Player${Math.floor(Math.random() * 9999)}`;
    networkManager.connect(playerName, this.currentMap.id);
  }

  private addRemotePlayer(data: NetworkPlayer): void {
    if (this.remotePlayers.has(data.id)) {
      console.log(`[GameScene] Remote player already exists: ${data.name}`);
      return;
    }

    console.log(`[GameScene] Creating RemotePlayer: ${data.name} at (${data.x}, ${data.y})`);
    const remotePlayer = new RemotePlayer(this, data);
    this.remotePlayers.set(data.id, remotePlayer);
    console.log(`[GameScene] Added remote player: ${data.name}, total: ${this.remotePlayers.size}`);
  }

  private showNotification(message: string): void {
    const text = this.add.text(GAME_WIDTH / 2, 100, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(9000);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 80,
      duration: 2000,
      delay: 1000,
      onComplete: () => text.destroy(),
    });
  }

  private showChatMessage(playerName: string, message: string): void {
    // For now, just show as notification
    // Could implement a proper chat UI later
    this.showNotification(`${playerName}: ${message}`);
  }

  private handleNetworkMonsterAdded(data: NetworkMonster): void {
    // Check if we already have this monster
    const existingMonster = this.monsters.find(m => m.networkId === data.id);
    if (existingMonster) return;

    // If this is the first network monster, clear any locally spawned monsters
    // (they were created before we connected to the server)
    if (this.monsters.length > 0 && !this.monsters[0].networkId) {
      console.log('[GameScene] Clearing locally spawned monsters for server-synced monsters');
      this.clearMonsters();
    }

    // Create the monster using the type from server
    const definition = getMonsterDefinition(data.type);
    if (!definition) {
      console.warn(`Unknown monster type from server: ${data.type}`);
      return;
    }

    const monster = new Monster(
      this,
      data.x,
      data.y,
      data.type,
      definition
    );
    monster.networkId = data.id;
    monster.setTarget(this.player);
    monster.syncHP(data.hp);
    this.monsters.push(monster);

    // Add collision with platforms
    const collider = this.physics.add.collider(monster, this.platforms);
    this.monsterColliders.push(collider);

    // Register hurtbox with combat manager
    this.combatManager.registerHurtbox(monster.getHurtbox());
  }

  private clearMonsters(): void {
    // Clear all monster colliders
    for (const collider of this.monsterColliders) {
      collider.destroy();
    }
    this.monsterColliders = [];

    // Destroy all monsters
    for (const monster of this.monsters) {
      monster.destroy();
    }
    this.monsters = [];
  }

  private handleNetworkMonsterUpdated(data: NetworkMonster): void {
    const monster = this.monsters.find(m => m.networkId === data.id);
    if (monster) {
      // Sync HP from server
      monster.syncHP(data.hp);
    }
  }

  private handleNetworkMonsterRemoved(data: NetworkMonster): void {
    const monsterIndex = this.monsters.findIndex(m => m.networkId === data.id);
    if (monsterIndex !== -1) {
      const monster = this.monsters[monsterIndex];
      monster.destroy();
      this.monsters.splice(monsterIndex, 1);
    }
  }

  /**
   * Send local player state to server
   */
  private sendNetworkUpdate(): void {
    if (!this.isMultiplayer || !networkManager.isConnected) return;

    const now = Date.now();
    if (now - this.lastNetworkUpdate < this.networkUpdateInterval) return;
    this.lastNetworkUpdate = now;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    networkManager.sendPosition(
      this.player.x,
      this.player.y,
      body.velocity.x,
      body.velocity.y,
      this.player.currentState,
      this.player.facingRight,
      this.player.anims.currentAnim?.key?.replace('player-', '') || 'idle',
      this.player.isAttacking(),
      ''
    );
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
      // Update keyboard config with new level (may unlock new skills)
      if (this.keyboardConfigUI) {
        this.keyboardConfigUI.updateJobAndLevel(this.playerStats.job, data.newLevel);
      }
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
      playerJob: () => this.playerStats.job,
      getATK: () => {
        const baseATK = this.playerStats.getATK();
        const equipATK = this.equipment.getTotalStats().ATK || 0;
        const buffATK = this.skillManager.getBuffBonus('ATK');
        return baseATK + equipATK + buffATK;
      },
      getMATK: () => {
        const baseMATK = this.playerStats.getMATK();
        const equipMATK = this.equipment.getTotalStats().MATK || 0;
        const buffMATK = this.skillManager.getBuffBonus('MATK');
        return baseMATK + equipMATK + buffMATK;
      }
    });

    // Initialize skill effects
    this.skillEffects = new SkillEffects(this);

    // Assign default skills to hotbar (beginner skills)
    const doubleStrike = getSkill('DOUBLE_STRIKE');
    const threeSnails = getSkill('THREE_SNAILS');
    const recovery = getSkill('RECOVERY');

    if (doubleStrike) this.skillBar.assignSkill(0, doubleStrike);
    if (threeSnails) this.skillBar.assignSkill(1, threeSnails);
    if (recovery) this.skillBar.assignSkill(2, recovery);

    // Set cooldown callbacks
    this.skillBar.setCooldownCallback((skillId: string) => {
      const skill = getSkill(skillId);
      if (!skill) return 0;
      return this.skillManager.getCooldownPercent(skillId, skill.cooldown);
    });
    this.skillBar.setCooldownRemainingCallback((skillId: string) => {
      return this.skillManager.getCooldownRemaining(skillId);
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

      // Handle mobility skills (teleport)
      if (data.skill.type === 'mobility' && data.skill.id === 'TELEPORT') {
        const teleportDistance = 150;
        const facingRight = !this.player.flipX;
        const direction = facingRight ? 1 : -1;
        const newX = this.player.x + (teleportDistance * direction);

        // Clamp to map bounds (using GAME_WIDTH since maps are currently screen-sized)
        const minX = 50;
        const maxX = GAME_WIDTH - 50;
        const clampedX = Phaser.Math.Clamp(newX, minX, maxX);

        this.player.setPosition(clampedX, this.player.y);
      }

      // Update MP bar
      this.events.emit('player:mp-changed', {
        current: this.playerStats.currentMP,
        max: this.playerStats.getMaxMP()
      });
    });

    // Listen for buff events
    this.skillManager.on('buff:applied', (buff: { skillId: string; stat: string; value: number; endTime: number }) => {
      this.buffIndicatorUI.addBuff(buff);
    });

    this.skillManager.on('buff:expired', (buff: { skillId: string }) => {
      this.buffIndicatorUI.removeBuff(buff.skillId);
    });

    // Set up skill hotkeys based on current bindings
    this.rebindSkillKeys();

    // K key to open skill config (slot-based)
    this.input.keyboard?.on('keydown-K', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) return;
      if (this.keyboardConfigUI.isOpen) return;
      this.skillConfigUI.toggle();
    });

    // F3 key to toggle debug info (hardcoded, not configurable)
    this.input.keyboard?.on('keydown-F3', () => {
      if (this.chatUI.isOpen) return;
      this.debugVisible = !this.debugVisible;
      this.debugText.setVisible(this.debugVisible);
    });

    // Apply initial action bindings to player
    // Note: M (World Map) and ESC (Menu) are now configurable via action bindings
    this.applyActionBindings();
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
        'Enter': 'ENTER',
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
      // Handle chat input first (if open, consume all keys)
      if (this.chatUI.isOpen) {
        this.chatUI.handleKeyDown(event);
        event.preventDefault();
        return;
      }

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
      case 'STATS':
        if (!this.dialogueBox.isOpen && !this.keyboardConfigUI.isOpen) {
          this.statsUI.toggle();
        }
        break;
      case 'SKILL_TREE':
        if (!this.dialogueBox.isOpen && !this.keyboardConfigUI.isOpen) {
          this.skillTreeUI.toggle();
        }
        break;
      case 'PICKUP':
        this.tryPickupItems();
        break;
      case 'SAVE':
        this.saveGame();
        break;
      case 'WORLD_MAP':
        if (!this.dialogueBox.isOpen && !this.keyboardConfigUI.isOpen) {
          this.worldMapUI.toggle();
        }
        break;
      case 'MINIMAP':
        this.toggleMinimap();
        break;
      case 'MENU':
        this.handleMenuAction();
        break;
      case 'CHAT':
        if (!this.dialogueBox.isOpen && !this.keyboardConfigUI.isOpen) {
          this.chatUI.open();
          this.player.inputEnabled = false;
        }
        break;
      // JUMP and ATTACK are handled directly by the Player class
    }
  }

  private handleMenuAction(): void {
    // Close any open menus in order of priority, or open keyboard config
    if (this.chatUI.isOpen) {
      this.chatUI.close();
      this.player.inputEnabled = true;
      return;
    }
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
    if (this.worldMapUI.isOpen) {
      this.worldMapUI.close();
      return;
    }
    if (this.skillTreeUI.isOpen) {
      this.skillTreeUI.hide();
      return;
    }
    if (this.statsUI.isOpen) {
      this.statsUI.hide();
      return;
    }
    if (this.keyboardConfigUI.isOpen) {
      this.keyboardConfigUI.close();
      this.skillBar.setVisible(true);
    } else {
      this.keyboardConfigUI.open();
      this.skillBar.setVisible(false);
    }
  }

  private toggleMinimap(): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.toggleMinimap();
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
    // If we're connecting to multiplayer, skip local monster creation
    // Server will send monsters via network events
    if (this.isMultiplayer) {
      console.log('[GameScene] Skipping local monster spawn - using server monsters');
      return;
    }

    // Create monsters from map data (offline mode)
    for (const monsterData of this.currentMap.monsters) {
      const definition = getMonsterDefinition(monsterData.monsterId);
      if (!definition) continue;

      const monster = new Monster(
        this,
        monsterData.x,
        monsterData.y,
        monsterData.monsterId,
        definition
      );
      monster.setTarget(this.player);
      this.monsters.push(monster);

      // Add collision with platforms - store reference for cleanup
      const collider = this.physics.add.collider(monster, this.platforms);
      this.monsterColliders.push(collider);

      // Register hurtbox with combat manager
      this.combatManager.registerHurtbox(monster.getHurtbox());
    }
  }

  private onCombatHit(data: { damage: number; x: number; y: number; isCritical: boolean }): void {
    // Show damage number
    this.effectsManager.showDamage(data.x, data.y - 20, data.damage, data.isCritical);

    // Show hit effect
    this.effectsManager.showHitEffect(data.x, data.y, HitEffectType.PHYSICAL);
  }

  private onMonsterDamaged(data: { monster: Monster; damage: number; x: number; y: number; isCritical?: boolean }): void {
    // Additional effects for monster damage
    this.cameras.main.shake(50, 0.002);

    // Send damage to server for sync
    if (this.isMultiplayer && networkManager.isConnected && data.monster.networkId) {
      networkManager.sendMonsterDamage(
        data.monster.networkId,
        data.damage,
        data.isCritical || false
      );
    }
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
      // Auto-save on level up
      this.autoSave();
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
    this.buffIndicatorUI.update();

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

    // Update minimap (every few frames to reduce overhead)
    if (time % 100 < delta) {
      this.updateMinimap();
    }

    // Update remote players
    this.remotePlayers.forEach(rp => {
      rp.update(time, delta);
    });

    // Send network update
    this.sendNetworkUpdate();
  }

  private updateMinimap(): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (!uiScene) return;

    // Update player position
    uiScene.updateMinimapPlayer(this.player.x, this.player.y);

    // Update monster positions (only alive monsters)
    const monsterPositions = this.monsters
      .filter(m => !m['isDead'])
      .map(m => ({ x: m.x, y: m.y }));
    uiScene.updateMinimapMonsters(monsterPositions);
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

    // Create platforms from map data
    for (const platformData of this.currentMap.platforms) {
      const textureKey = platformData.type === 'ground' ? 'ground' : 'platform';
      const platform = this.platforms.create(platformData.x, platformData.y, textureKey) as Phaser.Physics.Arcade.Sprite;
      if (platformData.scale) {
        platform.setScale(platformData.scale).refreshBody();
      }
    }
  }

  private createLadders(): void {
    // Create ladders from map data
    for (const ladderData of this.currentMap.ladders) {
      this.ladders.push(new Ladder({
        scene: this,
        x: ladderData.x,
        y: ladderData.y,
        height: ladderData.height,
        type: ladderData.type,
      }));
    }
  }

  private createPortals(): void {
    // Create portals from map data
    for (const portalData of this.currentMap.portals) {
      const portal = new Portal({
        scene: this,
        x: portalData.x,
        y: portalData.y,
        width: portalData.width,
        height: portalData.height,
        targetMap: portalData.targetMap,
        targetX: portalData.targetX,
        targetY: portalData.targetY,
      });
      this.portals.push(portal);
    }
  }

  private createNPCs(): void {
    // Create NPCs from map data
    for (const npcData of this.currentMap.npcs) {
      const npc = new NPC({
        scene: this,
        x: npcData.x,
        y: npcData.y,
        name: npcData.name,
        dialogueKey: npcData.dialogueKey,
      });
      this.npcs.push(npc);
    }
  }

  private setupLadderOverlaps(): void {
    this.ladders.forEach(ladder => {
      const overlap = this.physics.add.overlap(
        this.player,
        ladder,
        () => this.player.addNearbyLadder(ladder),
        undefined,
        this
      );
      this.ladderOverlaps.push(overlap);
    });
  }

  /**
   * Load a new map, cleaning up the old one first
   */
  private loadMap(mapId: string, spawnX: number, spawnY: number): void {
    const newMap = getMap(mapId);
    if (!newMap) {
      console.error(`Map not found: ${mapId}`);
      return;
    }

    // === CLEANUP PHASE ===
    // Order matters: destroy colliders FIRST, then game objects

    // 1. Destroy all colliders/overlaps that reference map objects
    this.playerPlatformCollider.destroy();

    this.monsterColliders.forEach(c => c.destroy());
    this.monsterColliders = [];

    this.ladderOverlaps.forEach(o => o.destroy());
    this.ladderOverlaps = [];

    // 2. Clear player's nearby ladders reference
    this.player.clearNearbyLadders();

    // 3. Destroy all map game objects
    this.monsters.forEach(m => m.destroy());
    this.monsters = [];

    this.ladders.forEach(l => l.destroy());
    this.ladders = [];

    this.portals.forEach(p => p.destroy());
    this.portals = [];

    this.npcs.forEach(n => n.destroy());
    this.npcs = [];

    this.droppedItems.forEach(d => d.destroy());
    this.droppedItems = [];

    // 4. Clear platforms group
    this.platforms.clear(true, true);

    // 5. Clear combat tracking
    this.hitMonstersThisAttack.clear();
    this.hitMonstersThisSkill.clear();
    this.nearbyNPC = null;
    this.nearbyPortal = null;

    // === LOAD PHASE ===
    this.currentMap = newMap;

    // Recreate background for new theme
    this.createBackground();

    // Recreate map elements
    this.createPlatforms();
    this.createLadders();
    this.createMonsters();
    this.createPortals();
    this.createNPCs();

    // Re-setup colliders
    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms);
    this.setupLadderOverlaps();

    // Move player to spawn position
    this.player.setPosition(spawnX, spawnY);
    this.player.setVelocity(0, 0);

    // Update UI
    this.events.emit('map:changed', { mapName: newMap.name, isSafeZone: newMap.isSafeZone });
    this.worldMapUI.setCurrentMap(mapId);

    // Update minimap with new map data
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.setMapData(newMap);
    }

    console.log(`Loaded map: ${newMap.name} (${newMap.backgroundTheme}${newMap.isSafeZone ? ', safe zone' : ''})`);
  }

  /**
   * Create the transition overlay for smooth map changes
   */
  private createTransitionOverlay(): void {
    this.transitionOverlay = this.add.graphics();
    this.transitionOverlay.setDepth(10000); // Above everything
    this.transitionOverlay.setScrollFactor(0); // Fixed to camera
    this.transitionOverlay.setAlpha(0);
    this.transitionOverlay.fillStyle(0x000000, 1);
    this.transitionOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  /**
   * Transition to a new map with fade effect
   */
  private transitionToMap(mapId: string, spawnX: number, spawnY: number): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Disable player input during transition
    this.player.setVelocity(0, 0);

    // Fade out
    this.tweens.add({
      targets: this.transitionOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Load the new map while screen is black
        this.loadMap(mapId, spawnX, spawnY);

        // Send map change to server
        if (this.isMultiplayer) {
          networkManager.sendMapChange(mapId, spawnX, spawnY);

          // Clear remote players from old map
          this.remotePlayers.forEach(rp => rp.destroy());
          this.remotePlayers.clear();
        }

        // Short pause at full black
        this.time.delayedCall(150, () => {
          // Fade in
          this.tweens.add({
            targets: this.transitionOverlay,
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.isTransitioning = false;
            }
          });
        });
      }
    });
  }

  private setupInteractionKeys(): void {
    // NPC interaction is now handled via action bindings

    // Keyboard config hotkey (backslash key)
    this.input.keyboard?.on('keydown-BACK_SLASH', () => {
      if (this.chatUI.isOpen) return;
      if (!this.dialogueBox.isOpen) {
        this.keyboardConfigUI.toggle();
      }
    });

    // Portal interaction key (UP arrow when near portal)
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) return;

      if (this.nearbyPortal && this.nearbyPortal.isActive) {
        this.usePortal(this.nearbyPortal);
      }
    });

    // Dialogue controls (these still work when chat is open since dialogue takes priority)
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('SPACE');
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('ENTER');
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      // ESC can close chat
      if (this.chatUI.isOpen) {
        this.chatUI.close();
        this.player.inputEnabled = true;
        return;
      }
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('ESC');
      }
    });

    // Arrow keys for dialogue choice selection
    this.input.keyboard?.on('keydown-UP', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('UP');
      }
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.chatUI.isOpen) return;
      if (this.dialogueBox.isOpen) {
        this.dialogueBox.handleInput('DOWN');
      }
    });
  }

  private usePortal(portal: Portal): void {
    console.log(`Using portal to ${portal.targetMap} at (${portal.targetX}, ${portal.targetY})`);

    // Check if target map exists
    const targetMap = getMap(portal.targetMap);
    if (!targetMap) {
      console.error(`Target map not found: ${portal.targetMap}`);
      return;
    }

    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    // Load the new map after flash starts
    this.time.delayedCall(150, () => {
      this.loadMap(portal.targetMap, portal.targetX, portal.targetY);
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
    // Clear existing background objects
    this.backgroundObjects.forEach(obj => obj.destroy());
    this.backgroundObjects = [];

    // Remove old sky texture if it exists
    if (this.textures.exists('sky-bg')) {
      this.textures.remove('sky-bg');
    }

    const theme = this.currentMap.backgroundTheme;
    this.createThemedBackground(theme);
  }

  private createThemedBackground(theme: BackgroundTheme): void {
    const skyCanvas = this.textures.createCanvas('sky-bg', GAME_WIDTH, GAME_HEIGHT);
    if (!skyCanvas) return;

    const ctx = skyCanvas.context;

    switch (theme) {
      case 'field':
        this.drawFieldSky(ctx);
        break;
      case 'town':
        this.drawTownSky(ctx);
        break;
      case 'forest':
        this.drawForestSky(ctx);
        break;
      case 'dungeon':
        this.drawDungeonSky(ctx);
        break;
      case 'night':
        this.drawNightSky(ctx);
        break;
      default:
        this.drawFieldSky(ctx);
    }

    skyCanvas.refresh();

    const sky = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky-bg');
    sky.setDepth(-100);
    this.backgroundObjects.push(sky);

    // Add theme-specific decorations
    switch (theme) {
      case 'field':
        this.createFieldDecorations();
        break;
      case 'town':
        this.createTownDecorations();
        break;
      case 'forest':
        this.createForestDecorations();
        break;
      case 'dungeon':
        this.createDungeonDecorations();
        break;
      case 'night':
        this.createNightDecorations();
        break;
    }
  }

  private drawFieldSky(ctx: CanvasRenderingContext2D): void {
    // Sunset/dawn gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.3, '#16213e');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.7, '#e94560');
    gradient.addColorStop(0.85, '#ff9a3c');
    gradient.addColorStop(1, '#ffd93d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars at top
    this.drawStars(ctx, 50, 0.4);
  }

  private drawTownSky(ctx: CanvasRenderingContext2D): void {
    // Bright daytime sky
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#4a90d9');
    gradient.addColorStop(0.4, '#87ceeb');
    gradient.addColorStop(0.7, '#b0e0e6');
    gradient.addColorStop(1, '#f0f8ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawForestSky(ctx: CanvasRenderingContext2D): void {
    // Green-tinted misty forest sky
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#2d5a3d');
    gradient.addColorStop(0.3, '#3d7a5a');
    gradient.addColorStop(0.6, '#6aaa7a');
    gradient.addColorStop(0.8, '#8fbc8f');
    gradient.addColorStop(1, '#90ee90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Add fog/mist effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = GAME_HEIGHT * 0.5 + Math.random() * GAME_HEIGHT * 0.5;
      const width = 100 + Math.random() * 200;
      const height = 30 + Math.random() * 50;
      ctx.beginPath();
      ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawDungeonSky(ctx: CanvasRenderingContext2D): void {
    // Dark stone dungeon
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(0.5, '#2d2d2d');
    gradient.addColorStop(1, '#3d3d3d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Add stone texture effect
    ctx.fillStyle = 'rgba(80, 80, 80, 0.3)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 2 + Math.random() * 4;
      ctx.fillRect(x, y, size, size);
    }
  }

  private drawNightSky(ctx: CanvasRenderingContext2D): void {
    // Deep night sky
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a15');
    gradient.addColorStop(0.3, '#0f0f25');
    gradient.addColorStop(0.6, '#151530');
    gradient.addColorStop(1, '#1a1a40');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Many stars
    this.drawStars(ctx, 150, 0.8);

    // Moon
    ctx.fillStyle = '#fffacd';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 150, 100, 50, 0, Math.PI * 2);
    ctx.fill();

    // Moon glow
    const moonGlow = ctx.createRadialGradient(GAME_WIDTH - 150, 100, 50, GAME_WIDTH - 150, 100, 120);
    moonGlow.addColorStop(0, 'rgba(255, 250, 205, 0.3)');
    moonGlow.addColorStop(1, 'rgba(255, 250, 205, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 150, 100, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStars(ctx: CanvasRenderingContext2D, count: number, maxHeight: number): void {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * (GAME_HEIGHT * maxHeight);
      const size = Math.random() * 2 + 1;
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private createFieldDecorations(): void {
    // Mountains
    this.backgroundObjects.push(this.createMountainLayer(-80, 0x2d3436, 0.8));
    this.backgroundObjects.push(this.createMountainLayer(-60, 0x636e72, 0.6));
    this.backgroundObjects.push(this.createHillLayer(-40, 0x74b9ff, 0.4));
    this.createCloudLayer();
    this.createTreeLayer();
  }

  private createTownDecorations(): void {
    // Buildings in background
    this.createTownBuildings();
    this.createCloudLayer();

    // Decorative flowers/grass
    const grassGraphics = this.add.graphics();
    grassGraphics.setDepth(-15);
    grassGraphics.fillStyle(0x90ee90, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      const height = 10 + Math.random() * 15;
      grassGraphics.fillRect(x, GAME_HEIGHT - 65 - height, 3, height);
    }
    this.backgroundObjects.push(grassGraphics);
  }

  private createForestDecorations(): void {
    // Dense tree layers
    this.backgroundObjects.push(this.createMountainLayer(-80, 0x1a4d2e, 0.9));
    this.backgroundObjects.push(this.createHillLayer(-60, 0x228b22, 0.7));

    // Tree silhouettes
    const treeGraphics = this.add.graphics();
    treeGraphics.setDepth(-30);
    this.backgroundObjects.push(treeGraphics);

    for (let i = 0; i < 15; i++) {
      const x = Math.random() * GAME_WIDTH;
      const height = 150 + Math.random() * 200;
      const width = 60 + Math.random() * 80;

      treeGraphics.fillStyle(0x1a4d2e, 0.6);
      // Tree trunk
      treeGraphics.fillRect(x - 10, GAME_HEIGHT - 60 - height * 0.3, 20, height * 0.3);
      // Tree foliage (triangle)
      treeGraphics.fillTriangle(
        x, GAME_HEIGHT - 60 - height,
        x - width / 2, GAME_HEIGHT - 60 - height * 0.3,
        x + width / 2, GAME_HEIGHT - 60 - height * 0.3
      );
    }

    // Vines hanging from top
    const vineGraphics = this.add.graphics();
    vineGraphics.setDepth(-10);
    vineGraphics.lineStyle(3, 0x228b22, 0.7);
    this.backgroundObjects.push(vineGraphics);

    for (let i = 0; i < 10; i++) {
      const x = Math.random() * GAME_WIDTH;
      const length = 50 + Math.random() * 150;
      vineGraphics.beginPath();
      vineGraphics.moveTo(x, 0);
      vineGraphics.lineTo(x + Math.sin(length * 0.1) * 20, length);
      vineGraphics.strokePath();
    }
  }

  private createDungeonDecorations(): void {
    // Stone pillars
    const pillarGraphics = this.add.graphics();
    pillarGraphics.setDepth(-30);
    this.backgroundObjects.push(pillarGraphics);

    const pillarPositions = [100, 300, 500, 700, 900, 1100];
    pillarPositions.forEach(x => {
      pillarGraphics.fillStyle(0x4a4a4a, 0.8);
      pillarGraphics.fillRect(x - 20, 50, 40, GAME_HEIGHT - 110);

      // Pillar top
      pillarGraphics.fillStyle(0x5a5a5a, 0.8);
      pillarGraphics.fillRect(x - 25, 40, 50, 20);

      // Cracks
      pillarGraphics.lineStyle(2, 0x3a3a3a, 0.6);
      pillarGraphics.beginPath();
      pillarGraphics.moveTo(x - 5, 100);
      pillarGraphics.lineTo(x + 10, 200);
      pillarGraphics.lineTo(x - 5, 300);
      pillarGraphics.strokePath();
    });

    // Torches (with animated glow)
    [200, 600, 1000].forEach(x => {
      const torch = this.add.graphics();
      torch.setDepth(-20);
      this.backgroundObjects.push(torch);

      // Torch holder
      torch.fillStyle(0x5a5a5a, 1);
      torch.fillRect(x - 5, 150, 10, 30);

      // Flame (orange glow)
      torch.fillStyle(0xff6600, 0.8);
      torch.fillCircle(x, 140, 12);
      torch.fillStyle(0xffcc00, 0.6);
      torch.fillCircle(x, 135, 8);

      // Animate flame
      this.tweens.add({
        targets: torch,
        alpha: { from: 0.7, to: 1 },
        duration: 200 + Math.random() * 200,
        yoyo: true,
        repeat: -1
      });
    });
  }

  private createNightDecorations(): void {
    // Similar to dungeon but with some distant lights
    this.createDungeonDecorations();

    // Glowing particles (fireflies or magic)
    for (let i = 0; i < 20; i++) {
      const particle = this.add.graphics();
      particle.setDepth(-5);
      this.backgroundObjects.push(particle);

      const x = Math.random() * GAME_WIDTH;
      const y = 100 + Math.random() * (GAME_HEIGHT - 200);

      particle.fillStyle(0x88ffff, 0.8);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);

      // Float animation
      this.tweens.add({
        targets: particle,
        y: y - 20 - Math.random() * 30,
        x: x + (Math.random() - 0.5) * 40,
        alpha: { from: 0.3, to: 0.9 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createTownBuildings(): void {
    const buildingGraphics = this.add.graphics();
    buildingGraphics.setDepth(-40);
    this.backgroundObjects.push(buildingGraphics);

    // Background buildings (shops, houses)
    const buildings = [
      { x: 100, width: 120, height: 180, color: 0x8b4513 },
      { x: 280, width: 100, height: 150, color: 0xa0522d },
      { x: 450, width: 150, height: 200, color: 0xcd853f },
      { x: 680, width: 130, height: 170, color: 0x8b4513 },
      { x: 880, width: 110, height: 160, color: 0xa0522d },
      { x: 1050, width: 140, height: 190, color: 0xcd853f },
    ];

    buildings.forEach(b => {
      const baseY = GAME_HEIGHT - 60;

      // Building body
      buildingGraphics.fillStyle(b.color, 0.7);
      buildingGraphics.fillRect(b.x, baseY - b.height, b.width, b.height);

      // Roof
      buildingGraphics.fillStyle(0x654321, 0.8);
      buildingGraphics.fillTriangle(
        b.x - 10, baseY - b.height,
        b.x + b.width / 2, baseY - b.height - 40,
        b.x + b.width + 10, baseY - b.height
      );

      // Window
      buildingGraphics.fillStyle(0xffff99, 0.6);
      buildingGraphics.fillRect(b.x + b.width / 2 - 15, baseY - b.height + 30, 30, 30);

      // Door
      buildingGraphics.fillStyle(0x4a3728, 0.8);
      buildingGraphics.fillRect(b.x + b.width / 2 - 12, baseY - 50, 24, 50);
    });
  }

  private createMountainLayer(depth: number, color: number, heightMultiplier: number): Phaser.GameObjects.Graphics {
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

    return graphics;
  }

  private createHillLayer(depth: number, color: number, heightMultiplier: number): Phaser.GameObjects.Graphics {
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

    return graphics;
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
      this.backgroundObjects.push(cloudContainer);

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
      this.backgroundObjects.push(graphics);

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
   * Handle job advancement when player confirms a job choice
   */
  private handleJobAdvancement(dialogueKey: string): void {
    // Map dialogue keys to job IDs
    const jobMap: Record<string, JobId> = {
      'job_confirm_warrior': JobId.WARRIOR,
      'job_confirm_mage': JobId.MAGE,
      'job_confirm_archer': JobId.ARCHER,
      'job_confirm_thief': JobId.THIEF
    };

    const targetJob = jobMap[dialogueKey];
    if (!targetJob) return;

    // Check if player can advance
    if (!this.playerStats.canAdvanceToJob(targetJob)) {
      const dialogue = getDialogue('job_level_required');
      if (dialogue) {
        this.dialogueBox.openDialogue(dialogue);
      }
      return;
    }

    // Advance to the job
    this.playerStats.setJob(targetJob);

    // Show confirmation dialogue
    const dialogue = getDialogue(dialogueKey);
    if (dialogue) {
      this.dialogueBox.openDialogue(dialogue);
    }

    // Show job advancement effect
    this.showJobAdvancementEffect(targetJob);

    // Update skill bindings for new job
    this.updateSkillsForJob(targetJob);

    // Emit event for UI updates
    this.events.emit('job:changed', { job: targetJob });
  }

  private showJobAdvancementEffect(jobId: JobId): void {
    const jobDef = getJob(jobId);

    // Create flashy effect
    const flash = this.add.graphics();
    flash.fillStyle(jobDef.color, 0.5);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    flash.setDepth(1000);

    // Flash and fade
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      onComplete: () => flash.destroy()
    });

    // Show floating text
    const text = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 50,
      `Job Advanced!\n${jobDef.name}`,
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    text.setOrigin(0.5);
    text.setDepth(1001);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  private updateSkillsForJob(jobId: JobId): void {
    // Update keyboard config UI with new job and level
    this.keyboardConfigUI.updateJobAndLevel(jobId, this.playerStats.level);

    // Update skill config UI with new job and level
    this.skillConfigUI.setJobAndLevel(jobId, this.playerStats.level);

    // Get skills available for this job
    const jobSkills = getSkillsForJobAndLevel(jobId, this.playerStats.level);

    // Update keyboard config UI with new job skills
    const skillBindings = new Map<string, SkillDefinition>();
    const keys = ['A', 'S', 'D', 'F', 'G'];

    jobSkills.slice(0, 5).forEach((skill, index) => {
      if (keys[index]) {
        skillBindings.set(keys[index], skill);
      }
    });

    // Keep existing action bindings
    const actionBindings = this.keyboardConfigUI.getActionBindings();

    // Apply new skill bindings
    this.keyboardConfigUI.setInitialBindings(skillBindings, actionBindings);

    // Rebind skill keys
    this.rebindSkillKeys();
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

  // ============================================
  // Save/Load System
  // ============================================

  /**
   * Save the current game state
   */
  private async saveGame(): Promise<void> {
    // Build keyboard bindings save data
    const skillBindings = this.keyboardConfigUI.getSkillBindings();
    const actionBindings = this.keyboardConfigUI.getActionBindings();
    const keyBindingsSave: { skills: Record<string, string>; actions: Record<string, string> } = {
      skills: {},
      actions: {}
    };
    skillBindings.forEach((skill, key) => {
      keyBindingsSave.skills[key] = skill.id;
    });
    actionBindings.forEach((action, key) => {
      keyBindingsSave.actions[key] = action.id;
    });

    // Get menu states from UI scene
    const uiScene = this.scene.get('UIScene') as UIScene;
    const minimapVisible = uiScene?.isMinimapVisible() ?? true;
    const skillBarVisible = this.skillBar?.visible ?? true;

    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      character: this.playerStats.toJSON(),
      inventory: this.inventory.toJSON(),
      equipment: this.equipment.toJSON(),
      keyBindings: keyBindingsSave,
      mapState: {
        mapId: this.currentMap.id,
        playerX: this.player.x,
        playerY: this.player.y
      },
      menuState: {
        minimapVisible,
        skillBarVisible
      }
    };

    const result = await defaultSaveManager.save(saveData);

    if (result.success) {
      this.showSaveMessage('Game saved!', true);
    } else {
      this.showSaveMessage(`Save failed: ${result.error}`, false);
    }
  }

  /**
   * Load game state from storage
   * @returns true if game was loaded, false if no save exists
   */
  private async loadGame(): Promise<boolean> {
    const result = await defaultSaveManager.load();

    if (!result.success || !result.data) {
      console.log('No save data found, starting fresh');
      return false;
    }

    const data = result.data;

    // Load character stats
    this.playerStats.loadFromData(data.character);

    // Load inventory
    this.inventory.loadFromData(data.inventory, (id: string) => getItem(id));

    // Load equipment
    this.equipment.loadFromData(data.equipment, (id: string) => {
      const item = getItem(id);
      if (item && item.type === ItemType.EQUIP) {
        return item as EquipItem;
      }
      return null;
    });

    // Load map state
    if (data.mapState) {
      const targetMap = getMap(data.mapState.mapId);
      if (targetMap && data.mapState.mapId !== this.currentMap.id) {
        // Load the saved map
        this.loadMap(data.mapState.mapId, data.mapState.playerX, data.mapState.playerY);
      } else if (targetMap) {
        // Same map, just move player to saved position
        this.player.setPosition(data.mapState.playerX, data.mapState.playerY);
      }
    }

    // Load keyboard bindings
    if (data.keyBindings) {
      const loadedSkillBindings = new Map<string, SkillDefinition>();
      const loadedActionBindings = new Map<string, ActionDefinition>();

      // Load skill bindings
      for (const [key, skillId] of Object.entries(data.keyBindings.skills)) {
        const skill = getSkill(skillId);
        if (skill) {
          loadedSkillBindings.set(key, skill);
        }
      }

      // Load action bindings
      for (const [key, actionId] of Object.entries(data.keyBindings.actions)) {
        const action = ACTIONS[actionId];
        if (action) {
          loadedActionBindings.set(key, action);
        }
      }

      // Apply the loaded bindings
      this.keyboardConfigUI.setInitialBindings(loadedSkillBindings, loadedActionBindings);
      this.actionBindings = loadedActionBindings;
      this.applyActionBindings();
      this.rebindSkillKeys();
    }

    // Load menu states
    if (data.menuState) {
      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.setMinimapVisible(data.menuState.minimapVisible);
      }
      if (this.skillBar) {
        this.skillBar.setVisible(data.menuState.skillBarVisible);
      }
    }

    console.log('Game loaded successfully');
    return true;
  }

  /**
   * Auto-save silently (no visual feedback unless error)
   */
  private async autoSave(): Promise<void> {
    // Build keyboard bindings save data
    const skillBindings = this.keyboardConfigUI.getSkillBindings();
    const actionBindings = this.keyboardConfigUI.getActionBindings();
    const keyBindingsSave: { skills: Record<string, string>; actions: Record<string, string> } = {
      skills: {},
      actions: {}
    };
    skillBindings.forEach((skill, key) => {
      keyBindingsSave.skills[key] = skill.id;
    });
    actionBindings.forEach((action, key) => {
      keyBindingsSave.actions[key] = action.id;
    });

    // Get menu states from UI scene
    const uiScene = this.scene.get('UIScene') as UIScene;
    const minimapVisible = uiScene?.isMinimapVisible() ?? true;
    const skillBarVisible = this.skillBar?.visible ?? true;

    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      character: this.playerStats.toJSON(),
      inventory: this.inventory.toJSON(),
      equipment: this.equipment.toJSON(),
      keyBindings: keyBindingsSave,
      mapState: {
        mapId: this.currentMap.id,
        playerX: this.player.x,
        playerY: this.player.y
      },
      menuState: {
        minimapVisible,
        skillBarVisible
      }
    };

    const result = await defaultSaveManager.save(saveData);

    if (!result.success) {
      console.error('Auto-save failed:', result.error);
    } else {
      console.log('Auto-saved');
    }
  }

  private showSaveMessage(message: string, success: boolean): void {
    const text = this.add.text(GAME_WIDTH / 2, 100, message, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: success ? '#88ff88' : '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setDepth(200);

    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }
}
