import type { Achievement } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={achievement.unlockedAt ? "" : "opacity-55"}>
      <CardContent className="flex items-center gap-3 pt-5">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-accent text-xl text-accent-foreground">{achievement.icon}</span>
        <div>
          <div className="font-bold">{achievement.title}</div>
          <div className="text-sm text-muted-foreground">{achievement.description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
