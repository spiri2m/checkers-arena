"use client";

import type { Difficulty } from "@/types";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";
import { cn } from "@/lib/utils";

const levels: Array<{ id: Difficulty; label: string }> = [
  { id: "easy", label: "Легко" },
  { id: "medium", label: "Средне" },
  { id: "hard", label: "Сложно" }
];

export function DifficultySelector() {
  const difficulty = useGameStore((state) => state.settings.aiDifficulty);
  const setDifficulty = useGameStore((state) => state.setDifficulty);
  const current = levels.find((level) => level.id === difficulty)?.label ?? "Средне";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
        <span>Сложность ИИ</span>
        <span className="text-primary">{current}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((level) => (
          <Button
            key={level.id}
            variant={difficulty === level.id ? "default" : "outline"}
            className={cn("px-2", difficulty === level.id && "shadow-soft")}
            onClick={() => setDifficulty(level.id)}
          >
            {level.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
