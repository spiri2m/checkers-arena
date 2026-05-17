import Link from "next/link";
import { Clock3 } from "lucide-react";
import { GameClient } from "@/components/game/GameClient";
import { buttonVariants } from "@/components/ui/button";

export default async function AIGamePage({ searchParams }: { searchParams: Promise<{ quick?: string }> }) {
  const { quick } = await searchParams;
  const quickMinutes = quick && ["1", "3", "5"].includes(quick) ? Number(quick) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[1, 3, 5].map((minutes) => (
          <Link key={minutes} href={`/game/ai?quick=${minutes}`} className={buttonVariants({ variant: quickMinutes === minutes ? "default" : "outline", size: "sm" })}>
            <Clock3 className="h-4 w-4" />
            {minutes} мин
          </Link>
        ))}
      </div>
      <GameClient mode="ai" quickMinutes={quickMinutes} />
    </div>
  );
}
