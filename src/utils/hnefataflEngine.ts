import {
  BoardState,
  CellState,
  Piece,
  PieceCounts,
  PlayerRole,
  Position,
  STARTING_SOLDIER_COUNTS,
  VICTORY_REASON,
} from '../types';

export const BOARD_SIZE = 11;
export const THRONE_POS: Position = { r: 5, c: 5 };
export const CORNER_POSITIONS: Position[] = [
  { r: 0, c: 0 },
  { r: 0, c: 10 },
  { r: 10, c: 0 },
  { r: 10, c: 10 },
];
export const DIRECTIONS = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
] as const;
export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const;

export function isCorner(r: number, c: number): boolean {
  return CORNER_POSITIONS.some((p) => p.r === r && p.c === c);
}

export function isThrone(r: number, c: number): boolean {
  return r === THRONE_POS.r && c === THRONE_POS.c;
}

export function toAlgebraic(r: number, c: number): string {
  return `${COL_LETTERS[c]}${BOARD_SIZE - r}`;
}

export function emptyBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, () => Array<CellState>(BOARD_SIZE).fill(null));
}

export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;
  const r = (value as Position).r;
  const c = (value as Position).c;
  return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function cellAt(board: BoardState, r: number, c: number): CellState {
  return board[r]?.[c] ?? null;
}

export function serializeBoard(board: BoardState): (Piece | 0)[][] {
  return hydrateBoard(board).map((row) => row.map((cell) => cell ?? 0));
}

export function hydrateBoard(raw: unknown): BoardState {
  const board = emptyBoard();
  if (!raw || typeof raw !== 'object') return board;
  const rows = raw as Record<string, unknown>;
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = rows[r];
    if (!row || typeof row !== 'object') continue;
    const cells = row as Record<string, unknown>;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = cells[c];
      if (cell && typeof cell === 'object' && 'type' in cell && 'role' in cell) {
        board[r][c] = cell as Piece;
      }
    }
  }
  return board;
}

export function createInitialBoard(): BoardState {
  const board = emptyBoard();

  let pieceId = 1;

  // King at (5,5)
  board[5][5] = { id: `k_${pieceId++}`, type: 'king', role: 'defenders' };

  // Defenders (12 pieces around King)
  const defenderPositions: Position[] = [
    { r: 3, c: 5 },
    { r: 4, c: 4 }, { r: 4, c: 5 }, { r: 4, c: 6 },
    { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 6 }, { r: 5, c: 7 },
    { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 },
    { r: 7, c: 5 },
  ];

  defenderPositions.forEach(({ r, c }) => {
    board[r][c] = { id: `d_${pieceId++}`, type: 'defender', role: 'defenders' };
  });

  // Attackers (24 pieces on 4 edges)
  const attackerPositions: Position[] = [
    // Top
    { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 0, c: 6 }, { r: 0, c: 7 },
    { r: 1, c: 5 },
    // Bottom
    { r: 10, c: 3 }, { r: 10, c: 4 }, { r: 10, c: 5 }, { r: 10, c: 6 }, { r: 10, c: 7 },
    { r: 9, c: 5 },
    // Left
    { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 6, c: 0 }, { r: 7, c: 0 },
    { r: 5, c: 1 },
    // Right
    { r: 3, c: 10 }, { r: 4, c: 10 }, { r: 5, c: 10 }, { r: 6, c: 10 }, { r: 7, c: 10 },
    { r: 5, c: 9 },
  ];

  attackerPositions.forEach(({ r, c }) => {
    board[r][c] = { id: `a_${pieceId++}`, type: 'attacker', role: 'attackers' };
  });

  return board;
}

/**
 * Calculates valid moves for a piece at (fromR, fromC)
 */
