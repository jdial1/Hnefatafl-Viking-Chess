import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const PORT = 3000;

  // Socket.IO signaling & P2P-host lobby logic
  // The server acts as signaling relay for room matchmaking and P2P host synchronization.
  // The oldest client in a room is designated as the Host/Master.

  interface LobbyUser {
    id: string;
    username: string;
    joinedAt: number;
    inQueue: boolean;
    roomId?: string;
  }

  // Active connected sockets state
  const users = new Map<string, LobbyUser>();
  // Matchmaking queue socket IDs
  let matchmakingQueue: string[] = [];

  const FIRST_NAMES = [
    'Ragnar', 'Bjorn', 'Lagertha', 'Sigurd', 'Freya', 'Astrid', 'Leif',
    'Harald', 'Ivar', 'Rollo', 'Erik', 'Torstein', 'Ubbe', 'Sigrid',
    'Gunnar', 'Einar', 'Thora', 'Kjetil', 'Valdis', 'Styrkar', 'Thyra',
    'Sven', 'Olaf', 'Hakon', 'Solveig', 'Aslaug', 'Rorik', 'Yngvar'
  ];

  const LAST_NAMES = [
    'Ironbeard', 'Shieldbreaker', 'Bloodaxe', 'Frostweaver', 'Stormcaller',
    'Ravenshadow', 'Wolfjaw', 'Dragonbane', 'Oakenshield', 'Swiftarrow',
    'Seaborn', 'Thunderfist', 'Winterhart', 'Bearclaw', 'Spearshaker',
    'Skullsmasher', 'Runeweaver', 'Galeborn', 'Fireheart', 'Shadowrider'
  ];

  const generateNorseName = (): string => {
    const existing = new Set(Array.from(users.values()).map(u => u.username.toLowerCase()));
    for (let i = 0; i < 50; i++) {
      const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const candidate = `${f} ${l}`;
      if (!existing.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
    const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${f} ${l} ${Math.floor(10 + Math.random() * 90)}`;
  };

  io.on('connection', (socket) => {
    // Register user upon connection with random Norse name
    const username = generateNorseName();
    const user: LobbyUser = {
      id: socket.id,
      username,
      joinedAt: Date.now(),
      inQueue: false,
    };
    users.set(socket.id, user);

    // Send initial configuration to client
    socket.emit('connected', { userId: socket.id, username });

    // Broadcast updated lobby user list to all connected clients
    const broadcastLobbyList = () => {
      const activeUsers = Array.from(users.values());
      io.emit('lobby:users', activeUsers);
    };

    broadcastLobbyList();

    // Set custom username
    socket.on('set_username', (name: string) => {
      if (name && typeof name === 'string') {
        const currentUser = users.get(socket.id);
        if (currentUser) {
          currentUser.username = name.trim().substring(0, 16);
          broadcastLobbyList();
        }
      }
    });

    // Enter matchmaking queue
    socket.on('queue:join', () => {
      const currentUser = users.get(socket.id);
      if (!currentUser || currentUser.inQueue || currentUser.roomId) return;

      currentUser.inQueue = true;
      if (!matchmakingQueue.includes(socket.id)) {
        matchmakingQueue.push(socket.id);
      }

      broadcastLobbyList();

      // Check if we have at least 2 users in queue to pair
      if (matchmakingQueue.length >= 2) {
        const player1Id = matchmakingQueue.shift()!;
        const player2Id = matchmakingQueue.shift()!;

        const p1 = users.get(player1Id);
        const p2 = users.get(player2Id);

        if (p1 && p2) {
          const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          
          p1.inQueue = false;
          p1.roomId = roomId;

          p2.inQueue = false;
          p2.roomId = roomId;

          const s1 = io.sockets.sockets.get(player1Id);
          const s2 = io.sockets.sockets.get(player2Id);

          if (s1) s1.join(roomId);
          if (s2) s2.join(roomId);

          // Player 1 (oldest / first in queue) is assigned Master Host role
          io.to(player1Id).emit('match:found', {
            roomId,
            role: 'defenders',
            opponentId: player2Id,
            opponentName: p2.username,
            isMaster: true,
          });

          io.to(player2Id).emit('match:found', {
            roomId,
            role: 'attackers',
            opponentId: player1Id,
            opponentName: p1.username,
            isMaster: false,
          });
        }
      }
    });

    // Leave matchmaking queue
    socket.on('queue:leave', () => {
      const currentUser = users.get(socket.id);
      if (currentUser) {
        currentUser.inQueue = false;
      }
      matchmakingQueue = matchmakingQueue.filter((id) => id !== socket.id);
      broadcastLobbyList();
    });

    // Direct Room Challenge (Host game / Join game)
    socket.on('room:create', () => {
      const currentUser = users.get(socket.id);
      if (!currentUser) return;

      const roomId = `room_${socket.id.substring(0, 5)}_${Date.now()}`;
      currentUser.roomId = roomId;
      socket.join(roomId);

      socket.emit('room:created', {
        roomId,
        isMaster: true,
        role: 'defenders',
      });
      broadcastLobbyList();
    });

    socket.on('room:join', (roomId: string) => {
      const currentUser = users.get(socket.id);
      if (!currentUser || !roomId) return;

      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size >= 2) {
        socket.emit('room:error', 'Room is full or no longer exists.');
        return;
      }

      currentUser.roomId = roomId;
      socket.join(roomId);

      // Notify room members
      socket.emit('room:joined', {
        roomId,
        isMaster: false,
        role: 'attackers',
      });

      // Relay to room host
      socket.to(roomId).emit('room:player_joined', {
        playerId: socket.id,
        playerName: currentUser.username,
      });

      broadcastLobbyList();
    });

    socket.on('room:leave', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        const roomId = currentUser.roomId;
        socket.to(roomId).emit('room:player_left', { playerId: socket.id });
        socket.leave(roomId);
        currentUser.roomId = undefined;
        broadcastLobbyList();
      }
    });

    // P2P Relay: Game moves & Master Host sync messages
    socket.on('game:move', (data: any) => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        socket.to(currentUser.roomId).emit('game:move', data);
      }
    });

    socket.on('game:state_sync', (data: any) => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        socket.to(currentUser.roomId).emit('game:state_sync', data);
      }
    });

    socket.on('game:restart', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        io.to(currentUser.roomId).emit('game:restart');
      }
    });

    socket.on('game:rematch_request', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        socket.to(currentUser.roomId).emit('game:rematch_request');
      }
    });

    socket.on('game:rematch_accept', () => {
      const currentUser = users.get(socket.id);
      if (currentUser && currentUser.roomId) {
        io.to(currentUser.roomId).emit('game:rematch_accept');
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const currentUser = users.get(socket.id);
      if (currentUser) {
        if (currentUser.roomId) {
          socket.to(currentUser.roomId).emit('room:player_left', { playerId: socket.id });
        }
        users.delete(socket.id);
      }
      matchmakingQueue = matchmakingQueue.filter((id) => id !== socket.id);
      broadcastLobbyList();
    });
  });

  // Health check API endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', connectedUsers: users.size });
  });

  // Mount Vite middleware for dev or static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
