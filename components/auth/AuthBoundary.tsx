"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { syncStorageOwner } from "@/lib/storage/local";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/game-store";

const publicRoutes = new Set(["/"]);

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(publicRoutes.has(pathname));
  const [checking, setChecking] = useState(!publicRoutes.has(pathname));

  useEffect(() => {
    if (publicRoutes.has(pathname)) {
      queueMicrotask(() => {
        setAllowed(true);
        setChecking(false);
      });
      return;
    }

    let active = true;
    const guest = window.localStorage.getItem("checkers-arena:guest-mode") === "true";
    if (guest) {
      queueMicrotask(() => {
        if (!active) return;
        if (syncStorageOwner("guest")) {
          useGameStore.setState({ hydrated: false });
        }
        setAllowed(true);
        setChecking(false);
      });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => {
        if (!active) return;
        setAllowed(false);
        setChecking(false);
      });
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const userId = data.session?.user?.id;
      if (userId && syncStorageOwner(`user:${userId}`)) {
        useGameStore.setState({ hydrated: false });
      }
      setAllowed(Boolean(userId));
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (userId && syncStorageOwner(`user:${userId}`)) {
        useGameStore.setState({ hydrated: false });
      }
      setAllowed(Boolean(userId));
      setChecking(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname]);

  if (checking) {
    return <LoadingOverlay label="Проверяем сессию..." />;
  }

  if (!allowed) {
    return <AuthGate onReady={() => setAllowed(true)} />;
  }

  return children;
}
