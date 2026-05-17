"use client";

import { Copy, ExternalLink, RotateCcw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function RoomInviteCard({ roomId }: { roomId: string }) {
  const invite = typeof window === "undefined" ? `/room/${roomId}?role=black` : `${window.location.origin}/room/${roomId}?role=black`;
  const newGame = useGameStore((state) => state.newGame);
  const game = useGameStore((state) => state.game);

  function rematch() {
    newGame("online", game.aiDifficulty);
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        roomId,
        localPlayerColor: game.localPlayerColor,
        message: "Реванш создан. Второй игрок получит новую позицию через веб-сокет."
      }
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4 text-primary" />
          Онлайн-комната
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="break-all rounded-md bg-muted p-3 text-sm">{invite}</p>
        <Button className="w-full" variant="outline" onClick={() => navigator.clipboard.writeText(invite)}>
          <Copy className="h-4 w-4" />
          Скопировать ссылку
        </Button>
        <Button className="w-full" variant="outline" onClick={() => window.open(invite, "_blank")}>
          <ExternalLink className="h-4 w-4" />
          Открыть как друг
        </Button>
        <Button className="w-full" onClick={rematch}>
          <RotateCcw className="h-4 w-4" />
          Реванш
        </Button>
        <p className="text-sm text-muted-foreground">
          Первый игрок играет белыми, друг по ссылке играет черными. Ходы, сдача и реванш синхронизируются через Supabase Realtime и веб-сокеты.
        </p>
      </CardContent>
    </Card>
  );
}
