import React from 'react';
import { motion } from 'framer-motion';

const DICE_PATTERNS = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true]
};

function DiceRoller({ value = 1, isRolling = false, isMyTurn = false, onRoll, disabled = false }) {
  const dots = DICE_PATTERNS[value] || DICE_PATTERNS[1];

  return (
    <div className="dice-container">
      <motion.div
        className={`dice ${isRolling ? 'rolling' : ''}`}
        animate={isRolling ? {
          rotate: [0, -10, 10, -8, 8, -5, 5, 0],
          scale: [1, 1.1, 0.95, 1.05, 1]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {dots.map((active, i) => (
          <div
            key={i}
            className={`dice-dot ${active ? 'active' : 'inactive'}`}
          />
        ))}
      </motion.div>

      <motion.button
        className="btn btn-primary"
        onClick={onRoll}
        disabled={disabled || !isMyTurn || isRolling}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ minWidth: '140px' }}
      >
        {isRolling ? (
          <span className="spinner" />
        ) : isMyTurn ? (
          '🎲 Roll Dice'
        ) : (
          '⏳ Wait...'
        )}
      </motion.button>

      {!isMyTurn && !disabled && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Waiting for other players...
        </p>
      )}
    </div>
  );
}

export default DiceRoller;
