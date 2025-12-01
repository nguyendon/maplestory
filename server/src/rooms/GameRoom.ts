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

export class GameRoom extends Room<GameRoomState> {
  maxClients = 50;
  private tickRate = 20; // 20 updates per second

  onCreate(options: any) {
    console.log('GameRoom created!', options);

    this.setState(new GameRoomState());
    this.state.mapId = options.mapId || 'maple_island';

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
      if (monster) {
        monster.hp -= data.damage;

        // Broadcast damage event
        this.broadcast('monsterDamaged', {
          monsterId: data.monsterId,
          damage: data.damage,
          isCritical: data.isCritical,
          x: monster.x,
          y: monster.y,
          attackerId: client.sessionId,
        });

        if (monster.hp <= 0) {
          this.broadcast('monsterDeath', {
            monsterId: data.monsterId,
            x: monster.x,
            y: monster.y,
            killerId: client.sessionId,
          });
          // Remove monster after death animation
          this.clock.setTimeout(() => {
            this.state.monsters.delete(data.monsterId);
          }, 1000);
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

    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player${Math.floor(Math.random() * 1000)}`;
    player.mapId = options.mapId || this.state.mapId;
    player.x = 400;
    player.y = 300;

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
}
