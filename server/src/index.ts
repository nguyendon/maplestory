import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import express from 'express';
import { GameRoom } from './rooms/GameRoom';

const port = Number(process.env.PORT) || 2567;

const app = express();

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create HTTP server
const httpServer = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// Register game room
gameServer.define('game', GameRoom);

// Start listening
httpServer.listen(port, () => {
  console.log(`
  ==========================================
   MapleStory Multiplayer Server
  ==========================================
   Listening on port ${port}
   WebSocket: ws://localhost:${port}
   Health check: http://localhost:${port}/health
  ==========================================
  `);
});
