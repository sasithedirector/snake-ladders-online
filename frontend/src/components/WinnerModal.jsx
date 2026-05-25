import React from 'react';
import { motion } from 'framer-motion';

function WinnerModal({ winner, players = [], onPlayAgain, onBackToLobby, isOpen }) {
  if (!isOpen || !winner) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Confetti particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][i % 5],
              left: `${Math.random() * 100}%`,
              top: '-10px',
              pointerEvents: 'none'
            }}
            animate={{
              y: [0, 500],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, 720],
              opacity: [1, 0]
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: 'easeOut'
            }}
          />
        ))}

        <div className="winner-trophy">🏆</div>
        <div className="winner-name">{winner.username}</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          has won the game!
        </p>

        {/* Player results */}
        <div style={{ marginBottom: '1.5rem' }}>
          {players
            .sort((a, b) => (b.position || 0) - (a.position || 0))
            .map((player, i) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  background: 'var(--surface-light)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.25rem',
                  fontSize: '0.9rem'
                }}
              >
                <span>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '}
                  <strong>{player.username}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Cell {player.position || 0}
                </span>
              </div>
            ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onPlayAgain}>
            🎮 Play Again
          </button>
          <button className="btn btn-secondary" onClick={onBackToLobby}>
            🏠 Lobby
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default WinnerModal;
