import Link from "next/link";
import { Bot, Crown, FlaskConical, Puzzle, Swords, Trophy, User } from "lucide-react";
import { BottomTabNav } from "@/components/layout/BottomTabNav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const desktopNav = [
  { href: "/game/ai", label: "ИИ", icon: Bot },
  { href: "/sandbox", label: "Песочница", icon: FlaskConical },
  { href: "/puzzles", label: "Задачи", icon: Puzzle },
  { href: "/leaderboard", label: "Лидерборд", icon: Trophy },
  { href: "/profile", label: "Профиль", icon: User }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/82 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 font-black tracking-normal">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Swords className="h-5 w-5" />
            </span>
            <span>Checkers Arena</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/pro"
              className={buttonVariants({
                variant: "default",
                className: "hidden bg-accent text-accent-foreground shadow-[0_0_22px_rgba(245,158,11,0.45)] hover:brightness-105 sm:inline-flex"
              })}
            >
              <Crown className="h-4 w-4" />
              Про
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:py-8">{children}</main>
      <BottomTabNav />
    </div>
  );
}
