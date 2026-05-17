"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIMove } from "@/lib/ai/checkers-ai";
import { useGameStore } from "@/store/game-store";

export function HintPanel() {
  const game = useGameStore((state) => state.game);
  const settings = useGameStore((state) => state.settings);
  const toggleHints = useGameStore((state) => state.toggleHints);
  const hint = settings.hintsEnabled && game.status === "playing" ? getAIMove(game, "medium") : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4" />
          Подсказки
        </CardTitle>
        <Button variant={settings.hintsEnabled ? "default" : "outline"} size="sm" onClick={toggleHints}>
          {settings.hintsEnabled ? "Включены" : "Выключены"}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {hint ? `Сильный кандидат: ${hint.notation}` : settings.hintsEnabled ? "Подсказка появится, когда будет доступен ход." : "Подсказки выключены для этой партии."}
        </p>
      </CardContent>
    </Card>
  );
}
