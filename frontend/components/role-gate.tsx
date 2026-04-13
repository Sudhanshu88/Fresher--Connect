"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingBlock } from "@/components/loading-block";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { UserRole } from "@/lib/types";

export function RoleGate({
  roles,
  children
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const bootstrapped = usePlatformStore((state) => state.bootstrapped);
  const hydrateSession = usePlatformStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    if (!user) {
      router.replace(roles.includes("admin") ? "/admin/login" : "/login");
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace(dashboardPath(user.role));
    }
  }, [bootstrapped, roles, router, user]);

  if (!bootstrapped || !user || !roles.includes(user.role)) {
    return <LoadingBlock label="Verifying secure access..." />;
  }

  return <>{children}</>;
}
