"use client";

import { useState } from "react";
import { LogIn, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { syncStorageOwner } from "@/lib/storage/local";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";

export function AuthGate({ onReady }: { onReady: (identity: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Войдите, создайте аккаунт или продолжите как гость.");

  async function submit() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage("Ключи Supabase не найдены в .env.local.");
      return;
    }
    if (!email || password.length < 6) {
      setMessage("Введите email и пароль минимум из 6 символов.");
      return;
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Аккаунт создан. Подтвердите email, затем войдите с паролем.");
      setMode("login");
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setMessage("Сессия еще не активна. Войдите с паролем.");
      setMode("login");
      return;
    }

    window.localStorage.removeItem("checkers-arena:guest-mode");
    if (syncStorageOwner(`user:${data.user.id}`)) {
      useGameStore.setState({ hydrated: false });
    }
    if (mode === "signup") {
      window.location.href = "/profile";
      return;
    }
    onReady(data.user.email ?? email);
  }

  function guest() {
    window.localStorage.setItem("checkers-arena:guest-mode", "true");
    if (syncStorageOwner("guest")) {
      useGameStore.setState({ hydrated: false });
    }
    onReady("Гость");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_380px]">
      <section className="flex min-h-[440px] flex-col justify-end rounded-lg border bg-card p-6 shadow-soft">
        <p className="text-sm font-bold uppercase text-primary">Checkers Arena</p>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Выберите, как начать</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Аккаунт включает профиль, лидерборд, историю матчей и достижения. Гостевой режим хранит прогресс локально на этом устройстве.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button className="w-full" onClick={submit}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
          <Button className="w-full" variant="outline" onClick={guest}>
            <Users className="h-4 w-4" />
            Играть как гость
          </Button>
          <Button className="w-full" variant="ghost" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Нужен аккаунт? Создать" : "Уже есть аккаунт? Войти"}
          </Button>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
