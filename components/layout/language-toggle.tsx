"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydratedGame } from "@/hooks/use-hydrated-game";
import { useGameStore } from "@/store/game-store";

export function LanguageToggle() {
  useHydratedGame();
  const language = useGameStore((state) => state.settings.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const nextLanguage = language === "ru" ? "en" : "ru";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(nextLanguage)}
      title={language === "ru" ? "Переключить на English" : "Switch to Russian"}
    >
      <Languages className="h-4 w-4" />
      {language.toUpperCase()}
    </Button>
  );
}
