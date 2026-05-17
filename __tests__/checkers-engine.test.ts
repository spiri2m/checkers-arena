import { describe, expect, it } from "vitest";
import type { Board, GameState, Piece } from "@/types";
import { getHardMove } from "@/lib/ai/checkers-ai";
import { getCompleteTurnMoves } from "@/lib/checkers/engine";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
}

describe("checkers engine search", () => {
  it("generates complete multi-capture turn moves", () => {
    const board = emptyBoard();
    board[2][1] = { id: "b1", color: "black", type: "man", position: { row: 2, col: 1 } };
    board[3][2] = { id: "w1", color: "white", type: "man", position: { row: 3, col: 2 } };
    board[5][4] = { id: "w2", color: "white", type: "man", position: { row: 5, col: 4 } };

    const moves = getCompleteTurnMoves(board, "black");

    expect(moves).toHaveLength(1);
    expect(moves[0].path).toEqual([
      { row: 2, col: 1 },
      { row: 4, col: 3 },
      { row: 6, col: 5 }
    ]);
    expect(moves[0].capturedPieceIds).toEqual(["w1", "w2"]);
  });

  it("hard AI prefers a longer capture sequence over a short capture", () => {
    const board = emptyBoard();
    board[2][1] = { id: "b1", color: "black", type: "man", position: { row: 2, col: 1 } };
    board[3][2] = { id: "w1", color: "white", type: "man", position: { row: 3, col: 2 } };
    board[5][4] = { id: "w2", color: "white", type: "man", position: { row: 5, col: 4 } };
    board[2][5] = { id: "b2", color: "black", type: "man", position: { row: 2, col: 5 } };
    board[3][6] = { id: "w3", color: "white", type: "man", position: { row: 3, col: 6 } };

    const gameState: GameState = {
      id: "engine-test",
      board,
      currentTurn: "black",
      mode: "ai",
      status: "playing",
      moveHistory: [],
      validMoves: [],
      aiDifficulty: "hard",
      startedAt: "2026-05-16T00:00:00.000Z"
    };

    const move = getHardMove(gameState);

    expect(move?.pieceId).toBe("b1");
    expect(move?.to).toEqual({ row: 4, col: 3 });
  });
});
