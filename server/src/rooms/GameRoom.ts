import { Room, Client } from 'colyseus';
import { GameRoomState, Player, Monster } from '../schemas/GameState';

interface PlayerInput {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  state: string;
  facingRight: boolean;
  animation: string;
  isAttacking: boolean;
  activeSkill: string;
}

interface JoinOptions {
  name?: string;
  mapId?: string;
}

// Monster spawn configuration (mirrors client-side MapData)
interface MonsterSpawnConfig {
  x: number;
  y: number;
  monsterId: string;
  maxHp: number;
  respawnTime: number;
}

// Game constants (must match client)
const GAME_HEIGHT = 720;

// Map spawn positions (must match client MapData)
// GAME_HEIGHT = 720, so y = 720 - 96 = 624
const MAP_SPAWNS: Record<string, { x: number; y: number }> = {
  henesys_town: { x: 640, y: 624 },
  henesys_field: { x: 100, y: 624 },
  hunting_ground_1: { x: 100, y: 624 },
  hunting_ground_2: { x: 1180, y: 624 },
};

// Map configurations with monster spawns
const MAP_MONSTERS: Record<string, MonsterSpawnConfig[]> = {
  henesys_field: [
    { x: 400, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 650, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 900, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
  ],
  hunting_ground_1: [
    { x: 400, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 650, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 900, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
    { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SLIME', maxHp: 50, respawnTime: 5000 },
  ],
  hunting_ground_2: [
    { x: 300, y: GAME_HEIGHT - 100, monsterId: 'SNAIL', maxHp: 30, respawnTime: 4000 },
    { x: 600, y: GAME_HEIGHT - 100, monsterId: 'SNAIL', maxHp: 30, respawnTime: 4000 },
    { x: 1100, y: GAME_HEIGHT - 100, monsterId: 'SNAIL', maxHp: 30, respawnTime: 4000 },
  ],
};

export class GameRoom extends Room<GameRoomState> {
  maxClients = 50;
  private tickRate = 20; // 20 updates per second
  private monsterIdCounter = 0;
  private monsterSpawnConfigs: Map<string, MonsterSpawnConfig> = new Map(); // Track spawn points for respawn

  onCreate(options: any) {
    console.log('GameRoom created!', options);

    this.setState(new GameRoomState());
    this.state.mapId = options.mapId || 'henesys_field';

    // Spawn initial monsters for this map
    this.spawnMonstersForMap(this.state.mapId);

    // Set up game loop
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / this.tickRate);

    // Handle player movement messages
    this.onMessage('move', (client, data: PlayerInput) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.velocityX = data.velocityX;
        player.velocityY = data.velocityY;
        player.state = data.state;
        player.facingRight = data.facingRight;
        player.animation = data.animation;
        player.isAttacking = data.isAttacking;
        player.activeSkill = data.activeSkill;
      }
    });

    // Handle attack messages
    this.onMessage('attack', (client, data: { skillId: string; x: number; y: number; facingRight: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isAttacking = true;
        player.activeSkill = data.skillId;
        player.facingRight = data.facingRight;

        // Broadcast attack to other players
        this.broadcast('playerAttack', {
          playerId: client.sessionId,
          skillId: data.skillId,
          x: data.x,
          y: data.y,
          facingRight: data.facingRight,
        }, { except: client });
      }
    });

    // Handle damage to monsters
    this.onMessage('damageMonster', (client, data: { monsterId: string; damage: number; isCritical: boolean }) => {
      const monster = this.state.monsters.get(data.monsterId);
      if (monster && monster.hp > 0) {
        monster.hp -= data.damage;

        // Broadcast damage event
        this.broadcast('monsterDamaged', {
          monsterId: data.monsterId,
          damage: data.damage,
          isCritical: data.isCritical,
          currentHp: monster.hp,
          x: monster.x,
          y: monster.y,
          attackerId: client.sessionId,
        });

        if (monster.hp <= 0) {
          const spawnConfig = this.monsterSpawnConfigs.get(data.monsterId);

          this.broadcast('monsterDeath', {
            monsterId: data.monsterId,
            monsterType: monster.type,
            x: monster.x,
            y: monster.y,
            killerId: client.sessionId,
          });

          // Remove monster after death animation
          this.clock.setTimeout(() => {
            this.state.monsters.delete(data.monsterId);
          }, 1000);

          // Schedule respawn if we have spawn config
          if (spawnConfig) {
            this.clock.setTimeout(() => {
              this.spawnMonster(spawnConfig, data.monsterId);
            }, spawnConfig.respawnTime);
          }
        }
      }
    });

    // Handle player taking damage
    this.onMessage('playerDamaged', (client, data: { damage: number; currentHP: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.currentHP = data.currentHP;

        // Broadcast to other players
        this.broadcast('playerHit', {
          playerId: client.sessionId,
          damage: data.damage,
          currentHP: data.currentHP,
          x: player.x,
          y: player.y,
        }, { except: client });
      }
    });

    // Handle chat messages
    this.onMessage('chat', (client, message: string) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast('chat', {
          playerId: client.sessionId,
          playerName: player.name,
          message: message.slice(0, 200), // Limit message length
        });
      }
    });

    // Handle map change
    this.onMessage('changeMap', (client, data: { mapId: string; x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.mapId = data.mapId;
        player.x = data.x;
        player.y = data.y;

        // Notify other players in the old map
        this.broadcast('playerMapChange', {
          playerId: client.sessionId,
          mapId: data.mapId,
        });
      }
    });

    // Handle stat updates
    this.onMessage('updateStats', (client, data: { level: number; maxHP: number; job: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.level = data.level;
        player.maxHP = data.maxHP;
        player.job = data.job;
      }
    });

    console.log('GameRoom handlers set up');
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joined!`, options);

    const mapId = options.mapId || this.state.mapId;
    const spawn = MAP_SPAWNS[mapId] || { x: 400, y: GAME_HEIGHT - 96 };

    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player${Math.floor(Math.random() * 1000)}`;
    player.mapId = mapId;
    player.x = spawn.x;
    player.y = spawn.y;

    console.log(`Player spawned at (${player.x}, ${player.y}) on map ${mapId}`);

    this.state.players.set(client.sessionId, player);

    // Notify other players
    this.broadcast('playerJoined', {
      playerId: client.sessionId,
      playerName: player.name,
    }, { except: client });

    console.log(`Total players: ${this.state.players.size}`);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left! (consented: ${consented})`);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Notify other players
      this.broadcast('playerLeft', {
        playerId: client.sessionId,
        playerName: player.name,
      });

      this.state.players.delete(client.sessionId);
    }

    console.log(`Total players: ${this.state.players.size}`);
  }

  update(deltaTime: number) {
    // Update server time
    this.state.serverTime += deltaTime;

    // Server-side game logic can go here
    // For now, we're doing client-authoritative movement for simplicity
  }

  onDispose() {
    console.log('GameRoom disposed');
  }

  /**
   * Spawn all monsters for a specific map
   */
  private spawnMonstersForMap(mapId: string): void {
    const spawns = MAP_MONSTERS[mapId] || [];
    console.log(`Spawning ${spawns.length} monsters for map: ${mapId}`);

    for (const spawnConfig of spawns) {
      const monsterId = `monster_${this.monsterIdCounter++}`;
      this.spawnMonster(spawnConfig, monsterId);
    }
  }

  /**
   * Spawn a single monster
   */
  private spawnMonster(config: MonsterSpawnConfig, monsterId: string): void {
    const monster = new Monster();
    monster.id = monsterId;
    monster.type = config.monsterId;
    monster.x = config.x;
    monster.y = config.y;
    monster.hp = config.maxHp;
    monster.maxHp = config.maxHp;
    monster.state = 'IDLE';
    monster.facingRight = Math.random() > 0.5;

    this.state.monsters.set(monsterId, monster);
    this.monsterSpawnConfigs.set(monsterId, config);

    console.log(`Spawned monster ${monsterId} (${config.monsterId}) at (${config.x}, ${config.y})`);
  }
}
