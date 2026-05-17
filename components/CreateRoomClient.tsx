"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoomId, markRoomHost } from "@/hooks/use-online-room";

export function CreateRoomClient() {
  const router = useRouter();

  useEffect(() => {
    const roomId = createRoomId();
    markRoomHost(roomId);
    router.replace(`/room/${roomId}`);
  }, [router]);

  return <div className="rounded-lg border bg-card p-6 text-muted-foreground">Создаем онлайн-комнату...</div>;
}
