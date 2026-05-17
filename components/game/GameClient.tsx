"use client";

import { useEffect } from "react";
import type { Difficulty, GameMode } from "@/types";
import { Board } from "@/components/game/Board";
import { GameResultModal } from "@/components/game/GameResultModal";
import { GameSidebar } from "@/components/game/GameSidebar";
import { useHydratedGame } from "@/hooks/use-hydrated-game";
import { useOnlineRoom } from "@/hooks/use-online-room";
import { useGameStore } from "@/store/game-store";

interface GameClientProps {
  mode: GameMode;
  difficulty?: Difficulty;
  roomId?: string;
  quickMinutes?: number;
}

export function GameClient({ mode, difficulty, roomId, quickMinutes }: GameClientProps) {
  const hydrated = useHydratedGame();
  const game = useGameStore((state) => state.game);
  const newGame = useGameStore((state) => state.newGame);
  const makeAIMove = useGameStore((state) => state.makeAIMove);
  const onlineRoom = useOnlineRoom(mode === "online" ? roomId : undefined);

  useEffect(() => {
    if (!hydrated) return;
    if (game.mode !== mode || (difficulty && game.aiDifficulty !== difficulty)) {
      newGame(mode, difficulty ?? game.aiDifficulty);
    }
  }, [difficulty, game.aiDifficulty, game.mode, hydrated, mode, newGame]);

  useEffect(() => {
    if (!hydrated || !quickMinutes || game.timeLimitSeconds === quickMinutes * 60) return;
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        timeLimitSeconds: quickMinutes * 60,
        startedAt: new Date().toISOString(),
        message: `Быстрая дуэль: ${quickMinutes} мин.`
      }
    }));
  }, [game.timeLimitSeconds, hydrated, quickMinutes]);

  useEffect(() => {
    if (game.mode !== "ai" || game.currentTurn !== "black" || game.status !== "playing") return;
    const timer = window.setTimeout(makeAIMove, 140);
    return () => window.clearTimeout(timer);
  }, [game.currentTurn, game.mode, game.status, game.moveHistory.length, makeAIMove]);

  const title = mode === "ai" ? (quickMinutes ? `Быстрая дуэль ${quickMinutes} мин` : "Игра против ИИ") : mode === "online" ? "Онлайн-комната" : "Локальная партия";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase text-primary">{roomId ? `Room ${roomId}` : mode}</p>
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
        {mode === "online" ? (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>WebSocket: {onlineRoom.status === "connected" ? "подключен" : onlineRoom.status === "connecting" ? "подключение" : "не подключен"}</span>
            <span>Роль: {onlineRoom.role === "white" ? "белые" : onlineRoom.role === "black" ? "черные" : "зритель"}</span>
            <span>Игроки: {onlineRoom.playerCount}/2</span>
            {onlineRoom.spectatorCount ? <span>Зрители: {onlineRoom.spectatorCount}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Board />
        <GameSidebar />
      </div>
      <GameResultModal />
    </div>
  );
}
