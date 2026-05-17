import { BookOpen, Crown, MousePointer2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ExamplePiece = "white" | "black" | "whiteKing" | "blackKing";

interface Lesson {
  title: string;
  text: string;
  icon: typeof MousePointer2;
  pieces: Record<string, ExamplePiece>;
  marks: Record<string, "move" | "capture" | "path">;
  note: string;
}

const lessons: Lesson[] = [
  {
    title: "Диагональный ход",
    text: "Обычная шашка ходит на одну свободную диагональную клетку вперед.",
    icon: MousePointer2,
    pieces: { "5-2": "white" },
    marks: { "4-1": "move", "4-3": "move" },
    note: "Белая шашка с c3 может пойти на b4 или d4."
  },
  {
    title: "Обязательное взятие",
    text: "Если есть взятие, обычный тихий ход становится недоступен.",
    icon: ShieldAlert,
    pieces: { "5-2": "white", "4-3": "black" },
    marks: { "3-4": "capture", "4-1": "path" },
    note: "Ход на b4 слабее, но запрещен: нужно бить c3xe5."
  },
  {
    title: "Множественное взятие",
    text: "После первого удара той же фигурой нужно продолжать, пока есть следующее взятие.",
    icon: BookOpen,
    pieces: { "5-0": "white", "4-1": "black", "2-3": "black" },
    marks: { "3-2": "capture", "1-4": "capture" },
    note: "Маршрут: a3xc5xe7. Остановка после первого взятия невозможна."
  },
  {
    title: "Дамка",
    text: "На последней линии шашка становится дамкой и ходит по диагонали на расстояние.",
    icon: Crown,
    pieces: { "1-2": "white", "5-6": "blackKing" },
    marks: { "0-1": "move", "0-3": "move", "4-5": "path", "3-4": "path", "2-3": "path" },
    note: "Белая шашка близка к превращению, а дамка уже контролирует длинную диагональ."
  }
];

export default function LearnPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Rules</p>
        <h1 className="text-3xl font-black">Обучение</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {lessons.map((lesson) => (
          <Card key={lesson.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <lesson.icon className="h-5 w-5 text-primary" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <MiniBoard pieces={lesson.pieces} marks={lesson.marks} />
              <div className="space-y-2">
                <p className="text-muted-foreground">{lesson.text}</p>
                <p className="rounded-md bg-muted p-3 text-sm font-medium">{lesson.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MiniBoard({ pieces, marks }: { pieces: Lesson["pieces"]; marks: Lesson["marks"] }) {
  return (
    <div className="grid aspect-square w-full max-w-[180px] grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border">
      {Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const key = `${row}-${col}`;
        const dark = (row + col) % 2 === 1;
        const piece = pieces[key];
        const mark = marks[key];

        return (
          <div
            key={key}
            className={cn(
              "relative grid min-h-0 place-items-center",
              dark ? "bg-[#7f1d1d]" : "bg-[#f3ead7]",
              mark === "move" && "after:absolute after:h-2 after:w-2 after:rounded-full after:bg-primary",
              mark === "capture" && "after:absolute after:inset-1 after:rounded-sm after:border-2 after:border-destructive",
              mark === "path" && "after:absolute after:h-2 after:w-2 after:rounded-full after:bg-accent"
            )}
          >
            {piece ? <MiniPiece piece={piece} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function MiniPiece({ piece }: { piece: ExamplePiece }) {
  const white = piece === "white" || piece === "whiteKing";
  const king = piece === "whiteKing" || piece === "blackKing";

  return (
    <span
      className={cn(
        "relative grid h-[68%] w-[68%] place-items-center rounded-full border shadow-sm",
        white ? "border-white bg-stone-50 text-slate-900" : "border-slate-700 bg-slate-950 text-amber-300"
      )}
    >
      {king ? <Crown className="h-3 w-3" /> : null}
    </span>
  );
}
