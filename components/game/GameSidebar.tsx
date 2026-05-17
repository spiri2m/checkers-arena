"use client";

import { ShieldAlert, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CoachAnalysis } from "@/components/game/CoachAnalysis";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { GameControls } from "@/components/game/GameControls";
import { HintPanel } from "@/components/game/HintPanel";
import { MoveHistory } from "@/components/game/MoveHistory";
import { Timer } from "@/components/game/Timer";
import { useGameStore } from "@/store/game-store";

export function GameSidebar() {
  const game = useGameStore((state) => state.game);

  return (
    <aside className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Ход</p>
              <p className="text-xl font-black">{game.currentTurn === "white" ? "Белые" : "Черные"}</p>
            </div>
            <Badge variant={game.status === "playing" ? "accent" : "secondary"}>
              <Trophy className="mr-1 h-3 w-3" />
              {game.status === "playing" ? "Игра" : "Финиш"}
            </Badge>
          </div>
          <Timer />
          {game.mode === "ai" ? <DifficultySelector /> : null}
          {game.message ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{game.message}</p>
            </div>
          ) : null}
          <GameControls />
        </CardContent>
      </Card>
      <HintPanel />
      <MoveHistory />
      <CoachAnalysis />
    </aside>
  );
}
