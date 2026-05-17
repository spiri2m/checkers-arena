import type { Board, Move, Piece, PlayerColor, Square } from "@/types";
import {
  applyMove,
  getCapturesForPiece,
  getPieceAt,
  getPieces,
  getValidMoves,
  squareToLabel
} from "@/lib/checkers/rules";

export interface EngineMove extends Move {
  firstStep: Move;
}

export function getCompleteTurnMoves(board: Board, playerColor: PlayerColor): EngineMove[] {
  const legalMoves = getValidMoves(board, playerColor);
  const captures = legalMoves.filter((move) => move.isCapture);

  if (!captures.length) {
    return legalMoves.map((move) => ({ ...move, firstStep: move }));
  }

  return captures.flatMap((move) => expandCaptureSequence(board, move, move));
}

export function applyEngineMove(board: Board, move: Move): Board {
  return applyMove(board, move);
}

function expandCaptureSequence(board: Board, firstStep: Move, currentMove: Move): EngineMove[] {
  const nextBoard = applyMove(board, currentMove);
  const movedPiece = getPieceAt(nextBoard, currentMove.to);
  const nextCaptures = movedPiece ? getCapturesForPiece(nextBoard, movedPiece) : [];

  if (!nextCaptures.length) {
    return [{ ...currentMove, firstStep }];
  }

  return nextCaptures.flatMap((nextCapture) =>
    expandCaptureSequence(nextBoard, firstStep, combineMoves(currentMove, nextCapture))
  );
}

function combineMoves(previous: Move, next: Move): Move {
  const path = [...previous.path, ...next.path.slice(1)];
  const captures = [...previous.captures, ...next.captures];
  const capturedPieceIds = [...previous.capturedPieceIds, ...next.capturedPieceIds];
  const notation = `${squareToLabel(previous.from)}${path
    .slice(1)
    .map((square) => `x${squareToLabel(square)}`)
    .join("")}${previous.promotion || next.promotion ? "=K" : ""}`;

  return {
    ...previous,
    id: `${previous.id}+${next.id}`,
    to: { ...next.to },
    path,
    captures,
    capturedPieceIds,
    promotion: previous.promotion || next.promotion,
    notation,
    createdAt: new Date().toISOString()
  };
}

export function countThreatenedPieces(board: Board, color: PlayerColor): number {
  const opponentCaptures = getPieces(board)
    .filter((piece) => piece.color !== color)
    .flatMap((piece) => getCapturesForPiece(board, piece));
  const threatened = new Set(opponentCaptures.flatMap((move) => move.capturedPieceIds));
  return threatened.size;
}

export function isBackRankGuard(piece: Piece): boolean {
  return (piece.color === "white" && piece.position.row === 7) || (piece.color === "black" && piece.position.row === 0);
}

export function distanceToPromotion(piece: Piece): number {
  if (piece.type === "king") return 0;
  return piece.color === "white" ? piece.position.row : 7 - piece.position.row;
}

export function landingSafety(board: Board, move: Move, color: PlayerColor): number {
  const nextBoard = applyMove(board, move);
  const movedPiece = getPieceAt(nextBoard, move.to);
  if (!movedPiece) return 0;

  const opponentCaptures = getPieces(nextBoard)
    .filter((piece) => piece.color !== color)
    .flatMap((piece) => getCapturesForPiece(nextBoard, piece));

  return opponentCaptures.some((capture) => capture.capturedPieceIds.includes(movedPiece.id)) ? -9 : 1;
}

export function pathToNotation(path: Square[], promotion?: boolean): string {
  return `${squareToLabel(path[0])}${path
    .slice(1)
    .map((square) => `x${squareToLabel(square)}`)
    .join("")}${promotion ? "=K" : ""}`;
}
