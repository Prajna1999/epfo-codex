"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import { EmployerDashboard } from "./EmployerDashboard";
import { EmployerActions } from "./EmployerActions";
import { PortalSidebar, PortalTopbar } from "./PortalChrome";

export function EmployerPortal({ role, onLogout }: { role: "establishment" | "principal"; onLogout: () => void }) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const contextName = role === "principal" ? "Apex Facilities · Principal employer" : "Infosys Limited · Establishment";

  return <main className="app-shell">
    <PortalTopbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onLogout={onLogout} profile={{ initials: role === "principal" ? "AF" : "IL", name: contextName, status: "Authorised access", accountId: role === "principal" ? "Principal employer · PE-00184" : "Establishment ID · MHBAN1318576", accountStatus: "KYC and DSC verified" }} />
    <PortalSidebar type={role === "principal" ? "principal" : "employer"} activeNav={activeNav} mobileOpen={mobileOpen} onNavigate={setActiveNav} onClose={() => setMobileOpen(false)} />
    <section key={activeNav} className="content page-enter">
      <div className="context-strip"><span className="verified-pill">{t("Mock workspace")}</span></div>
      <div className="page-head"><div><p className="eyebrow">{t("EMPLOYER PORTAL")}</p><h1>{activeNav === "Overview" ? t("Welcome back") : t(activeNav)}</h1><p>{contextName}</p></div></div>
      {activeNav === "Overview" ? <EmployerDashboard contextName={contextName} /> : <EmployerActions role={role} view={activeNav} />}
    </section>
  </main>;
}
