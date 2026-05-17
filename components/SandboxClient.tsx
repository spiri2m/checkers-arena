"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Crown, Eraser, FlipHorizontal2, Play, RotateCcw, Save, Sparkles, Trash2, Users } from "lucide-react";
import type { Board, Difficulty, PlayerColor, SandboxSetup, Square } from "@/types";
import { Piece } from "@/components/game/Piece";
import { boardThemes } from "@/components/game/Board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadSandboxSetups, saveSandboxSetups } from "@/lib/storage/local";
import {
  analyzeSandboxBoard,
  cloneSandboxBoard,
  createPieceFromTool,
  createSandboxBoard,
  isDarkSquare,
  sandboxPresets,
  type SandboxTool
} from "@/lib/sandbox/presets";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const tools: Array<{ id: SandboxTool; label: string; description: string; tone: string }> = [
  { id: "white-man", label: "Белая", description: "простая", tone: "bg-stone-100 text-slate-900" },
  { id: "white-king", label: "Белая дамка", description: "дамка", tone: "bg-stone-100 text-slate-900" },
  { id: "black-man", label: "Черная", description: "простая", tone: "bg-slate-900 text-amber-200" },
  { id: "black-king", label: "Черная дамка", description: "дамка", tone: "bg-slate-900 text-amber-200" },
  { id: "erase", label: "Ластик", description: "удалить", tone: "bg-destructive text-destructive-foreground" }
];

