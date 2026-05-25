const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory user store
const users = new Map();
let userIdCounter = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'snake-ladders-secret-key-change-me';
const JWT_EXPIRES_IN = '7d';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Token valid but user not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check duplicates
    for (const user of users.values()) {
      if (user.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      if (user.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = userIdCounter++;

    const user = {
      id: String(id),
      username,
      email: email.toLowerCase(),
      password: passwordHash,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalDiceRolls: 0,
        laddersClimbed: 0,
        snakesBitten: 0,
        winStreak: 0,
        bestWinStreak: 0
      },
      createdAt: new Date().toISOString()
    };

    users.set(String(id), user);

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    let foundUser = null;
    for (const user of users.values()) {
      if (user.email === email.toLowerCase()) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(foundUser.id);
    res.json({
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        stats: foundUser.stats
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
}

// GET /api/auth/me
function me(req, res) {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      stats: req.user.stats
    }
  });
}

module.exports = { authMiddleware, register, login, me, users, generateToken, JWT_SECRET };
