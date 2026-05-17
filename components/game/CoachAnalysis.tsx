"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeGame, type MoveReview } from "@/lib/coach/analysis";
import type { CoachInsight } from "@/types";
import { useGameStore } from "@/store/game-store";

interface AnalysisResult {
  summary: string;
  insights: CoachInsight[];
  reviews: MoveReview[];
}

export function CoachAnalysis() {
  const game = useGameStore((state) => state.game);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (game.status !== "finished") {
      queueMicrotask(() => {
        setAnalysis(null);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      setLoading(true);
      setAnalysis(null);
    });
    const timer = window.setTimeout(() => {
      setAnalysis(analyzeGame(game));
      setLoading(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [game]);

  if (game.status !== "finished") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            ИИ-тренер
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Глубокий анализ включится после завершения партии. Во время игры тренер не пересчитывает engine-варианты, чтобы не тормозить ходы.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            ИИ-тренер
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Анализируем партию...
        </CardContent>
      </Card>
    );
  }

  const topReviews = analysis.reviews.slice(-4).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4" />
          ИИ-тренер
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        {analysis.insights.map((insight, index) => (
          <div key={`${insight.title}-${index}`} className="rounded-md bg-muted p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">{insight.title}</div>
              {typeof insight.evalDelta === "number" ? (
                <span className="rounded-md bg-background px-2 py-1 text-xs font-bold">-{insight.evalDelta}</span>
              ) : null}
            </div>
            <div className="mt-1 text-muted-foreground">{insight.description}</div>
          </div>
        ))}
        {topReviews.length ? (
          <div className="space-y-2 border-t pt-3">
            <div className="text-xs font-bold uppercase text-muted-foreground">Последние оценки</div>
            {topReviews.map((review) => (
              <div key={`${review.move.id}-${review.moveNumber}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <span className="font-semibold">
                  {review.moveNumber}. {review.move.notation}
                </span>
                <span className={review.loss > 1.4 ? "flex items-center gap-1 text-destructive" : "flex items-center gap-1 text-primary"}>
                  {review.loss > 1.4 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.round(review.loss * 10) / 10}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
