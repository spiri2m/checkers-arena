import type { Board, CoachInsight, GameState, Move, PlayerColor } from "@/types";
import { evaluateBoard, minimax } from "@/lib/ai/checkers-ai";
import { applyEngineMove, getCompleteTurnMoves, type EngineMove } from "@/lib/checkers/engine";
import { applyMove, createInitialBoard, getPieces, switchTurn } from "@/lib/checkers/rules";

export interface MoveReview {
  move: Move;
  moveNumber: number;
  player: PlayerColor;
  bestMove?: Move;
  evalBefore: number;
  evalAfter: number;
  bestEval?: number;
  loss: number;
  opponentBestCapture: number;
}

export function analyzeGame(gameState: GameState): { summary: string; insights: CoachInsight[]; reviews: MoveReview[] } {
  const reviews = reviewMoves(gameState);
  const insights: CoachInsight[] = [
    ...detectMissedCapturesFromReviews(reviews),
    ...detectBlunderMovesFromReviews(reviews),
    ...detectPromotionOpportunities(gameState),
    ...detectGoodMovesFromReviews(reviews),
    ...detectBestMoveAlternatives(reviews)
  ].slice(0, 8);

  return {
    summary: generateCoachSummary(gameState, reviews),
    insights,
    reviews
  };
}

export function detectMissedCaptures(gameState: GameState): CoachInsight[] {
  return detectMissedCapturesFromReviews(reviewMoves(gameState));
}

export function detectBlunderMoves(gameState: GameState): CoachInsight[] {
  return detectBlunderMovesFromReviews(reviewMoves(gameState));
}

export function detectPromotionOpportunities(gameState: GameState): CoachInsight[] {
  return getPieces(gameState.board)
    .filter((piece) => piece.type === "man" && (piece.position.row === 1 || piece.position.row === 6))
    .slice(0, 2)
    .map((piece) => ({
      type: "promotion",
      title: "Близко к дамке",
      description: `${piece.color === "white" ? "Белая" : "Черная"} шашка на линии ${8 - piece.position.row} может стать дамкой за один темп.`
    }));
}

export function detectGoodMoves(gameState: GameState): CoachInsight[] {
  return detectGoodMovesFromReviews(reviewMoves(gameState));
}

export function generateCoachSummary(gameState: GameState, existingReviews?: MoveReview[]): string {
  const reviews = existingReviews ?? reviewMoves(gameState);
  const captures = gameState.moveHistory.reduce((sum, move) => sum + move.capturedPieceIds.length, 0);
  const promotions = gameState.moveHistory.filter((move) => move.promotion).length;
  const blunders = reviews.filter((review) => review.loss >= 3.2).length;
  const goodMoves = reviews.filter((review) => review.loss <= 0.8 && (review.move.isCapture || review.move.promotion)).length;
  const winner = gameState.winner ? (gameState.winner === "white" ? "белые" : "черные") : "никто";

  if (gameState.status !== "finished") {
    return "После завершения партии ИИ-тренер сравнит ваши ходы с кандидатами движка и покажет риски, промахи и сильные решения.";
  }

  return `Победитель: ${winner}. В партии было ${captures} взятий, ${promotions} превращений, ${goodMoves} сильных решений и ${blunders} серьезных просадок по оценке. Главный фокус на следующую игру: перед тихим ходом проверь цепочки взятий соперника и путь к дамке.`;
}

export function getBestMoveHint(gameState: GameState): Move | null {
  const best = findBestMove(gameState.board, gameState.currentTurn);
  return best?.move.firstStep ?? null;
}

export function explainMoveRisk(gameState: GameState, move: Move): string {
  const nextBoard = applyMove(gameState.board, move);
  const opponentMoves = getCompleteTurnMoves(nextBoard, switchTurn(move.player));
  const bestCapture = Math.max(0, ...opponentMoves.map((candidate) => candidate.capturedPieceIds.length));

  return bestCapture >= 2
    ? "Риск: после этого хода соперник получает цепочку множественного взятия."
    : bestCapture === 1
      ? "Риск: после этого хода соперник может сразу забрать фигуру."
      : "Ход выглядит устойчиво: немедленного взятия у соперника не видно.";
}

