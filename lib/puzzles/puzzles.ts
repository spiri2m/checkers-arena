import type { Board, Piece, PlayerColor, Square } from "@/types";

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  board: Board;
  turn: PlayerColor;
  solution: Square[];
  difficulty: "easy" | "medium" | "hard" | "expert";
  motif: string;
  source: string;
}

export const puzzles: Puzzle[] = [
  {
    id: "best-capture",
    title: "Лучший удар",
    description: "Белые выигрывают материал обязательным взятием. Найдите стартовую фигуру и точную клетку приземления.",
    board: createPuzzleBoard([piece("w1", "white", "man", 5, 0), piece("b1", "black", "man", 4, 1), piece("b2", "black", "man", 2, 5)]),
    turn: "white",
    solution: sq(5, 0, 3, 2),
    difficulty: "easy",
    motif: "обязательное взятие",
    source: "CheckerCruncher: forced captures"
  },
  {
    id: "double-capture",
    title: "Двойное взятие",
    description: "После первого удара есть продолжение. Не останавливайте цепочку.",
    board: createPuzzleBoard([piece("w1", "white", "man", 5, 0), piece("b1", "black", "man", 4, 1), piece("b2", "black", "man", 2, 3)]),
    turn: "white",
    solution: sq(5, 0, 3, 2, 1, 4),
    difficulty: "medium",
    motif: "цепочка взятий",
    source: "Draughts.io: multiple jumps"
  },
  {
    id: "promotion",
    title: "Путь к дамке",
    description: "Проведите шашку на последнюю линию без лишних ходов.",
    board: createPuzzleBoard([piece("w1", "white", "man", 1, 2), piece("b1", "black", "man", 5, 6)]),
    turn: "white",
    solution: sq(1, 2, 0, 1),
    difficulty: "easy",
    motif: "превращение",
    source: "Draughts.io: king promotion"
  },
  {
    id: "king-range",
    title: "Дамка на диагонали",
    description: "Дамка бьет с расстояния. Выберите правильную клетку после удара.",
    board: createPuzzleBoard([piece("wk", "white", "king", 5, 0), piece("b1", "black", "man", 3, 2), piece("b2", "black", "man", 6, 5)]),
    turn: "white",
    solution: sq(5, 0, 2, 3),
    difficulty: "medium",
    motif: "дамочный удар",
    source: "CheckerCruncher: king tactics"
  },
  {
    id: "black-counter",
    title: "Контрудар черных",
    description: "Черные ходят и сразу перехватывают инициативу длинной цепочкой.",
    board: createPuzzleBoard([piece("b1", "black", "man", 2, 1), piece("w1", "white", "man", 3, 2), piece("w2", "white", "man", 5, 4)]),
    turn: "black",
    solution: sq(2, 1, 4, 3, 6, 5),
    difficulty: "medium",
    motif: "контрвзятие",
    source: "Play Abstract Games: forced-capture patterns"
  },
  {
    id: "avoid-quiet",
    title: "Тихий ход запрещен",
    description: "Есть обязательное взятие. Найдите его, даже если обычный ход выглядит заманчиво.",
    board: createPuzzleBoard([piece("w1", "white", "man", 5, 4), piece("w2", "white", "man", 5, 0), piece("b1", "black", "man", 4, 3)]),
    turn: "white",
    solution: sq(5, 4, 3, 2),
    difficulty: "easy",
    motif: "обязательное взятие",
    source: "CheckerCruncher: forced captures"
  },
  {
    id: "last-rank-trap",
    title: "Прорыв к дамке",
    description: "Белые совмещают взятие и выход на последнюю линию.",
    board: createPuzzleBoard([piece("w1", "white", "man", 2, 3), piece("b1", "black", "man", 1, 4), piece("b2", "black", "man", 6, 1)]),
    turn: "white",
    solution: sq(2, 3, 0, 5),
    difficulty: "medium",
    motif: "взятие с превращением",
    source: "Draughts.io: promotion tactics"
  },
  {
    id: "center-control",
    title: "Центр доски",
    description: "Лучший ход забирает фигуру и оставляет шашку в активном центре.",
    board: createPuzzleBoard([piece("b1", "black", "man", 2, 5), piece("w1", "white", "man", 3, 4), piece("w2", "white", "man", 6, 1)]),
    turn: "black",
    solution: sq(2, 5, 4, 3),
    difficulty: "easy",
    motif: "центр",
    source: "Play Abstract Games: center control"
  },
  {
    id: "zigzag-four",
    title: "Зигзаг на четыре удара",
    description: "Белая шашка должна пройти всю цепочку. Считайте диагонали до конца.",
    board: createPuzzleBoard([
      piece("w1", "white", "man", 6, 1),
      piece("b1", "black", "man", 5, 2),
      piece("b2", "black", "man", 3, 4),
      piece("b3", "black", "man", 1, 4),
      piece("b4", "black", "man", 1, 2)
    ]),
    turn: "white",
    solution: sq(6, 1, 4, 3, 2, 5, 0, 3, 2, 1),
    difficulty: "hard",
    motif: "многоходовое взятие",
    source: "CheckerCruncher: multi-capture drills"
  },
  {
    id: "black-ladder",
    title: "Лестница черных",
    description: "Черные начинают с края и поднимают темп тремя точными взятиями.",
    board: createPuzzleBoard([
      piece("b1", "black", "man", 1, 6),
      piece("w1", "white", "man", 2, 5),
      piece("w2", "white", "man", 4, 3),
      piece("w3", "white", "man", 4, 1)
    ]),
    turn: "black",
    solution: sq(1, 6, 3, 4, 5, 2, 3, 0),
    difficulty: "hard",
    motif: "лестница взятий",
    source: "Draughts.io: multiple jumps"
  },
  {
    id: "flying-king-triple",
    title: "Дамочный маршрут",
    description: "Дамка должна выбрать короткие приземления, чтобы не потерять продолжение.",
    board: createPuzzleBoard([
      piece("wk", "white", "king", 7, 0),
      piece("b1", "black", "man", 5, 2),
      piece("b2", "black", "man", 3, 4),
      piece("b3", "black", "man", 1, 6)
    ]),
    turn: "white",
    solution: sq(7, 0, 4, 3, 2, 5, 0, 7),
    difficulty: "hard",
    motif: "дамочная цепочка",
    source: "CheckerCruncher: king tactics"
  },
  {
    id: "black-king-sweep",
    title: "Черная дамка чистит диагональ",
    description: "Черная дамка проходит от верхнего угла до нижнего, забирая три фигуры.",
    board: createPuzzleBoard([
      piece("bk", "black", "king", 0, 7),
      piece("w1", "white", "man", 2, 5),
      piece("w2", "white", "man", 4, 3),
      piece("w3", "white", "man", 6, 1)
    ]),
    turn: "black",
    solution: sq(0, 7, 3, 4, 5, 2, 7, 0),
    difficulty: "hard",
    motif: "дамочная зачистка",
    source: "CheckerCruncher: king tactics"
  },
  {
    id: "forced-choice",
    title: "Выбор под давлением",
    description: "Есть несколько взятий, но только один маршрут дает длинную серию.",
    board: createPuzzleBoard([
      piece("w1", "white", "man", 5, 2),
      piece("w2", "white", "man", 5, 6),
      piece("b1", "black", "man", 4, 3),
      piece("b2", "black", "man", 2, 5),
      piece("b3", "black", "man", 2, 1)
    ]),
    turn: "white",
    solution: sq(5, 2, 3, 4, 1, 6),
    difficulty: "hard",
    motif: "выбор цепочки",
    source: "Play Abstract Games: forced-capture patterns"
  },
  {
    id: "edge-escape",
    title: "Побег с края",
    description: "Фигура на краю не зажата: у нее есть точный двойной удар.",
    board: createPuzzleBoard([
      piece("w1", "white", "man", 7, 6),
      piece("b1", "black", "man", 6, 5),
      piece("b2", "black", "man", 4, 3),
      piece("b3", "black", "man", 1, 0)
    ]),
    turn: "white",
    solution: sq(7, 6, 5, 4, 3, 2),
    difficulty: "medium",
    motif: "краевой удар",
    source: "Draughts.io: jump sequences"
  },
  {
    id: "royal-fork",
    title: "Дамочная вилка",
    description: "Дамка забирает первую фигуру и сразу выходит на вторую диагональ.",
    board: createPuzzleBoard([
      piece("wk", "white", "king", 6, 7),
      piece("b1", "black", "man", 4, 5),
      piece("b2", "black", "man", 2, 3),
      piece("b3", "black", "man", 2, 1)
    ]),
    turn: "white",
    solution: sq(6, 7, 3, 4, 1, 2, 3, 0),
    difficulty: "expert",
    motif: "смена диагонали дамкой",
    source: "CheckerCruncher: king tactics"
  },
  {
    id: "six-square-net",
    title: "Сеть из шести клеток",
    description: "Маршрут выглядит коротким, но после второго удара появляется обратный ход.",
    board: createPuzzleBoard([
      piece("b1", "black", "man", 0, 1),
      piece("w1", "white", "man", 1, 2),
      piece("w2", "white", "man", 3, 4),
      piece("w3", "white", "man", 5, 4),
      piece("w4", "white", "man", 5, 2)
    ]),
    turn: "black",
    solution: sq(0, 1, 2, 3, 4, 5, 6, 3, 4, 1),
    difficulty: "expert",
    motif: "обратный многоудар",
    source: "CheckerCruncher: multi-capture drills"
  },
  {
    id: "promotion-combo",
    title: "Комбо с превращением",
    description: "Сначала взятие, затем выход на дамочное поле. Не перепутайте порядок.",
    board: createPuzzleBoard([
      piece("w1", "white", "man", 2, 1),
      piece("b1", "black", "man", 1, 2),
      piece("b2", "black", "man", 5, 6)
    ]),
    turn: "white",
    solution: sq(2, 1, 0, 3),
    difficulty: "medium",
    motif: "удар в дамки",
    source: "Draughts.io: king promotion"
  },
  {
    id: "king-landing-choice",
    title: "Выбор приземления дамки",
    description: "Дамка может приземлиться на разные клетки, но только одна сохраняет продолжение.",
    board: createPuzzleBoard([
      piece("wk", "white", "king", 7, 2),
      piece("b1", "black", "man", 5, 4),
      piece("b2", "black", "man", 3, 6),
      piece("b3", "black", "man", 2, 3)
    ]),
    turn: "white",
    solution: sq(7, 2, 4, 5, 2, 7),
    difficulty: "expert",
    motif: "точное приземление дамки",
    source: "CheckerCruncher: king tactics"
  }
];

export const dailyPuzzle = puzzles[new Date().getUTCDate() % puzzles.length];

function createPuzzleBoard(pieces: Piece[]): Board {
  const board = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  for (const item of pieces) {
    board[item.position.row][item.position.col] = item;
  }
  return board;
}

function piece(id: string, color: PlayerColor, type: Piece["type"], row: number, col: number): Piece {
  return {
    id,
    color,
    type,
    position: { row, col }
  };
}

function sq(...values: number[]): Square[] {
  const squares: Square[] = [];
  for (let index = 0; index < values.length; index += 2) {
    squares.push({ row: values[index], col: values[index + 1] });
  }
  return squares;
}
