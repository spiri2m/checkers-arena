import { GameClient } from "@/components/game/GameClient";
import { RoomInviteCard } from "@/components/RoomInviteCard";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <GameClient mode="online" roomId={roomId} />
      <RoomInviteCard roomId={roomId} />
    </div>
  );
}
