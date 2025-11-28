import Phaser from 'phaser';

/**
 * Base character statistics
 */
export interface BaseStats {
  STR: number;
  DEX: number;
  INT: number;
  LUK: number;
}

/**
 * Save data structure for character stats
 */
export interface CharacterStatsData {
  level: number;
  exp: number;
  baseStats: BaseStats;
  unassignedAP: number;
  currentHP?: number;
  currentMP?: number;
}

/**
 * PlayerStats class manages character progression, stats, and leveling
 */
export class PlayerStats extends Phaser.Events.EventEmitter {
  private _level: number = 1;
  private _exp: number = 0;
  private _unassignedAP: number = 0;

  private _baseStats: BaseStats = {
    STR: 4,
    DEX: 4,
    INT: 4,
    LUK: 4
  };

  private _currentHP: number;
  private _currentMP: number;

  private static readonly MAX_LEVEL = 200;
  private static readonly AP_PER_LEVEL = 5;
  private static readonly MAX_CRIT_RATE = 50;

  constructor(_scene: Phaser.Scene, data?: CharacterStatsData) {
    super();

    if (data) {
      this.loadFromData(data);
    }

    this._currentHP = data?.currentHP ?? this.getMaxHP();
    this._currentMP = data?.currentMP ?? this.getMaxMP();
  }

  // Getters
  get level(): number { return this._level; }
  get exp(): number { return this._exp; }
  get unassignedAP(): number { return this._unassignedAP; }
  get currentHP(): number { return this._currentHP; }
  get currentMP(): number { return this._currentMP; }
  get STR(): number { return this._baseStats.STR; }
  get DEX(): number { return this._baseStats.DEX; }
  get INT(): number { return this._baseStats.INT; }
  get LUK(): number { return this._baseStats.LUK; }

  // Derived Stats
  getMaxHP(): number {
    return 50 + (this._level * 20) + (this._baseStats.STR * 10);
  }

  getMaxMP(): number {
    return 30 + (this._level * 14) + (this._baseStats.INT * 10);
  }

  getATK(): number {
    return Math.floor(this._baseStats.STR * 1.2 + this._baseStats.DEX * 0.4);
  }

  getMATK(): number {
    return Math.floor(this._baseStats.INT * 1.2 + this._baseStats.LUK * 0.4);
  }

  getDEF(): number {
    return Math.floor((this._baseStats.STR + this._baseStats.DEX) * 0.5);
  }

  getCriticalRate(): number {
    return Math.min(this._baseStats.LUK * 0.05, PlayerStats.MAX_CRIT_RATE);
  }

  // Experience System
  // Returns TOTAL exp needed to reach a level (cumulative)
  static getExpForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > PlayerStats.MAX_LEVEL) return Infinity;
    // Level 2 needs 100 total, level 3 needs 250 total (100 + 150), etc.
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    return total;
  }

  // Returns exp needed for JUST the next level (not cumulative)
  static getExpRequiredForLevel(level: number): number {
    if (level <= 1) return 100;
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  getExpToNextLevel(): number {
    if (this._level >= PlayerStats.MAX_LEVEL) return Infinity;
    // Total exp needed to reach next level
    return PlayerStats.getExpForLevel(this._level + 1);
  }

  gainExp(amount: number): number {
    if (this._level >= PlayerStats.MAX_LEVEL || amount <= 0) return 0;

    this._exp += amount;
    this.emit('expGained', amount, this._exp);

    let levelsGained = 0;
    while (this._level < PlayerStats.MAX_LEVEL && this._exp >= this.getExpToNextLevel()) {
      this.levelUp();
      levelsGained++;
    }

    return levelsGained;
  }

  private levelUp(): void {
    if (this._level >= PlayerStats.MAX_LEVEL) return;

    const oldMaxHP = this.getMaxHP();
    const oldMaxMP = this.getMaxMP();

    this._level++;
    this._unassignedAP += PlayerStats.AP_PER_LEVEL;

    const hpGain = this.getMaxHP() - oldMaxHP;
    const mpGain = this.getMaxMP() - oldMaxMP;

    this._currentHP = Math.min(this._currentHP + hpGain, this.getMaxHP());
    this._currentMP = Math.min(this._currentMP + mpGain, this.getMaxMP());

    this.emit('levelUp', {
      newLevel: this._level,
      apGained: PlayerStats.AP_PER_LEVEL,
      hpGain,
      mpGain
    });

    this.emit('statsChanged');
  }

  // AP System
  addStatPoint(stat: keyof BaseStats): boolean {
    if (this._unassignedAP <= 0) return false;

    this._baseStats[stat]++;
    this._unassignedAP--;

    this.emit('statIncreased', { stat, newValue: this._baseStats[stat] });
    this.emit('statsChanged');
    return true;
  }

  // HP/MP Management
  healHP(amount: number): number {
    const oldHP = this._currentHP;
    this._currentHP = Math.min(this._currentHP + amount, this.getMaxHP());
    const healed = this._currentHP - oldHP;
    if (healed > 0) this.emit('hpChanged', this._currentHP, this.getMaxHP());
    return healed;
  }

  restoreMP(amount: number): number {
    const oldMP = this._currentMP;
    this._currentMP = Math.min(this._currentMP + amount, this.getMaxMP());
    const restored = this._currentMP - oldMP;
    if (restored > 0) this.emit('mpChanged', this._currentMP, this.getMaxMP());
    return restored;
  }

  takeDamage(amount: number): number {
    const oldHP = this._currentHP;
    this._currentHP = Math.max(0, this._currentHP - amount);
    this.emit('hpChanged', this._currentHP, this.getMaxHP());
    if (this._currentHP <= 0) this.emit('death');
    return oldHP - this._currentHP;
  }

  useMP(amount: number): boolean {
    if (this._currentMP < amount) return false;
    this._currentMP -= amount;
    this.emit('mpChanged', this._currentMP, this.getMaxMP());
    return true;
  }

  isAlive(): boolean {
    return this._currentHP > 0;
  }

  // Serialization
  toJSON(): CharacterStatsData {
    return {
      level: this._level,
      exp: this._exp,
      baseStats: { ...this._baseStats },
      unassignedAP: this._unassignedAP,
      currentHP: this._currentHP,
      currentMP: this._currentMP
    };
  }

  loadFromData(data: CharacterStatsData): void {
    this._level = data.level;
    this._exp = data.exp;
    this._baseStats = { ...data.baseStats };
    this._unassignedAP = data.unassignedAP;
    this._currentHP = data.currentHP ?? this.getMaxHP();
    this._currentMP = data.currentMP ?? this.getMaxMP();
    this.emit('statsChanged');
  }
}
