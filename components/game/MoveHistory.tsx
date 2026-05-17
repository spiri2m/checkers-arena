"use client";

import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function MoveHistory() {
  const moves = useGameStore((state) => state.game.moveHistory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4" />
          История ходов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-56 space-y-2 overflow-auto pr-1 text-sm">
          {moves.length === 0 ? <p className="text-muted-foreground">Пока ходов нет.</p> : null}
          {moves.map((move, index) => (
            <div key={`${move.id}-${index}`} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
              <span className="font-medium">{index + 1}. {move.notation}</span>
              <span className="text-xs text-muted-foreground">{move.player === "white" ? "Белые" : "Черные"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
