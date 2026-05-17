import type { GameRecord, Move, PlayerProfile } from "@/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const CURRENT_USER_TOKEN = "__current_user__";

export async function saveGameRecordToSupabase(record: GameRecord): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await ensureProfile(user.id, user.email);

  const { data: existingGame } = await supabase
    .from("games")
    .select("id,white_player_id,black_player_id")
    .eq("id", record.id)
    .maybeSingle();
  const userAlreadyRecorded =
    existingGame?.white_player_id === user.id || existingGame?.black_player_id === user.id;
  if (userAlreadyRecorded) return;

  const userIsBlack = record.playerBlack === CURRENT_USER_TOKEN || record.playerBlack === user.id;
  const whitePlayerId = userIsBlack ? (record.playerWhite ?? existingGame?.white_player_id ?? null) : (record.playerWhite ?? user.id);
  const blackPlayerId = userIsBlack ? user.id : (record.playerBlack ?? existingGame?.black_player_id ?? null);
  let persistedGameId = record.id;

  const gamePayload = {
    id: persistedGameId,
    mode: record.mode,
    status: record.status,
    winner: record.winner,
    duration_ms: record.durationMs,
    ai_difficulty: record.aiDifficulty,
    initial_board: record.initialBoard,
    white_player_id: whitePlayerId,
    black_player_id: blackPlayerId,
    created_by: user.id,
    created_at: record.createdAt
  };

  let { error: gameError } = await supabase.from("games").upsert(gamePayload);
  if (gameError && (gameError.message.toLowerCase().includes("ai_difficulty") || gameError.message.toLowerCase().includes("initial_board"))) {
    const fallbackPayload = {
      id: persistedGameId,
      mode: record.mode,
      status: record.status,
      winner: record.winner,
      duration_ms: record.durationMs,
      white_player_id: whitePlayerId,
      black_player_id: blackPlayerId,
      created_by: user.id,
      created_at: record.createdAt
    };
    const fallbackResult = await supabase.from("games").upsert(fallbackPayload);
    gameError = fallbackResult.error;
  }

  if (gameError) {
    persistedGameId = createRecordId();
    const personalPayload = {
      ...gamePayload,
      id: persistedGameId,
      white_player_id: userIsBlack ? null : user.id,
      black_player_id: userIsBlack ? user.id : null,
      created_by: user.id
    };
    const personalResult = await supabase.from("games").insert(personalPayload);
    if (personalResult.error && (personalResult.error.message.toLowerCase().includes("ai_difficulty") || personalResult.error.message.toLowerCase().includes("initial_board"))) {
      await supabase.from("games").insert({
        id: persistedGameId,
        mode: record.mode,
        status: record.status,
        winner: record.winner,
        duration_ms: record.durationMs,
        white_player_id: userIsBlack ? null : user.id,
        black_player_id: userIsBlack ? user.id : null,
        created_by: user.id,
        created_at: record.createdAt
      });
    }
  }

  if (record.moves.length) {
    await supabase.from("moves").upsert(
      record.moves.map((move, index) => ({
        game_id: persistedGameId,
        move_number: index + 1,
        player: move.player,
        notation: move.notation,
        payload: move
      })),
      { onConflict: "game_id,move_number" }
    );
  }

  await updateProfileStats(record, user.id);
}

export async function getSupabaseGameRecords(): Promise<GameRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .or(`created_by.eq.${user.id},white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !games?.length) return [];

  const ids = games.map((game) => game.id as string);
  const { data: moves } = await supabase
    .from("moves")
    .select("*")
    .in("game_id", ids)
    .order("move_number", { ascending: true });

  const movesByGame = new Map<string, Move[]>();
  for (const item of moves ?? []) {
    const gameId = String(item.game_id);
    const list = movesByGame.get(gameId) ?? [];
    list.push(item.payload as Move);
    movesByGame.set(gameId, list);
  }

  return games.map((game) => ({
    id: String(game.id),
    mode: game.mode as GameRecord["mode"],
    status: game.status as GameRecord["status"],
    winner: (game.winner as GameRecord["winner"]) ?? undefined,
    initialBoard: game.initial_board ? (game.initial_board as GameRecord["initialBoard"]) : undefined,
    moves: movesByGame.get(String(game.id)) ?? [],
    durationMs: Number(game.duration_ms ?? 0),
    createdAt: String(game.created_at),
    aiDifficulty: game.ai_difficulty ? (String(game.ai_difficulty) as GameRecord["aiDifficulty"]) : undefined,
    playerWhite: game.white_player_id ? String(game.white_player_id) : undefined,
    playerBlack: game.black_player_id ? String(game.black_player_id) : undefined
  }));
}

async function ensureProfile(userId: string, email?: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from("profiles").upsert(
    {
      id: userId,
      username: email?.split("@")[0] ?? "Player",
      avatar: "avatar:crown",
      rating: 600,
      wins: 0,
      losses: 0,
      draws: 0,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

async function updateProfileStats(record: GameRecord, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || record.status !== "finished") return;

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return;

  const profile = mapProfile(data);
  const userColor = record.playerBlack === CURRENT_USER_TOKEN || record.playerBlack === userId ? "black" : "white";
  const won = record.winner === userColor;
  const lost = Boolean(record.winner && record.winner !== userColor);
  const draw = !record.winner;
  const ratingDelta = getRatingDelta(record, won, lost);

  await supabase
    .from("profiles")
    .update({
      wins: profile.wins + (won ? 1 : 0),
      losses: profile.losses + (lost ? 1 : 0),
      draws: profile.draws + (draw ? 1 : 0),
      rating: Math.max(100, profile.rating + ratingDelta),
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);
}

function getRatingDelta(record: GameRecord, won: boolean, lost: boolean): number {
  if (record.fromSandbox) return 0;
  if (record.mode === "local") return 0;

  if (record.mode === "ai") {
    if (!won) return 0;
    if (record.aiDifficulty === "hard") return 25;
    if (record.aiDifficulty === "medium") return 15;
    return 8;
  }

  if (won) return 16;
  if (lost) return -12;
  return 1;
}

function mapProfile(row: Record<string, unknown>): PlayerProfile {
  return {
    id: String(row.id),
    username: String(row.username ?? "Player"),
    avatar: row.avatar ? String(row.avatar) : undefined,
    city: row.city ? String(row.city) : undefined,
    country: row.country ? String(row.country) : undefined,
    rating: Number(row.rating ?? 600),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0)
  };
}

function createRecordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "00000000-0000-4000-8000-000000000000".replace(/[08]/g, (char) =>
    (Number(char) ^ (Math.random() * 16) >> (Number(char) / 4)).toString(16)
  );
}
