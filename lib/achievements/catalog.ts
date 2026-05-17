import type { Achievement, GameState } from "@/types";

export const achievementCatalog: Achievement[] = [
  {
    id: "first-win",
    title: "Первая победа",
    description: "Завершите партию победой.",
    icon: "1"
  },
  {
    id: "double-capture",
    title: "Двойное взятие",
    description: "Сделайте ход с двумя или более взятиями.",
    icon: "2"
  },
  {
    id: "kingmaker",
    title: "Дамка",
    description: "Проведите шашку на последнюю линию.",
    icon: "K"
  },
  {
    id: "ai-sparring",
    title: "Sparring",
    description: "Сыграйте партию против ИИ.",
    icon: "AI"
  }
];

export function evaluateAchievements(game: GameState, existing: Achievement[]): Achievement[] {
  const unlocked = new Map(existing.map((achievement) => [achievement.id, achievement]));
  const now = new Date().toISOString();

  function unlock(id: string) {
    if (unlocked.has(id)) return;
    const achievement = achievementCatalog.find((candidate) => candidate.id === id);
    if (achievement) {
      unlocked.set(id, { ...achievement, unlockedAt: now });
    }
  }

  if (game.status === "finished") unlock("first-win");
  if (game.mode === "ai" && game.moveHistory.length > 0) unlock("ai-sparring");
  if (game.moveHistory.some((move) => move.capturedPieceIds.length >= 2)) unlock("double-capture");
  if (game.moveHistory.some((move) => move.promotion)) unlock("kingmaker");

  return achievementCatalog.map((achievement) => unlocked.get(achievement.id) ?? achievement);
}
