"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../language";
import { Icon, type IconName } from "./Icon";
import { LanguageSwitch } from "./LanguageSwitch";

export type PortalType = "member" | "employer";

const navigation = {
  member: [
    { label: "Home", icon: "home" },
    { label: "Money", icon: "book" },
    { label: "Employment", icon: "briefcase" },
    { label: "Withdraw", icon: "claim" },
    { label: "Account", icon: "user" },
  ],
  employer: [
    { label: "Overview", icon: "home" },
    { label: "Employees", icon: "users" },
    { label: "ECR & contributions", icon: "file" },
    { label: "Payments", icon: "payment" },
    { label: "Compliance", icon: "shield" },
    { label: "Reports", icon: "book" },
    { label: "Users & access", icon: "user" },
  ],
} satisfies Record<PortalType, { label: string; icon: IconName }[]>;

export function PortalTopbar({ mobileOpen, onToggleMobile }: { mobileOpen: boolean; onToggleMobile: () => void }) {
  const { t } = useLanguage();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="brand">
        <button className="mobile-menu" onClick={onToggleMobile} aria-label={t("Open navigation")} aria-expanded={mobileOpen}>
          <Icon name="menu" />
        </button>
        <div className="national-mark">अ</div>
        <div><div className="brand-title">EPFO</div><div className="brand-sub">{t("Your retirement account")}</div></div>
      </div>
      <div className="topbar-actions">
        <label className="search"><Icon name="search" size={18} /><input aria-label={t("Search EPFO services")} placeholder={t("Search services")} /></label>
        <div className="notification-wrap">
          <button className="icon-button" aria-label={t("Notifications")} aria-expanded={notificationsOpen} aria-controls="contribution-notification" onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" /><span className="notification-dot" /></button>
          {notificationsOpen && <section id="contribution-notification" className="contribution-notification" aria-label={t("LATEST CONTRIBUTION")}>
            <span className="contribution-icon"><Icon name="building" size={20} /></span>
            <div><small>{t("LATEST CONTRIBUTION")}</small><strong>{t("August contribution received")}</strong><span>Infosys Limited · {t("Deposited 18 August")}</span></div>
            <b>+ ₹8,430</b>
          </section>}
        </div>
        <LanguageSwitch />
        <button className="profile-button">
          <span className="avatar">RP</span>
          <span className="profile-copy"><strong>Rahul Patil</strong><small>{t("Verified account")}</small></span>
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </header>
  );
}

export function PortalSidebar({ type, activeNav, mobileOpen, onNavigate, onClose }: { type: PortalType; activeNav: string; mobileOpen: boolean; onNavigate: (item: string) => void; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <button className="mobile-close" onClick={onClose} aria-label={t("Close navigation")}><Icon name="close" /></button>
      <nav className="nav-list sidebar-nav" aria-label={t("Main navigation")}>
        {navigation[type].map(({ label, icon }) => (
          <button key={label} className={activeNav === label ? "active" : ""} onClick={() => { onNavigate(label); onClose(); }}>
            <Icon name={icon} />
            <span>{t(label)}</span>
            {activeNav === label && <i />}
          </button>
        ))}
      </nav>
      <div className="sidebar-help">
        <span className="help-icon">?</span>
        <div><strong>{t("Need help?")}</strong><small>{t("Guides and support")}</small></div>
        <Icon name="arrow" size={16} />
      </div>
    </aside>
  );
}

export function MemberPortalShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (item: string) => router.push(item === "Home" ? "/" : `/?view=${encodeURIComponent(item)}`);

  return (
    <main className="app-shell">
      <PortalTopbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
      <PortalSidebar type="member" activeNav="Withdraw" mobileOpen={mobileOpen} onNavigate={navigate} onClose={() => setMobileOpen(false)} />
      <section className="content">
        <div className="context-strip">
          <span className="verified-pill"><Icon name="shield" size={15} /> {t("Aadhaar verified")}</span>
          <span className="verified-pill">{t("Personal account")}: <strong>{t("My retirement account")}</strong></span>
        </div>
        {children}
      </section>
    </main>
  );
}
