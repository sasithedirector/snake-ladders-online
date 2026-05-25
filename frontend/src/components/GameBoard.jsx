import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LADDERS, SNAKES, getCellPosition, getCellPercent, getTokenOffset } from '../utils/boardUtils';

function GameBoard({ players = [], boardData, lastMove }) {
  // Build cell data
  const cells = useMemo(() => {
    const result = [];
    for (let i = 1; i <= 100; i++) {
      const pos = getCellPosition(i);
      const isLadderStart = !!LADDERS[i];
      const isSnakeStart = !!SNAKES[i];
      result.push({
        number: i,
        row: pos.row,
        col: pos.col,
        isLadderStart,
        isSnakeStart,
        isStart: i === 1,
        isEnd: i === 100
      });
    }
    return result;
  }, []);

  // Group players by position for token stacking
  const playersByPosition = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      const pos = p.position || 0;
      if (!map[pos]) map[pos] = [];
      map[pos].push(p);
    });
    return map;
  }, [players]);

  // Build SVG overlay paths for snakes and ladders
  const snakePaths = useMemo(() => {
    return Object.entries(SNAKES).map(([from, to]) => {
      const fromPct = getCellPercent(parseInt(from));
      const toPct = getCellPercent(parseInt(to));
      return {
        from: parseInt(from),
        to: parseInt(to),
        path: generateSnakePath(fromPct, toPct)
      };
    });
  }, []);

  const ladderPaths = useMemo(() => {
    return Object.entries(LADDERS).map(([from, to]) => {
      const fromPct = getCellPercent(parseInt(from));
      const toPct = getCellPercent(parseInt(to));
      return {
        from: parseInt(from),
        to: parseInt(to),
        paths: generateLadderPaths(fromPct, toPct)
      };
    });
  }, []);

  return (
    <div className="board-container">
      <div className="board-grid" style={{ position: 'relative' }}>
        {/* SVG Overlay for snakes and ladders */}
        <svg
          className="snake-ladder-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Ladders */}
          {ladderPaths.map(({ from, paths }) => (
            <g key={`ladder-${from}`}>
              <path
                d={paths.left}
                stroke="#2ecc71"
                strokeWidth="0.6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={paths.right}
                stroke="#2ecc71"
                strokeWidth="0.6"
                fill="none"
                strokeLinecap="round"
              />
              {paths.rungs.map((rung, i) => (
                <path
                  key={i}
                  d={rung}
                  stroke="#27ae60"
                  strokeWidth="0.4"
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </g>
          ))}

          {/* Snakes */}
          {snakePaths.map(({ from, path }) => (
            <g key={`snake-${from}`}>
              <path
                d={path}
                stroke="#e74c3c"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="1.5 0.5"
              />
            </g>
          ))}
        </svg>

        {/* Cells */}
        {cells.map((cell) => {
          const tokensHere = playersByPosition[cell.number] || [];
          const cellClasses = [
            'cell',
            cell.isStart ? 'cell-start' : '',
            cell.isEnd ? 'cell-end' : '',
            cell.isLadderStart ? 'cell-ladder' : '',
            cell.isSnakeStart ? 'cell-snake' : '',
            (cell.row + cell.col) % 2 === 0 ? 'cell-even' : 'cell-odd'
          ].filter(Boolean).join(' ');

          return (
            <div
              key={cell.number}
              className={cellClasses}
              data-cell-number={cell.number}
              style={{
                gridRow: 10 - cell.row, // invert: row 0 (bottom) = grid row 10
                gridColumn: cell.col + 1
              }}
            >
              <span className="cell-number">{cell.number}</span>

              {/* Snake/Ladder indicators */}
              {cell.isLadderStart && (
                <span style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '0.5rem' }}>🪜</span>
              )}
              {cell.isSnakeStart && (
                <span style={{ position: 'absolute', top: '1px', right: '2px', fontSize: '0.5rem' }}>🐍</span>
              )}

              {/* Tokens */}
              {tokensHere.length > 0 && (
                <div className="token-stack">
                  <AnimatePresence>
                    {tokensHere.map((player, idx) => {
                      const offset = getTokenOffset(idx, tokensHere.length);
                      return (
                        <motion.div
                          key={player.id}
                          className={`token token-${player.colorName || 'red'}`}
                          initial={{ scale: 0 }}
                          animate={{
                            scale: 1,
                            x: offset.x,
                            y: offset.y
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20
                          }}
                          title={player.username}
                          style={{
                            zIndex: 10 + idx
                          }}
                        >
                          {player.username?.charAt(0)?.toUpperCase() || '?'}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateSnakePath(fromPct, toPct) {
  const x1 = fromPct.x + 5;
  const y1 = fromPct.y + 5;
  const x2 = toPct.x + 5;
  const y2 = toPct.y + 5;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const perpX = -dy * 0.2;
  const perpY = dx * 0.2;
  return `M ${x1} ${y1} Q ${midX + perpX} ${midY + perpY}, ${x2} ${y2}`;
}

function generateLadderPaths(fromPct, toPct) {
  const x1 = fromPct.x + 3;
  const y1 = fromPct.y + 5;
  const x2 = toPct.x + 3;
  const y2 = toPct.y + 5;
  const x1r = fromPct.x + 7;
  const x2r = toPct.x + 7;

  const rungs = [];
  const steps = 4;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lx = x1 + (x2 - x1) * t;
    const ly = y1 + (y2 - y1) * t;
    const rx = x1r + (x2r - x1r) * t;
    const ry = y1 + (y2 - y1) * t;
    rungs.push(`M ${lx} ${ly} L ${rx} ${ry}`);
  }

  return {
    left: `M ${x1} ${y1} L ${x2} ${y2}`,
    right: `M ${x1r} ${y1} L ${x2r} ${y2}`,
    rungs
  };
}

export default GameBoard;
