import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { playDiceRoll, playLadder, playSnake, playWin, playTurnNotification, playTokenMove } from '../utils/sounds';
import GameBoard from '../components/GameBoard';
import DiceRoller from '../components/DiceRoller';
import PlayerList from '../components/PlayerList';
import ChatBox from '../components/ChatBox';
import TurnIndicator from '../components/TurnIndicator';
import WinnerModal from '../components/WinnerModal';
import WaitingRoom from '../components/WaitingRoom';

function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { emit, connected, on, off } = useSocket();
  const {
    gameStatus, players, currentPlayer, diceValue, diceRolling,
    lastMove, winner, boardData, messages, soundEnabled,
    setRoom, setGameStatus, setCurrentPlayer, setDiceValue,
    setDiceRolling, setLastMove, setWinner, setBoardData,
    addMessage, resetGame, room
  } = useGameStore();

  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Join room on mount
  useEffect(() => {
    if (!connected || !roomId) return;

    emit('join-room-by-id', { roomId }, (response) => {
      if (response?.room) {
        setRoom(response.room);
      } else if (response?.error) {
        showToast(response.error);
      }
    });

    emit('get-board-data', {}, (response) => {
      if (response?.board) {
        setBoardData(response.board);
      }
    });

    return () => {
      resetGame();
    };
  }, [connected, roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!connected) return;

    const handlePlayerJoined = (data) => {
      if (data?.room) setRoom(data.room);
    };

    const handlePlayerLeft = (data) => {
      if (data?.room) setRoom(data.room);
    };

    const handlePlayerDisconnected = (data) => {
      if (data?.room) {
        setRoom(data.room);
        showToast(data.message || 'A player disconnected');
      }
    };

    const handleGameStarted = (data) => {
      if (data?.room) {
        setRoom(data.room);
        showToast('Game started!');
      }
    };

    const handleDiceRolled = (data) => {
      setDiceValue(data.dice);
      setDiceRolling(false);
      setLastMove(data);

      if (soundEnabled) {
        playDiceRoll();
        setTimeout(() => {
          if (data.event === 'ladder') playLadder();
          else if (data.event === 'snake') playSnake();
          else playTokenMove();
        }, 400);
      }
    };

    const handleGameOver = (data) => {
      if (data?.room) setRoom(data.room);
      if (data?.winner) {
        setWinner(data.winner);
        setGameStatus('completed');
        if (soundEnabled) playWin();
      }
    };

    const handleTurnChanged = (data) => {
      if (data?.currentPlayer) {
        setCurrentPlayer(data.currentPlayer);
        if (soundEnabled) playTurnNotification();
      }
    };

    const handleNewMessage = (data) => {
      addMessage(data);
    };

    on('player-joined', handlePlayerJoined);
    on('player-left', handlePlayerLeft);
    on('player-disconnected', handlePlayerDisconnected);
    on('game-started', handleGameStarted);
    on('dice-rolled', handleDiceRolled);
    on('game-over', handleGameOver);
    on('turn-changed', handleTurnChanged);
    on('new-message', handleNewMessage);

    return () => {
      off('player-joined', handlePlayerJoined);
      off('player-left', handlePlayerLeft);
      off('player-disconnected', handlePlayerDisconnected);
      off('game-started', handleGameStarted);
      off('dice-rolled', handleDiceRolled);
      off('game-over', handleGameOver);
      off('turn-changed', handleTurnChanged);
      off('new-message', handleNewMessage);
    };
  }, [connected, on, off, soundEnabled, setRoom, setGameStatus, setCurrentPlayer, setDiceValue, setDiceRolling, setLastMove, setWinner, setBoardData, addMessage, showToast]);

  const handleRollDice = useCallback(() => {
    if (diceRolling) return;
    setDiceRolling(true);
    emit('roll-dice', {}, (response) => {
      if (response?.error) {
        setDiceRolling(false);
        showToast(response.error);
      }
    });
  }, [diceRolling, emit, setDiceRolling, showToast]);

  const handleSendMessage = useCallback((text) => {
    emit('send-message', { text });
  }, [emit]);

  const handleStartGame = useCallback(() => {
    emit('start-game', {}, (response) => {
      if (response?.error) showToast(response.error);
    });
  }, [emit, showToast]);

  const handleLeaveRoom = useCallback(() => {
    emit('leave-room', {}, () => {
      resetGame();
      navigate('/lobby');
    });
  }, [emit, navigate, resetGame]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    navigate('/lobby');
  }, [resetGame, navigate]);

  const isMyTurn = !!(currentPlayer?.id === userId);
  const isHost = room?.hostId === userId || players[0]?.id === userId;

  return (
    <div>
      {toast && (
        <div className="toast toast-info">{toast}</div>
      )}

      {gameStatus === 'completed' && winner && (
        <WinnerModal
          winner={winner}
          players={players}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handlePlayAgain}
          isOpen={true}
        />
      )}

      {gameStatus === 'waiting' ? (
        <WaitingRoom
          room={room}
          players={players}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          onCopyCode={showToast}
        />
      ) : (
        <div className="game-layout">
          <div className="game-main">
            <TurnIndicator
              currentPlayer={currentPlayer}
              isMyTurn={isMyTurn}
              gameStatus={gameStatus}
            />

            <GameBoard
              players={players}
              boardData={boardData}
              lastMove={lastMove}
            />

            <DiceRoller
              value={diceValue}
              isRolling={diceRolling}
              isMyTurn={isMyTurn}
              onRoll={handleRollDice}
              disabled={gameStatus !== 'playing'}
            />
          </div>

          <div className="game-sidebar">
            <PlayerList
              players={players}
              currentPlayer={currentPlayer}
              isHost={isHost}
            />

            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
            />

            <button
              className="btn btn-danger btn-small"
              style={{ width: '100%' }}
              onClick={handleLeaveRoom}
            >
              Leave Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
