import { Schema, type, MapSchema } from '@colyseus/schema';

/**
 * Player state synchronized across all clients
 */
export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') velocityX: number = 0;
  @type('number') velocityY: number = 0;
  @type('string') state: string = 'IDLE';
  @type('boolean') facingRight: boolean = true;
  @type('string') mapId: string = 'henesys_field';
  @type('number') level: number = 1;
  @type('number') currentHP: number = 100;
  @type('number') maxHP: number = 100;
  @type('string') job: string = 'BEGINNER';
  @type('string') animation: string = 'idle';
  @type('boolean') isAttacking: boolean = false;
  @type('string') activeSkill: string = '';
}

/**
 * Monster state synchronized across all clients
 */
export class Monster extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') hp: number = 100;
  @type('number') maxHp: number = 100;
  @type('string') state: string = 'IDLE';
  @type('boolean') facingRight: boolean = true;
}

/**
 * Main game room state
 */
export class GameRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type('number') serverTime: number = 0;
  @type('string') mapId: string = 'henesys_field';
}
