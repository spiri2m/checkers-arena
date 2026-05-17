"use client";

import { useEffect, useState } from "react";
import { LogIn, Save } from "lucide-react";
import { AchievementBadge } from "@/components/AchievementBadge";
import { MatchHistoryPanel } from "@/components/MatchHistoryPanel";
import { ProfileCard } from "@/components/ProfileCard";
import { SupabaseAuthPanel } from "@/components/SupabaseAuthPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { Achievement, PlayerProfile } from "@/types";
import { achievementCatalog } from "@/lib/achievements/catalog";
import { avatarOptions } from "@/lib/avatars";
import { loadGuestAchievements } from "@/lib/storage/local";
import { getCurrentProfile, getUserAchievements, upsertCurrentProfile } from "@/lib/supabase/profiles";
import { cn } from "@/lib/utils";

export function ProfileClient() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(achievementCatalog);
  const [message, setMessage] = useState("Загружаем профиль и сессию...");

  useEffect(() => {
    let active = true;
    void Promise.all([getCurrentProfile(), getUserAchievements()]).then(([loadedProfile, loadedAchievements]) => {
      if (!active) return;
      const guestAchievements = loadGuestAchievements();
      const merged = loadedAchievements.map((achievement) => {
        const guestUnlocked = guestAchievements.find((candidate) => candidate.id === achievement.id)?.unlockedAt;
        return { ...achievement, unlockedAt: achievement.unlockedAt ?? guestUnlocked };
      });
      setProfile(loadedProfile);
      setAchievements(merged);
      setMessage(loadedProfile.id === "guest" ? "Гостевой профиль хранится локально." : "Профиль загружен из Supabase.");
    });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    if (!profile) return;
    const saved = await upsertCurrentProfile(profile);
    setProfile(saved);
    setMessage(saved.id === "guest" ? "Войдите через Supabase Auth, чтобы сохранить профиль в базе." : "Профиль сохранен в Supabase.");
  }

  if (!profile) {
    return <LoadingOverlay label="Загружаем профиль..." />;
  }

  const guest = profile.id === "guest";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Профиль игрока</p>
          <h1 className="text-3xl font-black">Профиль</h1>
        </div>
        {guest ? (
          <Card className="border-accent/50 bg-accent/10">
            <CardContent className="flex items-start gap-3 pt-5">
              <LogIn className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-bold">Авторизуйтесь, чтобы быть в лидерборде</div>
                <p className="text-sm text-muted-foreground">
                  Гостевой профиль сохраняет историю на этом устройстве, но рейтинг, лидерборд и история Supabase доступны после входа.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <ProfileCard profile={profile} />
        <Card>
          <CardHeader>
            <CardTitle>Данные игрока</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ProfileInput label="Никнейм" value={profile.username} onChange={(username) => setProfile({ ...profile, username })} />
            <ProfileInput label="Город" value={profile.city ?? ""} onChange={(city) => setProfile({ ...profile, city })} />
            <ProfileInput label="Страна" value={profile.country ?? ""} onChange={(country) => setProfile({ ...profile, country })} />
            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm font-semibold">Аватар</div>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, avatar: avatar.id })}
                    className={cn(
                      "grid h-12 place-items-center rounded-md border text-lg font-black",
                      avatar.className,
                      profile.avatar === avatar.id && "ring-2 ring-ring"
                    )}
                    title={avatar.label}
                  >
                    {avatar.symbol}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
              <Button onClick={saveProfile}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>
      <div className="space-y-5">
        <SupabaseAuthPanel />
        <MatchHistoryPanel />
      </div>
    </div>
  );
}

function ProfileInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-sm font-semibold">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
