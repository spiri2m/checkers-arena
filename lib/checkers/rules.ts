import type { Board, GameState, Move, Piece, PlayerColor, Square } from "@/types";

const BOARD_SIZE = 8;
const MAN_DIRECTIONS: Record<PlayerColor, Square[]> = {
  white: [
    { row: -1, col: -1 },
    { row: -1, col: 1 }
  ],
  black: [
    { row: 1, col: -1 },
    { row: 1, col: 1 }
  ]
};
const CAPTURE_DIRECTIONS: Square[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 }
];

export function createInitialBoard(): Board {
  const board = Array.from({ length: BOARD_SIZE }, () => Array<Piece | null>(BOARD_SIZE).fill(null));

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!isDarkSquare({ row, col })) continue;
      if (row < 3) {
        board[row][col] = {
          id: `black-${row}-${col}`,
          color: "black",
          type: "man",
          position: { row, col }
        };
      }
      if (row > 4) {
        board[row][col] = {
          id: `white-${row}-${col}`,
          color: "white",
          type: "man",
          position: { row, col }
        };
      }
    }
  }

  return board;
}

export function getValidMoves(board: Board, playerColor: PlayerColor): Move[] {
  const pieces = getPieces(board).filter((piece) => piece.color === playerColor);
  const captures = pieces.flatMap((piece) => getCapturesForPiece(board, piece));

  if (captures.length > 0) {
    return captures;
  }

  return pieces.flatMap((piece) => getQuietMovesForPiece(board, piece));
}

export function getValidMovesForPiece(board: Board, piece: Piece): Move[] {
  const allCaptures = getPieces(board)
    .filter((candidate) => candidate.color === piece.color)
    .flatMap((candidate) => getCapturesForPiece(board, candidate));

  if (allCaptures.length > 0) {
    return allCaptures.filter((move) => move.pieceId === piece.id);
  }

  return [...getQuietMovesForPiece(board, piece), ...getCapturesForPiece(board, piece)];
}

export function getCapturesForPiece(board: Board, piece: Piece): Move[] {
  if (piece.type === "king") {
    return getKingCaptures(board, piece);
  }

  return CAPTURE_DIRECTIONS.flatMap((direction) => {
    const middle = addSquares(piece.position, direction);
    const landing = addSquares(piece.position, { row: direction.row * 2, col: direction.col * 2 });
    const captured = getPieceAt(board, middle);

    if (!isInsideBoard(landing) || !captured || captured.color === piece.color || getPieceAt(board, landing)) {
      return [];
    }

    return [createMove(piece, landing, [middle], [captured.id])];
  });
}

export function hasMandatoryCapture(board: Board, playerColor: PlayerColor): boolean {
  return getPieces(board)
    .filter((piece) => piece.color === playerColor)
    .some((piece) => getCapturesForPiece(board, piece).length > 0);
}

export function applyMove(board: Board, move: Move): Board {
  const nextBoard = cloneBoard(board);
  const piece = getPieceAt(nextBoard, move.from);

  if (!piece) {
    return nextBoard;
  }

  nextBoard[move.from.row][move.from.col] = null;

  for (const capturedSquare of move.captures) {
    nextBoard[capturedSquare.row][capturedSquare.col] = null;
  }

  const movedPiece: Piece = {
    ...piece,
    position: { ...move.to }
  };
  const promotedPiece = promoteIfNeeded(movedPiece, move.to);
  nextBoard[move.to.row][move.to.col] = promotedPiece;

  return nextBoard;
}

export function promoteIfNeeded(piece: Piece, targetSquare: Square): Piece {
  if (piece.type === "king") return piece;
  if (piece.color === "white" && targetSquare.row === 0) {
    return { ...piece, type: "king" };
  }
  if (piece.color === "black" && targetSquare.row === BOARD_SIZE - 1) {
    return { ...piece, type: "king" };
  }
  return piece;
}

export function switchTurn(currentTurn: PlayerColor): PlayerColor {
  return currentTurn === "white" ? "black" : "white";
}

