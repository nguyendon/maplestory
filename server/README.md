# MapleStory Multiplayer Server

This document explains how the multiplayer server works using Colyseus, a real-time multiplayer game framework.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         COLYSEUS SERVER                          │
│                        (localhost:2567)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      GameRoom                            │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              GameRoomState                       │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐               │    │    │
│  │  │  │  players    │  │  monsters   │               │    │    │
│  │  │  │  (MapSchema)│  │  (MapSchema)│               │    │    │
│  │  │  └─────────────┘  └─────────────┘               │    │    │
│  │  │  mapId: string    serverTime: number            │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        ▲              ▲              ▲              ▲
        │ WebSocket    │ WebSocket    │ WebSocket    │ WebSocket
        ▼              ▼              ▼              ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Client 1│    │ Client 2│    │ Client 3│    │ Client 4│
   │ Browser │    │ Browser │    │ Browser │    │ Browser │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

## How Colyseus Works

### 1. State Synchronization

Colyseus uses a **schema-based state synchronization** system. The server maintains the authoritative game state, and changes are automatically synchronized to all connected clients.

```typescript
// Server defines the state schema
class Player extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  // ... other properties
}

class GameRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
```

When any property changes on the server, Colyseus:
1. Detects the change automatically
2. Serializes only the delta (what changed)
3. Sends the delta to all clients via WebSocket
4. Clients apply the delta to their local state copy

### 2. Room Lifecycle

```
Client Request          Server                    Other Clients
     │                    │                            │
     │── joinOrCreate ───►│                            │
     │                    │── onCreate() ─────────────►│ (if new room)
     │                    │── onJoin(client) ─────────►│
     │◄── room.state ─────│                            │
     │                    │── broadcast "playerJoined"─►│
     │                    │                            │
     │── send("move") ───►│                            │
     │                    │── update state ───────────►│
     │◄── state delta ────│◄─────────────────────────┘│
     │                    │                            │
     │── disconnect ──────│                            │
     │                    │── onLeave(client) ────────►│
     │                    │── broadcast "playerLeft" ──►│
```

## File Structure

```
server/
├── src/
│   ├── index.ts           # Server entry point
│   ├── rooms/
│   │   └── GameRoom.ts    # Game room logic
│   └── schemas/
│       └── GameState.ts   # State definitions
├── package.json
└── tsconfig.json
```

## Key Components

### 1. Server Entry Point (`src/index.ts`)

```typescript
// Create Express app for HTTP endpoints
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Create Colyseus game server with WebSocket transport
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

// Register room types
gameServer.define('game', GameRoom);

// Start listening on port 2567
httpServer.listen(2567);
```

### 2. State Schema (`src/schemas/GameState.ts`)

The schema defines what data is synchronized:

```typescript
class Player extends Schema {
  @type('string') id: string = '';        // Unique session ID
  @type('string') name: string = '';      // Display name
  @type('number') x: number = 0;          // Position X
  @type('number') y: number = 0;          // Position Y
  @type('number') velocityX: number = 0;  // Movement velocity
  @type('number') velocityY: number = 0;
  @type('string') state: string = 'IDLE'; // Animation state
  @type('boolean') facingRight: boolean = true;
  @type('string') mapId: string = '';     // Current map
  @type('number') level: number = 1;
  @type('number') currentHP: number = 100;
  @type('number') maxHP: number = 100;
  @type('string') job: string = 'BEGINNER';
  @type('boolean') isAttacking: boolean = false;
  @type('string') activeSkill: string = '';
}
```

The `@type` decorator tells Colyseus:
- What type of data to expect
- How to serialize/deserialize it
- When to send updates to clients

### 3. Game Room (`src/rooms/GameRoom.ts`)

The room handles all game logic:

#### Room Creation
```typescript
onCreate(options: any) {
  // Initialize state
  this.setState(new GameRoomState());

  // Set up game loop (20 ticks/second)
  this.setSimulationInterval((deltaTime) => {
    this.update(deltaTime);
  }, 1000 / 20);

  // Register message handlers
  this.onMessage('move', (client, data) => { ... });
  this.onMessage('attack', (client, data) => { ... });
}
```

#### Player Join
```typescript
onJoin(client: Client, options: JoinOptions) {
  // Create new player in state
  const player = new Player();
  player.id = client.sessionId;
  player.name = options.name || 'Anonymous';

  // Add to synchronized state (auto-syncs to all clients)
  this.state.players.set(client.sessionId, player);

  // Notify other clients
  this.broadcast('playerJoined', { ... }, { except: client });
}
```

#### Message Handling
```typescript
// Client sends: room.send('move', { x, y, ... })
this.onMessage('move', (client, data) => {
  const player = this.state.players.get(client.sessionId);
  if (player) {
    // Update state (auto-syncs to all clients)
    player.x = data.x;
    player.y = data.y;
    player.state = data.state;
    // ...
  }
});
```

