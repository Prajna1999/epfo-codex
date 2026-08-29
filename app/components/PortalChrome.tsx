"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import { Icon, type IconName } from "./Icon";
import { LanguageSwitch } from "./LanguageSwitch";

export type PortalType = "member" | "employer" | "principal";

type NavigationItem = { label: string; value?: string; icon: IconName };

const navigation: Record<PortalType, NavigationItem[]> = {
  member: [
    { label: "Home", icon: "home" },
    { label: "Claims", icon: "claim" },
    { label: "Passbook", icon: "book" },
    { label: "Service history", value: "ServiceHistory", icon: "briefcase" },
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
  principal: [
    { label: "Overview", icon: "home" },
    { label: "Contract employers", icon: "building" },
    { label: "Work orders", icon: "file" },
    { label: "Contract workers", icon: "users" },
    { label: "Compliance", icon: "shield" },
    { label: "Reports", icon: "book" },
  ],
};

export function PortalTopbar({ mobileOpen, onToggleMobile, onOpenAccount, onOpenAgent, onLogout, profile = { initials: "RP", name: "Rahul Patil", status: "Verified account", accountId: "UAN 1009 2000 0123", accountStatus: "KYC verified" } }: { mobileOpen: boolean; onToggleMobile: () => void; onOpenAccount?: () => void; onOpenAgent?: () => void; onLogout?: () => void; profile?: { initials: string; name: string; status: string; accountId?: string; accountStatus?: string } }) {
  const { t } = useLanguage();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="brand">
        <button className="mobile-menu" onClick={onToggleMobile} aria-label={t("Open navigation")} aria-expanded={mobileOpen}>
          <Icon name="menu" />
        </button>
        <span className="service-mark" aria-hidden="true"><i /><i /><i /></span>
        <div><div className="brand-title">EPFO</div><div className="brand-sub">{t("Your retirement account")}</div></div>
      </div>
      <div className="topbar-actions">
        {onOpenAgent && <button className="agent-launch" type="button" onClick={onOpenAgent}><Icon name="spark" size={17} /><span>EPF guide</span></button>}
        <div className="notification-wrap">
          <button className="icon-button" aria-label={t("Notifications")} aria-expanded={notificationsOpen} aria-controls="contribution-notification" onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" /><span className="notification-dot" /></button>
          {notificationsOpen && <section id="contribution-notification" className="contribution-notification" aria-label={t("LATEST CONTRIBUTION")}>
            <span className="contribution-icon"><Icon name="building" size={20} /></span>
            <div><small>{t("LATEST CONTRIBUTION")}</small><strong>{t("August contribution received")}</strong><span>Infosys Limited · {t("Deposited 18 August")}</span></div>
            <b>+ ₹8,430</b>
          </section>}
        </div>
        <LanguageSwitch />
        <div className="account-menu"><button className="profile-button" type="button" onClick={onOpenAccount} aria-label={onOpenAccount ? t("View profile details") : profile.name}>
          <span className="avatar">{profile.initials}</span><span className="profile-copy"><strong>{profile.name}</strong><small>{t(profile.status)}</small></span><Icon name="chevron" size={16} />
        </button><section className="account-hover" aria-label="Account summary"><strong>{profile.accountId ?? "UAN 1009 2000 0123"}</strong><span>{profile.accountStatus ?? "KYC verified"}</span>{onLogout && <button type="button" onClick={onLogout}>Log out</button>}</section></div>
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
        {navigation[type].map(({ label, value = label, icon }) => (
          <button key={value} className={activeNav === value ? "active" : ""} onClick={() => { onNavigate(value); onClose(); }}>
            <Icon name={icon} />
            <span>{t(label)}</span>
            {activeNav === value && <i />}
          </button>
        ))}
      </nav>
      <details className="sidebar-help" style={{ display: "block" }}>
        <summary><span className="help-icon">?</span><span><strong>{t("Need help?")}</strong><small>{t("Guides and support")}</small></span><Icon name="chevron" size={16} /></summary>
        <a href="tel:14470">Call EPFO helpdesk · 14470</a>
        <a href="tel:1800118005">Toll-free support · 1800 118 005</a>
        <ul><li>Keep your UAN and registered mobile ready.</li><li>Track requests from Claims or Profile.</li><li>Never share an OTP over a call.</li></ul>
      </details>
    </aside>
  );
}
