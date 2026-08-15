import { BoardState, Move, Piece, Position } from '../types';
import { isCorner, isKingThreatened, isThrone, toAlgebraic } from './hnefataflEngine';

/**
 * Turns a move into a line of saga rather than a coordinate pair.
 *
 * Every line is chosen from what actually happened on the board: who fell, where
 * the piece landed, whether the king's road opened. Flavour that ignores the
 * position is the same hollowness as no flavour at all, so nothing here is
 * picked at random from a generic pool.
 */

interface MoveContext {
  from: Position;
  to: Position;
  piece: Piece;
  captures: Position[];
  /** Board state after the move resolved. */
  board: BoardState;
}

function nearThrone({ r, c }: Position): boolean {
  return Math.abs(r - 5) + Math.abs(c - 5) <= 1;
}

function fallen(count: number): string {
  if (count === 1) return 'one warrior fell';
  if (count === 2) return 'two were cut down';
  if (count === 3) return 'three shields broke';
  return `${count} fell in the press`;
}

export function describeMove({ from, to, piece, captures, board }: MoveContext): string {
  const square = toAlgebraic(to.r, to.c);
  const origin = toAlgebraic(from.r, from.c);
  const isKing = piece.type === 'king';
  const kills = captures.length;

  if (isKing && isCorner(to.r, to.c)) {
    return `The king reached the refuge at ${square}. The siege is broken.`;
  }

  if (isKing && kills > 0) {
    return `The king struck from ${origin} to ${square}, and ${fallen(kills)}.`;
  }

  if (kills > 0) {
    const side = piece.role === 'attackers' ? 'The besiegers' : 'The king\u2019s guard';
    if (kills > 1) {
      return `${side} closed on ${square} and ${fallen(kills)}.`;
    }
    return `${side} took ${square}, and ${fallen(kills)}.`;
  }

  if (isKing) {
    if (isThrone(to.r, to.c)) return `The king returned to the throne at ${square}.`;
    if (isKingThreatened(board)) return `The king moved to ${square}, and the road to the corners lies open.`;
    return `The king slipped from ${origin} to ${square}.`;
  }

  if (isThrone(from.r, from.c)) {
    return `A guard stepped off the throne toward ${square}.`;
  }

  if (nearThrone(to)) {
    const side = piece.role === 'attackers' ? 'A besieger pressed in to' : 'A guard drew close at';
    return `${side} ${square}, beside the throne.`;
  }

  if (isKingThreatened(board)) {
    const side = piece.role === 'attackers' ? 'The besiegers shifted to' : 'The guard wheeled to';
    return `${side} ${square}, but the king\u2019s road still lies open.`;
  }

  const quiet = piece.role === 'attackers' ? 'A besieger advanced to' : 'A guard held the line at';
  return `${quiet} ${square}.`;
}

/**
 * Single place a Move record is built, so notation, saga, and captures can never
 * drift apart between the local and remote move paths.
 */
export function hydrateMove(move: Move): Move {
  return { ...move, captures: Array.isArray(move.captures) ? move.captures : [] };
}

export function createMoveRecord(
  context: MoveContext,
  notation: string,
  timestamp = Date.now()
): Move {
  return {
    from: context.from,
    to: context.to,
    piece: context.piece,
    captures: context.captures,
    timestamp,
    notation,
    saga: describeMove(context),
  };
}
