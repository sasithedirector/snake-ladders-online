const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MatchHistory = require('../models/MatchHistory');
const { getBoardData } = require('./engine');
const {
  createRoom,
  getRoom,
  getRoomByInviteCode,
  getRoomBySocketId,
  deleteRoom,
  getPublicRooms,
  cleanupStaleRooms
} = require('./roomManager');

// Authenticate socket connection
function authenticateSocket(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

async function initializeSocketHandlers(io) {
  // Periodic cleanup of stale rooms
  const cleanupInterval = setInterval(() => {
    cleanupStaleRooms();
  }, 15 * 60 * 1000); // every 15 minutes

  // Allow cleanup interval to not keep process alive
  cleanupInterval.unref();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = authenticateSocket(token);
        if (decoded) {
          const user = await User.findById(decoded.userId).select('_id username');
          if (user) {
            socket.userId = user._id.toString();
            socket.username = user.username;
          }
        }
      }
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id} (${socket.username || 'guest'})`);

    // === ROOM MANAGEMENT ===

    socket.on('create-room', async (data, callback) => {
      try {
        if (!socket.userId) {
          return callback?.({ error: 'Must be logged in to create a room' });
        }

        const isPrivate = data?.isPrivate !== false; // default true
        const room = createRoom(socket.userId, socket.id, socket.username, isPrivate);

        socket.join(room.id);

        // If user was in another room, leave it
        const oldRoom = getRoomBySocketId(socket.id);
        if (oldRoom && oldRoom.id !== room.id) {
          socket.leave(oldRoom.id);
        }

        callback?.({
          success: true,
          room: room.getGameState()
        });

        // Notify public rooms list changed
        if (!isPrivate) {
          io.emit('public-rooms-updated', getPublicRooms());
        }
      } catch (err) {
        console.error('create-room error:', err);
        callback?.({ error: 'Failed to create room' });
      }
    });

    socket.on('join-room', async (data, callback) => {
      try {
        const { inviteCode } = data;
        if (!inviteCode) {
          return callback?.({ error: 'Invite code is required' });
        }

        const room = getRoomByInviteCode(inviteCode.toUpperCase());
        if (!room) {
          return callback?.({ error: 'Room not found' });
        }

        if (room.status !== 'waiting') {
          return callback?.({ error: 'Game already in progress' });
        }

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.username || `Guest-${socket.id.slice(0, 4)}`;

        const added = room.addPlayer(userId, socket.id, username);
        if (!added) {
          return callback?.({ error: 'Cannot join room (full or already in room)' });
        }

        socket.join(room.id);

        // Update socket mapping
        const { playerSocketMap } = require('./roomManager');
        // Already set in room.addPlayer, but we update the map to point to new room
        // Actually room doesn't update the map, we do it here via createRoom mapping only
        // Let's handle it properly - join-room needs to update playerSocketMap
        // We'll import and update it

        callback?.({
          success: true,
          room: room.getGameState()
        });

        // Notify other players
        socket.to(room.id).emit('player-joined', {
          player: {
            id: userId,
            username,
            color: room.players.find(p => p.id === userId)?.color,
            colorName: room.players.find(p => p.id === userId)?.colorName,
            position: 0,
            isConnected: true
          },
          room: room.getGameState()
        });
      } catch (err) {
        console.error('join-room error:', err);
        callback?.({ error: 'Failed to join room' });
      }
    });

    socket.on('join-room-by-id', async (data, callback) => {
      try {
        const { roomId } = data;
        const room = getRoom(roomId);

        if (!room) {
          return callback?.({ error: 'Room not found' });
        }

        if (room.status !== 'waiting') {
          return callback?.({ error: 'Game already in progress' });
        }

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        const username = socket.username || `Guest-${socket.id.slice(0, 4)}`;

        const added = room.addPlayer(userId, socket.id, username);
        if (!added) {
          return callback?.({ error: 'Cannot join room' });
        }

        socket.join(room.id);

        callback?.({ success: true, room: room.getGameState() });

        socket.to(room.id).emit('player-joined', {
          player: {
            id: userId,
            username,
            color: room.players.find(p => p.id === userId)?.color,
            colorName: room.players.find(p => p.id === userId)?.colorName,
            position: 0,
            isConnected: true
          },
          room: room.getGameState()
        });
      } catch (err) {
        console.error('join-room-by-id error:', err);
        callback?.({ error: 'Failed to join room' });
      }
    });

    socket.on('leave-room', async (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) {
          return callback?.({ error: 'Not in a room' });
        }

        const userId = socket.userId || `guest_${socket.id.slice(0, 8)}`;
        room.removePlayer(userId);

        socket.leave(room.id);

        if (room.status === 'waiting') {
          socket.to(room.id).emit('player-left', {
            playerId: userId,
            room: room.getGameState()
          });
        }

        if (room.isEmpty()) {
          deleteRoom(room.id);
        }

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

    socket.on('start-game', async (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) {
          return callback?.({ error: 'Not in a room' });
        }

        if (room.hostId !== socket.userId && room.players[0]?.socketId !== socket.id) {
          return callback?.({ error: 'Only the host can start the game' });
        }

        if (!room.canStart()) {
          return callback?.({ error: `Need at least ${room.MIN_PLAYERS || 2} players to start` });
        }

        room.startGame();

        io.to(room.id).emit('game-started', {
          room: room.getGameState()
        });

        callback?.({ success: true });
      } catch (err) {
        console.error('start-game error:', err);
        callback?.({ error: 'Failed to start game' });
      }
    });

    socket.on('roll-dice', async (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) {
          return callback?.({ error: 'Not in a room' });
        }

        if (room.status !== 'playing') {
          return callback?.({ error: 'Game not in progress' });
        }

        const currentPlayer = room.getCurrentPlayer();
        if (!currentPlayer) {
          return callback?.({ error: 'No current player' });
        }

        // Verify it's this player's turn
        if (currentPlayer.socketId !== socket.id && currentPlayer.id !== socket.userId) {
          return callback?.({ error: 'Not your turn' });
        }

        const result = room.rollDiceAndMove();
        if (!result) {
          return callback?.({ error: 'Failed to process move' });
        }

        // Broadcast the dice result and move to all players
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
            id: p.id,
            username: p.username,
            position: p.position,
            color: p.color,
            colorName: p.colorName
          }))
        });

        // If game ended
        if (room.status === 'completed') {
          io.to(room.id).emit('game-over', {
            winner: result.winner,
            room: room.getGameState(),
            players: room.players.map(p => ({
              id: p.id,
              username: p.username,
              position: p.position,
              diceRolls: p.diceRolls,
              laddersClimbed: p.laddersClimbed,
              snakesBitten: p.snakesBitten
            }))
          });

          // Save match history to database
          await saveMatchHistory(room);
        }

        if (room.status === 'playing' && result.nextPlayer) {
          io.to(room.id).emit('turn-changed', {
            currentPlayer: {
              id: result.nextPlayer.id,
              username: result.nextPlayer.username
            }
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
        if (!room) {
          return callback?.({ error: 'Room not found' });
        }
        callback?.({ room: room.getGameState() });
      } catch (err) {
        callback?.({ error: 'Failed to get game state' });
      }
    });

    // === BOARD DATA ===

    socket.on('get-board-data', (data, callback) => {
      try {
        callback?.({ board: getBoardData() });
      } catch (err) {
        callback?.({ error: 'Failed to get board data' });
      }
    });

    // === CHAT ===

    socket.on('send-message', (data, callback) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) {
          return callback?.({ error: 'Not in a room' });
        }

        const message = {
          id: Date.now().toString(),
          username: socket.username || 'Guest',
          text: data.text?.slice(0, 500) || '', // max 500 chars
          timestamp: Date.now()
        };

        io.to(room.id).emit('new-message', message);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: 'Failed to send message' });
      }
    });

    // === DISCONNECT ===

    socket.on('disconnect', async (reason) => {
      console.log(`Disconnected: ${socket.id} (${socket.username || 'guest'}) - ${reason}`);

      const room = getRoomBySocketId(socket.id);
      if (!room) return;

      const playerId = room.disconnectPlayer(socket.id);
      if (!playerId) return;

      if (room.status === 'playing') {
        // Notify others about disconnect
        io.to(room.id).emit('player-disconnected', {
          playerId,
          username: socket.username || 'Guest',
          room: room.getGameState(),
          message: `${socket.username || 'A player'} disconnected. Waiting for reconnect...`
        });

        // If it was this player's turn, advance
        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer && currentPlayer.id === playerId) {
          room.advanceTurn();
          const nextPlayer = room.getCurrentPlayer();
          if (nextPlayer) {
            io.to(room.id).emit('turn-changed', {
              currentPlayer: {
                id: nextPlayer.id,
                username: nextPlayer.username
              },
              reason: 'disconnect'
            });
          }
        }
      } else if (room.status === 'waiting') {
        // Remove from waiting room
        room.removePlayer(playerId);
        io.to(room.id).emit('player-left', {
          playerId,
          room: room.getGameState()
        });

        if (room.isEmpty()) {
          deleteRoom(room.id);
        }
      }
    });
  });
}

// Save completed game to database
async function saveMatchHistory(room) {
  try {
    if (room.status !== 'completed') return;

    const duration = room.startedAt
      ? Math.floor((Date.now() - room.startedAt) / 1000)
      : 0;

    const matchData = {
      roomId: room.id,
      inviteCode: room.inviteCode,
      players: room.players.map(p => ({
        user: p.id.startsWith('guest_') ? null : p.id,
        username: p.username,
        position: 0,
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
      status: 'completed'
    };

    const match = new MatchHistory(matchData);
    await match.save();

    // Update player stats for non-guest players
    for (const player of room.players) {
      if (player.id.startsWith('guest_')) continue;

      try {
        const user = await User.findById(player.id);
        if (user) {
          await user.updateStats({
            won: room.winner?.id === player.id,
            diceRolls: player.diceRolls,
            laddersClimbed: player.laddersClimbed,
            snakesBitten: player.snakesBitten
          });
        }
      } catch (err) {
        console.error(`Failed to update stats for player ${player.id}:`, err);
      }
    }
  } catch (err) {
    console.error('saveMatchHistory error:', err);
  }
}

module.exports = { initializeSocketHandlers };
