"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { useHydratedGame } from "@/hooks/use-hydrated-game";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useHydratedGame();
  const theme = useGameStore((state) => state.settings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return children;
}
