import { describe, expect, it } from "vitest";
import type { Board, Piece } from "@/types";
import {
  applyMove,
  checkWinner,
  createInitialBoard,
  deserializeGameState,
  getCapturesForPiece,
  getPieces,
  getValidMoves,
  hasMandatoryCapture,
  serializeGameState
} from "@/lib/checkers/rules";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
}

describe("checkers rules", () => {
  it("creates a standard 8x8 board with 24 pieces", () => {
    const board = createInitialBoard();
    expect(board).toHaveLength(8);
    expect(board[0]).toHaveLength(8);
    expect(getPieces(board)).toHaveLength(24);
  });

  it("allows opening diagonal moves for white", () => {
    const board = createInitialBoard();
    const moves = getValidMoves(board, "white");
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => !move.isCapture)).toBe(true);
  });

  it("enforces mandatory capture over quiet moves", () => {
    const board = emptyBoard();
    board[5][0] = { id: "w1", color: "white", type: "man", position: { row: 5, col: 0 } };
    board[4][1] = { id: "b1", color: "black", type: "man", position: { row: 4, col: 1 } };
    board[5][4] = { id: "w2", color: "white", type: "man", position: { row: 5, col: 4 } };

    const moves = getValidMoves(board, "white");

    expect(hasMandatoryCapture(board, "white")).toBe(true);
    expect(moves).toHaveLength(1);
    expect(moves[0].isCapture).toBe(true);
    expect(moves[0].to).toEqual({ row: 3, col: 2 });
  });

  it("removes captured pieces and promotes on the final rank", () => {
    const board = emptyBoard();
    board[2][1] = { id: "w1", color: "white", type: "man", position: { row: 2, col: 1 } };
    board[1][2] = { id: "b1", color: "black", type: "man", position: { row: 1, col: 2 } };

    const move = getCapturesForPiece(board, board[2][1]!).find((candidate) => candidate.to.row === 0);
    expect(move).toBeDefined();

    const nextBoard = applyMove(board, move!);
    expect(nextBoard[1][2]).toBeNull();
    expect(nextBoard[0][3]?.type).toBe("king");
  });

  it("detects winner when current player has no legal moves", () => {
    const board = emptyBoard();
    board[0][1] = { id: "b1", color: "black", type: "man", position: { row: 0, col: 1 } };

    expect(checkWinner(board, "white")).toBe("black");
  });

  it("supports multi-capture continuation for a man", () => {
    const board = emptyBoard();
    board[5][0] = { id: "w1", color: "white", type: "man", position: { row: 5, col: 0 } };
    board[4][1] = { id: "b1", color: "black", type: "man", position: { row: 4, col: 1 } };
    board[2][3] = { id: "b2", color: "black", type: "man", position: { row: 2, col: 3 } };

    const firstMove = getValidMoves(board, "white")[0];
    const afterFirst = applyMove(board, firstMove);
    const movedPiece = afterFirst[3][2];
    const nextCaptures = getCapturesForPiece(afterFirst, movedPiece!);

    expect(firstMove.to).toEqual({ row: 3, col: 2 });
    expect(nextCaptures).toHaveLength(1);
    expect(nextCaptures[0].to).toEqual({ row: 1, col: 4 });
  });

  it("lets kings move multiple diagonal squares and enforces king captures", () => {
    const board = emptyBoard();
    board[5][0] = { id: "wk", color: "white", type: "king", position: { row: 5, col: 0 } };
    board[3][2] = { id: "b1", color: "black", type: "man", position: { row: 3, col: 2 } };
    board[5][4] = { id: "w1", color: "white", type: "man", position: { row: 5, col: 4 } };

    const moves = getValidMoves(board, "white");

    expect(moves.every((move) => move.isCapture)).toBe(true);
    expect(moves.some((move) => move.pieceId === "wk" && move.to.row === 2 && move.to.col === 3)).toBe(true);
    expect(moves.some((move) => move.pieceId === "w1")).toBe(false);
  });

  it("blocks a king by friendly pieces on the same diagonal", () => {
    const board = emptyBoard();
    board[5][0] = { id: "wk", color: "white", type: "king", position: { row: 5, col: 0 } };
    board[4][1] = { id: "w1", color: "white", type: "man", position: { row: 4, col: 1 } };

    const moves = getValidMoves(board, "white").filter((move) => move.pieceId === "wk");

    expect(moves.some((move) => move.to.row === 3 && move.to.col === 2)).toBe(false);
  });

  it("serializes and restores a game state", () => {
    const gameState = {
      id: "game-1",
      board: createInitialBoard(),
      currentTurn: "white" as const,
      mode: "local" as const,
      status: "playing" as const,
      moveHistory: [],
      validMoves: [],
      aiDifficulty: "medium" as const,
      startedAt: "2026-05-16T00:00:00.000Z"
    };

    const restored = deserializeGameState(serializeGameState(gameState));

    expect(restored.id).toBe("game-1");
    expect(restored.board[5][0]?.color).toBe("white");
    expect(restored.currentTurn).toBe("white");
  });
});
