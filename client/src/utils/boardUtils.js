// Board configuration matching backend engine

export const LADDERS = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
  28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94
};

export const SNAKES = {
  16: 6, 46: 25, 49: 11, 62: 19, 64: 60,
  74: 53, 89: 68, 92: 88, 95: 75, 99: 80
};

// Get cell position for rendering
// Row 0 is bottom (cells 1-10), Row 9 is top (cells 91-100)
// Boustrophedon (snake-like) pattern
export function getCellPosition(cellNumber) {
  if (cellNumber < 1 || cellNumber > 100) return null;
  const row = Math.floor((cellNumber - 1) / 10);
  const colInRow = (cellNumber - 1) % 10;
  const col = row % 2 === 0 ? colInRow : 9 - colInRow;
  return { row, col };
}

// Get percentage coordinates within the board for a cell
export function getCellPercent(cellNumber) {
  const pos = getCellPosition(cellNumber);
  if (!pos) return { x: 0, y: 0 };
  // row 0 is bottom, so invert for CSS (top = 0%)
  const x = pos.col * 10;
  const y = (9 - pos.row) * 10;
  return { x, y };
}

// Get token position within a cell (for overlapping tokens)
export function getTokenOffset(tokenIndex, totalTokens) {
  if (totalTokens <= 1) return { x: 0, y: 0 };
  const angle = (tokenIndex / totalTokens) * Math.PI * 2;
  const radius = 8; // percentage offset
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

// Generate SVG path for a snake between two cells
export function getSnakePath(from, to) {
  const fromPos = getCellPercent(from);
  const toPos = getCellPercent(to);
  const x1 = fromPos.x + 5;
  const y1 = fromPos.y + 5;
  const x2 = toPos.x + 5;
  const y2 = toPos.y + 5;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const perpX = -dy * 0.15;
  const perpY = dx * 0.15;
  return `M ${x1} ${y1} Q ${midX + perpX} ${midY + perpY}, ${x2} ${y2}`;
}

// Generate SVG path for a ladder between two cells
export function getLadderPath(from, to) {
  const fromPos = getCellPercent(from);
  const toPos = getCellPercent(to);
  const x1 = fromPos.x + 3;
  const y1 = fromPos.y + 5;
  const x2 = toPos.x + 3;
  const y2 = toPos.y + 5;
  const x1r = fromPos.x + 7;
  const x2r = toPos.x + 7;
  return {
    leftRail: `M ${x1} ${y1} L ${x2} ${y2}`,
    rightRail: `M ${x1r} ${y1} L ${x2r} ${y2}`,
    rungs: getLadderRungs(x1, y1, x2, y2, x1r, x2r)
  };
}

function getLadderRungs(x1, y1, x2, y2, x1r, x2r) {
  const rungs = [];
  const steps = 5;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lx = x1 + (x2 - x1) * t;
    const ly = y1 + (y2 - y1) * t;
    const rx = x1r + (x2r - x1r) * t;
    const ry = y1 + (y2 - y1) * t;
    rungs.push(`M ${lx} ${ly} L ${rx} ${ry}`);
  }
  return rungs;
}

// Get cell number from row/col (reverse mapping)
export function getCellNumber(row, col) {
  const actualCol = row % 2 === 0 ? col : 9 - col;
  return row * 10 + actualCol + 1;
}
