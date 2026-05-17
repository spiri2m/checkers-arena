"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, RotateCcw, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function GameResultModal() {
  const game = useGameStore((state) => state.game);
  const newGame = useGameStore((state) => state.newGame);

  if (game.status !== "finished") return null;

  const duration = new Date(game.endedAt ?? new Date()).getTime() - new Date(game.startedAt).getTime();
  const minutes = Math.floor(duration / 60_000);
  const seconds = Math.floor((duration % 60_000) / 1000);
  const winner = game.winner === "white" ? "Белые" : "Черные";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Партия завершена</CardTitle>
            <Button aria-label="Закрыть" title="Закрыть" size="icon" variant="ghost" onClick={() => newGame(game.mode, game.aiDifficulty)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md bg-muted p-3">
                <div className="text-muted-foreground">Победитель</div>
                <div className="font-black">{winner}</div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-muted-foreground">Ходы</div>
                <div className="font-black">{game.moveHistory.length}</div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-muted-foreground">Время</div>
                <div className="font-black">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {winner} выигрывают. Подробный разбор появится в панели ИИ-тренера через мгновение.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => newGame(game.mode, game.aiDifficulty)}>
                <RotateCcw className="h-4 w-4" />
                Играть снова
              </Button>
              <Link href="/history" className={buttonVariants({ variant: "outline" })}>
                <Play className="h-4 w-4" />
                Повтор
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
