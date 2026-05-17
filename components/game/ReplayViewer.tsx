"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import type { Board, GameRecord, GameState, Move, Square } from "@/types";
import { analyzeGame } from "@/lib/coach/analysis";
import { applyMove, cloneBoard, createInitialBoard, isSameSquare, squareToLabel } from "@/lib/checkers/rules";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReplayViewer({ record }: { record: GameRecord }) {
  const [step, setStep] = useState(0);
  const initialBoard = useMemo(() => (record.initialBoard ? cloneBoard(record.initialBoard) : createInitialBoard()), [record.initialBoard]);
  const board = useMemo(() => {
    return record.moves.slice(0, step).reduce((currentBoard, move) => applyMove(currentBoard, move), cloneBoard(initialBoard));
  }, [initialBoard, record.moves, step]);
  const analysis = useMemo(() => analyzeGame(recordToGameState(record, initialBoard)), [initialBoard, record]);
  const currentMove = step > 0 ? record.moves[step - 1] : undefined;
  const currentReview = step > 0 ? analysis.reviews[step - 1] : undefined;

  return (
    <div className="space-y-3">
      <ReplayBoard board={board} actualMove={currentMove} bestMove={currentReview?.bestMove} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setStep(Math.max(0, step - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">
          Ход {step} / {record.moves.length}
        </div>
        <Button variant="outline" size="icon" onClick={() => setStep(Math.min(record.moves.length, step + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="rounded-md bg-muted p-3 text-sm">
        {currentMove ? (
          <div className="space-y-1">
            <div className="font-bold">
              Сыграно: {currentMove.notation} · {currentMove.player === "white" ? "белые" : "черные"}
            </div>
            <div className="text-muted-foreground">
              Лучший ход Coach: {currentReview?.bestMove?.notation ?? "не найден"}.
              {typeof currentReview?.loss === "number" ? ` Потеря оценки: ${Math.round(currentReview.loss * 10) / 10}.` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              Зеленая рамка показывает сыгранный ход, желтая пунктирная рамка показывает рекомендованный Coach ход.
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            Стартовая позиция {record.initialBoard ? "из песочницы" : "обычной партии"}. Листайте ходы, чтобы увидеть сравнение с Coach.
          </div>
        )}
      </div>
    </div>
  );
}

function ReplayBoard({ board, actualMove, bestMove }: { board: Board; actualMove?: Move; bestMove?: Move }) {
  return (
    <div className="grid aspect-square w-full max-w-sm grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border">
      {board.flatMap((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const square = { row: rowIndex, col: colIndex };
          const actual = actualMove && (isSameSquare(square, actualMove.from) || isSameSquare(square, actualMove.to));
          const best = bestMove && (isSameSquare(square, bestMove.from) || isSameSquare(square, bestMove.to));
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "relative grid min-h-0 place-items-center",
                (rowIndex + colIndex) % 2 === 1 ? "bg-[#7f1d1d]" : "bg-[#f3ead7]",
                actual && "outline outline-4 outline-amber-600 outline-offset-[-4px]",
                best && "after:absolute after:inset-1 after:rounded-sm after:border-2 after:border-dashed after:border-amber-300"
              )}
              title={squareToLabel(square)}
            >
              {piece ? (
                <span
                  className={cn(
                    "grid h-[56%] w-[56%] place-items-center rounded-full border shadow",
                    piece.color === "white" ? "border-stone-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-amber-300"
                  )}
                >
                  {piece.type === "king" ? <Crown className="h-3 w-3" /> : null}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function recordToGameState(record: GameRecord, initialBoard: Board): GameState {
  const board = record.moves.reduce((currentBoard, move) => applyMove(currentBoard, move), cloneBoard(initialBoard));
  return {
    id: record.id,
    board,
    initialBoard,
    currentTurn: record.moves.at(-1)?.player === "white" ? "black" : "white",
    mode: record.mode,
    status: record.status,
    winner: record.winner,
    moveHistory: record.moves,
    validMoves: [],
    aiDifficulty: record.aiDifficulty ?? "medium",
    startedAt: record.createdAt,
    endedAt: new Date(new Date(record.createdAt).getTime() + record.durationMs).toISOString()
  };
}
