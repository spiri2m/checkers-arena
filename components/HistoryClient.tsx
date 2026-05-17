"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { GameRecord } from "@/types";
import { ReplayViewer } from "@/components/game/ReplayViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadGuestRecords } from "@/lib/storage/local";
import { hasSupabaseSession } from "@/lib/supabase/auth";
import { getSupabaseGameRecords } from "@/lib/supabase/games";

export function HistoryClient() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [source, setSource] = useState("Загрузка");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => setLoading(true));
    void hasSupabaseSession().then(async (isAuthed) => {
      if (!active) return;
      if (isAuthed) {
        const remoteRecords = await getSupabaseGameRecords();
        if (!active) return;
        setRecords(remoteRecords);
        setSource("Supabase");
        setLoading(false);
        return;
      }
      setRecords(loadGuestRecords());
      setSource("Гостевое локальное хранилище");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Повтор • {source}</p>
        <h1 className="text-3xl font-black">История партий</h1>
      </div>
      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Загружаем историю партий...
          </CardContent>
        </Card>
      ) : null}
      {!loading && records.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-muted-foreground">История появится после завершения первой партии.</CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <CardTitle>
                {modeLabel(record.mode)} • {record.winner ? `победили ${record.winner === "white" ? "белые" : "черные"}` : "ничья"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReplayViewer record={record} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
