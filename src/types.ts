/**
 * Hnefatafl (Viking Chess) Type Definitions
 */

export type PieceType = 'attacker' | 'defender' | 'king';

export type PlayerRole = 'attackers' | 'defenders';

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
}

export type GameMode = 'local' | 'online';

export interface LobbyUser {
  id: string;
  username: string;
  joinedAt: number;
  inQueue: boolean;
  roomId?: string;
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
}

export type ThemeMode = 'dark' | 'light';

export type AccentColor = 'amber' | 'teal' | 'emerald' | 'ruby' | 'nordic';

export type GridStyle = 'dots' | 'lines' | 'minimal';

export type GameStatus = 'playing' | 'defenders_win' | 'attackers_win' | 'draw';

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  gridStyle: GridStyle;
  accentColor: AccentColor;
  showValidMoves: boolean;
}

export interface GameStats {
  defendersWins: number;
  attackersWins: number;
  totalGames: number;
  totalMoves: number;
  fastestWinMoves: number | null;
}
