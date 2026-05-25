import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard(20);
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>🏆 Leaderboard</h1>

      <div className="card">
        {leaderboard.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            No players yet. Be the first to play!
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Best Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => (
                  <tr key={player.rank}>
                    <td className={`rank-${player.rank <= 3 ? player.rank : ''}`}>
                      {player.rank <= 3 ? (
                        player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'
                      ) : (
                        `#${player.rank}`
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{player.username}</td>
                    <td>{player.gamesPlayed}</td>
                    <td style={{ color: 'var(--success)' }}>{player.gamesWon}</td>
                    <td>{player.winRate}%</td>
                    <td style={{ color: 'var(--warning)' }}>{player.bestWinStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
