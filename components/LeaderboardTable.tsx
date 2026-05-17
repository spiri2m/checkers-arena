import { Trophy } from "lucide-react";
import type { PlayerProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaderboardTable({ players }: { players: PlayerProfile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Лидерборд
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">#</th>
              <th>Игрок</th>
              <th>Город</th>
              <th>Рейтинг</th>
              <th>П/Пор/Н</th>
              <th>Винрейт</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const decided = player.wins + player.losses;
              const winRate = decided > 0 ? Math.round((player.wins / decided) * 100) : 0;
              return (
                <tr key={player.id} className="border-t">
                  <td className="py-3 font-bold">{index + 1}</td>
                  <td className="font-semibold">{player.username}</td>
                  <td>{player.city ?? "Глобально"}</td>
                  <td>{player.rating}</td>
                  <td>
                    {player.wins}/{player.losses}/{player.draws}
                  </td>
                  <td>{winRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
