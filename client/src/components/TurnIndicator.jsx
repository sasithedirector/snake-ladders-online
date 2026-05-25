import React from 'react';
import { motion } from 'framer-motion';

function TurnIndicator({ currentPlayer, isMyTurn, gameStatus }) {
  if (gameStatus === 'completed') return null;
  if (gameStatus === 'waiting') return null;

  return (
    <motion.div
      className={`turn-indicator ${isMyTurn ? 'my-turn' : 'waiting-turn'}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      key={currentPlayer?.id}
    >
      {isMyTurn ? (
        <span>🎲 Your turn! Roll the dice!</span>
      ) : currentPlayer ? (
        <span>⏳ {currentPlayer.username}'s turn...</span>
      ) : (
        <span>Waiting...</span>
      )}
    </motion.div>
  );
}

export default TurnIndicator;
