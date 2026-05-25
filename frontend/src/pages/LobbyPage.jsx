import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';

function LobbyPage() {
  const token = useAuthStore((s) => s.token);
  const { emit, connected } = useSocket();
  const resetGame = useGameStore((s) => s.resetGame);
  const setRoom = useGameStore((s) => s.setRoom);

  const [inviteCode, setInviteCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch profile stats
  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/stats/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {});
  }, [token]);

  const handleCreateRoom = useCallback(() => {
    if (!connected) return;
    setLoading(true);
    setError('');

    resetGame();
    emit('create-room', { isPrivate: true }, (response) => {
      setLoading(false);
      if (response?.error) {
        setError(response.error);
      } else if (response?.room) {
        setRoom(response.room);
        navigate(`/game/${response.room.roomId}`);
      }
    });
  }, [connected, emit, navigate, resetGame, setRoom]);

  const handleJoinRoom = useCallback(() => {
    if (!connected || !inviteCode.trim()) return;
    setLoading(true);
    setError('');

    resetGame();
    emit('join-room', { inviteCode: inviteCode.trim().toUpperCase() }, (response) => {
      setLoading(false);
      if (response?.error) {
        setError(response.error);
      } else if (response?.room) {
        setRoom(response.room);
        navigate(`/game/${response.room.roomId}`);
      }
    });
  }, [connected, inviteCode, emit, navigate, resetGame, setRoom]);

  const handlePublicRooms = useCallback(() => {
    if (!connected) return;
    emit('get-public-rooms', {}, (response) => {
      if (response?.rooms) {
        setPublicRooms(response.rooms);
      }
    });
  }, [connected, emit]);

  useEffect(() => {
    if (connected) handlePublicRooms();
  }, [connected, handlePublicRooms]);

  const stats = profile?.user?.stats || {};
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Game Lobby</h1>

      {error && (
        <div style={{
          background: 'rgba(231, 76, 60, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: 'var(--danger)'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Create Room */}
        <div className="card">
          <h3 className="card-title">🎮 Create New Room</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Start a new game and invite friends with a code.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleCreateRoom}
            disabled={!connected || loading}
          >
            {loading ? <span className="spinner" /> : 'Create Room'}
          </button>
        </div>

        {/* Join Room */}
        <div className="card">
          <h3 className="card-title">🔗 Join Room</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Enter an invite code to join an existing game.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 700 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoinRoom}
              disabled={!connected || loading || inviteCode.length < 6}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">📊 Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-value">{stats.gamesPlayed || 0}</div>
            <div className="stat-card-label">Games Played</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats.gamesWon || 0}</div>
            <div className="stat-card-label">Games Won</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{winRate}%</div>
            <div className="stat-card-label">Win Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
              {stats.bestWinStreak || 0}
            </div>
            <div className="stat-card-label">Best Streak</div>
          </div>
        </div>
      </div>

      {/* Public Rooms */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>🌐 Public Rooms</h3>
          <button className="btn btn-secondary btn-small" onClick={handlePublicRooms}>
            Refresh
          </button>
        </div>
        {publicRooms.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No public rooms available. Create one!
          </p>
        ) : (
          publicRooms.map((room) => (
            <div key={room.roomId} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'var(--surface-light)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '0.5rem'
            }}>
              <div>
                <strong>{room.hostUsername}'s Room</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '1rem', fontSize: '0.85rem' }}>
                  {room.playerCount}/{room.maxPlayers} players
                </span>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  resetGame();
                  emit('join-room-by-id', { roomId: room.roomId }, (response) => {
                    if (response?.room) {
                      setRoom(response.room);
                      navigate(`/game/${response.room.roomId}`);
                    } else if (response?.error) {
                      setError(response.error);
                    }
                  });
                }}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.85rem' }}>
        Connection status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </p>
    </div>
  );
}

export default LobbyPage;
