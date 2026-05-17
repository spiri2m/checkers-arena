import type { Board, Piece, PieceType, PlayerColor, SandboxSetup, Square } from "@/types";
import { getPieces, getValidMoves } from "@/lib/checkers/rules";

export type SandboxTool = "white-man" | "white-king" | "black-man" | "black-king" | "erase";

export interface SandboxStats {
  whiteMen: number;
  whiteKings: number;
  blackMen: number;
  blackKings: number;
  whiteMoves: number;
  blackMoves: number;
  warnings: string[];
}

export const sandboxPresets: SandboxSetup[] = [
  {
    id: "empty-lab",
    title: "Пустая доска",
    description: "Чистая лаборатория для своей позиции, эндшпиля или тренировки дамок.",
    board: createSandboxBoard([]),
    currentTurn: "white",
    tags: ["editor", "blank"]
  },
  {
    id: "standard-break",
    title: "Стартовая позиция",
    description: "Обычная расстановка 12 на 12, если хочется быстро изменить пару фигур.",
    board: createStandardSandboxBoard(),
    currentTurn: "white",
    tags: ["classic", "12v12"]
  },
  {
    id: "ten-vs-five-kings",
    title: "10 шашек против 5 дамок",
    description: "Нечестный, но полезный стресс-тест: плотная масса против мобильных дамок.",
    board: createSandboxBoard([
      piece("w1", "white", "man", 7, 0),
      piece("w2", "white", "man", 7, 2),
      piece("w3", "white", "man", 7, 4),
      piece("w4", "white", "man", 7, 6),
      piece("w5", "white", "man", 6, 1),
      piece("w6", "white", "man", 6, 3),
      piece("w7", "white", "man", 6, 5),
      piece("w8", "white", "man", 6, 7),
      piece("w9", "white", "man", 5, 0),
      piece("w10", "white", "man", 5, 2),
      piece("bk1", "black", "king", 0, 1),
      piece("bk2", "black", "king", 0, 5),
      piece("bk3", "black", "king", 2, 1),
      piece("bk4", "black", "king", 2, 5),
      piece("bk5", "black", "king", 3, 6)
    ]),
    currentTurn: "black",
    tags: ["imbalance", "kings"]
  },
  {
    id: "promotion-race",
    title: "Гонка в дамки",
    description: "Обе стороны рядом с последней линией. Проверь, кто успевает первым.",
    board: createSandboxBoard([
      piece("w1", "white", "man", 1, 2),
      piece("w2", "white", "man", 3, 4),
      piece("b1", "black", "man", 6, 5),
      piece("b2", "black", "man", 4, 3),
      piece("wk", "white", "king", 5, 0)
    ]),
    currentTurn: "white",
    tags: ["promotion", "endgame"]
  },
  {
    id: "capture-lab",
    title: "Лаборатория взятий",
    description: "Позиция с несколькими цепочками, чтобы тестировать обязательное и множественное взятие.",
    board: createSandboxBoard([
      piece("w1", "white", "man", 5, 0),
      piece("w2", "white", "man", 5, 4),
      piece("b1", "black", "man", 4, 1),
      piece("b2", "black", "man", 2, 3),
      piece("b3", "black", "man", 4, 5),
      piece("b4", "black", "man", 2, 7)
    ]),
    currentTurn: "white",
    tags: ["captures", "combo"]
  },
  {
    id: "king-hunt",
    title: "Охота на дамку",
    description: "Одна дамка пытается удержаться против группы шашек и угрозы перекрытия диагоналей.",
    board: createSandboxBoard([
      piece("wk", "white", "king", 6, 1),
      piece("b1", "black", "man", 3, 2),
      piece("b2", "black", "man", 3, 4),
      piece("b3", "black", "man", 5, 4),
      piece("b4", "black", "man", 1, 6)
    ]),
    currentTurn: "black",
    tags: ["king", "trap"]
  }
];

export function createSandboxBoard(pieces: Piece[]): Board {
  const board = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  for (const item of pieces) {
    if (!isDarkSquare(item.position)) continue;
    board[item.position.row][item.position.col] = {
      ...item,
      position: { ...item.position }
    };
  }
  return board;
}

export function createPieceFromTool(tool: SandboxTool, square: Square): Piece | null {
  if (tool === "erase") return null;
  const [color, type] = tool.split("-") as [PlayerColor, PieceType];
  return {
    id: `${color}-${type}-${square.row}-${square.col}-${Date.now()}`,
    color,
    type,
    position: { ...square }
  };
}

export function analyzeSandboxBoard(board: Board): SandboxStats {
  const pieces = getPieces(board);
  const whiteMen = pieces.filter((item) => item.color === "white" && item.type === "man").length;
  const whiteKings = pieces.filter((item) => item.color === "white" && item.type === "king").length;
  const blackMen = pieces.filter((item) => item.color === "black" && item.type === "man").length;
  const blackKings = pieces.filter((item) => item.color === "black" && item.type === "king").length;
  const whiteMoves = getValidMoves(board, "white").length;
  const blackMoves = getValidMoves(board, "black").length;
  const warnings: string[] = [];

  if (whiteMen + whiteKings === 0) warnings.push("У белых нет фигур.");
  if (blackMen + blackKings === 0) warnings.push("У черных нет фигур.");
  if (whiteMoves === 0 && whiteMen + whiteKings > 0) warnings.push("У белых нет легальных ходов.");
  if (blackMoves === 0 && blackMen + blackKings > 0) warnings.push("У черных нет легальных ходов.");
  if (pieces.length > 32) warnings.push("На доске больше 32 фигур. Это можно тестировать, но позиция нестандартная.");

  return { whiteMen, whiteKings, blackMen, blackKings, whiteMoves, blackMoves, warnings };
}

export function cloneSandboxBoard(board: Board): Board {
  return board.map((row) => row.map((item) => (item ? { ...item, position: { ...item.position } } : null)));
}

export function isDarkSquare(square: Square): boolean {
  return (square.row + square.col) % 2 === 1;
}

function createStandardSandboxBoard(): Board {
  const pieces: Piece[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (!isDarkSquare({ row, col })) continue;
      if (row < 3) pieces.push(piece(`b-${row}-${col}`, "black", "man", row, col));
      if (row > 4) pieces.push(piece(`w-${row}-${col}`, "white", "man", row, col));
    }
  }
  return createSandboxBoard(pieces);
}

function piece(id: string, color: PlayerColor, type: PieceType, row: number, col: number): Piece {
  return {
    id,
    color,
    type,
    position: { row, col }
  };
}
