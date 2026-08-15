export type PieceType = 'attacker' | 'defender' | 'king';

export type PlayerRole = 'attackers' | 'defenders';

export const STARTING_SOLDIER_COUNTS: Record<PlayerRole, number> = {
  attackers: 24,
  defenders: 12,
};

export const VICTORY_REASON: Record<PlayerRole, string> = {
  attackers: 'The King has been captured!',
  defenders: 'The King has escaped to safety!',
};

export interface Piece {
  id: string;
  type: PieceType;
  role: PlayerRole;
}

export type CellState = Piece | null;

export type BoardState = CellState[][];

export interface Position {
  r: number;
  c: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captures: Position[];
  timestamp: number;
  notation: string;
  /** Optional so older saves and un-updated online clients stay readable. */
  saga?: string;
}

/** A piece caught mid-death, kept on screen after the board has already moved on. */
export interface DyingPiece {
  pos: Position;
  piece: Piece;
}

/** The mark a captured piece leaves behind for the rest of the match. */
export interface Scar {
  r: number;
  c: number;
  role: PlayerRole;
  moveIndex: number;
}

export interface MovePayload {
  from: Position;
  to: Position;
  board?: BoardState;
  nextTurn?: PlayerRole;
  moveRecord?: Move;
}

export interface PieceCounts {
  attackers: number;
  defenders: number;
  hasKing: boolean;
  capturedAttackers: number;
  capturedDefenders: number;
}

export const DISPLAY_NAME_MAX = 16;

export interface LobbyUser {
  id: string;
  username: string;
  joinedAt: number;
  inQueue: boolean;
  roomId?: string;
  signedIn?: boolean;
  photoURL?: string | null;
}

export interface OnlineMatchState {
  roomId: string | null;
  role: PlayerRole | null;
  isMaster: boolean;
  opponentId: string | null;
  opponentName: string | null;
  isConnected: boolean;
  inQueue: boolean;
  username: string;
  uid: string | null;
  isSignedIn: boolean;
}

export type GameStatus = 'playing' | 'defenders_win' | 'attackers_win' | 'draw';

export interface GameSettings {
  soundEnabled: boolean;
  showValidMoves: boolean;
  juiceEnabled: boolean;
}

export interface GameStats {
  defendersWins: number;
  attackersWins: number;
  totalGames: number;
  totalMoves: number;
  fastestWinMoves: number | null;
  onlineWins: number;
  onlineLosses: number;
  onlineDraws: number;
}

export const EMPTY_STATS: GameStats = {
  defendersWins: 0,
  attackersWins: 0,
  totalGames: 0,
  totalMoves: 0,
  fastestWinMoves: null,
  onlineWins: 0,
  onlineLosses: 0,
  onlineDraws: 0,
};

export const EMPTY_ONLINE: OnlineMatchState = {
  roomId: null,
  role: null,
  isMaster: false,
  opponentId: null,
  opponentName: null,
  isConnected: false,
  inQueue: false,
  username: '',
  uid: null,
  isSignedIn: false,
};

export const CLEAR_MATCH = {
  roomId: null,
  role: null,
  isMaster: false,
  opponentId: null,
  opponentName: null,
  inQueue: false,
} as const;

export type MatchWinner = 'attackers' | 'defenders' | 'draw';
export type PersonalResult = 'win' | 'loss' | 'draw';

export interface RoomPlayer {
  displayName: string;
  joinedAt: number;
  ready?: boolean;
}

export interface RoomResult {
  winner: MatchWinner;
  moveCount: number;
  writtenBy: string;
}

export interface LiveRoom {
  status: 'waiting' | 'playing' | 'finished';
  hostUid: string;
  createdAt: number;
  players: Record<string, RoomPlayer>;
  roles: Record<string, PlayerRole>;
  lastMove?: MovePayload | null;
  lastMoveBy?: string | null;
  lastMoveAt?: number | null;
  state?: { board: BoardState; currentTurn: PlayerRole } | null;
  restartAt?: number | null;
  result?: RoomResult | null;
}

export interface MatchFound {
  roomId: string;
  role: PlayerRole;
  isMaster: boolean;
  opponentId: string | null;
  opponentName: string | null;
  createdAt: number;
}

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  googleName: string | null;
  stats: GameStats;
}
