"use client";

import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import type { PlayerProfile } from "@/types";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile, getLeaderboard } from "@/lib/supabase/profiles";

type Scope = "global" | "country" | "city";

const scopes: Array<{ id: Scope; label: string }> = [
  { id: "global", label: "Глобальный" },
  { id: "country", label: "По стране" },
  { id: "city", label: "По городу" }
];

export function LeaderboardClient() {
  const [scope, setScope] = useState<Scope>("global");
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | undefined>();

  useEffect(() => {
    let active = true;
    void getCurrentProfile().then((loadedProfile) => {
      if (!active) return;
      setProfile(loadedProfile);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getLeaderboard(scope, profile).then((loadedPlayers) => {
      if (active) setPlayers(loadedPlayers);
    });
    return () => {
      active = false;
    };
  }, [profile, scope]);

  const guest = profile?.id === "guest";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Глобально • Страна • Город</p>
        <h1 className="text-3xl font-black">Лидерборд</h1>
      </div>
      {guest ? (
        <Card className="border-accent/50 bg-accent/10">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LogIn className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-bold">Авторизуйтесь, чтобы попасть в лидерборд</div>
                <p className="text-sm text-muted-foreground">Гостевые партии хранятся локально и не участвуют в рейтинге Supabase.</p>
              </div>
            </div>
            <a href="/profile" className={buttonVariants()}>
              Войти в профиль
            </a>
          </CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {scopes.map((item) => (
          <Button key={item.id} variant={scope === item.id ? "default" : "outline"} onClick={() => setScope(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <LeaderboardTable players={players} />
    </div>
  );
}
