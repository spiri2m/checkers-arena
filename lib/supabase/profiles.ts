import type { Achievement, PlayerProfile } from "@/types";
import { achievementCatalog } from "@/lib/achievements/catalog";
import { getSupabaseClient } from "@/lib/supabase/client";

const fallbackPlayers: PlayerProfile[] = [
  { id: "1", username: "Аружан", city: "Алматы", country: "Казахстан", rating: 1840, wins: 41, losses: 14, draws: 6 },
  { id: "2", username: "Мира", city: "Астана", country: "Казахстан", rating: 1795, wins: 38, losses: 16, draws: 4 },
  { id: "3", username: "Дамочный ход", city: "Кызылорда", country: "Казахстан", rating: 1710, wins: 31, losses: 19, draws: 8 },
  { id: "4", username: "Дамка Про", city: "Ташкент", country: "Узбекистан", rating: 1688, wins: 29, losses: 18, draws: 7 },
  { id: "5", username: "Новичок", city: "Кызылорда", country: "Казахстан", rating: 600, wins: 0, losses: 0, draws: 0 }
];

export const guestProfile: PlayerProfile = {
  id: "guest",
  username: "Гость",
  city: "Кызылорда",
  country: "Казахстан",
  rating: 600,
  wins: 0,
  losses: 0,
  draws: 0
};

export async function getCurrentProfile(): Promise<PlayerProfile> {
  const supabase = getSupabaseClient();
  if (!supabase) return guestProfile;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return guestProfile;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) {
    const created = await upsertCurrentProfile({
      ...guestProfile,
      id: user.id,
      username: user.email?.split("@")[0] ?? "Игрок",
      avatar: "avatar:crown"
    });
    return created;
  }

  return mapProfile(data);
}

export async function upsertCurrentProfile(profile: PlayerProfile): Promise<PlayerProfile> {
  const supabase = getSupabaseClient();
  if (!supabase) return profile;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return profile;

  const payload = {
    id: user.id,
    username: profile.username,
    avatar: profile.avatar ?? null,
    city: profile.city ?? null,
    country: profile.country ?? null,
    rating: profile.rating || 600,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("profiles").upsert(payload).select("*").single();
  if (error || !data) return profile;
  return mapProfile(data);
}

export async function getLeaderboard(scope: "global" | "country" | "city" = "global", profile?: PlayerProfile): Promise<PlayerProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return fallbackPlayers;

  let query = supabase.from("profiles").select("*").order("rating", { ascending: false }).limit(50);
  if (scope === "country" && profile?.country) query = query.eq("country", profile.country);
  if (scope === "city" && profile?.city) query = query.eq("city", profile.city);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return fallbackPlayers;
  return data.map(mapProfile);
}

export async function getUserAchievements(): Promise<Achievement[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return achievementCatalog;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return achievementCatalog;

  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", user.id);

  const unlocked = new Map((data ?? []).map((item) => [item.achievement_id as string, item.unlocked_at as string]));
  return achievementCatalog.map((achievement) => ({
    ...achievement,
    unlockedAt: unlocked.get(achievement.id)
  }));
}

export async function unlockSupabaseAchievements(achievements: Achievement[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const unlocked = achievements.filter((achievement) => achievement.unlockedAt);
  if (!unlocked.length) return;

  await supabase.from("achievements").upsert(
    achievementCatalog.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon
    })),
    { onConflict: "id", ignoreDuplicates: true }
  );

  await supabase.from("user_achievements").upsert(
    unlocked.map((achievement) => ({
      user_id: user.id,
      achievement_id: achievement.id,
      unlocked_at: achievement.unlockedAt
    })),
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
  );
}

function mapProfile(row: Record<string, unknown>): PlayerProfile {
  return {
    id: String(row.id),
    username: String(row.username ?? "Игрок"),
    avatar: row.avatar ? String(row.avatar) : undefined,
    city: row.city ? String(row.city) : undefined,
    country: row.country ? String(row.country) : undefined,
    rating: Number(row.rating ?? 1200),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0)
  };
}
