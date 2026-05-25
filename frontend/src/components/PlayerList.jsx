import React from 'react';
import { motion } from 'framer-motion';

function PlayerList({ players = [], currentPlayer, isHost }) {
  return (
    <div className="card">
      <h3 className="card-title">👥 Players ({players.length}/4)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {players.map((player, index) => {
          const isCurrent = currentPlayer?.id === player.id;
          return (
            <motion.div
              key={player.id}
              className={`player-badge ${isCurrent ? 'active' : ''} ${!player.isConnected ? 'player-badge-disconnected' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="player-badge-avatar"
                style={{ background: player.color || '#666' }}
              >
                {player.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="player-badge-name">
                  {player.username}
                  {index === 0 && ' 👑'}
                  {!player.isConnected && ' (DC)'}
                </div>
                <div className="player-badge-position">
                  Position: {player.position || 0}/100
                </div>
              </div>
              <div
                className={`connection-dot ${player.isConnected ? 'connected' : 'disconnected'}`}
              />
            </motion.div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: 4 - players.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="player-badge"
            style={{ opacity: 0.4, borderStyle: 'dashed' }}
          >
            <div className="player-badge-avatar" style={{ background: '#333' }}>
              ?
            </div>
            <div className="player-badge-name" style={{ color: 'var(--text-dark)' }}>
              Waiting...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;
