import { MapPin, Star } from "lucide-react";
import type { PlayerProfile } from "@/types";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileCard({ profile }: { profile: PlayerProfile }) {
  const decidedGames = profile.wins + profile.losses;
  const winRate = decidedGames > 0 ? Math.round((profile.wins / decidedGames) * 100) : 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <AvatarFallback name={profile.username} image={profile.avatar} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-black">{profile.username}</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[profile.city, profile.country].filter(Boolean).join(", ") || "Город не указан"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-md bg-muted px-2 py-1">
              <Star className="mr-1 inline h-3 w-3" />
              {profile.rating}
            </span>
            <span className="rounded-md bg-muted px-2 py-1">W {profile.wins}</span>
            <span className="rounded-md bg-muted px-2 py-1">L {profile.losses}</span>
            <span className="rounded-md bg-muted px-2 py-1">D {profile.draws}</span>
            <span className="rounded-md bg-muted px-2 py-1">WR {winRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
