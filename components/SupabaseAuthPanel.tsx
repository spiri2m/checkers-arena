"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { syncStorageOwner } from "@/lib/storage/local";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function SupabaseAuthPanel() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("Авторизация через Supabase.");
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user && syncStorageOwner(`user:${data.user.id}`)) {
        useGameStore.setState({ hydrated: false });
      }
      setUserEmail(data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && syncStorageOwner(`user:${session.user.id}`)) {
        useGameStore.setState({ hydrated: false });
      }
      setUserEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit() {
    if (!supabase) {
      setMessage("Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local.");
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
      setMessage("Аккаунт создан. Подтвердите email, затем войдите.");
      setMode("login");
      return;
    }

    window.localStorage.removeItem("checkers-arena:guest-mode");
    if (result.data.user && syncStorageOwner(`user:${result.data.user.id}`)) {
      useGameStore.setState({ hydrated: false });
    }
    setUserEmail(result.data.user?.email ?? email);
    if (mode === "signup") {
      window.location.href = "/profile";
      return;
    }
    setMessage(mode === "login" ? "Вы вошли." : "Аккаунт создан, вход выполнен.");
  }

  async function signOut() {
    await supabase?.auth.signOut();
    window.localStorage.removeItem("checkers-arena:guest-mode");
    if (syncStorageOwner("anonymous")) {
      useGameStore.setState({ hydrated: false });
    }
    setUserEmail(null);
    setMessage("Вы вышли из аккаунта.");
  }

  if (userEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Авторизация через Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="rounded-md bg-muted p-3 text-sm">Вы вошли как {userEmail}</p>
          <Button className="w-full" variant="destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          Авторизация через Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          type="email"
          placeholder="you@example.com"
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
        <Button className="w-full" variant="ghost" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Создать аккаунт" : "Войти"}
        </Button>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
