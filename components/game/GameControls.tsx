"use client";

import { Flag, RotateCcw, StepBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

export function GameControls() {
  const newGame = useGameStore((state) => state.newGame);
  const undo = useGameStore((state) => state.undo);
  const surrender = useGameStore((state) => state.surrender);
  const game = useGameStore((state) => state.game);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="secondary" onClick={() => newGame(game.mode, game.aiDifficulty)}>
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Новая</span>
      </Button>
      <Button variant="outline" onClick={undo}>
        <StepBack className="h-4 w-4" />
        <span className="hidden sm:inline">Отмена</span>
      </Button>
      <Button variant="destructive" onClick={() => surrender()}>
        <Flag className="h-4 w-4" />
        <span className="hidden sm:inline">Сдаться</span>
      </Button>
    </div>
  );
}
