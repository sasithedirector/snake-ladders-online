import React from 'react';
import { motion } from 'framer-motion';

function WaitingRoom({ room, players = [], isHost, onStartGame, onLeaveRoom, onCopyCode }) {
  const copyInviteCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode).then(() => {
        onCopyCode('Invite code copied!');
      }).catch(() => {
        onCopyCode('Code: ' + room.inviteCode);
      });
    }
  };

  const canStart = players.length >= 2;

  return (
    <div className="waiting-room">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 style={{ marginBottom: '1.5rem' }}>Waiting Room</h2>

        {/* Invite Code */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Share this code with friends:
          </p>
          <div
            className="room-code-display"
            onClick={copyInviteCode}
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            <span className="room-code">{room?.inviteCode || '------'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📋 Copy</span>
          </div>
        </div>

        {/* Players */}
        <div className="waiting-players-list">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              className="waiting-player-slot filled"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className="player-badge-avatar"
                style={{
                  background: player.color || '#666',
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 0.5rem',
                  fontSize: '1rem'
                }}
              >
                {player.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {player.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {i === 0 ? '👑 Host' : `Player ${i + 1}`}
              </div>
            </motion.div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="waiting-player-slot"
              style={{ opacity: 0.5 }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
              <div style={{ color: 'var(--text-dark)', fontSize: '0.85rem' }}>
                Waiting<span className="waiting-dots"></span>
              </div>
            </div>
          ))}
        </div>

        {/* Status */}
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {canStart
            ? '✅ Ready to start!'
            : `Need at least ${2 - players.length} more player(s) to start`
          }
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isHost && (
            <button
              className="btn btn-success btn-large"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? '🚀 Start Game' : `Need ${2 - players.length} more player(s)`}
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={onLeaveRoom}
          >
            🚪 Leave Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default WaitingRoom;