function reviewMoves(gameState: GameState): MoveReview[] {
  let board = gameState.initialBoard ?? createInitialBoard();
  let turn: PlayerColor = "white";
  const reviews: MoveReview[] = [];

  for (const [index, move] of gameState.moveHistory.entries()) {
    const best = findBestMove(board, turn);
    const evalBefore = evaluateBoard(board, turn);
    const afterActual = applyMove(board, move);
    const evalAfter = evaluateBoard(afterActual, turn);
    const opponentMoves = getCompleteTurnMoves(afterActual, switchTurn(turn));
    const opponentBestCapture = Math.max(0, ...opponentMoves.map((candidate) => candidate.capturedPieceIds.length));
    const bestEval = best?.score;
    const loss = typeof bestEval === "number" ? Math.max(0, bestEval - evalAfter) : 0;

    reviews.push({
      move,
      moveNumber: index + 1,
      player: turn,
      bestMove: best?.move,
      evalBefore,
      evalAfter,
      bestEval,
      loss,
      opponentBestCapture
    });

    board = afterActual;
    turn = switchTurn(turn);
  }

  return reviews;
}

function findBestMove(board: Board, player: PlayerColor): { move: EngineMove; score: number } | null {
  const moves = getCompleteTurnMoves(board, player);
  if (!moves.length) return null;

  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of moves) {
    const nextBoard = applyEngineMove(board, move);
    const score =
      evaluateBoard(nextBoard, player) +
      minimax(nextBoard, 3, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false, switchTurn(player), player) * 0.15 +
      move.capturedPieceIds.length * 2.5 +
      (move.promotion ? 2 : 0);

    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }

  return { move: best, score: bestScore };
}

function detectMissedCapturesFromReviews(reviews: MoveReview[]): CoachInsight[] {
  return reviews
    .filter((review) => (review.bestMove?.capturedPieceIds.length ?? 0) > review.move.capturedPieceIds.length)
    .slice(0, 3)
    .map((review) => ({
      type: "missed-capture",
      title: "Упущенное взятие",
      description: `На ходу ${review.moveNumber} был сильнее вариант ${review.bestMove?.notation}. Сыграно ${review.move.notation}, и материальный баланс стал хуже.`,
      moveId: review.move.id,
      moveNumber: review.moveNumber,
      notation: review.move.notation,
      bestMove: review.bestMove?.notation,
      evalDelta: round(review.loss)
    }));
}

function detectBlunderMovesFromReviews(reviews: MoveReview[]): CoachInsight[] {
  return reviews
    .filter((review) => review.loss >= 3.2 || review.opponentBestCapture >= 2)
    .slice(0, 3)
    .map((review) => ({
      type: "blunder",
      title: "Критический риск",
      description:
        review.opponentBestCapture >= 2
          ? `После ${review.move.notation} соперник получает взятие из ${review.opponentBestCapture} фигур. Перед ходом проверь ответные диагонали.`
          : `${review.move.notation} проседает примерно на ${round(review.loss)} пункта оценки. Лучше смотрелся ${review.bestMove?.notation ?? "другой активный ход"}.`,
      moveId: review.move.id,
      moveNumber: review.moveNumber,
      notation: review.move.notation,
      bestMove: review.bestMove?.notation,
      evalDelta: round(review.loss)
    }));
}

function detectGoodMovesFromReviews(reviews: MoveReview[]): CoachInsight[] {
  return reviews
    .filter((review) => review.loss <= 0.8 && (review.move.isCapture || review.move.promotion || review.move.notation === review.bestMove?.notation))
    .slice(-3)
    .map((review) => ({
      type: "good",
      title: review.move.promotion ? "Сильное превращение" : "Хорошее решение",
      description: `${review.move.notation} почти совпадает с кандидатом движка и сохраняет оценку позиции.`,
      moveId: review.move.id,
      moveNumber: review.moveNumber,
      notation: review.move.notation,
      bestMove: review.bestMove?.notation,
      evalDelta: round(review.loss)
    }));
}

function detectBestMoveAlternatives(reviews: MoveReview[]): CoachInsight[] {
  return reviews
    .filter((review) => review.bestMove && review.bestMove.notation !== review.move.notation && review.loss >= 1.4)
    .slice(0, 2)
    .map((review) => ({
      type: "best-move",
      title: "Лучший ход был рядом",
      description: `На ходу ${review.moveNumber} ИИ-тренер предпочел ${review.bestMove?.notation} вместо ${review.move.notation}. Разница оценки: ${round(review.loss)}.`,
      moveId: review.move.id,
      moveNumber: review.moveNumber,
      notation: review.move.notation,
      bestMove: review.bestMove?.notation,
      evalDelta: round(review.loss)
    }));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
