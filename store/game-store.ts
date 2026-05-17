"use client";

import { create } from "zustand";
import type { Difficulty, GameMode, GameRecord, GameState, Move, Piece, PlayerColor, Square } from "@/types";
import { getAIMove } from "@/lib/ai/checkers-ai";
import {
  applyMove,
  checkWinner,
  cloneBoard,
  createInitialBoard,
  getCapturesForPiece,
  getPieceAt,
  getValidMoves,
  getValidMovesForPiece,
  isSameSquare,
  squareToLabel,
  switchTurn
} from "@/lib/checkers/rules";
import {
  defaultSettings,
  loadGuestAchievements,
  loadCurrentGame,
  loadSettings,
  isGuestMode,
  saveCurrentGame,
  saveGuestAchievements,
  saveGuestRecord,
  saveSettings,
  type LocalSettings
} from "@/lib/storage/local";
import { saveGameRecordToSupabase } from "@/lib/supabase/games";
import { evaluateAchievements } from "@/lib/achievements/catalog";
import { unlockSupabaseAchievements } from "@/lib/supabase/profiles";

interface GameStore {
  game: GameState;
  settings: LocalSettings;
  past: GameState[];
  hydrated: boolean;
  hydrate: () => void;
  newGame: (mode?: GameMode, difficulty?: Difficulty) => void;
  selectSquare: (square: Square) => void;
  makeMove: (move: Move) => void;
  makeAIMove: () => void;
  undo: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  toggleHints: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: LocalSettings["language"]) => void;
  setBoardTheme: (theme: string) => void;
  setPieceSkin: (skin: string) => void;
  startCustomGame: (board: GameState["board"], turn: PlayerColor, mode?: Extract<GameMode, "local" | "ai">, difficulty?: Difficulty) => void;
  surrender: (winner?: PlayerColor) => void;
}

function createFreshGame(mode: GameMode = "local", aiDifficulty: Difficulty = "medium"): GameState {
  return {
    id: cryptoSafeId(),
    board: createInitialBoard(),
    initialBoard: createInitialBoard(),
    currentTurn: "white",
    mode,
    status: "playing",
    moveHistory: [],
    validMoves: [],
    aiDifficulty,
    startedAt: new Date().toISOString()
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createFreshGame(),
  settings: defaultSettings,
  past: [],
  hydrated: false,
  hydrate: () => {
    const settings = loadSettings();
    const game = loadCurrentGame();
    set({
      settings,
      game: game ?? createFreshGame("local", settings.aiDifficulty),
      hydrated: true
    });
  },
  newGame: (mode = get().game.mode, difficulty = get().settings.aiDifficulty) => {
    const settings = { ...get().settings, boardTheme: "classic" };
    const game = createFreshGame(mode, difficulty);
    set({ game, past: [], settings });
    saveSettings(settings);
    saveCurrentGame(game);
  },
  selectSquare: (square) => {
    const { game } = get();
    if (game.status !== "playing") return;
    if (game.mode === "online" && game.localPlayerColor && game.currentTurn !== game.localPlayerColor) {
      set({ game: { ...game, message: "Сейчас ход соперника. Дождитесь синхронизации через WebSocket." } });
      return;
    }

    const targetMove = game.validMoves.find((move) => isSameSquare(move.to, square));
    if (targetMove) {
      get().makeMove(targetMove);
      return;
    }

    const piece = getPieceAt(game.board, square);
    if (!piece || piece.color !== game.currentTurn) {
      set({ game: { ...game, message: "Выберите свою фигуру, затем доступную клетку." } });
      return;
    }

    if (game.forcedPieceId && piece.id !== game.forcedPieceId) {
      set({ game: { ...game, message: "Продолжите множественное взятие этой же фигурой." } });
      return;
    }

    const pieceMoves = filterMovesForPiece(game, piece);
    set({
      game: {
        ...game,
        selectedPieceId: piece.id,
        validMoves: pieceMoves,
        message: pieceMoves.length ? undefined : "У этой фигуры сейчас нет допустимых ходов."
      }
    });
  },
  makeMove: (move) => {
    const { game } = get();
    if (game.status !== "playing") return;

    const legalMoves = game.forcedPieceId
      ? getValidMovesForPiece(game.board, getPieceAt(game.board, move.from) as Piece)
      : getValidMoves(game.board, game.currentTurn);
    const legalMove = legalMoves.find((candidate) => candidate.id === move.id);

    if (!legalMove) {
      set({ game: { ...game, message: "Такой ход невозможен по текущим правилам." } });
      return;
    }

    const nextBoard = applyMove(game.board, legalMove);
    const movedPiece = getPieceAt(nextBoard, legalMove.to);
    const extraCaptures = movedPiece && legalMove.isCapture ? getCapturesForPiece(nextBoard, movedPiece) : [];
    const shouldContinueCapture = Boolean(extraCaptures.length && movedPiece);
    const nextTurn = shouldContinueCapture ? game.currentTurn : switchTurn(game.currentTurn);
    const winner = shouldContinueCapture ? null : checkWinner(nextBoard, nextTurn);
    const finished = Boolean(winner);
    const createdAt = new Date().toISOString();
    const nextMoveHistory = buildMoveHistory(game.moveHistory, legalMove, createdAt, Boolean(game.forcedPieceId));
    const nextGame: GameState = {
      ...game,
      board: nextBoard,
      currentTurn: nextTurn,
      status: finished ? "finished" : "playing",
      winner: winner ?? undefined,
      moveHistory: nextMoveHistory,
      selectedPieceId: shouldContinueCapture ? movedPiece?.id : undefined,
      validMoves: shouldContinueCapture ? extraCaptures : [],
      forcedPieceId: shouldContinueCapture ? movedPiece?.id : undefined,
      endedAt: finished ? new Date().toISOString() : undefined,
      message: shouldContinueCapture ? "Есть продолжение взятия." : undefined
    };

    set({ game: nextGame, past: [...get().past, game].slice(-24) });
    saveCurrentGame(nextGame);
    if (finished) saveFinishedGame(nextGame);
  },
  makeAIMove: () => {
    const { game } = get();
    if (game.mode !== "ai" || game.currentTurn !== "black" || game.status !== "playing") return;
    const move = getAIMove(game, game.aiDifficulty);
    if (move) get().makeMove(move);
  },
  undo: () => {
    const { past } = get();
    const previous = past[past.length - 1];
    if (!previous) return;
    set({ game: previous, past: past.slice(0, -1) });
    saveCurrentGame(previous);
  },
  setDifficulty: (difficulty) => {
    const settings = { ...get().settings, aiDifficulty: difficulty };
    const game = { ...get().game, aiDifficulty: difficulty };
    set({ settings, game });
    saveSettings(settings);
    saveCurrentGame(game);
  },
  toggleHints: () => {
    const settings = { ...get().settings, hintsEnabled: !get().settings.hintsEnabled };
    set({ settings });
    saveSettings(settings);
  },
  setTheme: (theme) => {
    const settings = { ...get().settings, theme };
    set({ settings });
    saveSettings(settings);
  },
  setLanguage: (language) => {
    const settings = { ...get().settings, language };
    set({ settings });
    saveSettings(settings);
  },
  setBoardTheme: (boardTheme) => {
    const settings = { ...get().settings, boardTheme };
    set({ settings });
    saveSettings(settings);
  },
  setPieceSkin: (pieceSkin) => {
    const settings = { ...get().settings, pieceSkin };
    set({ settings });
    saveSettings(settings);
  },
  startCustomGame: (board, turn, mode = "local", difficulty = get().settings.aiDifficulty) => {
    const settings = { ...get().settings, boardTheme: "classic" };
    const initialBoard = cloneBoard(board);
    const game: GameState = {
      id: cryptoSafeId(),
      board: cloneBoard(board),
      initialBoard,
      currentTurn: turn,
      mode,
      status: "playing",
      moveHistory: [],
      validMoves: [],
      aiDifficulty: difficulty,
      fromSandbox: true,
      startedAt: new Date().toISOString(),
      message: "Позиция из песочницы загружена. Можно тестировать идею сразу на доске."
    };
    set({ game, past: [], settings });
    saveSettings(settings);
    saveCurrentGame(game);
  },
  surrender: (winner = switchTurn(get().game.currentTurn)) => {
    const game = { ...get().game, status: "finished" as const, winner, endedAt: new Date().toISOString() };
    set({ game });
    saveCurrentGame(game);
    saveFinishedGame(game);
  }
}));