export function getValidMoves(board: BoardState, from: Position): Position[] {
  if (!isPosition(from)) return [];
  const grid = hydrateBoard(board);
  const piece = cellAt(grid, from.r, from.c);
  if (!piece) return [];

  const validMoves: Position[] = [];

  for (const dir of DIRECTIONS) {
    let nr = from.r + dir.r;
    let nc = from.c + dir.c;

    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      // Check if square is occupied
      if (cellAt(grid, nr, nc) !== null) {
        break;
      }

      // Check special square rules
      if (isCorner(nr, nc)) {
        // Only King can land on Corners
        if (piece.type === 'king') {
          validMoves.push({ r: nr, c: nc });
        }
        break; // Cannot pass through corner
      }

      if (isThrone(nr, nc)) {
        // Only King can land on Throne
        if (piece.type === 'king') {
          validMoves.push({ r: nr, c: nc });
        }
        // Non-king pieces can pass through empty throne, so we don't break, but non-king cannot land on it
        nr += dir.r;
        nc += dir.c;
        continue;
      }

      validMoves.push({ r: nr, c: nc });
      nr += dir.r;
      nc += dir.c;
    }
  }

  return validMoves;
}

/**
 * Helper to check if a square acts as hostile to a given player role
 */
export function isSquareHostile(
  board: BoardState,
  r: number,
  c: number,
  targetRole: PlayerRole
): boolean {
  // Corner squares are hostile to all pieces
  if (isCorner(r, c)) return true;

  // Empty throne is hostile to all non-king pieces
  const occupant = cellAt(board, r, c);
  if (isThrone(r, c) && occupant === null) return true;

  const piece = occupant;
  if (piece && piece.role !== targetRole) {
    return true;
  }

  return false;
}

/**
 * Executes a move on the board and calculates captured pieces.
 * Returns new board state and array of captured positions.
 */
export function executeMove(
  board: BoardState,
  from: Position,
  to: Position
): { newBoard: BoardState; captured: Position[] } {
  const newBoard = hydrateBoard(board);
  if (!isPosition(from) || !isPosition(to)) return { newBoard, captured: [] };
  const piece = cellAt(newBoard, from.r, from.c);
  if (!piece) return { newBoard, captured: [] };

  newBoard[from.r][from.c] = null;
  newBoard[to.r][to.c] = piece;

  const captured: Position[] = [];

  for (const dir of DIRECTIONS) {
    const adjR = to.r + dir.r;
    const adjC = to.c + dir.c;

    if (adjR < 0 || adjR >= BOARD_SIZE || adjC < 0 || adjC >= BOARD_SIZE) continue;

    const targetPiece = newBoard[adjR][adjC];
    if (!targetPiece || targetPiece.role === piece.role) continue;

    // KING CAPTURE HANDLING
    if (targetPiece.type === 'king') {
      if (checkKingCaptured(newBoard, { r: adjR, c: adjC })) {
        captured.push({ r: adjR, c: adjC });
      }
      continue;
    }

    // REGULAR PIECE CUSTODIAL CAPTURE
    const oppR = adjR + dir.r;
    const oppC = adjC + dir.c;

    if (oppR >= 0 && oppR < BOARD_SIZE && oppC >= 0 && oppC < BOARD_SIZE) {
      if (isSquareHostile(newBoard, oppR, oppC, targetPiece.role)) {
        captured.push({ r: adjR, c: adjC });
      }
    }
  }

  // Remove captured pieces from board
  captured.forEach(({ r, c }) => {
    newBoard[r][c] = null;
  });

  return { newBoard, captured };
}

/**
 * Checks if the King at position kingPos is captured.
 * King on/adjacent to Throne requires 4-sided surround.
 * King elsewhere requires standard 2-sided surround.
 */
