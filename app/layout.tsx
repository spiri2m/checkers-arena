import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "Checkers Arena",
  description: "Современная веб-игра в шашки с ИИ, онлайн-комнатами, задачами, историей партий и лидербордом."
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
