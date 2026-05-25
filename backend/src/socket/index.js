const jwt = require('jsonwebtoken');
const { getBoardData } = require('./engine');
const { users, JWT_SECRET } = require('../routes/auth');
const {
  createRoom, getRoom, getRoomByInviteCode, getRoomBySocketId,
  deleteRoom, getPublicRooms, cleanupStaleRooms, playerSocketMap
} = require('./roomManager');

function authenticateSocket(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// In-memory match history
const matchHistory = [];

function initializeSocketHandlers(io) {
  const cleanupInterval = setInterval(() => cleanupStaleRooms(), 15 * 60 * 1000);
  cleanupInterval.unref();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = authenticateSocket(token);
        if (decoded) {
          const user = users.get(decoded.userId);
          if (user) {
            socket.userId = user.id;
            socket.username = user.username;
          }
        }
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id} (${socket.username || 'guest'})`);

    // === ROOM MANAGEMENT ===

    socket.on('create-room', (data, callback) => {
      try {
        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.username || `Guest-${socket.id.slice(0, 4)}`;
        const isPrivate = data?.isPrivate !== false;

        const room = createRoom(userId, socket.id, username, isPrivate);
        playerSocketMap.set(socket.id, room.id);
        socket.join(room.id);

        callback?.({ success: true, room: room.getGameState() });

        if (!isPrivate) io.emit('public-rooms-updated', getPublicRooms());
      } catch (err) {
        console.error('create-room error:', err);
        callback?.({ error: 'Failed to create room' });
      }
    });

    socket.on('join-room', (data, callback) => {
      try {
        const { inviteCode } = data;
        if (!inviteCode) return callback?.({ error: 'Invite code is required' });

        const room = getRoomByInviteCode(inviteCode.toUpperCase());
        if (!room) return callback?.({ error: 'Room not found' });
        if (room.status !== 'waiting') return callback?.({ error: 'Game already in progress' });

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.username || `Guest-${socket.id.slice(0, 4)}`;

        if (!room.addPlayer(userId, socket.id, username)) {
          return callback?.({ error: 'Cannot join room (full or already in room)' });
        }

        playerSocketMap.set(socket.id, room.id);
        socket.join(room.id);

        callback?.({ success: true, room: room.getGameState() });

        const player = room.players.find(p => p.id === userId);
        socket.to(room.id).emit('player-joined', {
          player: { id: userId, username, color: player?.color, colorName: player?.colorName, position: 0, isConnected: true },
          room: room.getGameState()
        });
      } catch (err) {
        console.error('join-room error:', err);
        callback?.({ error: 'Failed to join room' });
      }
    });

    socket.on('join-room-by-id', (data, callback) => {
      try {
        const { roomId } = data;
        const room = getRoom(roomId);
        if (!room) return callback?.({ error: 'Room not found' });
        if (room.status !== 'waiting') return callback?.({ error: 'Game already in progress' });

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.username || `Guest-${socket.id.slice(0, 4)}`;

        if (!room.addPlayer(userId, socket.id, username)) {
          return callback?.({ error: 'Cannot join room' });
        }

        playerSocketMap.set(socket.id, room.id);
        socket.join(room.id);

        callback?.({ success: true, room: room.getGameState() });

        const player = room.players.find(p => p.id === userId);
        socket.to(room.id).emit('player-joined', {
          player: { id: userId, username, color: player?.color, colorName: player?.colorName, position: 0, isConnected: true },
          room: room.getGameState()
        });
      } catch (err) {
        console.error('join-room-by-id error:', err);
        callback?.({ error: 'Failed to join room' });
      }
    });

    socket.on('leave-room', (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) return callback?.({ error: 'Not in a room' });

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        room.removePlayer(userId);
        playerSocketMap.delete(socket.id);
        socket.leave(room.id);

        if (room.status === 'waiting') {
          socket.to(room.id).emit('player-left', { playerId: userId, room: room.getGameState() });
        }

        if (room.isEmpty()) deleteRoom(room.id);
        callback?.({ success: true });
      } catch (err) {
        console.error('leave-room error:', err);
        callback?.({ error: 'Failed to leave room' });
      }
    });

    socket.on('get-public-rooms', (data, callback) => {
      try {
        callback?.({ rooms: getPublicRooms() });
      } catch (err) {
        callback?.({ error: 'Failed to get public rooms' });
      }
    });

    // === GAME MANAGEMENT ===

    socket.on('start-game', (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) return callback?.({ error: 'Not in a room' });
        if (room.hostId !== socket.userId && room.players[0]?.socketId !== socket.id) {
          return callback?.({ error: 'Only the host can start the game' });
        }
        if (!room.canStart()) {
          return callback?.({ error: 'Need at least 2 players to start' });
        }

        room.startGame();
        io.to(room.id).emit('game-started', { room: room.getGameState() });
        callback?.({ success: true });
      } catch (err) {
        console.error('start-game error:', err);
        callback?.({ error: 'Failed to start game' });
      }
    });

    socket.on('roll-dice', (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) return callback?.({ error: 'Not in a room' });
        if (room.status !== 'playing') return callback?.({ error: 'Game not in progress' });

        const currentPlayer = room.getCurrentPlayer();
        if (!currentPlayer) return callback?.({ error: 'No current player' });
        if (currentPlayer.socketId !== socket.id && currentPlayer.id !== socket.userId) {
          return callback?.({ error: 'Not your turn' });
        }

        const result = room.rollDiceAndMove();
        if (!result) return callback?.({ error: 'Failed to process move' });

        io.to(room.id).emit('dice-rolled', {
          player: result.player,
          dice: result.dice,
          from: result.from,
          to: result.to,
          event: result.event,
          eventTo: result.eventTo,
          bounced: result.bounced,
          totalTurns: result.totalTurns,
          currentPositions: room.players.map(p => ({
            id: p.id, username: p.username, position: p.position,
            color: p.color, colorName: p.colorName
          }))
        });

        if (room.status === 'completed') {
          io.to(room.id).emit('game-over', {
            winner: result.winner,
            room: room.getGameState(),
            players: room.players.map(p => ({
              id: p.id, username: p.username, position: p.position,
              diceRolls: p.diceRolls, laddersClimbed: p.laddersClimbed, snakesBitten: p.snakesBitten
            }))
          });

          // Save match history in memory
          saveMatchHistory(room);
        }

        if (room.status === 'playing' && result.nextPlayer) {
          io.to(room.id).emit('turn-changed', {
            currentPlayer: { id: result.nextPlayer.id, username: result.nextPlayer.username }
          });
        }

        callback?.({ success: true, result });
      } catch (err) {
        console.error('roll-dice error:', err);
        callback?.({ error: 'Failed to roll dice' });
      }
    });

    socket.on('get-game-state', (data, callback) => {
      try {
        const room = data?.roomId ? getRoom(data.roomId) : getRoomBySocketId(socket.id);
        if (!room) return callback?.({ error: 'Room not found' });
        callback?.({ room: room.getGameState() });
      } catch (err) {
        callback?.({ error: 'Failed to get game state' });
      }
    });

    socket.on('get-board-data', (data, callback) => {
      try {
        callback?.({ board: getBoardData() });
      } catch (err) {
        callback?.({ error: 'Failed to get board data' });
      }
    });

    socket.on('send-message', (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) return callback?.({ error: 'Not in a room' });

        const message = {
          id: Date.now().toString(),
          username: socket.username || 'Guest',
          text: data.text?.slice(0, 500) || '',
          timestamp: Date.now()
        };

        io.to(room.id).emit('new-message', message);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: 'Failed to send message' });
      }
    });

    // === DISCONNECT ===

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected: ${socket.id} (${socket.username || 'guest'}) - ${reason}`);

      const room = getRoomBySocketId(socket.id);
      if (!room) return;

      const playerId = room.disconnectPlayer(socket.id);
      playerSocketMap.delete(socket.id);
      if (!playerId) return;

      if (room.status === 'playing') {
        io.to(room.id).emit('player-disconnected', {
          playerId, username: socket.username || 'Guest',
          room: room.getGameState(),
          message: `${socket.username || 'A player'} disconnected.`
        });

        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer && currentPlayer.id === playerId) {
          room.advanceTurn();
          const nextPlayer = room.getCurrentPlayer();
          if (nextPlayer) {
            io.to(room.id).emit('turn-changed', {
              currentPlayer: { id: nextPlayer.id, username: nextPlayer.username },
              reason: 'disconnect'
            });
          }
        }
      } else if (room.status === 'waiting') {
        room.removePlayer(playerId);
        io.to(room.id).emit('player-left', { playerId, room: room.getGameState() });
        if (room.isEmpty()) deleteRoom(room.id);
      }
    });
  });
}

