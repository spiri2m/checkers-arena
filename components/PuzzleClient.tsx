"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Crown, Target, XCircle } from "lucide-react";
import type { Board, Move, Piece, Square } from "@/types";
import { dailyPuzzle, puzzles, type Puzzle } from "@/lib/puzzles/puzzles";
import { applyMove, getCapturesForPiece, getPieceAt, getValidMoves, isSameSquare } from "@/lib/checkers/rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Feedback = "idle" | "correct" | "wrong" | "solved";

export function PuzzleClient() {
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>(dailyPuzzle);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Задачи • Daily Challenge</p>
        <h1 className="text-3xl font-black">Тактические задачи</h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Набор задач</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-2 overflow-auto pr-1">
            {puzzles.map((puzzle) => (
              <Button
                key={puzzle.id}
                className="h-auto w-full justify-start py-3 text-left"
                variant={activePuzzle.id === puzzle.id ? "default" : "outline"}
                onClick={() => setActivePuzzle(puzzle)}
              >
                <Target className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate">{puzzle.title}</span>
                  <span className="block text-xs opacity-75">{difficultyLabel(puzzle.difficulty)} · {puzzle.motif}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
        <PuzzleBoard key={activePuzzle.id} puzzle={activePuzzle} />
      </div>
    </div>
  );
}

function PuzzleBoard({ puzzle }: { puzzle: Puzzle }) {
  const [board, setBoard] = useState<Board>(puzzle.board);
  const [selected, setSelected] = useState<Piece | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [message, setMessage] = useState("Выберите фигуру и найдите лучший ход.");
  const solved = step >= puzzle.solution.length;

  const moveTargets = useMemo(() => new Set(moves.map((move) => `${move.to.row}-${move.to.col}`)), [moves]);

  function flash(next: Feedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback((current) => (current === next ? "idle" : current)), 800);
  }

  function handleSquare(square: Square) {
    if (solved) return;

    const targetMove = moves.find((move) => isSameSquare(move.to, square));
    if (targetMove) {
      const expectedTarget = puzzle.solution[step];
      if (!isSameSquare(targetMove.to, expectedTarget)) {
        setMessage("Ход допустимый, но задача просит лучший маршрут. Попробуйте другую клетку.");
        flash("wrong");
        return;
      }

      const nextBoard = applyMove(board, targetMove);
      const movedPiece = getPieceAt(nextBoard, targetMove.to);
      const nextCaptures = movedPiece && targetMove.isCapture ? getCapturesForPiece(nextBoard, movedPiece) : [];
      const nextStep = step + 1;

      setBoard(nextBoard);
      setStep(nextStep);
      setSelected(movedPiece);
      setMoves(nextStep < puzzle.solution.length ? nextCaptures : []);
      setMessage(nextStep >= puzzle.solution.length ? "Верно. Задача решена." : "Верно. Продолжите цепочку тем же маршрутом.");
      setFeedback(nextStep >= puzzle.solution.length ? "solved" : "correct");
      return;
    }

    const piece = getPieceAt(board, square);
    const expectedStart = puzzle.solution[0];
    if (!piece || piece.color !== puzzle.turn || (step === 1 && !isSameSquare(square, expectedStart))) {
      setMessage("Это не стартовая фигура лучшего решения.");
      flash("wrong");
      return;
    }

    const legalMoves = step === 1 ? getValidMoves(board, puzzle.turn) : getCapturesForPiece(board, piece);
    setSelected(piece);
    setMoves(legalMoves.filter((move) => move.pieceId === piece.id));
    setMessage("Теперь выберите целевую клетку.");
    flash("correct");
  }

  function reset() {
    setBoard(puzzle.board);
    setSelected(null);
    setMoves([]);
    setStep(1);
    setFeedback("idle");
    setMessage("Выберите фигуру и найдите лучший ход.");
  }

  return (
    <Card className={cn(feedback === "solved" && "ring-2 ring-primary", feedback === "wrong" && "ring-2 ring-destructive")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {feedback === "wrong" ? <XCircle className="h-5 w-5 text-destructive" /> : solved ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Target className="h-5 w-5 text-primary" />}
          {puzzle.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-[minmax(0,440px)_1fr]">
        <div className="grid aspect-square w-full max-w-[440px] grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border">
          {board.flatMap((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "relative grid min-h-0 place-items-center",
                    (rowIndex + colIndex) % 2 === 1 ? "bg-[#7f1d1d]" : "bg-[#f3ead7]",
                    selected?.id === piece?.id && "outline outline-4 outline-accent outline-offset-[-4px]",
                    moveTargets.has(key) && "after:absolute after:h-4 after:w-4 after:rounded-full after:bg-primary",
                    feedback === "solved" && "brightness-110",
                    feedback === "wrong" && "saturate-50"
                  )}
                  onClick={() => handleSquare({ row: rowIndex, col: colIndex })}
                >
                  {piece ? <PuzzlePiece piece={piece} /> : null}
                </button>
              );
            })
          )}
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">{puzzle.description}</p>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <Meta label="Сложность" value={difficultyLabel(puzzle.difficulty)} />
            <Meta label="Мотив" value={puzzle.motif} />
            <Meta label="Источник" value={puzzle.source} />
          </div>
          <div
            className={cn(
              "rounded-md p-3 text-sm font-semibold",
              feedback === "wrong" ? "bg-destructive/10 text-destructive" : feedback === "correct" || feedback === "solved" ? "bg-primary/10 text-primary" : "bg-muted"
            )}
          >
            {message}
          </div>
          <Button variant="outline" onClick={reset}>
            Сбросить задачу
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

function difficultyLabel(difficulty: Puzzle["difficulty"]): string {
  if (difficulty === "easy") return "Легкая";
  if (difficulty === "medium") return "Средняя";
  if (difficulty === "hard") return "Сложная";
  return "Эксперт";
}

function PuzzlePiece({ piece }: { piece: Piece }) {
  return (
    <span
      className={cn(
        "grid h-[72%] w-[72%] place-items-center rounded-full border-2 shadow",
        piece.color === "white" ? "border-stone-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-amber-300"
      )}
    >
      {piece.type === "king" ? <Crown className="h-4 w-4" /> : null}
    </span>
  );
}