export function checkWinner(board: Board, currentTurn: PlayerColor): PlayerColor | null {
  const currentPieces = getPieces(board).filter((piece) => piece.color === currentTurn);
  if (currentPieces.length === 0) {
    return switchTurn(currentTurn);
  }

  if (getValidMoves(board, currentTurn).length === 0) {
    return switchTurn(currentTurn);
  }

  const opponent = switchTurn(currentTurn);
  const opponentPieces = getPieces(board).filter((piece) => piece.color === opponent);
  if (opponentPieces.length === 0) {
    return currentTurn;
  }

  return null;
}

export function serializeGameState(gameState: GameState): string {
  return JSON.stringify(gameState);
}

export function deserializeGameState(data: string): GameState {
  return JSON.parse(data) as GameState;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((piece) =>
      piece
        ? {
            ...piece,
            position: { ...piece.position }
          }
        : null
    )
  );
}

export function getPieces(board: Board): Piece[] {
  return board.flat().filter((piece): piece is Piece => Boolean(piece));
}

export function getPieceAt(board: Board, square: Square): Piece | null {
  if (!isInsideBoard(square)) return null;
  return board[square.row][square.col];
}

export function isInsideBoard(square: Square): boolean {
  return square.row >= 0 && square.row < BOARD_SIZE && square.col >= 0 && square.col < BOARD_SIZE;
}

export function isSameSquare(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col;
}

export function squareToLabel(square: Square): string {
  return `${String.fromCharCode(97 + square.col)}${BOARD_SIZE - square.row}`;
}

function getQuietMovesForPiece(board: Board, piece: Piece): Move[] {
  if (piece.type === "king") {
    return getKingQuietMoves(board, piece);
  }

  return MAN_DIRECTIONS[piece.color].flatMap((direction) => {
    const target = addSquares(piece.position, direction);
    if (!isInsideBoard(target) || getPieceAt(board, target)) {
      return [];
    }
    return [createMove(piece, target, [], [])];
  });
}

function getKingQuietMoves(board: Board, piece: Piece): Move[] {
  const moves: Move[] = [];

  for (const direction of CAPTURE_DIRECTIONS) {
    let target = addSquares(piece.position, direction);
    while (isInsideBoard(target) && !getPieceAt(board, target)) {
      moves.push(createMove(piece, target, [], []));
      target = addSquares(target, direction);
    }
  }

  return moves;
}

function getKingCaptures(board: Board, piece: Piece): Move[] {
  const captures: Move[] = [];

  for (const direction of CAPTURE_DIRECTIONS) {
    let cursor = addSquares(piece.position, direction);
    let captured: Piece | null = null;

    while (isInsideBoard(cursor)) {
      const occupant = getPieceAt(board, cursor);

      if (!occupant && captured) {
        captures.push(createMove(piece, cursor, [captured.position], [captured.id]));
      }

      if (occupant) {
        if (occupant.color === piece.color || captured) {
          break;
        }
        captured = occupant;
      }

      cursor = addSquares(cursor, direction);
    }
  }

  return captures;
}

function addSquares(square: Square, delta: Square): Square {
  return {
    row: square.row + delta.row,
    col: square.col + delta.col
  };
}

function createMove(piece: Piece, to: Square, captures: Square[], capturedPieceIds: string[]): Move {
  const isCapture = captures.length > 0;
  const promotion =
    piece.type === "man" &&
    ((piece.color === "white" && to.row === 0) || (piece.color === "black" && to.row === BOARD_SIZE - 1));

  return {
    id: `${piece.id}-${piece.position.row}-${piece.position.col}-${to.row}-${to.col}-${capturedPieceIds.join(".")}`,
    pieceId: piece.id,
    player: piece.color,
    from: { ...piece.position },
    to: { ...to },
    path: [{ ...piece.position }, { ...to }],
    captures: captures.map((square) => ({ ...square })),
    capturedPieceIds,
    isCapture,
    promotion,
    notation: `${squareToLabel(piece.position)}${isCapture ? "x" : "-"}${squareToLabel(to)}${promotion ? "=K" : ""}`,
    createdAt: new Date().toISOString()
  };
}

function isDarkSquare(square: Square): boolean {
  return (square.row + square.col) % 2 === 1;
}
