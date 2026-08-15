import { Shield, Crown } from "../icons";
import React, { useMemo, memo, useState, useRef } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';

import {
  AccentColor,
  BoardState,
  GridStyle,
  Piece,
  PlayerRole,
  Position,
} from '../types';
import {
  BOARD_SIZE,
  isCorner,
  isThrone,
} from '../utils/hnefataflEngine';
import { PieceComponent } from './Piece';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position; piece?: Piece } | null;
  capturingPositions: Position[];
  currentTurn: PlayerRole;
  gridStyle: GridStyle;
  accentColor: AccentColor;
  showValidMoves: boolean;
  onSelectPiece: (pos: Position) => void;
  onMovePiece: (to: Position) => void;
}

export const Board: React.FC<BoardProps> = memo(({
  board,
  selectedPos,
  validMoves,
  lastMove,
  capturingPositions,
  currentTurn,
  gridStyle,
  accentColor,
  showValidMoves,
  onSelectPiece,
  onMovePiece,
}) => {
  // Touch feedback and drag vs tap tracking state
  const [touchingCell, setTouchingCell] = useState<{ r: number; c: number } | null>(null);
  const [hoveredDragCell, setHoveredDragCell] = useState<{ r: number; c: number } | null>(null);
  const [focusedPos, setFocusedPos] = useState<Position | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const preventClickRef = useRef<boolean>(false);

  // Keyboard navigation across the 11x11 grid
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cur = focusedPos || selectedPos || { r: 5, c: 5 };
    let nr = cur.r;
    let nc = cur.c;

    switch (e.key) {
      case 'ArrowUp':
        nr = Math.max(0, cur.r - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        nr = Math.min(BOARD_SIZE - 1, cur.r + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        nc = Math.max(0, cur.c - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        nc = Math.min(BOARD_SIZE - 1, cur.c + 1);
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        handleCellClick(cur.r, cur.c);
        e.preventDefault();
        return;
      case 'Escape':
        onSelectPiece({ r: -1, c: -1 });
        setFocusedPos(null);
        e.preventDefault();
        return;
      default:
        return;
    }

    setFocusedPos({ r: nr, c: nc });
  };

  // Fast O(1) set lookups for grid rendering
  const validMoveSet = useMemo(() => {
    const set = new Set<string>();
    if (showValidMoves) {
      validMoves.forEach(m => set.add(`${m.r},${m.c}`));
    }
    return set;
  }, [validMoves, showValidMoves]);

  const capturingSet = useMemo(() => {
    const set = new Set<string>();
    capturingPositions.forEach(p => set.add(`${p.r},${p.c}`));
    return set;
  }, [capturingPositions]);

  const lastMoveSet = useMemo(() => {
    const set = new Set<string>();
    if (lastMove) {
      set.add(`${lastMove.from.r},${lastMove.from.c}`);
      set.add(`${lastMove.to.r},${lastMove.to.c}`);
    }
    return set;
  }, [lastMove]);

  // Vector arrow calculations for last move visualization
  const arrowData = useMemo(() => {
    if (!lastMove) return null;
    const fromX = lastMove.from.c * 100 + 50;
    const fromY = lastMove.from.r * 100 + 50;
    const toX = lastMove.to.c * 100 + 50;
    const toY = lastMove.to.r * 100 + 50;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) return null;

    const angle = Math.atan2(dy, dx);
    const startOffset = 28;
    const endOffset = 34;

    const startX = fromX + Math.cos(angle) * startOffset;
    const startY = fromY + Math.sin(angle) * startOffset;
    const endX = toX - Math.cos(angle) * endOffset;
    const endY = toY - Math.sin(angle) * endOffset;

    return {
      startX,
      startY,
      endX,
      endY,
      angleDeg: (angle * 180) / Math.PI,
    };
  }, [lastMove]);

  const handleCellClick = (r: number, c: number) => {
    const piece = board[r][c];

    // If clicking a valid move destination for selected piece
    if (selectedPos && validMoveSet.has(`${r},${c}`)) {
      onMovePiece({ r, c });
      return;
    }

    // Otherwise select piece if it belongs to current player
    if (piece && piece.role === currentTurn) {
      onSelectPiece({ r, c });
    } else {
      // Clear selection if clicking empty square or opponent piece
      onSelectPiece({ r: -1, c: -1 });
    }
  };

  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      r,
      c,
    };
    isDraggingRef.current = false;
    setTouchingCell({ r, c });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    // If moved more than 10px, classify as a drag or scroll interaction
    if (dist > 10) {
      isDraggingRef.current = true;
      setTouchingCell(null); // Clear active tap highlight

      // Identify target cell under touch point
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cellEl = el?.closest('[data-cell-pos]');
      if (cellEl) {
        const posStr = cellEl.getAttribute('data-cell-pos');
        if (posStr) {
          const [tr, tc] = posStr.split(',').map(Number);
          setHoveredDragCell({ r: tr, c: tc });
          return;
        }
      }
      setHoveredDragCell(null);
    }
  };

  const handleTouchEnd = (r: number, c: number) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    setTouchingCell(null);

    const hovered = hoveredDragCell;
    setHoveredDragCell(null);

    // Suppress subsequent mouse click event generated by browser
    preventClickRef.current = true;
    setTimeout(() => {
      preventClickRef.current = false;
    }, 350);

    // If interaction was a drag or scroll gesture
    if (isDraggingRef.current) {
      // If dragged onto a valid destination cell for selected piece, perform move
      if (hovered && selectedPos && validMoveSet.has(`${hovered.r},${hovered.c}`)) {
        onMovePiece({ r: hovered.r, c: hovered.c });
      }
      // Otherwise, ignore drag to prevent accidental moves on mobile scroll
      return;
    }

    // Intentional tap on starting cell
    handleCellClick(start.r, start.c);
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    isDraggingRef.current = false;
    setTouchingCell(null);
    setHoveredDragCell(null);
  };

  const handleClick = (r: number, c: number) => {
    if (preventClickRef.current) return;
    handleCellClick(r, c);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-[620px] aspect-square mx-auto select-none outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg sm:rounded-2xl"
    >
      {/* Outer Nordic Slate Board Container */}
      <div className="w-full h-full p-0.5 sm:p-3 rounded-lg sm:rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        {/* 11x11 Grid Layout with Framer Motion LayoutGroup */}
        <LayoutGroup id="hnefatafl-board">
          <div className="relative grid grid-cols-11 grid-rows-11 gap-0.5 sm:gap-1 w-full h-full rounded-md sm:rounded-xl bg-slate-950/60 border border-slate-800/80 p-0.5 sm:p-1">
            {/* Previous Move Vector Arrow Overlay */}
            {arrowData && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible p-0.5 sm:p-1"
                viewBox="0 0 1100 1100"
              >
                <defs>
                  <filter id="move-arrow-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="move-arrow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Glowing Background Stroke */}
                <line
                  x1={arrowData.startX}
                  y1={arrowData.startY}
                  x2={arrowData.endX}
                  y2={arrowData.endY}
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeOpacity="0.35"
                  filter="url(#move-arrow-glow)"
                />

                {/* Animated Dashed Vector Line */}
                <line
                  x1={arrowData.startX}
                  y1={arrowData.startY}
                  x2={arrowData.endX}
                  y2={arrowData.endY}
                  stroke="url(#move-arrow-grad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="animate-knot-dash"
                />

                {/* Origin Circle Marker */}
                <circle
                  cx={arrowData.startX}
                  cy={arrowData.startY}
                  r="7"
                  fill="#fbbf24"
                  stroke="#78350f"
                  strokeWidth="2.5"
                  filter="url(#move-arrow-glow)"
                />

                {/* Destination Arrowhead */}
                <g transform={`translate(${arrowData.endX}, ${arrowData.endY}) rotate(${arrowData.angleDeg})`}>
                  <path
                    d="M -18,-13 L 8,0 L -18,13 Z"
                    fill="#f59e0b"
                    stroke="#fef3c7"
                    strokeWidth="2"
                    filter="url(#move-arrow-glow)"
                  />
                </g>
              </svg>
            )}

            {Array.from({ length: BOARD_SIZE }).map((_, r) =>
              Array.from({ length: BOARD_SIZE }).map((_, c) => {
                const piece = board[r][c];
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isFocused = focusedPos?.r === r && focusedPos?.c === c;
                const isValid = validMoveSet.has(`${r},${c}`);
                const isCapturing = capturingSet.has(`${r},${c}`);
                const isLast = lastMoveSet.has(`${r},${c}`);
                const isCornerSquare = isCorner(r, c);
                const isThroneSquare = isThrone(r, c);

                const ghostPiece = lastMove?.piece || (lastMove ? board[lastMove.to.r]?.[lastMove.to.c] : null);
                const isGhostCell = Boolean(lastMove && lastMove.from.r === r && lastMove.from.c === c && !piece && ghostPiece);

                const isTouched = touchingCell?.r === r && touchingCell?.c === c;
                const isDragHovered = hoveredDragCell?.r === r && hoveredDragCell?.c === c;

                const colLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'][c];
                const cellNotation = `${colLetter}${11 - r}`;

                return (
                  <div
                    key={`${r}-${c}`}
                    id={`cell-${r}-${c}`}
                    data-cell-pos={`${r},${c}`}
                    aria-label={`Square ${cellNotation}${piece ? `, ${piece.role} ${piece.type}` : ''}`}
                    onClick={() => handleClick(r, c)}
                    onTouchStart={(e) => handleTouchStart(r, c, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(r, c)}
                    onTouchCancel={handleTouchCancel}
                    className={`relative flex items-center justify-center rounded-md sm:rounded-lg transition-colors duration-100 cursor-pointer ${
                      gridStyle === 'dots'
                        ? 'bg-slate-900/40 hover:bg-slate-800/50'
                        : gridStyle === 'lines'
                        ? 'bg-slate-900/60 border border-slate-800/30 hover:bg-slate-800/60'
                        : 'bg-slate-950 hover:bg-slate-900/60'
                    } ${
                      isFocused
                        ? 'ring-2 ring-amber-400 border border-amber-300 z-30 shadow-lg shadow-amber-500/20'
                        : ''
                    } ${
                      isTouched
                        ? 'scale-95 bg-amber-500/30 border border-amber-400 ring-2 ring-amber-400/80 z-20'
                        : isDragHovered && isValid
                        ? 'scale-105 bg-amber-400/40 border-2 border-amber-300 ring-4 ring-amber-400/60 z-30'
                        : isSelected
                        ? 'ring-2 ring-amber-400 bg-amber-500/10 dark:bg-amber-400/15'
                        : isValid
                        ? 'bg-amber-400/20 dark:bg-amber-400/25 border border-amber-400/50'
                        : isLast
                        ? 'bg-slate-800/60 border border-slate-700/60'
                        : ''
                    }`}
                  >
                    {/* Subtle Grid Dot Accent */}
                    {gridStyle === 'dots' && !isCornerSquare && !isThroneSquare && !piece && (
                      <div className="w-1 h-1 rounded-full bg-slate-700/40" />
                    )}

                    {/* Corner Escape Refuge Indicator */}
                    {isCornerSquare && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/50 border border-cyan-500/30 rounded-md sm:rounded-lg overflow-hidden">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 opacity-80" />
                      </div>
                    )}

                    {/* Throne Center Square Indicator */}
                    {isThroneSquare && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-950/40 border border-amber-500/30 rounded-md sm:rounded-lg overflow-hidden">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/70" />
                      </div>
                    )}

                    {/* Valid Move Destination Marker */}
                    {isValid && (
                      <div className="absolute z-10 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-400/90 ring-2 ring-amber-500/40" />
                    )}

                    {/* Piece Rendering with Framer Motion Sliding Animation */}
                    {piece && (
                      <motion.div
                        key={piece.id}
                        layoutId={`piece-${piece.id}`}
                        layout
                        transition={{
                          type: 'spring',
                          stiffness: 240,
                          damping: 22.5,
                          mass: 0.7,
                        }}
                        className="w-full h-full p-0.5 sm:p-1 z-20 relative"
                      >
                        <PieceComponent
                          type={piece.type}
                          role={piece.role}
                          isSelected={isSelected}
                          isLastMoved={isLast}
                          accentColor={accentColor}
                          isCapturing={isCapturing}
                        />
                      </motion.div>
                    )}

                    {/* Ghost Piece at Previous Move Origin */}
                    <AnimatePresence>
                      {isGhostCell && ghostPiece && !piece && (
                        <motion.div
                          key={`ghost-${lastMove?.from.r}-${lastMove?.from.c}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.31 }}
                          className="w-full h-full p-0.5 sm:p-1 pointer-events-none z-10"
                        >
                          <PieceComponent
                            type={ghostPiece.type}
                            role={ghostPiece.role}
                            isGhost={true}
                            accentColor={accentColor}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Capturing Flash */}
                    {isCapturing && (
                      <div className="absolute inset-0 bg-rose-500/50 rounded-md z-20 pointer-events-none animate-ping" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
});

Board.displayName = 'Board';