// Save match history in memory and update user stats
function saveMatchHistory(room) {
  try {
    if (room.status !== 'completed') return;

    const duration = room.startedAt ? Math.floor((Date.now() - room.startedAt) / 1000) : 0;

    matchHistory.push({
      roomId: room.id,
      inviteCode: room.inviteCode,
      players: room.players.map(p => ({
        userId: p.id.startsWith('guest_') ? null : p.id,
        username: p.username,
        finalPosition: p.position,
        diceRolls: p.diceRolls,
        laddersClimbed: p.laddersClimbed,
        snakesBitten: p.snakesBitten
      })),
      winner: room.winner?.id?.startsWith('guest_') ? null : room.winner?.id,
      winnerUsername: room.winner?.username || '',
      totalTurns: room.totalTurns,
      duration,
      gameLog: room.gameLog,
      createdAt: new Date().toISOString()
    });

    // Keep only last 100 matches
    if (matchHistory.length > 100) matchHistory.splice(0, matchHistory.length - 100);

    // Update in-memory user stats
    for (const player of room.players) {
      if (player.id.startsWith('guest_')) continue;
      const user = users.get(player.id);
      if (!user) continue;

      const stats = user.stats;
      stats.gamesPlayed += 1;
      stats.totalDiceRolls += player.diceRolls;
      stats.laddersClimbed += player.laddersClimbed;
      stats.snakesBitten += player.snakesBitten;

      if (room.winner?.id === player.id) {
        stats.gamesWon += 1;
        stats.winStreak += 1;
        if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
      } else {
        stats.gamesLost += 1;
        stats.winStreak = 0;
      }
    }
  } catch (err) {
    console.error('saveMatchHistory error:', err);
  }
}

module.exports = { initializeSocketHandlers };
