"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activatePro } from "@/lib/pro/status";

export function ProCheckoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    try {
      activatePro();
      const response = await fetch("/api/stripe/mock-checkout", { method: "POST" });
      const data = (await response.json()) as { url?: string };
      window.location.href = data.url ?? "/pro/success";
    } catch {
      window.location.href = "/pro/cancel";
    }
  }

  return (
    <Button className={className} onClick={checkout} disabled={loading}>
      <CreditCard className="h-4 w-4" />
      {loading ? "Активируем..." : "Подключить Про"}
    </Button>
  );
}
