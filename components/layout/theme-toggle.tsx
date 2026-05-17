"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

export function ThemeToggle() {
  const theme = useGameStore((state) => state.settings.theme);
  const setTheme = useGameStore((state) => state.setTheme);

  return (
    <Button
      aria-label="Переключить тему"
      title="Тема"
      size="icon"
      variant="outline"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
