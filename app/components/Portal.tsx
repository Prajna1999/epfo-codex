"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "../language";
import { EmployerDashboard } from "./EmployerDashboard";
import { EmploymentHistory } from "./EmploymentHistory";
import { Icon } from "./Icon";
import { MemberDashboard } from "./MemberDashboard";
import { Passbook } from "./Passbook";
import { PortalSidebar, PortalTopbar } from "./PortalChrome";

type Context = {
  id: string;
  name: string;
  role: string;
  meta: string;
  type: "member" | "employer";
  accent: string;
};

const contexts: Context[] = [
  { id: "member", name: "My retirement account", role: "Personal", meta: "UAN •••• 1234", type: "member", accent: "PF" },
  { id: "abc", name: "ABC Pvt Ltd", role: "CA", meta: "All extensions", type: "employer", accent: "AB" },
  { id: "xyz", name: "XYZ Consulting", role: "Authorized Signatory", meta: "Head office · 000", type: "employer", accent: "XY" },
];

export function Portal({ initialNav = "Home" }: { initialNav?: string }) {
  const [activeId, setActiveId] = useState("member");
  const [activeNav, setActiveNav] = useState(initialNav);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = useMemo(() => contexts.find((item) => item.id === activeId) ?? contexts[0], [activeId]);
  const isHome = active.type === "member" ? activeNav === "Home" : activeNav === "Overview";

  const chooseContext = (context: Context) => {
    setActiveId(context.id);
    setActiveNav(context.type === "member" ? "Home" : "Overview");
    setSwitchOpen(false);
  };

  return (
    <main className="app-shell">
      <PortalTopbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
      <PortalSidebar type={active.type} activeNav={activeNav} mobileOpen={mobileOpen} onNavigate={setActiveNav} onClose={() => setMobileOpen(false)} />

      <section className="content">
        <PageHeader active={active} activeNav={activeNav} onSwitch={() => setSwitchOpen(true)} />
        {active.type === "member" && activeNav === "Money" ? (
          <Passbook />
        ) : active.type === "member" && activeNav === "Employment" ? (
          <EmploymentHistory />
        ) : !isHome ? (
          <PlaceholderView active={active} activeNav={activeNav} onReturn={() => setActiveNav(active.type === "member" ? "Home" : "Overview")} />
        ) : active.type === "member" ? (
          <MemberDashboard onNavigate={setActiveNav} />
        ) : (
          <EmployerDashboard contextName={active.name} />
        )}
      </section>

      {switchOpen && <ContextModal active={active} onChoose={chooseContext} onClose={() => setSwitchOpen(false)} />}
    </main>
  );
}

function PageHeader({ active, activeNav, onSwitch }: { active: Context; activeNav: string; onSwitch: () => void }) {
  const { t, tpl } = useLanguage();
  const isMember = active.type === "member";
  const isEmployment = isMember && activeNav === "Employment";
  return (
    <>
      <div className="context-strip">
        <span className="verified-pill"><Icon name="shield" size={15} /> {t("Aadhaar verified")}</span>
        <button onClick={onSwitch}>{isMember ? t("Personal account") : t("Acting as")}: <strong>{t(active.name)}</strong><Icon name="chevron" size={15} /></button>
      </div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("MONDAY, 24 AUGUST")}</p>
          <h1>{isEmployment ? t("Employment history") : t("Good afternoon, Rahul")}</h1>
          <p>{isEmployment ? t("Your connected employment accounts and PF transfers.") : isMember ? t("Your retirement savings, contributions and withdrawals in one place.") : tpl("Here’s what needs attention at {name}.", { name: t(active.name) })}</p>
        </div>
        {isMember ? <a className="outline-button" href="/pf-statement.pdf" download="EPFO-PF-Statement-2026-27.pdf"><Icon name="file" size={17} />{t("Download statement")}</a> : <button className="outline-button"><Icon name="file" size={17} />{t("Download report")}</button>}
      </div>
    </>
  );
}

function PlaceholderView({ active, activeNav, onReturn }: { active: Context; activeNav: string; onReturn: () => void }) {
  const { t, tpl } = useLanguage();
  return (
    <section className="placeholder-view">
      <div className="placeholder-icon"><Icon name={active.type === "member" ? "book" : "building"} size={26} /></div>
      <p className="eyebrow">{t(active.name)}</p>
      <h2>{t(activeNav)}</h2>
      <p>{tpl("This workspace is ready for the {item} journey. Your active role and scope remain visible while you work.", { item: t(activeNav).toLowerCase() })}</p>
      <button className="primary-button" onClick={onReturn}>{t("Return home")}</button>
    </section>
  );
}

function ContextModal({ active, onChoose, onClose }: { active: Context; onChoose: (context: Context) => void; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="context-modal" role="dialog" aria-modal="true" aria-labelledby="switch-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">EPFO PROFILES</p>
            <h2 id="switch-title">{t("Switch context")}</h2>
            <p>{t("Choose who you want to act as. You won’t need to sign in again.")}</p>
          </div>
          <button onClick={onClose} aria-label={t("Close")}><Icon name="close" /></button>
        </div>
        <div className="context-options">
          {contexts.map((context) => (
            <button key={context.id} onClick={() => onChoose(context)} className={context.id === active.id ? "selected" : ""}>
              <span className="context-icon large">{context.accent}</span>
              <span><strong>{t(context.name)}</strong><small>{t(context.role)} · {t(context.meta)}</small></span>
              {context.id === active.id ? <span className="current-tag">{t("Current")}</span> : <Icon name="arrow" size={18} />}
            </button>
          ))}
        </div>
        <div className="modal-note"><Icon name="shield" size={18} /><span>{t("Sensitive actions may require an OTP or e-Sign confirmation.")}</span></div>
      </section>
    </div>
  );
}
