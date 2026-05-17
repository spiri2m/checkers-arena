import type { Board, Difficulty, GameState, Move, PlayerColor } from "@/types";
import { applyMove, checkWinner, getPieces, getValidMoves, switchTurn } from "@/lib/checkers/rules";
import {
  applyEngineMove,
  countThreatenedPieces,
  distanceToPromotion,
  type EngineMove,
  getCompleteTurnMoves,
  isBackRankGuard,
  landingSafety
} from "@/lib/checkers/engine";

const PIECE_VALUES = {
  man: 3,
  king: 8
};

export function getAIMove(gameState: GameState, difficulty: Difficulty): Move | null {
  if (difficulty === "easy") return getRandomMove(gameState);
  if (difficulty === "medium") return getMediumMove(gameState);
  return getHardMove(gameState);
}

export function getRandomMove(gameState: GameState): Move | null {
  const moves = getValidMoves(gameState.board, gameState.currentTurn);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export function getMediumMove(gameState: GameState): Move | null {
  const moves = getValidMoves(gameState.board, gameState.currentTurn);
  if (moves.length === 0) return null;

  return [...moves]
    .map((move) => ({
      ...move,
      score: scoreMove(gameState.board, move, gameState.currentTurn)
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

export function getHardMove(gameState: GameState): Move | null {
  const aiColor = gameState.currentTurn;
  const moves = getCompleteTurnMoves(gameState.board, aiColor);
  if (moves.length === 0) return null;
  const pieceCount = getPieces(gameState.board).length;
  const hasKing = getPieces(gameState.board).some((piece) => piece.type === "king");
  const depth = hasKing ? 3 : pieceCount > 14 ? 3 : pieceCount > 8 ? 4 : 5;
  const deadline = Date.now() + 280;
  const candidateMoves = orderEngineMoves(moves, gameState.board, aiColor).slice(0, hasKing ? 6 : 12);

  let bestMove = candidateMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of candidateMoves) {
    if (Date.now() > deadline) break;
    const board = applyEngineMove(gameState.board, move);
    const score =
      minimax(board, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false, switchTurn(aiColor), aiColor, deadline) +
      scoreEngineMove(gameState.board, move, aiColor);
    if (score > bestScore) {
      bestScore = score;
      bestMove = { ...move, score };
    }
  }

  return { ...bestMove.firstStep, score: bestScore };
}

export function evaluateBoard(board: Board, aiColor: PlayerColor): number {
  const material = getPieces(board).reduce((score, piece) => {
    const base = PIECE_VALUES[piece.type];
    const advancement = piece.type === "man" ? (7 - distanceToPromotion(piece)) * 0.22 : 0;
    const center = piece.position.col >= 2 && piece.position.col <= 5 ? 0.35 : 0;
    const backRank = isBackRankGuard(piece) ? 0.3 : 0;
    const edgePenalty = piece.position.col === 0 || piece.position.col === 7 ? -0.12 : 0;
    const value = base + advancement + center + backRank + edgePenalty;
    return score + (piece.color === aiColor ? value : -value);
  }, 0);
  const mobility = (getCompleteTurnMoves(board, aiColor).length - getCompleteTurnMoves(board, switchTurn(aiColor)).length) * 0.08;
  const threats = (countThreatenedPieces(board, switchTurn(aiColor)) - countThreatenedPieces(board, aiColor)) * 1.2;
  return material + mobility + threats;
}

export function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  currentTurn: PlayerColor = "black",
  aiColor: PlayerColor = "black",
  deadline = Number.POSITIVE_INFINITY
): number {
  if (Date.now() > deadline) {
    return evaluateBoard(board, aiColor);
  }

  const winner = checkWinner(board, currentTurn);
  if (winner) {
    return winner === aiColor ? 10_000 + depth : -10_000 - depth;
  }

  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }

  const hasKing = getPieces(board).some((piece) => piece.type === "king");
  const moves = orderEngineMoves(getCompleteTurnMoves(board, currentTurn), board, currentTurn).slice(0, hasKing ? 6 : 12);
  if (moves.length === 0) {
    return currentTurn === aiColor ? -10_000 - depth : 10_000 + depth;
  }

  if (maximizingPlayer) {
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      bestScore = Math.max(
        bestScore,
        minimax(applyEngineMove(board, move), depth - 1, alpha, beta, false, switchTurn(currentTurn), aiColor, deadline)
      );
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return bestScore;
  }

  let bestScore = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    bestScore = Math.min(
     bestScore,
      minimax(applyEngineMove(board, move), depth - 1, alpha, beta, true, switchTurn(currentTurn), aiColor, deadline)
    );
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return bestScore;
}

function orderEngineMoves(moves: EngineMove[], board: Board, color: PlayerColor): EngineMove[] {
  return moves
    .map((move) => ({ move, score: scoreEngineMove(board, move, color) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.move);
}

function scoreMove(board: Board, move: Move, aiColor: PlayerColor): number {
  const nextBoard = applyMove(board, move);
  const capturedScore = move.capturedPieceIds.length * 8;
  const promotionScore = move.promotion ? 5 : 0;
  const mobility = getValidMoves(nextBoard, switchTurn(aiColor)).length * -0.18;
  return evaluateBoard(nextBoard, aiColor) + capturedScore + promotionScore + mobility;
}

function scoreEngineMove(board: Board, move: Move, aiColor: PlayerColor): number {
  const nextBoard = applyEngineMove(board, move);
  const opponentMoves = getCompleteTurnMoves(nextBoard, switchTurn(aiColor));
  const worstOpponentCapture = Math.max(0, ...opponentMoves.map((candidate) => candidate.capturedPieceIds.length));
  const captureScore = move.capturedPieceIds.length * 9;
  const promotionScore = move.promotion ? 6 : 0;
  const safety = landingSafety(board, move, aiColor);
  return captureScore + promotionScore + safety - worstOpponentCapture * 7;
}
