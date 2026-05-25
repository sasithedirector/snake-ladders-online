import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  room: null,
  players: [],
  currentPlayer: null,
  gameStatus: 'idle',
  diceValue: null,
  diceRolling: false,
  lastMove: null,
  winner: null,
  boardData: null,
  messages: [],
  soundEnabled: localStorage.getItem('sl_sound') !== 'false',

  setRoom: (room) => set({
    room,
    players: room?.players || [],
    currentPlayer: room?.currentPlayer || null,
    gameStatus: room?.status || 'idle',
    winner: room?.winner || null
  }),

  setGameStatus: (status) => set({ gameStatus: status }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setDiceValue: (value) => set({ diceValue: value }),

  setDiceRolling: (rolling) => set({ diceRolling: rolling }),

  setLastMove: (move) => set({ lastMove: move }),

  setWinner: (winner) => set({ winner }),

  setBoardData: (data) => set({ boardData: data }),

  addMessage: (msg) => set((s) => ({
    messages: [...s.messages.slice(-49), msg]
  })),

  setMessages: (msgs) => set({ messages: msgs }),

  toggleSound: () => {
    const newVal = !get().soundEnabled;
    localStorage.setItem('sl_sound', String(newVal));
    set({ soundEnabled: newVal });
  },

  resetGame: () => set({
    room: null,
    players: [],
    currentPlayer: null,
    gameStatus: 'idle',
    diceValue: null,
    diceRolling: false,
    lastMove: null,
    winner: null,
    messages: []
  })
}));

export { useGameStore };
