"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export function Timer() {
  const game = useGameStore((state) => state.game);
  const surrender = useGameStore((state) => state.surrender);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (game.endedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [game.endedAt]);

  const timestamp = game.endedAt ?? (now ? now : game.startedAt);
  const elapsed = Math.max(0, new Date(timestamp).getTime() - new Date(game.startedAt).getTime());
  const remaining = game.timeLimitSeconds ? Math.max(0, game.timeLimitSeconds * 1000 - elapsed) : null;
  const displayMs = remaining ?? elapsed;
  const minutes = Math.floor(displayMs / 60_000).toString().padStart(2, "0");
  const seconds = Math.floor((displayMs % 60_000) / 1000).toString().padStart(2, "0");

  useEffect(() => {
    if (!game.timeLimitSeconds || game.status !== "playing") return;
    if (remaining === 0) surrender();
  }, [game.status, game.timeLimitSeconds, remaining, surrender]);

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-semibold">
      <Clock3 className="h-4 w-4 text-primary" />
      {game.timeLimitSeconds ? "Блиц " : ""}
      {minutes}:{seconds}
    </div>
  );
}
