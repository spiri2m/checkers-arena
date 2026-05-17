import type { Achievement, Difficulty, GameRecord, GameState, SandboxSetup } from "@/types";
import { deserializeGameState, serializeGameState } from "@/lib/checkers/rules";

const CURRENT_GAME_KEY = "checkers-arena:current-game";
const GUEST_HISTORY_KEY = "checkers-arena:guest-history";
const SETTINGS_KEY = "checkers-arena:settings";
const GUEST_ACHIEVEMENTS_KEY = "checkers-arena:guest-achievements";
const STORAGE_OWNER_KEY = "checkers-arena:storage-owner";
const SANDBOX_SETUPS_KEY = "checkers-arena:sandbox-setups";

export interface LocalSettings {
  theme: "light" | "dark";
  language: "ru" | "en";
  hintsEnabled: boolean;
  aiDifficulty: Difficulty;
  boardTheme: string;
  pieceSkin: string;
}

export const defaultSettings: LocalSettings = {
  theme: "dark",
  language: "ru",
  hintsEnabled: true,
  aiDifficulty: "medium",
  boardTheme: "classic",
  pieceSkin: "marble"
};

export function saveCurrentGame(gameState: GameState): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(currentGameKey(), serializeGameState(gameState));
}

export function loadCurrentGame(): GameState | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(currentGameKey());
  if (!raw) return null;

  try {
    return deserializeGameState(raw);
  } catch {
    window.localStorage.removeItem(currentGameKey());
    return null;
  }
}

export function clearCurrentGame(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(currentGameKey());
  window.localStorage.removeItem(CURRENT_GAME_KEY);
}

export function isGuestMode(): boolean {
  return isBrowser() && window.localStorage.getItem("checkers-arena:guest-mode") === "true";
}

export function syncStorageOwner(owner: string): boolean {
  if (!isBrowser()) return false;
  const normalizedOwner = owner || "anonymous";
  const previousOwner = window.localStorage.getItem(STORAGE_OWNER_KEY);
  if (previousOwner === normalizedOwner) return false;

  if (previousOwner) {
    window.localStorage.removeItem(scopedCurrentGameKey(previousOwner));
  }
  window.localStorage.removeItem(CURRENT_GAME_KEY);
  window.localStorage.setItem(STORAGE_OWNER_KEY, normalizedOwner);
  return true;
}

export function saveGuestRecord(record: GameRecord): void {
  if (!isBrowser()) return;
  const records = loadGuestRecords();
  window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify([record, ...records].slice(0, 50)));
}

export function loadGuestRecords(): GameRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(GUEST_HISTORY_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as GameRecord[];
  } catch {
    window.localStorage.removeItem(GUEST_HISTORY_KEY);
    return [];
  }
}

export function saveGuestAchievements(achievements: Achievement[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(GUEST_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

export function loadGuestAchievements(): Achievement[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(GUEST_ACHIEVEMENTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Achievement[];
  } catch {
    window.localStorage.removeItem(GUEST_ACHIEVEMENTS_KEY);
    return [];
  }
}

export function saveSandboxSetups(setups: SandboxSetup[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SANDBOX_SETUPS_KEY, JSON.stringify(setups.slice(0, 24)));
}

export function loadSandboxSetups(): SandboxSetup[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(SANDBOX_SETUPS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SandboxSetup[];
  } catch {
    window.localStorage.removeItem(SANDBOX_SETUPS_KEY);
    return [];
  }
}

export function saveSettings(settings: LocalSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): LocalSettings {
  if (!isBrowser()) return defaultSettings;
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<LocalSettings>) };
  } catch {
    window.localStorage.removeItem(SETTINGS_KEY);
    return defaultSettings;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function currentGameKey(): string {
  if (!isBrowser()) return scopedCurrentGameKey("anonymous");
  const owner =
    window.localStorage.getItem(STORAGE_OWNER_KEY) ??
    (window.localStorage.getItem("checkers-arena:guest-mode") === "true" ? "guest" : "anonymous");
  return scopedCurrentGameKey(owner);
}

function scopedCurrentGameKey(owner: string): string {
  return `${CURRENT_GAME_KEY}:${owner}`;
}
