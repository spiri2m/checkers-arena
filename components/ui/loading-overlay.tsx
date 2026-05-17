"use client";

import { Loader2 } from "lucide-react";

export function LoadingOverlay({ label = "Загрузка..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/88 p-4 backdrop-blur">
      <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4 text-sm font-semibold shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
