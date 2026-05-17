"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameState, PlayerColor } from "@/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";

type ConnectionStatus = "offline" | "connecting" | "connected" | "error";
type RoomRole = "white" | "black" | "spectator";

interface RoomPresence {
  senderId: string;
  role: RoomRole;
  onlineAt: string;
}

export interface OnlineRoomState {
  status: ConnectionStatus;
  role: RoomRole;
  playerColor?: PlayerColor;
  playerCount: number;
  spectatorCount: number;
}

export function useOnlineRoom(roomId?: string): OnlineRoomState {
  const game = useGameStore((state) => state.game);
  const newGame = useGameStore((state) => state.newGame);
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [role, setRole] = useState<RoomRole>("spectator");
  const [playerCount, setPlayerCount] = useState(0);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const suppressNextBroadcast = useRef(false);
  const senderId = useMemo(() => getClientId(), []);
  const playerColor = role === "white" || role === "black" ? role : undefined;

  useEffect(() => {
    if (!roomId) return;
    const nextRole = resolveRoomRole(roomId);
    queueMicrotask(() => setRole(nextRole));
    if (game.mode !== "online") {
      newGame("online", game.aiDifficulty);
    }
    useGameStore.setState((state) => ({
      game: {
        ...state.game,
        mode: "online",
        roomId,
        localPlayerColor: roleToColor(nextRole),
        message: nextRole === "spectator" ? "Вы смотрите комнату как зритель." : `Вы играете за ${nextRole === "white" ? "белых" : "черных"}.`
      }
    }));
  }, [game.aiDifficulty, game.mode, newGame, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => setStatus("offline"));
      return;
    }

    const currentRole = resolveRoomRole(roomId);
    queueMicrotask(() => setRole(currentRole));
    queueMicrotask(() => setStatus("connecting"));
    const channel = supabase.channel(`checkers-room:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: senderId }
      }
    });

    function updatePresence() {
      const state = channel.presenceState<RoomPresence>();
      const presences = Object.values(state).flat();
      setPlayerCount(presences.filter((presence) => presence.role === "white" || presence.role === "black").length);
      setSpectatorCount(presences.filter((presence) => presence.role === "spectator").length);
    }

    channel
      .on("presence", { event: "sync" }, updatePresence)
      .on("presence", { event: "join" }, updatePresence)
      .on("presence", { event: "leave" }, updatePresence)
      .on("broadcast", { event: "game-state" }, ({ payload }) => {
        const incoming = payload as { senderId?: string; game?: GameState };
        if (!incoming.game || incoming.senderId === senderId) return;
        const localColor = useGameStore.getState().game.localPlayerColor;
        suppressNextBroadcast.current = true;
        useGameStore.setState({
          game: {
            ...incoming.game,
            mode: "online",
            roomId,
            localPlayerColor: localColor
          }
        });
      })
      .subscribe(async (nextStatus) => {
        if (nextStatus === "SUBSCRIBED") {
          setStatus("connected");
          await channel.track({
            senderId,
            role: currentRole,
            onlineAt: new Date().toISOString()
          });
          updatePresence();
        }
        if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId, senderId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || status !== "connected" || game.mode !== "online" || game.roomId !== roomId) return;
    if (suppressNextBroadcast.current) {
      suppressNextBroadcast.current = false;
      return;
    }

    void channel.send({
      type: "broadcast",
      event: "game-state",
      payload: {
        senderId,
        game
      }
    });
  }, [game, roomId, senderId, status]);

  return { status, role, playerColor, playerCount, spectatorCount };
}

export function createRoomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function markRoomHost(roomId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`checkers-arena:room-role:${roomId}`, "white");
  window.sessionStorage.setItem(`checkers-arena:room-role:${roomId}`, "white");
}

function resolveRoomRole(roomId: string): RoomRole {
  if (typeof window === "undefined") return "spectator";
  const key = `checkers-arena:room-role:${roomId}`;
  const urlRole = new URLSearchParams(window.location.search).get("role");
  if (urlRole === "white" || urlRole === "black" || urlRole === "spectator") {
    window.sessionStorage.setItem(key, urlRole);
    return urlRole;
  }

  const sessionRole = window.sessionStorage.getItem(key);
  if (sessionRole === "white" || sessionRole === "black" || sessionRole === "spectator") return sessionRole;

  const stored = window.localStorage.getItem(key);
  if (stored === "white" || stored === "black" || stored === "spectator") return stored;

  const role: RoomRole = "black";
  window.localStorage.setItem(key, role);
  return role;
}

function roleToColor(role: RoomRole): PlayerColor | undefined {
  if (role === "white" || role === "black") return role;
  return undefined;
}

function getClientId(): string {
  if (typeof window === "undefined") return "server-client";
  const key = "checkers-arena:client-id";
  const stored = window.localStorage.getItem(key);
  if (stored) return stored;
  const next = createRoomId();
  window.localStorage.setItem(key, next);
  return next;
}
