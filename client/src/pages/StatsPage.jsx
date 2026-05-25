import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getProfileStats, getMatchHistory } from '../utils/api';

function StatsPage() {
  const token = useAuthStore((s) => s.token);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [profileData, matchesData] = await Promise.all([
          getProfileStats(token),
          getMatchHistory(token, 1)
        ]);
        setProfile(profileData);
        setMatches(matchesData.matches || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading stats...</p>
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

  const stats = profile?.user?.stats || {};
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>📊 Your Profile</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">{profile?.user?.username || 'Player'}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-value">{stats.gamesPlayed || 0}</div>
            <div className="stat-card-label">Games Played</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              {stats.gamesWon || 0}
            </div>
            <div className="stat-card-label">Games Won</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
              {stats.gamesLost || 0}
            </div>
            <div className="stat-card-label">Games Lost</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{winRate}%</div>
            <div className="stat-card-label">Win Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{stats.totalDiceRolls || 0}</div>
            <div className="stat-card-label">Dice Rolls</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              {stats.laddersClimbed || 0}
            </div>
            <div className="stat-card-label">Ladders Climbed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
              {stats.snakesBitten || 0}
            </div>
            <div className="stat-card-label">Snakes Bitten</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
              {stats.bestWinStreak || 0}
            </div>
            <div className="stat-card-label">Best Win Streak</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">📜 Recent Matches</h3>
        {matches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No matches played yet. Start playing to see your history!
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Result</th>
                  <th>Winner</th>
                  <th>Turns</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const isWinner = match.winner?.toString() === profile?.user?.id?.toString();
                  const duration = match.duration
                    ? `${Math.floor(match.duration / 60)}m ${match.duration % 60}s`
                    : '-';
                  return (
                    <tr key={match._id}>
                      <td>{new Date(match.createdAt).toLocaleDateString()}</td>
                      <td style={{ color: isWinner ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {isWinner ? '🏆 Win' : '❌ Loss'}
                      </td>
                      <td>{match.winnerUsername || 'Unknown'}</td>
                      <td>{match.totalTurns || 0}</td>
                      <td>{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPage;
