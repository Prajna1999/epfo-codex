"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readAuthRole, writeAuthRole } from "./auth";
import { EmployerPortal } from "./EmployerPortal";
import type { MockRole } from "./mock-login-data";
import { Portal } from "./Portal";

export function AppGate({ initialNav, initialClaimsTab, initialClaimId, initialMemberId, initialProfileSection }: { initialNav: string; initialClaimsTab: "start" | "status"; initialClaimId?: string; initialMemberId?: string; initialProfileSection?: string }) {
  const router = useRouter();
  const [role, setRole] = useState<MockRole | null | "checking">("checking");

  useEffect(() => {
    // localStorage is unavailable during SSR, so this can't be a lazy useState initializer —
    // that would freeze at the server's fallback value forever, since hydration never re-runs it.
    const stored = readAuthRole();
    if (!stored) { router.replace("/login"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(stored);
  }, [router]);

  const logout = () => {
    writeAuthRole(null);
    router.replace("/login");
  };

  if (role === "checking" || role === null) return <div className="app-gate-loading" role="status" aria-live="polite"><span /></div>;
  if (role === "member") return <Portal initialNav={initialNav} initialClaimsTab={initialClaimsTab} initialClaimId={initialClaimId} initialMemberId={initialMemberId} initialProfileSection={initialProfileSection} onLogout={logout} />;
  return <EmployerPortal role={role} onLogout={logout} />;
}
