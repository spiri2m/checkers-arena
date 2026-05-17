"use client";

import type { Piece as PieceType, Square as SquareType } from "@/types";
import { Piece } from "@/components/game/Piece";
import { cn } from "@/lib/utils";

interface SquareProps {
  square: SquareType;
  piece: PieceType | null;
  selected?: boolean;
  possibleMove?: boolean;
  possibleCapture?: boolean;
  onClick: () => void;
  lightClass: string;
  darkClass: string;
  pieceSkin: string;
}

export function Square({
  square,
  piece,
  selected,
  possibleMove,
  possibleCapture,
  onClick,
  lightClass,
  darkClass,
  pieceSkin
}: SquareProps) {
  const dark = (square.row + square.col) % 2 === 1;

  return (
    <button
      type="button"
      aria-label={`Клетка ${square.row + 1}-${square.col + 1}`}
      onClick={onClick}
      className={cn(
        "relative grid aspect-square place-items-center overflow-hidden transition",
        dark ? darkClass : lightClass,
        selected && "outline outline-4 outline-accent outline-offset-[-4px]",
        possibleMove && "after:absolute after:h-5 after:w-5 after:rounded-full after:border-2 after:border-white after:bg-sky-500 after:shadow-[0_0_0_3px_rgba(2,6,23,0.45)]",
        possibleCapture && "before:absolute before:inset-2 before:rounded-md before:border-4 before:border-sky-400 before:bg-sky-400/18 before:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)]"
      )}
    >
      {piece ? <Piece piece={piece} selected={selected} skin={pieceSkin} /> : null}
    </button>
  );
}