export function checkKingCaptured(board: BoardState, kingPos: Position): boolean {
  const { r, c } = kingPos;
  const onOrNextToThrone = Math.abs(r - 5) + Math.abs(c - 5) <= 1;

  if (onOrNextToThrone) {
    let hostileCount = 0;
    for (const dir of DIRECTIONS) {
      const nr = r + dir.r;
      const nc = c + dir.c;

      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) {
        // Edge acts as hostile for king on/near throne or not? Usually edge is not hostile unless corner
        continue;
      }

      if (isThrone(nr, nc) && cellAt(board, nr, nc) === null) {
        hostileCount++;
      } else {
        const p = cellAt(board, nr, nc);
        if (p && p.role === 'attackers') {
          hostileCount++;
        }
      }
    }
    return hostileCount === 4;
  } else {
    // Standard 2-sided capture on open board
    for (let i = 0; i < 2; i++) {
      const d1 = DIRECTIONS[i];
      const d2 = DIRECTIONS[i + 2];

      const r1 = r + d1.r, c1 = c + d1.c;
      const r2 = r + d2.r, c2 = c + d2.c;

      if (r1 >= 0 && r1 < BOARD_SIZE && c1 >= 0 && c1 < BOARD_SIZE &&
          r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE) {
        
        const h1 = isSquareHostile(board, r1, c1, 'defenders');
        const h2 = isSquareHostile(board, r2, c2, 'defenders');

        if (h1 && h2) return true;
      }
    }
    return false;
  }
}

/**
 * Finds current position of the King
 */
export function findKing(board: BoardState): Position | null {
  const grid = hydrateBoard(board);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c]?.type === 'king') {
        return { r, c };
      }
    }
  }
  return null;
}

/**
 * Checks overall win conditions:
 * - Defenders win if King is in a Corner square or Attackers have no moves
 * - Attackers win if King is captured or Defenders have no moves
 */
export function checkGameStatus(
  board: BoardState,
  currentTurn: PlayerRole
): { status: 'playing' | 'defenders_win' | 'attackers_win' | 'draw'; reason?: string } {
  const grid = hydrateBoard(board);
  const kingPos = findKing(grid);

  // If King missing -> Attackers win
  if (!kingPos) {
    return { status: 'attackers_win', reason: VICTORY_REASON.attackers };
  }

  // If King in Corner -> Defenders win
  if (isCorner(kingPos.r, kingPos.c)) {
    return { status: 'defenders_win', reason: VICTORY_REASON.defenders };
  }

  // Check if current turn player has any valid moves
  let hasValidMoves = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = grid[r][c];
      if (p && p.role === currentTurn) {
        const moves = getValidMoves(grid, { r, c });
        if (moves.length > 0) {
          hasValidMoves = true;
          break;
        }
      }
    }
    if (hasValidMoves) break;
  }

  if (!hasValidMoves) {
    if (currentTurn === 'attackers') {
      return { status: 'defenders_win', reason: 'Attackers have no legal moves remaining.' };
    } else {
      return { status: 'attackers_win', reason: 'Defenders have no legal moves remaining.' };
    }
  }

  return { status: 'playing' };
}

/**
 * Formats move into algebraic notation (e.g., F6 -> F10)
 */
export function formatNotation(from: Position, to: Position, piece: Piece): string {
  const symbol = piece.type === 'king' ? 'K' : piece.role === 'attackers' ? 'A' : 'D';
  return `${symbol} ${toAlgebraic(from.r, from.c)} → ${toAlgebraic(to.r, to.c)}`;
}

/**
 * Counts total active and captured pieces on the board
 */
export function countPieces(board: BoardState): PieceCounts {
  const grid = hydrateBoard(board);
  let attackers = 0;
  let defenders = 0;
  let hasKing = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = grid[r][c];
      if (!p) continue;
      if (p.role === 'attackers') attackers++;
      else if (p.role === 'defenders') {
        if (p.type === 'king') hasKing = true;
        else defenders++;
      }
    }
  }

  return {
    attackers,
    defenders,
    hasKing,
    capturedAttackers: STARTING_SOLDIER_COUNTS.attackers - attackers,
    capturedDefenders: STARTING_SOLDIER_COUNTS.defenders - defenders,
  };
}

/**
 * Checks if the King has a direct, open straight-line path to any corner escape refuge
 */
export function isKingThreatened(board: BoardState): boolean {
  const kingPos = findKing(board);
  if (!kingPos) return false;
  if (isCorner(kingPos.r, kingPos.c)) return false;

  const validKingMoves = getValidMoves(board, kingPos);
  return validKingMoves.some(pos => isCorner(pos.r, pos.c));
}

