import { BoardState, PlayerRole, Position } from '../types';

export type AIDifficulty = 'thrall' | 'karl' | 'jarl';
import {
  BOARD_SIZE,
  CORNER_POSITIONS,
  executeMove,
  findKing,
  getValidMoves,
  isCorner,
} from './hnefataflEngine';

interface EvaluatedMove {
  from: Position;
  to: Position;
  score: number;
}

/**
 * Gets best AI move for current turn role
 */
export function getAIMove(
  board: BoardState,
  role: PlayerRole,
  difficulty: AIDifficulty
): { from: Position; to: Position } | null {
  const allMoves = getAllLegalMoves(board, role);
  if (allMoves.length === 0) return null;

  // Easy Difficulty (Thrall) - Simple heuristic + 30% randomness
  if (difficulty === 'thrall') {
    if (Math.random() < 0.35) {
      const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      return { from: randomMove.from, to: randomMove.to };
    }
  }

  const depth = difficulty === 'thrall' ? 1 : difficulty === 'karl' ? 2 : 3;

  let bestMove: { from: Position; to: Position } | null = null;
  let bestScore = role === 'attackers' ? -Infinity : Infinity;
  const isMaximizing = role === 'attackers';

  let alpha = -Infinity;
  let beta = Infinity;

  // Shuffle move order slightly for non-deterministic variety among equal moves
  const shuffledMoves = [...allMoves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    const { newBoard, captured } = executeMove(board, move.from, move.to);
    
    // Quick win check
    const kingPos = findKing(newBoard);
    if (role === 'defenders' && kingPos && isCorner(kingPos.r, kingPos.c)) {
      return { from: move.from, to: move.to };
    }
    if (role === 'attackers' && !kingPos) {
      return { from: move.from, to: move.to };
    }

    const score = minimax(
      newBoard,
      depth - 1,
      !isMaximizing,
      alpha,
      beta,
      role === 'attackers' ? 'defenders' : 'attackers'
    );

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to };
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to };
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  return bestMove || { from: shuffledMoves[0].from, to: shuffledMoves[0].to };
}

/**
 * Minimax algorithm with Alpha-Beta Pruning
 */
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  currentTurn: PlayerRole
): number {
  const kingPos = findKing(board);

  // Terminal state evaluation
  if (!kingPos) return 10000; // Attackers won (Maximizing = Attackers)
  if (isCorner(kingPos.r, kingPos.c)) return -10000; // Defenders won (Minimizing = Defenders)

  if (depth === 0) {
    return evaluateBoard(board);
  }

  const moves = getAllLegalMoves(board, currentTurn);
  if (moves.length === 0) {
    // Current player has no moves -> Loss for current player
    return currentTurn === 'attackers' ? -10000 : 10000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard } = executeMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, false, alpha, beta, 'defenders');
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard } = executeMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, true, alpha, beta, 'attackers');
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Evaluates board state. Positive score favors Attackers; Negative score favors Defenders.
 */
function evaluateBoard(board: BoardState): number {
  let score = 0;

  let attackerCount = 0;
  let defenderCount = 0;
  let kingPos: Position | null = null;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;

      if (p.type === 'attacker') attackerCount++;
      else if (p.type === 'defender') defenderCount++;
      else if (p.type === 'king') kingPos = { r, c };
    }
  }

  if (!kingPos) return 10000; // Attackers win
  if (isCorner(kingPos.r, kingPos.c)) return -10000; // Defenders win

  // 1. Piece Count Weight
  score += attackerCount * 12;
  score -= defenderCount * 22; // Defenders are more valuable piece for piece

  // 2. King Distance to Nearest Corner Refuge
  let minDistanceToCorner = Infinity;
  for (const corner of CORNER_POSITIONS) {
    const dist = Math.abs(kingPos.r - corner.r) + Math.abs(kingPos.c - corner.c);
    minDistanceToCorner = Math.min(minDistanceToCorner, dist);
  }
  score -= (20 - minDistanceToCorner) * 15; // Closer to corner = lower score (favors defenders)

  // 3. King Escape Paths (Direct line to corner or board edge)
  const kingMoves = getValidMoves(board, kingPos);
  let openCornerEscapes = 0;
  for (const m of kingMoves) {
    if (isCorner(m.r, m.c)) openCornerEscapes++;
  }

  if (openCornerEscapes > 0) {
    score -= openCornerEscapes * 800; // Major threat for defenders
  }

  score -= kingMoves.length * 8; // King mobility

  // 4. Attacker Surround Threats on King
  const kingNeighbors = [
    { r: kingPos.r - 1, c: kingPos.c },
    { r: kingPos.r + 1, c: kingPos.c },
    { r: kingPos.r, c: kingPos.c - 1 },
    { r: kingPos.r, c: kingPos.c + 1 },
  ];

  let surroundingAttackers = 0;
  for (const n of kingNeighbors) {
    if (n.r >= 0 && n.r < BOARD_SIZE && n.c >= 0 && n.c < BOARD_SIZE) {
      if (board[n.r][n.c]?.role === 'attackers') {
        surroundingAttackers++;
      }
    }
  }
  score += surroundingAttackers * 45; // Attackers surrounding King = higher score

  return score;
}

/**
 * Gets all legal moves for a player role
 */
function getAllLegalMoves(board: BoardState, role: PlayerRole): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.role === role) {
        const validDests = getValidMoves(board, { r, c });
        for (const to of validDests) {
          moves.push({ from: { r, c }, to });
        }
      }
    }
  }

  return moves;
}
