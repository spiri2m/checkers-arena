"use client";

import { useMemo } from "react";
import type { BoardTheme } from "@/types";
import { Square } from "@/components/game/Square";
import { useGameStore } from "@/store/game-store";

const boardThemes: BoardTheme[] = [
  { id: "classic", name: "Classic", light: "bg-[#f3ead7]", dark: "bg-[#7f1d1d]" },
  { id: "arena", name: "Club", light: "bg-[#e7dec8]", dark: "bg-[#27272a]" },
  { id: "ice", name: "Ice Pro", light: "bg-[#e0f2fe]", dark: "bg-[#075985]", pro: true }
];

export function Board() {
  const game = useGameStore((state) => state.game);
  const selectSquare = useGameStore((state) => state.selectSquare);
  const settings = useGameStore((state) => state.settings);
  const theme = boardThemes.find((candidate) => candidate.id === settings.boardTheme) ?? boardThemes[0];

  const highlights = useMemo(
    () =>
      new Map(
        game.validMoves.map((move) => [
          `${move.to.row}-${move.to.col}`,
          {
            capture: move.isCapture
          }
        ])
      ),
    [game.validMoves]
  );

  return (
    <section className="mx-auto w-full max-w-[min(94vw,680px)]">
      <div className="board-shadow grid aspect-square grid-cols-8 overflow-hidden rounded-lg border-4 border-card bg-card">
        {game.board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const highlight = highlights.get(key);
            return (
              <Square
                key={key}
                square={{ row: rowIndex, col: colIndex }}
                piece={piece}
                selected={piece?.id === game.selectedPieceId}
                possibleMove={Boolean(highlight && !highlight.capture)}
                possibleCapture={Boolean(highlight?.capture)}
                onClick={() => selectSquare({ row: rowIndex, col: colIndex })}
                lightClass={theme.light}
                darkClass={theme.dark}
                pieceSkin={settings.pieceSkin}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

export { boardThemes };
