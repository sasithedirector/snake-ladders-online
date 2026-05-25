const { v4: uuidv4 } = require('uuid');
const {
  generateInviteCode,
  rollDice,
  processMove,
  PLAYER_COLORS,
  PLAYER_COLOR_NAMES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  BOARD_SIZE
} = require('./engine');

// In-memory room storage (can be moved to Redis for scaling)
const rooms = new Map();
const playerSocketMap = new Map(); // socketId -> roomId

class GameRoom {
  constructor(hostId, hostSocketId, hostUsername, isPrivate = true) {
    this.id = uuidv4();
    this.inviteCode = generateInviteCode();
    this.hostId = hostId;
    this.isPrivate = isPrivate;
    this.status = 'waiting'; // waiting, playing, completed
    this.players = []; // { id, socketId, username, color, colorName, position, isConnected }
    this.currentTurn = 0; // index in players array
    this.turnOrder = []; // ordered player IDs
    this.gameLog = [];
    this.totalTurns = 0;
    this.startedAt = null;
    this.winner = null;
    this.createdAt = Date.now();

    // Add host as first player
    this.addPlayer(hostId, hostSocketId, hostUsername);
  }

  addPlayer(playerId, socketId, username) {
    if (this.players.length >= MAX_PLAYERS) return false;
    if (this.status !== 'waiting') return false;
    if (this.players.find(p => p.id === playerId)) return false;

    const colorIndex = this.players.length;
    this.players.push({
      id: playerId,
      socketId,
      username,
      color: PLAYER_COLORS[colorIndex],
      colorName: PLAYER_COLOR_NAMES[colorIndex],
      position: 0,
      isConnected: true,
      diceRolls: 0,
      laddersClimbed: 0,
      snakesBitten: 0
    });

    return true;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) return;

    if (this.status === 'waiting') {
      // Remove entirely if game hasn't started
      this.players.splice(index, 1);
      // Reassign colors
      this.players.forEach((p, i) => {
        p.color = PLAYER_COLORS[i];
        p.colorName = PLAYER_COLOR_NAMES[i];
      });
    } else {
      // Mark as disconnected if game is in progress
      this.players[index].isConnected = false;
    }
  }

  reconnectPlayer(playerId, newSocketId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = newSocketId;
      player.isConnected = true;
      return true;
    }
    return false;
  }

  disconnectPlayer(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    if (player) {
      player.isConnected = false;
      return player.id;
    }
    return null;
  }

  getConnectedPlayers() {
    return this.players.filter(p => p.isConnected);
  }

  canStart() {
    return this.players.length >= MIN_PLAYERS && this.status === 'waiting';
  }

  startGame() {
    if (!this.canStart()) return false;

    this.status = 'playing';
    this.startedAt = Date.now();
    this.turnOrder = this.players.map(p => p.id);
    this.currentTurn = 0;
    this.totalTurns = 0;
    this.gameLog = [];
    this.players.forEach(p => {
      p.position = 0;
      p.diceRolls = 0;
      p.laddersClimbed = 0;
      p.snakesBitten = 0;
    });

    return true;
  }

  getCurrentPlayer() {
    if (this.status !== 'playing') return null;
    const playerId = this.turnOrder[this.currentTurn];
    return this.players.find(p => p.id === playerId);
  }

  rollDiceAndMove() {
    if (this.status !== 'playing') return null;

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return null;

    const dice = rollDice();
    const result = processMove(currentPlayer.position, dice);

    // Update player position
    const previousPosition = currentPlayer.position;
    currentPlayer.position = result.newPosition;
    currentPlayer.diceRolls += 1;

    if (result.event === 'ladder') {
      currentPlayer.laddersClimbed += 1;
    } else if (result.event === 'snake') {
      currentPlayer.snakesBitten += 1;
    }

    this.totalTurns += 1;

    // Log the move
    const logEntry = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.username,
      from: previousPosition,
      to: result.newPosition,
      dice,
      event: result.event,
      eventTo: result.eventTo,
      bounced: result.bounced || false,
      timestamp: Date.now()
    };
    this.gameLog.push(logEntry);

    // Check for win
    if (result.event === 'win') {
      this.winner = {
        id: currentPlayer.id,
        username: currentPlayer.username
      };
      this.status = 'completed';
    } else {
      // Move to next connected player
      this.advanceTurn();
    }

    return {
      player: {
        id: currentPlayer.id,
        username: currentPlayer.username,
        color: currentPlayer.color,
        colorName: currentPlayer.colorName
      },
      dice,
      from: previousPosition,
      to: result.newPosition,
      event: result.event,
      eventTo: result.eventTo,
      bounced: result.bounced || false,
      winner: this.winner,
      nextPlayer: this.status === 'playing' ? this.getCurrentPlayer() : null,
      totalTurns: this.totalTurns
    };
  }

  advanceTurn() {
    let attempts = 0;
    const playerCount = this.turnOrder.length;

    do {
      this.currentTurn = (this.currentTurn + 1) % playerCount;
      attempts++;
      const nextPlayer = this.getCurrentPlayer();
      if (nextPlayer && nextPlayer.isConnected) break;
    } while (attempts < playerCount);

    // If no connected players, end game
    if (this.getConnectedPlayers().length === 0) {
      this.status = 'abandoned';
    }
  }

  getGameState() {
    return {
      roomId: this.id,
      inviteCode: this.inviteCode,
      status: this.status,
      hostId: this.hostId,
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        color: p.color,
        colorName: p.colorName,
        position: p.position,
        isConnected: p.isConnected
      })),
      currentTurn: this.currentTurn,
      currentPlayer: this.getCurrentPlayer() ? {
        id: this.getCurrentPlayer().id,
        username: this.getCurrentPlayer().username
      } : null,
      winner: this.winner,
      totalTurns: this.totalTurns,
      gameLog: this.gameLog
    };
  }

  isEmpty() {
    return this.players.length === 0;
  }

  allDisconnected() {
    return this.players.every(p => !p.isConnected);
  }
}

// Room manager functions
function createRoom(hostId, hostSocketId, hostUsername, isPrivate = true) {
  const room = new GameRoom(hostId, hostSocketId, hostUsername, isPrivate);
  rooms.set(room.id, room);
  playerSocketMap.set(hostSocketId, room.id);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function getRoomByInviteCode(inviteCode) {
  for (const room of rooms.values()) {
    if (room.inviteCode === inviteCode) return room;
  }
  return null;
}

function getRoomBySocketId(socketId) {
  const roomId = playerSocketMap.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) || null;
}

function deleteRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    // Clean up socket mappings
    room.players.forEach(p => {
      playerSocketMap.delete(p.socketId);
    });
    rooms.delete(roomId);
  }
}

function getPublicRooms() {
  const publicRooms = [];
  for (const room of rooms.values()) {
    if (!room.isPrivate && room.status === 'waiting') {
      publicRooms.push({
        roomId: room.id,
        playerCount: room.players.length,
        maxPlayers: MAX_PLAYERS,
        hostUsername: room.players[0]?.username || 'Unknown'
      });
    }
  }
  return publicRooms;
}

// Cleanup stale rooms (called periodically)
function cleanupStaleRooms(maxAgeMs = 3600000) { // 1 hour default
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > maxAgeMs || room.allDisconnected()) {
      deleteRoom(roomId);
    }
  }
}

module.exports = {
  GameRoom,
  createRoom,
  getRoom,
  getRoomByInviteCode,
  getRoomBySocketId,
  deleteRoom,
  getPublicRooms,
  cleanupStaleRooms,
  rooms
};
