const { authMiddleware, users } = require('./auth');

// GET /api/stats/leaderboard
function leaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const allUsers = Array.from(users.values())
      .filter((u) => u.stats.gamesPlayed > 0)
      .sort((a, b) => {
        if (b.stats.gamesWon !== a.stats.gamesWon) return b.stats.gamesWon - a.stats.gamesWon;
        return a.stats.gamesPlayed - b.stats.gamesPlayed;
      })
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        username: u.username,
        gamesPlayed: u.stats.gamesPlayed,
        gamesWon: u.stats.gamesWon,
        winRate: u.stats.gamesPlayed > 0
          ? Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100)
          : 0,
        bestWinStreak: u.stats.bestWinStreak
      }));

    res.json({ leaderboard: allUsers });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

// GET /api/stats/profile
function profile(req, res) {
  try {
    res.json({
      user: {
        username: req.user.username,
        stats: req.user.stats,
        memberSince: req.user.createdAt
      },
      recentMatches: []
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = { leaderboard, profile, authMiddleware };