function filterMovesForPiece(game: GameState, piece: Piece): Move[] {
  const moves = game.forcedPieceId ? getValidMovesForPiece(game.board, piece) : getValidMoves(game.board, game.currentTurn);
  return moves.filter((move) => move.pieceId === piece.id);
}

function buildMoveHistory(history: Move[], move: Move, createdAt: string, isContinuation: boolean): Move[] {
  const currentMove = { ...move, createdAt };
  const previousMove = history.at(-1);

  if (
    !isContinuation ||
    !previousMove ||
    !previousMove.isCapture ||
    !currentMove.isCapture ||
    previousMove.pieceId !== currentMove.pieceId ||
    previousMove.player !== currentMove.player
  ) {
    return [...history, currentMove];
  }

  const path = [...previousMove.path, ...currentMove.path.slice(1)];
  const captures = [...previousMove.captures, ...currentMove.captures];
  const capturedPieceIds = [...previousMove.capturedPieceIds, ...currentMove.capturedPieceIds];
  const notation = `${squareToLabel(previousMove.from)}${path
    .slice(1)
    .map((square) => `x${squareToLabel(square)}`)
    .join("")}${currentMove.promotion ? "=K" : ""}`;

  return [
    ...history.slice(0, -1),
    {
      ...previousMove,
      id: `${previousMove.id}+${currentMove.id}`,
      to: currentMove.to,
      path,
      captures,
      capturedPieceIds,
      promotion: previousMove.promotion || currentMove.promotion,
      notation,
      createdAt
    }
  ];
}

function saveFinishedGame(game: GameState): void {
  if (game.mode === "online" && !game.localPlayerColor) return;

  const record: GameRecord = {
    id: game.id,
    mode: game.mode,
    status: game.status,
    winner: game.winner,
    initialBoard: game.initialBoard,
    fromSandbox: game.fromSandbox,
    moves: game.moveHistory,
    durationMs: new Date(game.endedAt ?? new Date()).getTime() - new Date(game.startedAt).getTime(),
    createdAt: game.startedAt,
    aiDifficulty: game.aiDifficulty,
    playerBlack: game.localPlayerColor === "black" ? "__current_user__" : undefined
  };
  if (isGuestMode()) {
    saveGuestRecord(record);
  }
  const achievements = evaluateAchievements(game, loadGuestAchievements());
  saveGuestAchievements(achievements);
  void unlockSupabaseAchievements(achievements);
  void saveGameRecordToSupabase(record);
}

function cryptoSafeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `game-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
