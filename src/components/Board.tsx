import { Shield, Crown } from '../icons';
import React, { useMemo, memo, useState, useRef } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import { BoardState, DyingPiece, Piece, PlayerRole, Position, Scar } from '../types';
import { BOARD_SIZE, isCorner, isThrone, toAlgebraic } from '../utils/hnefataflEngine';
import { JUICE, scarOpacity } from '../utils/juice';
import { ROLE_META } from '../utils/roles';
import { PieceComponent } from './Piece';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position; piece?: Piece } | null;
  dyingPieces: DyingPiece[];
  scars: Scar[];
  moveCount: number;
  currentTurn: PlayerRole;
  showValidMoves: boolean;
  juiceEnabled: boolean;
  isEscapeThreat: boolean;
  onSelectPiece: (pos: Position) => void;
  onMovePiece: (to: Position) => void;
}

const cellKey = (r: number, c: number) => `${r},${c}`;
const positionSet = (positions: Position[]) => new Set(positions.map(({ r, c }) => cellKey(r, c)));

export const Board: React.FC<BoardProps> = memo(({
  board,
  selectedPos,
  validMoves,
  lastMove,
  dyingPieces,
  scars,
  moveCount,
  currentTurn,
  showValidMoves,
  juiceEnabled,
  isEscapeThreat,
  onSelectPiece,
  onMovePiece,
}) => {
  const [touchingCell, setTouchingCell] = useState<Position | null>(null);
  const [hoveredDragCell, setHoveredDragCell] = useState<Position | null>(null);
  const [focusedPos, setFocusedPos] = useState<Position | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);
  const isDraggingRef = useRef(false);
  const preventClickRef = useRef(false);

  const validMoveSet = useMemo(() => positionSet(validMoves), [validMoves]);
  const lastMoveSet = useMemo(
    () => positionSet(lastMove ? [lastMove.from, lastMove.to] : []),
    [lastMove]
  );
  const dyingByCell = useMemo(
    () => new Map(dyingPieces.map((dying) => [cellKey(dying.pos.r, dying.pos.c), dying.piece])),
    [dyingPieces]
  );
  /** Only the newest scar per square is drawn; a square can fall more than once. */
  const scarByCell = useMemo(() => {
    const map = new Map<string, Scar>();
    scars.forEach((scar) => map.set(cellKey(scar.r, scar.c), scar));
    return map;
  }, [scars]);

  const handleCellClick = (r: number, c: number) => {
    const piece = board[r][c];
    if (selectedPos && validMoveSet.has(cellKey(r, c))) {
      onMovePiece({ r, c });
      return;
    }
    if (piece && piece.role === currentTurn) {
      onSelectPiece({ r, c });
    } else {
      onSelectPiece({ r: -1, c: -1 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cur = focusedPos || selectedPos || { r: 5, c: 5 };
    let nr = cur.r;
    let nc = cur.c;

    switch (e.key) {
      case 'ArrowUp':
        nr = Math.max(0, cur.r - 1);
        break;
      case 'ArrowDown':
        nr = Math.min(BOARD_SIZE - 1, cur.r + 1);
        break;
      case 'ArrowLeft':
        nc = Math.max(0, cur.c - 1);
        break;
      case 'ArrowRight':
        nc = Math.min(BOARD_SIZE - 1, cur.c + 1);
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

    e.preventDefault();
    setFocusedPos({ r: nr, c: nc });
  };

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
    return {
      startX: fromX + Math.cos(angle) * 28,
      startY: fromY + Math.sin(angle) * 28,
      endX: toX - Math.cos(angle) * 34,
      endY: toY - Math.sin(angle) * 34,
      angleDeg: (angle * 180) / Math.PI,
    };
  }, [lastMove]);

  /**
   * Cells are around 30px on a phone, so an exact release is an unfair ask.
   * Accepts the closest legal destination within roughly one cell of the finger.
   */
  const snapToValidMove = (x: number, y: number): Position | null => {
    let best: { pos: Position; distance: number } | null = null;

    for (const move of validMoves) {
      const el = document.getElementById(`cell-${move.r}-${move.c}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      const reach = Math.max(rect.width, rect.height);
      if (distance <= reach && (!best || distance < best.distance)) {
        best = { pos: { r: move.r, c: move.c }, distance };
      }
    }

    return best?.pos ?? null;
  };

  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, r, c };
    isDraggingRef.current = false;
    setTouchingCell({ r, c });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dist = Math.hypot(touch.clientX - touchStartRef.current.x, touch.clientY - touchStartRef.current.y);
    if (dist <= 10) return;
    isDraggingRef.current = true;
    setTouchingCell(null);
    const cellEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-cell-pos]');
    const posStr = cellEl?.getAttribute('data-cell-pos');
    if (posStr) {
      const [tr, tc] = posStr.split(',').map(Number);
      setHoveredDragCell({ r: tr, c: tc });
    } else {
      setHoveredDragCell(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    setTouchingCell(null);
    const hovered = hoveredDragCell;
    setHoveredDragCell(null);
    preventClickRef.current = true;
    setTimeout(() => {
      preventClickRef.current = false;
    }, 350);

    if (isDraggingRef.current) {
      if (!selectedPos) return;
      if (hovered && validMoveSet.has(cellKey(hovered.r, hovered.c))) {
        onMovePiece({ r: hovered.r, c: hovered.c });
        return;
      }
      const touch = e.changedTouches[0];
      const snapped = touch ? snapToValidMove(touch.clientX, touch.clientY) : null;
      if (snapped) onMovePiece(snapped);
      return;
    }

    handleCellClick(start.r, start.c);
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    isDraggingRef.current = false;
    setTouchingCell(null);
    setHoveredDragCell(null);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-[620px] aspect-square mx-auto select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
    >
      <div className="w-full h-full p-0.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <LayoutGroup id="hnefatafl-board">
          <div className="relative grid grid-cols-11 grid-rows-11 gap-0.5 sm:gap-1 w-full h-full rounded-lg bg-slate-950 border border-slate-800 p-0.5 sm:p-1">
            {arrowData && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible p-0.5 sm:p-1" viewBox="0 0 1100 1100">
                <line x1={arrowData.startX} y1={arrowData.startY} x2={arrowData.endX} y2={arrowData.endY} stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.85" />
                <circle cx={arrowData.startX} cy={arrowData.startY} r="7" fill="#fbbf24" />
                <g transform={`translate(${arrowData.endX}, ${arrowData.endY}) rotate(${arrowData.angleDeg})`}>
                  <path d="M -18,-13 L 8,0 L -18,13 Z" fill="#f59e0b" />
                </g>
              </svg>
            )}

            {Array.from({ length: BOARD_SIZE }).map((_, r) =>
              Array.from({ length: BOARD_SIZE }).map((_, c) => {
                const piece = board[r][c];
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isFocused = focusedPos?.r === r && focusedPos?.c === c;
                const isValid = showValidMoves && validMoveSet.has(cellKey(r, c));
                const dyingPiece = dyingByCell.get(cellKey(r, c));
                const scar = scarByCell.get(cellKey(r, c));
                const isLandingCell = Boolean(lastMove && lastMove.to.r === r && lastMove.to.c === c);
                const isAlertKing = isEscapeThreat && piece?.type === 'king';
                const isLast = lastMoveSet.has(cellKey(r, c));
                const isCornerSquare = isCorner(r, c);
                const isThroneSquare = isThrone(r, c);
                const ghostPiece = lastMove?.piece || (lastMove ? board[lastMove.to.r]?.[lastMove.to.c] : null);
                const isGhostCell = Boolean(lastMove && lastMove.from.r === r && lastMove.from.c === c && !piece && ghostPiece);
                const isTouched = touchingCell?.r === r && touchingCell?.c === c;
                const isDragHovered = hoveredDragCell?.r === r && hoveredDragCell?.c === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    id={`cell-${r}-${c}`}
                    data-cell-pos={`${r},${c}`}
                    aria-label={`Square ${toAlgebraic(r, c)}${piece ? `, ${piece.role} ${piece.type}` : ''}`}
                    onClick={() => {
                      if (!preventClickRef.current) handleCellClick(r, c);
                    }}
                    onTouchStart={(e) => handleTouchStart(r, c, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                    className={`relative flex items-center justify-center rounded-md sm:rounded-lg transition-colors duration-100 cursor-pointer bg-slate-900/40 hover:bg-slate-800/50 ${
                      isFocused ? 'outline outline-2 outline-amber-300 outline-offset-[-2px] z-30' : ''
                    } ${
                      isTouched
                        ? 'bg-amber-500/25 z-20'
                        : isDragHovered && isValid
                        ? 'bg-amber-400/35 outline outline-2 outline-amber-300 outline-offset-[-2px] z-30'
                        : isSelected
                        ? 'outline outline-2 outline-amber-400 outline-offset-[-2px] bg-amber-500/10'
                        : isValid
                        ? 'bg-amber-400/15'
                        : isLast
                        ? 'bg-slate-800/70'
                        : ''
                    }`}
                  >
                    {!isCornerSquare && !isThroneSquare && !piece && <div className="w-1 h-1 rounded-full bg-slate-700/40" />}
                    {isCornerSquare && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/60 rounded-md sm:rounded-lg overflow-hidden">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 opacity-80" />
                      </div>
                    )}
                    {isThroneSquare && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-950/50 rounded-md sm:rounded-lg overflow-hidden">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/70" />
                      </div>
                    )}
                    {scar && (
                      <div
                        aria-hidden
                        className={`absolute inset-[22%] rounded-full pointer-events-none blur-[1px] ${ROLE_META[scar.role].scarClass}`}
                        style={{ opacity: scarOpacity(moveCount - scar.moveIndex) }}
                      />
                    )}
                    {isValid && <div className="absolute z-10 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" />}
                    {piece && (
                      <motion.div
                        key={piece.id}
                        layoutId={`piece-${piece.id}`}
                        layout
                        transition={{ type: 'spring', stiffness: 240, damping: 22.5, mass: 0.7 }}
                        className="w-full h-full p-0.5 sm:p-1 z-20 relative"
                      >
                        {/*
                          Squash lives on an inner element: animating scale on the
                          layoutId wrapper above would fight its shared-layout transform.
                        */}
                        <motion.div
                          className="w-full h-full"
                          animate={
                            isLandingCell && juiceEnabled
                              ? { scaleX: [1, JUICE.squash.scaleX, 1], scaleY: [1, JUICE.squash.scaleY, 1] }
                              : { scaleX: 1, scaleY: 1 }
                          }
                          transition={{ duration: JUICE.squash.durationMs / 1000, ease: 'easeOut' }}
                        >
                          <PieceComponent
                            type={piece.type}
                            role={piece.role}
                            isSelected={isSelected}
                            isAlert={isAlertKing}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                    <AnimatePresence>
                      {dyingPiece && (
                        <motion.div
                          key={`dying-${dyingPiece.id}`}
                          initial={{ scale: 1, rotate: 0, opacity: 1 }}
                          animate={{ scaleX: 1.35, scaleY: 0.35, rotate: 8, opacity: 0 }}
                          transition={{ duration: JUICE.deathMs / 1000, ease: 'easeIn' }}
                          className="absolute inset-0 w-full h-full p-0.5 sm:p-1 z-20 pointer-events-none"
                        >
                          <PieceComponent type={dyingPiece.type} role={dyingPiece.role} isCapturing />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                          <PieceComponent type={ghostPiece.type} role={ghostPiece.role} isGhost />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {dyingPiece && <div className="absolute inset-0 bg-rose-500/45 rounded-md z-10 pointer-events-none" />}
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
