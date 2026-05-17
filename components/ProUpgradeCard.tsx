"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Crown, Palette, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProCheckoutButton } from "@/components/ProCheckoutButton";
import { isProActive, subscribeToProStatus } from "@/lib/pro/status";

export function ProUpgradeCard() {
  const [pro, setPro] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setPro(isProActive()));
    return subscribeToProStatus(() => setPro(isProActive()));
  }, []);

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          {pro ? "Pro активен" : "Перейти на Pro"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pro ? (
          <div className="flex items-center gap-2 rounded-md bg-accent/20 p-3 text-sm font-bold">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Premium уже активирован.
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Benefit icon={<Palette className="h-5 w-5" />} title="Pro-скины" text="Доски Ice и неоновые фигуры." />
          <Benefit icon={<Brain className="h-5 w-5" />} title="Тренер+" text="Больше объяснений после партии." />
          <Benefit icon={<Zap className="h-5 w-5" />} title="Сильный ИИ" text="Расширенная глубина анализа." />
        </div>
        {!pro ? <ProCheckoutButton className="w-full" /> : null}
      </CardContent>
    </Card>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="mb-2 text-primary">{icon}</div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>
  );
}