#### Player Leave
```typescript
onLeave(client: Client) {
  // Remove from state (auto-syncs removal to all clients)
  this.state.players.delete(client.sessionId);

  // Notify others
  this.broadcast('playerLeft', { ... });
}
```

## Message Types

### Client → Server

| Message | Data | Description |
|---------|------|-------------|
| `move` | `{ x, y, velocityX, velocityY, state, facingRight, animation, isAttacking, activeSkill }` | Position/state update |
| `attack` | `{ skillId, x, y, facingRight }` | Player used a skill |
| `damageMonster` | `{ monsterId, damage, isCritical }` | Player damaged a monster |
| `playerDamaged` | `{ damage, currentHP }` | Player took damage |
| `chat` | `string` | Chat message |
| `changeMap` | `{ mapId, x, y }` | Player changed maps |
| `updateStats` | `{ level, maxHP, job }` | Stats changed |

### Server → Clients

| Message | Data | Description |
|---------|------|-------------|
| `playerAttack` | `{ playerId, skillId, x, y, facingRight }` | Another player attacked |
| `monsterDamaged` | `{ monsterId, damage, isCritical, x, y, attackerId }` | Monster took damage |
| `monsterDeath` | `{ monsterId, x, y, killerId }` | Monster died |
| `playerHit` | `{ playerId, damage, currentHP, x, y }` | Player took damage |
| `chat` | `{ playerId, playerName, message }` | Chat message |
| `playerJoined` | `{ playerId, playerName }` | New player joined |
| `playerLeft` | `{ playerId, playerName }` | Player left |
| `playerMapChange` | `{ playerId, mapId }` | Player changed maps |

## State Synchronization Flow

```
1. Client moves player locally (instant feedback)
        │
        ▼
2. Client sends 'move' message to server (20x/second throttled)
        │
        ▼
3. Server updates Player state
        │
        ▼
4. Colyseus detects state change
        │
        ▼
5. Colyseus sends delta to ALL clients
        │
        ▼
6. Other clients receive state change
        │
        ▼
7. Other clients update their RemotePlayer entities
```

## Client-Side Integration

### NetworkManager (`src/network/NetworkManager.ts`)

The client uses a singleton NetworkManager:

```typescript
// Connect to server
await networkManager.connect('PlayerName', 'maple_island');

// Send position updates (called every frame, throttled internally)
networkManager.sendPosition(x, y, vx, vy, state, facingRight, animation, isAttacking, skill);

// Listen for events
networkManager.on('playerJoined', (player) => {
  // Create RemotePlayer entity
});

networkManager.on('playerUpdated', (player) => {
  // Update RemotePlayer position/state
});

networkManager.on('playerLeft', (player) => {
  // Destroy RemotePlayer entity
});
```

### RemotePlayer Entity (`src/entities/RemotePlayer.ts`)

Renders other players with:
- Sprite with animations
- Name tag
- Level display
- Health bar
- Smooth position interpolation

```typescript
// Interpolate position for smooth movement
update(time, delta) {
  const dx = this.targetX - this.x;
  const dy = this.targetY - this.y;
  this.x += dx * 0.2; // Smooth lerp
  this.y += dy * 0.2;
}
```

## Running the Server

### Development
```bash
cd server
npm install
npm run dev
```

### Production
```bash
cd server
npm run build
npm start
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 2567 | WebSocket server port |
| Max Clients | 50 | Per room limit |
| Tick Rate | 20 | Server updates per second |
| Client Update Rate | 20 | Position messages per second |

## Security Considerations

### Current Implementation (Client-Authoritative)
- Client sends position directly
- Server trusts client data
- Simple but vulnerable to cheating

### Future Improvements (Server-Authoritative)
For a more secure implementation:
1. Client sends input (key presses)
2. Server simulates movement
3. Server sends authoritative position
4. Client interpolates/predicts

```typescript
// Instead of trusting client position:
this.onMessage('input', (client, input) => {
  const player = this.state.players.get(client.sessionId);
  // Server calculates new position based on input
  if (input.left) player.x -= SPEED * deltaTime;
  if (input.right) player.x += SPEED * deltaTime;
  // Position is now server-authoritative
});
```

## Scaling Considerations

### Multiple Rooms
Each map could be a separate room:
```typescript
gameServer.define('maple_island', GameRoom);
gameServer.define('henesys', GameRoom);
gameServer.define('ellinia', GameRoom);
```

### Load Balancing
For many players, use multiple server instances with Redis for matchmaking:
```typescript
import { RedisPresence } from '@colyseus/redis-presence';

const gameServer = new Server({
  presence: new RedisPresence({ host: 'localhost', port: 6379 }),
});
```

## Debugging

### Server Logs
The server logs:
- Room creation/disposal
- Player joins/leaves
- Player count

### Client Console
Check browser console for:
- Connection status
- State updates
- Error messages

### Health Check
```bash
curl http://localhost:2567/health
# Returns: { "status": "ok", "timestamp": 1234567890 }
```
