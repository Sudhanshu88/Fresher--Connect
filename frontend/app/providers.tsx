"use client";

import { useEffect } from "react";

import { usePlatformStore } from "@/lib/stores/platform-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateSession = usePlatformStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return <>{children}</>;
}
