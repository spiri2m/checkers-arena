"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { activatePro } from "@/lib/pro/status";

export function ProSuccessClient() {
  useEffect(() => {
    activatePro();
  }, []);

  return (
    <div className="mx-auto max-w-xl rounded-lg border bg-card p-6 text-center shadow-soft">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
      <h1 className="text-3xl font-black">Pro активирован</h1>
      <p className="mt-2 text-muted-foreground">
        Премиум включен. Pro-скины, расширенный ИИ-тренер и премиум-настройки доступны на этом устройстве.
      </p>
      <Link href="/settings" className={buttonVariants({ className: "mt-5" })}>
        Настроить Pro-скины
      </Link>
    </div>
  );
}
