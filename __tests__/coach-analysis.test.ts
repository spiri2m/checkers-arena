import { describe, expect, it } from "vitest";
import type { Board, GameState, Move, Piece } from "@/types";
import { analyzeGame } from "@/lib/coach/analysis";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
}

describe("AI coach analysis", () => {
  it("flags a quiet move when a stronger capture was available", () => {
    const board = emptyBoard();
    board[5][0] = { id: "w1", color: "white", type: "man", position: { row: 5, col: 0 } };
    board[2][1] = { id: "b1", color: "black", type: "man", position: { row: 2, col: 1 } };
    board[3][2] = { id: "w2", color: "white", type: "man", position: { row: 3, col: 2 } };
    board[5][4] = { id: "w3", color: "white", type: "man", position: { row: 5, col: 4 } };

    const quietMove: Move = {
      id: "quiet",
      pieceId: "w1",
      player: "white",
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
      path: [
        { row: 5, col: 0 },
        { row: 4, col: 1 }
      ],
      captures: [],
      capturedPieceIds: [],
      isCapture: false,
      notation: "a3-b4",
      createdAt: "2026-05-16T00:00:10.000Z"
    };

    const gameState: GameState = {
      id: "coach-test",
      board,
      initialBoard: board,
      currentTurn: "black",
      mode: "local",
      status: "finished",
      winner: "black",
      moveHistory: [quietMove],
      validMoves: [],
      aiDifficulty: "medium",
      startedAt: "2026-05-16T00:00:00.000Z",
      endedAt: "2026-05-16T00:01:00.000Z"
    };

    const analysis = analyzeGame(gameState);

    expect(analysis.insights.some((insight) => insight.type === "missed-capture" || insight.type === "best-move")).toBe(true);
    expect(analysis.summary).toContain("Победитель");
  });
});
