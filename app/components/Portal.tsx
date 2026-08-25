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
import { Services } from "./Services";
import { AccountProfile } from "./AccountProfile";

export function Portal({ initialNav = "Home", initialClaimsTab = "status", initialClaimId }: { initialNav?: string; initialClaimsTab?: "start" | "status"; initialClaimId?: string }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeNav = initialNav;
  const isHome = activeNav === "Home";

  const navigate = (item: string, tab?: "start" | "status", claimId?: string) => {
    if (item === "Home") return router.push("/");
    const query = new URLSearchParams({ view: item });
    if (item === "Claims") {
      query.set("tab", tab ?? "status");
      if (claimId) query.set("claim", claimId);
    }
    router.push(`/?${query}`);
  };

  return (
    <main className="app-shell">
      <PortalTopbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onOpenAccount={() => navigate("Account")} />
      <PortalSidebar type="member" activeNav={activeNav} mobileOpen={mobileOpen} onNavigate={navigate} onClose={() => setMobileOpen(false)} />

      <section className="content">
        <PageHeader activeNav={activeNav} />
        {activeNav === "Passbook" ? (
          <Passbook />
        ) : activeNav === "Employment" ? (
          <EmploymentHistory />
        ) : activeNav === "Claims" ? (
          <ClaimsWorkspace initialTab={initialClaimsTab} initialClaimId={initialClaimId} />
        ) : activeNav === "Services" ? (
          <Services onNavigate={navigate} />
        ) : activeNav === "Account" ? (
          <AccountProfile />
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
  const isEmployment = activeNav === "Employment";
  const isClaims = activeNav === "Claims";
  const isServices = activeNav === "Services";
  const isAccount = activeNav === "Account";
  return (
    <>
      <div className="context-strip">
        <span className="verified-pill"><Icon name="shield" size={15} /> {t("Aadhaar verified")}</span>
      </div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("MONDAY, 24 AUGUST")}</p>
          <h1>{isEmployment ? t("Employment history") : isClaims ? t("Claims") : isServices ? t("Services") : isAccount ? t("Profile details") : t("Good afternoon, Rahul")}</h1>
          <p>{isEmployment ? t("Your connected employment accounts and PF transfers.") : isClaims ? t("Start a claim or track your current and past claims.") : isServices ? t("Keep your account ready and manage less frequent requests.") : isAccount ? t("Your EPFO identity and contact details.") : t("Your retirement savings, contributions and claims in one place.")}</p>
        </div>
        <a className="outline-button" href="/pf-statement.pdf" download="EPFO-PF-Statement-2026-27.pdf"><Icon name="file" size={17} />{t("Download statement")}</a>
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
