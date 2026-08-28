"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../language";
import { EmploymentHistory } from "./EmploymentHistory";
import { ClaimsWorkspace } from "./ClaimsWorkspace";
import { Icon } from "./Icon";
import { MemberDashboard } from "./MemberDashboard";
import { Passbook } from "./Passbook";
import { PortalSidebar, PortalTopbar } from "./PortalChrome";
import { AccountProfile } from "./AccountProfile";

export function Portal({ initialNav = "Home", initialClaimsTab = "status", initialClaimId, initialMemberId, initialProfileSection, onLogout }: { initialNav?: string; initialClaimsTab?: "start" | "status"; initialClaimId?: string; initialMemberId?: string; initialProfileSection?: string; onLogout?: () => void }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeNav = initialNav;
  const isHome = activeNav === "Home";

  const navigate = (item: string, tab?: "start" | "status", claimId?: string, memberId?: string, section?: string) => {
    if (item === "Home") return router.push("/");
    const query = new URLSearchParams({ view: item });
    if (item === "Claims") {
      query.set("tab", tab ?? "status");
      if (claimId) query.set("claim", claimId);
    }
    if (item === "Passbook" && memberId) query.set("member", memberId);
    if (item === "Account" && section) query.set("section", section);
    router.push(`/?${query}`);
  };

  return (
    <main className="app-shell">
      <PortalTopbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onOpenAccount={() => navigate("Account")} onLogout={onLogout} />
      <PortalSidebar type="member" activeNav={activeNav} mobileOpen={mobileOpen} onNavigate={navigate} onClose={() => setMobileOpen(false)} />

      <section key={activeNav} className="content page-enter">
        <PageHeader activeNav={activeNav} />
        {activeNav === "Passbook" ? (
          <Passbook initialMemberId={initialMemberId} />
        ) : activeNav === "ServiceHistory" ? (
          <EmploymentHistory onOpenPassbook={(memberId) => navigate("Passbook", undefined, undefined, memberId)} onStartTransfer={() => navigate("Claims", "start")} />
        ) : activeNav === "Claims" ? (
          <ClaimsWorkspace initialTab={initialClaimsTab} initialClaimId={initialClaimId} />
        ) : activeNav === "Account" ? (
          <AccountProfile initialSection={initialProfileSection} onTrackRequest={(id) => navigate("Claims", "status", id)} onLogout={onLogout} />
        ) : !isHome ? (
          <PlaceholderView activeNav={activeNav} onReturn={() => navigate("Home")} />
        ) : (
          <MemberDashboard onNavigate={navigate} />
        )}
      </section>
    </main>
  );
}

function PageHeader({ activeNav }: { activeNav: string }) {
  const { t } = useLanguage();
  const isServiceHistory = activeNav === "ServiceHistory";
  const isClaims = activeNav === "Claims";
  const isAccount = activeNav === "Account";
  return (
    <>
      <div className="context-strip">
        <span className="verified-pill"><Icon name="shield" size={15} /> {t("Aadhaar verified")}</span>
      </div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("MONDAY, 24 AUGUST")}</p>
          <h1>{isServiceHistory ? t("Service history") : isClaims ? t("Claims") : isAccount ? t("Profile details") : t("Good afternoon, Rahul")}</h1>
          <p>{isServiceHistory ? t("Your connected employment accounts and PF transfers.") : isClaims ? t("Start a claim or track your current and past claims.") : isAccount ? t("Your EPFO identity and contact details.") : t("Your retirement savings, contributions and claims in one place.")}</p>
        </div>
      </div>
    </>
  );
}

function PlaceholderView({ activeNav, onReturn }: { activeNav: string; onReturn: () => void }) {
  const { t, tpl } = useLanguage();
  return (
    <section className="placeholder-view">
      <div className="placeholder-icon"><Icon name="book" size={26} /></div>
      <p className="eyebrow">{t("My retirement account")}</p>
      <h2>{t(activeNav)}</h2>
      <p>{tpl("This workspace is ready for the {item} journey. Your active role and scope remain visible while you work.", { item: t(activeNav).toLowerCase() })}</p>
      <button className="primary-button" onClick={onReturn}>{t("Return home")}</button>
    </section>
  );
}
