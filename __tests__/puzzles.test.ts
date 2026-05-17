import { describe, expect, it } from "vitest";
import { puzzles } from "@/lib/puzzles/puzzles";
import { applyMove, getCapturesForPiece, getPieceAt, getValidMoves, isSameSquare } from "@/lib/checkers/rules";

describe("puzzle bank", () => {
  it("contains advanced multi-step puzzles", () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(18);
    expect(puzzles.filter((puzzle) => puzzle.solution.length >= 4).length).toBeGreaterThanOrEqual(6);
    expect(puzzles.some((puzzle) => puzzle.difficulty === "expert")).toBe(true);
  });

  it("has legal solution paths for every puzzle", () => {
    for (const puzzle of puzzles) {
      let board = puzzle.board;
      let moves = getValidMoves(board, puzzle.turn).filter((move) => move.pieceId === getPieceAt(board, puzzle.solution[0])?.id);

      for (let step = 1; step < puzzle.solution.length; step += 1) {
        const move = moves.find((candidate) => isSameSquare(candidate.to, puzzle.solution[step]));
        expect(move, `${puzzle.id} step ${step}`).toBeDefined();
        board = applyMove(board, move!);
        const movedPiece = getPieceAt(board, move!.to);
        moves = movedPiece && move!.isCapture ? getCapturesForPiece(board, movedPiece) : [];
      }
    }
  });
});
