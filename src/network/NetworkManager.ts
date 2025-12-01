import { Client, Room } from 'colyseus.js';
import Phaser from 'phaser';

export interface NetworkPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  state: string;
  facingRight: boolean;
  mapId: string;
  level: number;
  currentHP: number;
  maxHP: number;
  job: string;
  animation: string;
  isAttacking: boolean;
  activeSkill: string;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

/**
 * Manages multiplayer network connection using Colyseus
 */
export class NetworkManager extends Phaser.Events.EventEmitter {
  private client: Client | null = null;
  private room: Room | null = null;
  private serverUrl: string;
  private _isConnected: boolean = false;
  private _isConnecting: boolean = false;
  private playerId: string = '';
  private playerName: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;

  // Cached players from server state
  private remotePlayers: Map<string, NetworkPlayer> = new Map();

  // Throttle position updates
  private lastPositionUpdate: number = 0;
  private positionUpdateInterval: number = 50; // 20 updates per second

  constructor(serverUrl: string = 'ws://localhost:2567') {
    super();
    this.serverUrl = serverUrl;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isConnecting(): boolean {
    return this._isConnecting;
  }

  get sessionId(): string {
    return this.playerId;
  }

  get name(): string {
    return this.playerName;
  }

  getRemotePlayers(): Map<string, NetworkPlayer> {
    return this.remotePlayers;
  }

  /**
   * Connect to the game server
   */
  async connect(playerName: string, mapId: string = 'maple_island'): Promise<boolean> {
    if (this._isConnected || this._isConnecting) {
      console.log('Already connected or connecting');
      return this._isConnected;
    }

    this._isConnecting = true;
    this.playerName = playerName;

    try {
      console.log(`Connecting to server: ${this.serverUrl}`);
      this.client = new Client(this.serverUrl);

      this.room = await this.client.joinOrCreate('game', {
        name: playerName,
        mapId: mapId,
      });

      this.playerId = this.room.sessionId;
      this._isConnected = true;
      this._isConnecting = false;
      this.reconnectAttempts = 0;

      console.log(`Connected! Session ID: ${this.playerId}`);

      this.setupRoomListeners();
      this.emit('connected', { sessionId: this.playerId });

      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      this._isConnecting = false;
      this.emit('connectionFailed', error);

      // Try to reconnect
      this.attemptReconnect(playerName, mapId);

      return false;
    }
  }

  private attemptReconnect(playerName: string, mapId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(playerName, mapId);
    }, this.reconnectDelay);
  }

  /**
   * Set up room event listeners
   */
  private setupRoomListeners(): void {
    if (!this.room) return;

    // Listen for state changes
    this.room.state.players.onAdd((player: any, key: string) => {
      if (key === this.playerId) return; // Skip local player

      const networkPlayer: NetworkPlayer = {
        id: key,
        name: player.name,
        x: player.x,
        y: player.y,
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        state: player.state,
        facingRight: player.facingRight,
        mapId: player.mapId,
        level: player.level,
        currentHP: player.currentHP,
        maxHP: player.maxHP,
        job: player.job,
        animation: player.animation,
        isAttacking: player.isAttacking,
        activeSkill: player.activeSkill,
      };

      this.remotePlayers.set(key, networkPlayer);
      this.emit('playerJoined', networkPlayer);

      // Listen for changes on this player
      player.onChange(() => {
        const existing = this.remotePlayers.get(key);
        if (existing) {
          existing.x = player.x;
          existing.y = player.y;
          existing.velocityX = player.velocityX;
          existing.velocityY = player.velocityY;
          existing.state = player.state;
          existing.facingRight = player.facingRight;
          existing.mapId = player.mapId;
          existing.level = player.level;
          existing.currentHP = player.currentHP;
          existing.maxHP = player.maxHP;
          existing.job = player.job;
          existing.animation = player.animation;
          existing.isAttacking = player.isAttacking;
          existing.activeSkill = player.activeSkill;

          this.emit('playerUpdated', existing);
        }
      });
    });

    this.room.state.players.onRemove((_player: any, key: string) => {
      const removed = this.remotePlayers.get(key);
      if (removed) {
        this.remotePlayers.delete(key);
        this.emit('playerLeft', removed);
      }
    });

    // Listen for room messages
    this.room.onMessage('playerAttack', (data: any) => {
      this.emit('playerAttack', data);
    });

    this.room.onMessage('monsterDamaged', (data: any) => {
      this.emit('monsterDamaged', data);
    });

    this.room.onMessage('monsterDeath', (data: any) => {
      this.emit('monsterDeath', data);
    });

    this.room.onMessage('playerHit', (data: any) => {
      this.emit('playerHit', data);
    });

    this.room.onMessage('chat', (data: any) => {
      const message: ChatMessage = {
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: Date.now(),
      };
      this.emit('chat', message);
    });

    this.room.onMessage('playerJoined', (data: any) => {
      this.emit('playerJoinedNotification', data);
    });

    this.room.onMessage('playerLeft', (data: any) => {
      this.emit('playerLeftNotification', data);
    });

    this.room.onMessage('playerMapChange', (data: any) => {
      this.emit('playerMapChange', data);
    });

    // Handle disconnection
    this.room.onLeave((code: number) => {
      console.log(`Left room with code: ${code}`);
      this._isConnected = false;
      this.remotePlayers.clear();
      this.emit('disconnected', code);
    });

    this.room.onError((code: number, message?: string) => {
      console.error(`Room error ${code}: ${message}`);
      this.emit('error', { code, message });
    });
  }

  /**
   * Send position update to server
   */
  sendPosition(x: number, y: number, velocityX: number, velocityY: number, state: string, facingRight: boolean, animation: string, isAttacking: boolean = false, activeSkill: string = ''): void {
    if (!this.room || !this._isConnected) return;

    // Throttle updates
    const now = Date.now();
    if (now - this.lastPositionUpdate < this.positionUpdateInterval) {
      return;
    }
    this.lastPositionUpdate = now;

    this.room.send('move', {
      x,
      y,
      velocityX,
      velocityY,
      state,
      facingRight,
      animation,
      isAttacking,
      activeSkill,
    });
  }

  /**
   * Send attack event to server
   */
  sendAttack(skillId: string, x: number, y: number, facingRight: boolean): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('attack', {
      skillId,
      x,
      y,
      facingRight,
    });
  }

  /**
   * Send damage to monster
   */
  sendMonsterDamage(monsterId: string, damage: number, isCritical: boolean): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('damageMonster', {
      monsterId,
      damage,
      isCritical,
    });
  }

  /**
   * Send player taking damage
   */
  sendPlayerDamaged(damage: number, currentHP: number): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('playerDamaged', {
      damage,
      currentHP,
    });
  }

  /**
   * Send chat message
   */
  sendChat(message: string): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('chat', message);
  }

  /**
   * Send map change
   */
  sendMapChange(mapId: string, x: number, y: number): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('changeMap', { mapId, x, y });
  }

  /**
   * Send stats update
   */
  sendStatsUpdate(level: number, maxHP: number, job: string): void {
    if (!this.room || !this._isConnected) return;

    this.room.send('updateStats', { level, maxHP, job });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this._isConnected = false;
    this.remotePlayers.clear();
    this.client = null;
  }
}

// Singleton instance
export const networkManager = new NetworkManager();
