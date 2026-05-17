"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game-store";

export function useHydratedGame() {
  const hydrated = useGameStore((state) => state.hydrated);
  const hydrate = useGameStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}