export function SandboxClient() {
  const router = useRouter();
  const settings = useGameStore((state) => state.settings);
  const startCustomGame = useGameStore((state) => state.startCustomGame);
  const [activePresetId, setActivePresetId] = useState(sandboxPresets[2].id);
  const [board, setBoard] = useState<Board>(() => cloneSandboxBoard(sandboxPresets[2].board));
  const [turn, setTurn] = useState<PlayerColor>("black");
  const [tool, setTool] = useState<SandboxTool>("white-man");
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.aiDifficulty);
  const [savedSetups, setSavedSetups] = useState<SandboxSetup[]>([]);
  const [setupName, setSetupName] = useState("Моя позиция");
  const [message, setMessage] = useState("Выберите инструмент и кликайте по темным клеткам.");
  const theme = boardThemes.find((candidate) => candidate.id === settings.boardTheme) ?? boardThemes[0];
  const stats = useMemo(() => analyzeSandboxBoard(board), [board]);
  const canPlay = stats.whiteMen + stats.whiteKings > 0 && stats.blackMen + stats.blackKings > 0;

  useEffect(() => {
    queueMicrotask(() => setSavedSetups(loadSandboxSetups()));
  }, []);

  function loadSetup(setup: SandboxSetup) {
    setActivePresetId(setup.id);
    setBoard(cloneSandboxBoard(setup.board));
    setTurn(setup.currentTurn);
    setMessage(`Загружено: ${setup.title}`);
  }

  function editSquare(square: Square) {
    if (!isDarkSquare(square)) {
      setMessage("Фигуры можно ставить только на темные клетки.");
      return;
    }
    if (tool === "white-man" && square.row === 0) {
      setMessage("Белую простую шашку нельзя ставить на 8-й ряд. На этой линии она должна быть дамкой.");
      return;
    }
    if (tool === "black-man" && square.row === 7) {
      setMessage("Черную простую шашку нельзя ставить на 1-й ряд. На этой линии она должна быть дамкой.");
      return;
    }

    setBoard((current) => {
      const next = cloneSandboxBoard(current);
      const piece = createPieceFromTool(tool, square);
      next[square.row][square.col] = piece;
      return next;
    });
    setMessage(tool === "erase" ? "Клетка очищена." : "Фигура поставлена.");
  }

  function clearBoard() {
    setBoard(createSandboxBoard([]));
    setActivePresetId("custom");
    setMessage("Доска очищена. Можно собрать позицию с нуля.");
  }

  function mirrorBoard() {
    const pieces = board.flatMap((row) => row.filter(Boolean)).map((piece) => ({
      ...piece!,
      id: `${piece!.id}-mirror-${Date.now()}`,
      position: { row: 7 - piece!.position.row, col: 7 - piece!.position.col },
      color: piece!.color === "white" ? ("black" as const) : ("white" as const)
    }));
    setBoard(createSandboxBoard(pieces));
    setTurn(turn === "white" ? "black" : "white");
    setMessage("Позиция зеркально перевернута с заменой цветов.");
  }

  function saveSetup() {
    const setup: SandboxSetup = {
      id: `custom-${Date.now()}`,
      title: setupName.trim() || "Моя позиция",
      description: "Пользовательская позиция из песочницы.",
      board: cloneSandboxBoard(board),
      currentTurn: turn,
      tags: ["custom", `${stats.whiteMen + stats.whiteKings}v${stats.blackMen + stats.blackKings}`],
      createdAt: new Date().toISOString()
    };
    const next = [setup, ...savedSetups].slice(0, 12);
    setSavedSetups(next);
    saveSandboxSetups(next);
    setMessage("Позиция сохранена локально.");
  }

  function deleteSetup(id: string) {
    const next = savedSetups.filter((setup) => setup.id !== id);
    setSavedSetups(next);
    saveSandboxSetups(next);
  }

  function start(mode: "local" | "ai") {
    if (!canPlay) {
      setMessage("Для запуска нужны фигуры обеих сторон.");
      return;
    }
    startCustomGame(board, turn, mode, difficulty);
    router.push(mode === "ai" ? "/game/ai" : "/game/local");
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="border-b bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.28),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(20,83,45,0.86))] p-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-accent text-accent-foreground">Главная фича</Badge>
              <Badge variant="outline" className="border-white/30 text-white">Лаборатория позиций</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Песочница позиций</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78 sm:text-base">
              Собирайте любую доску: 10 шашек против 5 дамок, эндшпили, ловушки, тесты ИИ и тренировочные задачи. Потом запускайте позицию как обычную партию.
            </p>
          </div>
          <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <SandboxBoard board={board} onSquare={editSquare} theme={theme} pieceSkin={settings.pieceSkin} />
            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Инструменты</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {tools.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTool(item.id)}
                      className={cn(
                        "flex items-center justify-between rounded-md border bg-background p-2 text-left text-sm transition hover:bg-muted",
                        tool === item.id && "ring-2 ring-ring"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn("grid h-8 w-8 place-items-center rounded-full text-xs font-black", item.tone)}>
                          {item.id.includes("king") ? <Crown className="h-4 w-4" /> : item.id === "erase" ? <Eraser className="h-4 w-4" /> : "●"}
                        </span>
                        <span>
                          <span className="block font-bold">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Запуск</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={turn === "white" ? "default" : "outline"} onClick={() => setTurn("white")}>Ход белых</Button>
                    <Button variant={turn === "black" ? "default" : "outline"} onClick={() => setTurn("black")}>Ход черных</Button>
                  </div>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                  >
                    <option value="easy">ИИ: легко</option>
                    <option value="medium">ИИ: средне</option>
                    <option value="hard">ИИ: сложно</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => start("ai")} disabled={!canPlay}>
                      <Bot className="h-4 w-4" />
                      Против ИИ
                    </Button>
                    <Button variant="outline" onClick={() => start("local")} disabled={!canPlay}>
                      <Users className="h-4 w-4" />
                      Локально
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <SandboxStatsCard stats={stats} message={message} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Шаблоны
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sandboxPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadSetup(preset)}
                  className={cn(
                    "w-full rounded-md border bg-background p-3 text-left transition hover:bg-muted",
                    activePresetId === preset.id && "ring-2 ring-ring"
                  )}
                >
                  <span className="block font-bold">{preset.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{preset.description}</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Мои позиции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={setupName}
                onChange={(event) => setSetupName(event.target.value)}
                placeholder="Название позиции"
              />
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={clearBoard} title="Очистить">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={mirrorBoard} title="Зеркально">
                  <FlipHorizontal2 className="h-4 w-4" />
                </Button>
                <Button onClick={saveSetup} title="Сохранить">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              {savedSetups.length === 0 ? <p className="text-sm text-muted-foreground">Сохраненные позиции появятся здесь.</p> : null}
              {savedSetups.map((setup) => (
                <div key={setup.id} className="flex items-center gap-2 rounded-md bg-muted p-2">
                  <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={() => loadSetup(setup)}>
                    <span className="block truncate font-semibold">{setup.title}</span>
                    <span className="text-xs text-muted-foreground">{setup.tags.join(" · ")}</span>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => deleteSetup(setup.id)} title="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function SandboxBoard({
  board,
  onSquare,
  theme,
  pieceSkin
}: {
  board: Board;
  onSquare: (square: Square) => void;
  theme: { light: string; dark: string };
  pieceSkin: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[min(94vw,680px)]">
      <div className="board-shadow grid aspect-square grid-cols-8 overflow-hidden rounded-lg border-4 border-card bg-card">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const square = { row: rowIndex, col: colIndex };
            const dark = isDarkSquare(square);
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                onClick={() => onSquare(square)}
                className={cn(
                  "relative grid aspect-square place-items-center overflow-hidden transition hover:brightness-110",
                  dark ? theme.dark : theme.light,
                  !dark && "opacity-75"
                )}
              >
                {dark ? <span className="absolute left-1 top-1 text-[10px] font-bold text-white/35">{String.fromCharCode(97 + colIndex)}{8 - rowIndex}</span> : null}
                {piece ? <Piece piece={piece} skin={pieceSkin} /> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function SandboxStatsCard({ stats, message }: { stats: ReturnType<typeof analyzeSandboxBoard>; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Play className="h-4 w-4 text-primary" />
          Диагностика позиции
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Белые" value={`${stats.whiteMen} шашек · ${stats.whiteKings} дамок`} />
          <Stat label="Черные" value={`${stats.blackMen} шашек · ${stats.blackKings} дамок`} />
          <Stat label="Ходы белых" value={String(stats.whiteMoves)} />
          <Stat label="Ходы черных" value={String(stats.blackMoves)} />
        </div>
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</p>
        {stats.warnings.map((warning) => (
          <p key={warning} className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {warning}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-black">{value}</div>
    </div>
  );
}
