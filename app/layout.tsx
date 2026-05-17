import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "Checkers Arena",
  description: "Modern checkers web app with local play, AI, online rooms, puzzles, and leaderboards."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>
            <AuthBoundary>{children}</AuthBoundary>
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
