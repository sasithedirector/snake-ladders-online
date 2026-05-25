const mongoose = require('mongoose');

const matchHistorySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  inviteCode: {
    type: String,
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: { type: String, required: true },
    position: { type: Number, default: 0 },
    finalPosition: { type: Number, default: 0 },
    diceRolls: { type: Number, default: 0 },
    laddersClimbed: { type: Number, default: 0 },
    snakesBitten: { type: Number, default: 0 }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  winnerUsername: { type: String, default: '' },
  totalTurns: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // in seconds
  gameLog: [{
    player: String,
    from: Number,
    to: Number,
    dice: Number,
    event: { type: String, enum: ['ladder', 'snake', 'normal', 'win'], default: 'normal' },
    eventTo: { type: Number, default: null }, // for snake/ladder: where they ended up
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'completed', 'abandoned'],
    default: 'waiting'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MatchHistory', matchHistorySchema);
