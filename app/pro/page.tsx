import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { ProUpgradeCard } from "@/components/ProUpgradeCard";
import { ProCheckoutButton } from "@/components/ProCheckoutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  "Про-скины доски и фигур",
  "Расширенный ИИ-тренер",
  "Сильный ИИ с глубиной анализа",
  "Больше тактических задач",
  "Приоритет в будущих онлайн-дуэлях"
];

export default function ProPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-6 shadow-soft">
        <Crown className="mb-3 h-8 w-8 text-accent" />
        <h1 className="text-4xl font-black">Перейти на Про</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Про включает премиум-скины, расширенный анализ партий и будущие премиум-возможности.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ProCheckoutButton />
          <Link href="/pro/cancel" className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            Отмена
          </Link>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Что входит</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 rounded-md bg-muted p-3">
                <Check className="h-4 w-4 text-primary" />
                <span className="font-semibold">{benefit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <ProUpgradeCard />
      </div>
    </div>
  );
}
