const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // don't include in queries by default
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    totalDiceRolls: { type: Number, default: 0 },
    laddersClimbed: { type: Number, default: 0 },
    snakesBitten: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 }
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update stats after a game
userSchema.methods.updateStats = async function(gameResult) {
  this.stats.gamesPlayed += 1;
  this.stats.totalDiceRolls += gameResult.diceRolls || 0;
  this.stats.laddersClimbed += gameResult.laddersClimbed || 0;
  this.stats.snakesBitten += gameResult.snakesBitten || 0;

  if (gameResult.won) {
    this.stats.gamesWon += 1;
    this.stats.winStreak += 1;
    if (this.stats.winStreak > this.stats.bestWinStreak) {
      this.stats.bestWinStreak = this.stats.winStreak;
    }
  } else {
    this.stats.gamesLost += 1;
    this.stats.winStreak = 0;
  }

  await this.save();
};

module.exports = mongoose.model('User', userSchema);
