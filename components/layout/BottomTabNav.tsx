"use client";

import Link from "next/link";
import { Bot, FlaskConical, Home, Puzzle, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomTabNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/game/ai", label: "ИИ", icon: Bot },
    { href: "/sandbox", label: "Песочница", icon: FlaskConical },
    { href: "/puzzles", label: "Задачи", icon: Puzzle },
    { href: "/profile", label: "Профиль", icon: User }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 py-2 backdrop-blur sm:hidden">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold text-muted-foreground",
                active && "bg-primary text-primary-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
