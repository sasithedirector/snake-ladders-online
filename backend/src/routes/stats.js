const express = require('express');
const MatchHistory = require('../models/MatchHistory');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const users = await User.find({ 'stats.gamesPlayed': { $gt: 0 } })
      .select('username stats')
      .sort({ 'stats.gamesWon': -1, 'stats.gamesPlayed': 1 })
      .limit(limit);

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      gamesPlayed: u.stats.gamesPlayed,
      gamesWon: u.stats.gamesWon,
      winRate: u.stats.gamesPlayed > 0
        ? Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100)
        : 0,
      bestWinStreak: u.stats.bestWinStreak
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/stats/matches
router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matches = await MatchHistory.find({
      'players.user': req.user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('winner', 'username');

    const total = await MatchHistory.countDocuments({
      'players.user': req.user._id,
      status: 'completed'
    });

    res.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// GET /api/stats/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('username stats createdAt');

    const recentMatches = await MatchHistory.find({
      'players.user': req.user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('winner winnerUsername totalTurns duration createdAt');

    res.json({
      user: {
        username: user.username,
        stats: user.stats,
        memberSince: user.createdAt
      },
      recentMatches
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
