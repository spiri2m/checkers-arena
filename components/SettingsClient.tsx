"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, Palette, Sparkles } from "lucide-react";
import { boardThemes } from "@/components/game/Board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHydratedGame } from "@/hooks/use-hydrated-game";
import { isProActive, subscribeToProStatus } from "@/lib/pro/status";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const skins = [
  { id: "marble", name: "Мрамор" },
  { id: "neon", name: "Неон Про", pro: true }
];

export function SettingsClient() {
  useHydratedGame();
  const settings = useGameStore((state) => state.settings);
  const setBoardTheme = useGameStore((state) => state.setBoardTheme);
  const setPieceSkin = useGameStore((state) => state.setPieceSkin);
  const toggleHints = useGameStore((state) => state.toggleHints);
  const [pro, setPro] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setPro(isProActive()));
    return subscribeToProStatus(() => setPro(isProActive()));
  }, []);

  function chooseBoardTheme(theme: (typeof boardThemes)[number]) {
    if (theme.pro && !pro) return;
    setBoardTheme(theme.id);
  }

  function chooseSkin(skin: (typeof skins)[number]) {
    if (skin.pro && !pro) return;
    setPieceSkin(skin.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Предпочтения</p>
          <h1 className="text-3xl font-black">Настройки</h1>
        </div>
        <div className={cn("rounded-md border px-3 py-2 text-sm font-bold", pro ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
          {pro ? "Про активен" : "Бесплатный режим"}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Темы доски
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {boardThemes.map((theme) => {
              const locked = Boolean(theme.pro && !pro);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => chooseBoardTheme(theme)}
                  className={cn(
                    "flex items-center justify-between rounded-md border bg-card p-3 text-left transition",
                    settings.boardTheme === theme.id && "ring-2 ring-ring",
                    locked ? "opacity-60" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2 font-bold">
                    {theme.name} {theme.pro ? "Про" : ""}
                    {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
                  </span>
                  <span className="grid h-8 w-16 grid-cols-2 overflow-hidden rounded-md border">
                    <span className={theme.light} />
                    <span className={theme.dark} />
                  </span>
                </button>
              );
            })}
            {!pro ? (
              <Link href="/pro" className="rounded-md border border-accent/50 bg-accent/15 p-3 text-sm font-semibold text-accent-foreground">
                Открыть Про, чтобы включить ледяную доску и будущие премиум-темы.
              </Link>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Фигуры и подсказки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {skins.map((skin) => {
                const locked = Boolean(skin.pro && !pro);
                return (
                  <Button key={skin.id} variant={settings.pieceSkin === skin.id ? "default" : "outline"} onClick={() => chooseSkin(skin)} disabled={locked}>
                    {locked ? <Lock className="h-4 w-4" /> : null}
                    {skin.name}
                  </Button>
                );
              })}
            </div>
            <Button variant="secondary" className="w-full" onClick={toggleHints}>
              Подсказки: {settings.hintsEnabled ? "включены" : "выключены"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
