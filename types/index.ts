export type PlayerColor = "white" | "black";
export type PieceType = "man" | "king";
export type GameMode = "local" | "ai" | "online" | "puzzle" | "sandbox";
export type GameStatus = "playing" | "finished" | "draw";
export type Difficulty = "easy" | "medium" | "hard";

export interface Square {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  color: PlayerColor;
  type: PieceType;
  position: Square;
}

export type Board = Array<Array<Piece | null>>;

export interface Move {
  id: string;
  pieceId: string;
  player: PlayerColor;
  from: Square;
  to: Square;
  path: Square[];
  captures: Square[];
  capturedPieceIds: string[];
  isCapture: boolean;
  promotion?: boolean;
  notation: string;
  createdAt: string;
  score?: number;
}

export interface GameState {
  id: string;
  board: Board;
  initialBoard?: Board;
  currentTurn: PlayerColor;
  mode: GameMode;
  status: GameStatus;
  winner?: PlayerColor;
  moveHistory: Move[];
  selectedPieceId?: string;
  validMoves: Move[];
  forcedPieceId?: string;
  aiDifficulty: Difficulty;
  startedAt: string;
  endedAt?: string;
  roomId?: string;
  timeLimitSeconds?: number;
  localPlayerColor?: PlayerColor;
  fromSandbox?: boolean;
  message?: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  avatar?: string;
  city?: string;
  country?: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface GameRecord {
  id: string;
  mode: GameMode;
  status: GameStatus;
  winner?: PlayerColor;
  initialBoard?: Board;
  fromSandbox?: boolean;
  moves: Move[];
  durationMs: number;
  createdAt: string;
  aiDifficulty?: Difficulty;
  playerWhite?: string;
  playerBlack?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Room {
  id: string;
  hostId?: string;
  guestId?: string;
  status: "waiting" | "playing" | "finished";
  board: Board;
  currentTurn: PlayerColor;
  createdAt: string;
  updatedAt: string;
}

export interface CoachInsight {
  type: "missed-capture" | "blunder" | "promotion" | "good" | "best-move" | "risk";
  title: string;
  description: string;
  moveId?: string;
  moveNumber?: number;
  notation?: string;
  bestMove?: string;
  evalDelta?: number;
}

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  pro?: boolean;
}

export interface SandboxSetup {
  id: string;
  title: string;
  description: string;
  board: Board;
  currentTurn: PlayerColor;
  tags: string[];
  createdAt?: string;
}
