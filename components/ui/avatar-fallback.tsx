import { cn } from "@/lib/utils";
import { getAvatarOption } from "@/lib/avatars";

export function AvatarFallback({ name, image, className }: { name: string; image?: string; className?: string }) {
  const avatar = getAvatarOption(image);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-xl font-black text-primary-foreground",
        avatar?.className,
        className
      )}
    >
      {avatar ? avatar.symbol : image ? <span aria-hidden className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} /> : initials}
    </div>
  );
}
