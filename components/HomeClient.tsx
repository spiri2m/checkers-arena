"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Brain, Crown, Dumbbell, FlaskConical, Gauge, LogOut, Swords, Trophy, User, Wifi } from "lucide-react";
import { AuthGate } from "@/components/auth/AuthGate";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { syncStorageOwner } from "@/lib/storage/local";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/game/ai", label: "Играть против ИИ", icon: Bot, text: "Easy, Medium, Hard Engine" },
  { href: "/sandbox", label: "Песочница", icon: FlaskConical, text: "Собери любую позицию" },
  { href: "/room/new", label: "Играть онлайн", icon: Wifi, text: "Создать WebSocket-комнату" },
  { href: "/game/ai?quick=3", label: "Быстрая дуэль", icon: Gauge, text: "1, 3 или 5 минут" },
  { href: "/game/local", label: "Локальная игра", icon: Swords, text: "Два игрока на одном экране" },
  { href: "/learn", label: "Обучение", icon: Brain, text: "Правила и примеры" },
  { href: "/leaderboard", label: "Лидерборд", icon: Trophy, text: "Глобально, страна, город" },
  { href: "/profile", label: "Профиль", icon: User, text: "Рейтинг и достижения" },
  { href: "/pro", label: "Перейти на Pro", icon: Crown, text: "Скины и тренер+" }
];

export function HomeClient() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [identity, setIdentity] = useState("Guest");

  useEffect(() => {
    const guest = window.localStorage.getItem("checkers-arena:guest-mode") === "true";
    const supabase = getSupabaseClient();
    if (guest) {
      queueMicrotask(() => {
        if (syncStorageOwner("guest")) useGameStore.setState({ hydrated: false });
        setIdentity("Guest");
        setAllowed(true);
        setChecking(false);
      });
      return;
    }
    if (!supabase) {
      queueMicrotask(() => {
        setAllowed(false);
        setChecking(false);
      });
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (syncStorageOwner(`user:${data.user.id}`)) useGameStore.setState({ hydrated: false });
        setIdentity(data.user.email ?? "Player");
        setAllowed(true);
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return <LoadingOverlay label="Загружаем аккаунт..." />;
  }

  if (!allowed) {
    return (
      <AuthGate
        onReady={(nextIdentity) => {
          setIdentity(nextIdentity);
          setAllowed(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-[380px] bg-[linear-gradient(135deg,#faf7ef,#efe4cf_52%,#c7b895)] p-6 text-slate-950 dark:bg-[linear-gradient(135deg,#111827,#18181b_56%,#3f121a)] dark:text-stone-50">
            <div className="flex h-full flex-col">
              <div className="mb-auto flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-bold text-primary dark:bg-white/10 dark:text-stone-100">
                  <FlaskConical className="h-4 w-4" />
                  Песочница позиций
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    window.localStorage.removeItem("checkers-arena:guest-mode");
                    void getSupabaseClient()?.auth.signOut();
                    if (syncStorageOwner("anonymous")) useGameStore.setState({ hydrated: false });
                    setAllowed(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Button>
              </div>
              <div className="max-w-3xl">
                <h1 className="text-4xl font-black leading-tight sm:text-5xl">Checkers Arena</h1>
                <p className="mt-4 max-w-2xl text-slate-700 dark:text-stone-200">
                  Добро пожаловать, {identity}. Играйте против ИИ, создавайте онлайн-комнаты, решайте задачи и собирайте собственные позиции в песочнице.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/sandbox" className={buttonVariants({ className: "bg-primary text-primary-foreground hover:brightness-110" })}>
                    <FlaskConical className="h-4 w-4" />
                    Открыть песочницу
                  </Link>
                  <Link href="/game/ai" className={buttonVariants({ variant: "secondary" })}>
                    <Bot className="h-4 w-4" />
                    Начать партию с ИИ
                  </Link>
                  <Link href="/room/new" className={buttonVariants({ variant: "outline", className: "border-slate-950/20 bg-white/45 text-slate-950 hover:bg-white/70 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/18" })}>
                    <Wifi className="h-4 w-4" />
                    Онлайн-комната
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <Card className="rounded-none border-0">
            <CardContent className="grid gap-3 pt-5">
              {actions.slice(0, 4).map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md bg-muted p-3 transition hover:bg-secondary",
                    action.href === "/sandbox" && "border border-amber-700/35 bg-amber-900/10"
                  )}
                >
                  <action.icon className={cn("h-5 w-5 text-primary", action.href === "/sandbox" && "text-amber-700 dark:text-amber-300")} />
                  <span>
                    <span className="block font-bold">{action.label}</span>
                    <span className="text-sm text-muted-foreground">{action.text}</span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actions.slice(4).map((action) => (
          <Link key={action.href} href={action.href} className="rounded-lg border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <action.icon className="mb-3 h-6 w-6 text-primary" />
            <div className="font-black">{action.label}</div>
            <div className="text-sm text-muted-foreground">{action.text}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
