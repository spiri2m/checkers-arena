"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import type { GameRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadGuestRecords } from "@/lib/storage/local";
import { hasSupabaseSession } from "@/lib/supabase/auth";
import { getSupabaseGameRecords } from "@/lib/supabase/games";

export function MatchHistoryPanel() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [source, setSource] = useState("Загрузка");

  useEffect(() => {
    let active = true;
    void hasSupabaseSession().then(async (isAuthed) => {
      if (!active) return;
      if (isAuthed) {
        const remote = await getSupabaseGameRecords();
        if (!active) return;
        setRecords(remote.slice(0, 5));
        setSource("Supabase");
        return;
      }
      setRecords(loadGuestRecords().slice(0, 5));
      setSource("Гостевое локальное хранилище");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          История матчей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{source}</p>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">Матчи появятся после завершения партии.</p> : null}
        {records.map((record) => (
          <div key={record.id} className="rounded-md bg-muted p-3 text-sm">
            <div className="font-semibold">
              {modeLabel(record.mode)}
              {record.aiDifficulty ? ` • ${difficultyLabel(record.aiDifficulty)}` : ""} •{" "}
              {record.winner ? `победили ${record.winner === "white" ? "белые" : "черные"}` : "ничья"}
            </div>
            <div className="text-muted-foreground">{record.moves.length} ходов</div>
          </div>
        ))}
        <Link href="/history" className="inline-flex h-9 w-full items-center justify-center rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted">
          Открыть повтор
        </Link>
      </CardContent>
    </Card>
  );
}

function modeLabel(mode: GameRecord["mode"]): string {
  const labels: Record<GameRecord["mode"], string> = {
    local: "Локальная игра",
    ai: "Против ИИ",
    online: "Онлайн",
    puzzle: "Задача",
    sandbox: "Песочница"
  };
  return labels[mode] ?? mode;
}

function difficultyLabel(difficulty: NonNullable<GameRecord["aiDifficulty"]>): string {
  const labels = {
    easy: "легко",
    medium: "средне",
    hard: "сложно"
  };
  return labels[difficulty];
}
