// Traditional 100-cell Snake and Ladders board configuration
// Ladders: bottom -> top (move up)
// Snakes: head -> tail (move down)

const LADDERS = {
  2: 38,
  7: 14,
  8: 31,
  15: 26,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  78: 98,
  87: 94
};

const SNAKES = {
  16: 6,
  46: 25,
  49: 11,
  62: 19,
  64: 60,
  74: 53,
  89: 68,
  92: 88,
  95: 75,
  99: 80
};

const BOARD_SIZE = 100;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

// Player colors for tokens
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const PLAYER_COLOR_NAMES = ['red', 'blue', 'green', 'yellow'];

// Generate a random 6-character invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Roll a dice (1-6)
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// Check if a position has a ladder
function checkLadder(position) {
  if (LADDERS[position]) {
    return { hasLadder: true, to: LADDERS[position] };
  }
  return { hasLadder: false, to: position };
}

// Check if a position has a snake
function checkSnake(position) {
  if (SNAKES[position]) {
    return { hasSnake: true, to: SNAKES[position] };
  }
  return { hasSnake: false, to: position };
}

// Process a dice roll: returns { newPosition, event, eventTo, dice }
function processMove(currentPosition, dice) {
  let newPosition = currentPosition + dice;

  // Must land exactly on 100 to win
  if (newPosition > BOARD_SIZE) {
    return {
      newPosition: currentPosition, // don't move
      event: 'normal',
      eventTo: null,
      dice,
      bounced: true
    };
  }

  // Check for ladder
  const ladder = checkLadder(newPosition);
  if (ladder.hasLadder) {
    return {
      newPosition: ladder.to,
      event: 'ladder',
      eventTo: ladder.to,
      dice,
      bounced: false
    };
  }

  // Check for snake
  const snake = checkSnake(newPosition);
  if (snake.hasSnake) {
    return {
      newPosition: snake.to,
      event: 'snake',
      eventTo: snake.to,
      dice,
      bounced: false
    };
  }

  // Check for win
  if (newPosition === BOARD_SIZE) {
    return {
      newPosition,
      event: 'win',
      eventTo: null,
      dice,
      bounced: false
    };
  }

  return {
    newPosition,
    event: 'normal',
    eventTo: null,
    dice,
    bounced: false
  };
}

// Get the board cell layout for rendering
// Returns mapping of cell number -> { row, col } for a 10x10 board
// Row 0 is bottom (cells 1-10), Row 9 is top (cells 91-100)
// Direction alternates: even rows go left-to-right, odd rows go right-to-left
function getCellPosition(cellNumber) {
  if (cellNumber < 1 || cellNumber > 100) return null;

  const row = Math.floor((cellNumber - 1) / 10); // 0-indexed from bottom
  const colInRow = (cellNumber - 1) % 10;

  // Boustrophedon (snake-like) pattern
  const col = row % 2 === 0 ? colInRow : 9 - colInRow;

  return { row, col };
}

// Get board data for frontend rendering
function getBoardData() {
  const cells = [];
  for (let i = 1; i <= 100; i++) {
    const pos = getCellPosition(i);
    const hasLadder = LADDERS[i] ? { from: i, to: LADDERS[i] } : null;
    const hasSnake = SNAKES[i] ? { from: i, to: SNAKES[i] } : null;
    cells.push({
      number: i,
      row: pos.row,
      col: pos.col,
      hasLadder,
      hasSnake
    });
  }
  return {
    cells,
    ladders: LADDERS,
    snakes: SNAKES
  };
}

module.exports = {
  LADDERS,
  SNAKES,
  BOARD_SIZE,
  MIN_PLAYERS,
  MAX_PLAYERS,
  PLAYER_COLORS,
  PLAYER_COLOR_NAMES,
  generateInviteCode,
  rollDice,
  checkLadder,
  checkSnake,
  processMove,
  getCellPosition,
  getBoardData
};
