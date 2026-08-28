"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import { Icon, type IconName } from "./Icon";

type Navigate = (item: string, tab?: "start" | "status", claimId?: string, memberId?: string, section?: string) => void;

export function MemberDashboard({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <BalanceCard />
      <ServicesSection onNavigate={onNavigate} />
      <section className="dashboard-grid banking-grid">
        <RecentActivityCard onNavigate={onNavigate} />
        <ClaimStatusCard onNavigate={onNavigate} />
      </section>
    </>
  );
}

function BalanceCard() {
  const { t } = useLanguage();
  const [cardFlipped, setCardFlipped] = useState(false);
  const flipCard = () => setCardFlipped((flipped) => !flipped);

  return (
    <div className={`card-flip-shell ${cardFlipped ? "is-flipped" : ""}`}>
      <div className="card-flip-inner">
        <article className="balance-card card-face card-front" aria-hidden={cardFlipped}>
          <div className="balance-top">
            <span className="account-kind">{t("PF BALANCE")}</span>
            <span className="account-active">{t("Active")}</span>
            <button className="flip-control" type="button" onClick={flipCard} tabIndex={cardFlipped ? -1 : 0}>
              <Icon name="idcard" size={15} />
              <span>{t("View UAN ID")}</span>
            </button>
          </div>
          <p>
            {t("Total PF balance")} <span className="info" title={t("This is your recorded PF balance, not an immediately claimable amount.")}>i</span>
          </p>
          <h2>₹4,52,340<span>.00</span></h2>
          <p className="balance-caption">{t("Recorded balance · Updated 18 Aug 2026")}</p>
          <div className="balance-breakdown">
            <div><span>{t("Your contributions")}</span><strong>₹3,25,685</strong></div>
            <div><span>{t("Employer contributions")}</span><strong>₹1,26,655</strong></div>
          </div>
          <div className="account-number">UAN &nbsp;•••• &nbsp;•••• &nbsp;1234</div>
        </article>

        <article className="uan-card card-face card-back" aria-hidden={!cardFlipped}>
          <header className="uan-header">
            <span>EPFO</span>
            <div className="uan-org">
              <strong>EMPLOYEES&apos; PROVIDENT FUND ORGANISATION</strong>
              <small>MINISTRY OF LABOUR &amp; EMPLOYMENT, GOVT. OF INDIA</small>
            </div>
          </header>
          <div className="uan-body">
            <div className="uan-details">
              <CardDetail label={t("Universal Account Number")} value="1009 2000 0123" />
              <CardDetail label={t("Name")} value="RAHUL PATIL" />
              <CardDetail label={t("Father's Name")} value="MADHAV PATIL" />
              <CardDetail label={t("KYC Status")} value={t("Yes")} />
            </div>
            <div className="uan-photo"><div className="portrait"><span /><i /></div><small>{t("Photograph")}</small></div>
          </div>
          <footer>uan.epfindia.gov.in <span>{t("Issued 24 Aug 2026")}</span></footer>
        </article>
      </div>

      {cardFlipped && (
        <div className="uan-controls uan-controls-overlay">
          <button className="uan-back-control" type="button" onClick={flipCard} aria-label={t("Back to PF balance")}>
            <Icon name="rotate" size={16} /><span>{t("Balance")}</span>
          </button>
          <a href="/uan-card.pdf" download="EPFO-UAN-Card-100920000123.pdf" aria-label={t("Download UAN card as PDF")}>
            <Icon name="download" size={16} />
          </a>
        </div>
      )}
    </div>
  );
}

function CardDetail({ label, value }: { label: string; value: string }) {
  return <div className="card-detail"><span>{label}</span><strong>{value}</strong></div>;
}

function ServicesSection({ onNavigate }: { onNavigate: Navigate }) {
  const { t } = useLanguage();
  return (
    <section className="quick-section">
      <div className="section-heading">
        <h2>{t("Most used actions")}</h2>
        <span>{t("Official EPFO services, in plain language")}</span>
      </div>
      <div className="quick-grid three">
        <ServiceCard icon="claim" title={t("File a Claim")} text={t("Start a new PF claim")} onClick={() => onNavigate("Claims", "start")} />
        <ServiceCard icon="file" title={t("Past Claim Status")} text={t("Track your previous claims")} onClick={() => onNavigate("Claims", "status")} />
        <ServiceCard icon="shield" title={t("KYC and bank details")} text="Aadhaar, PAN and bank status" onClick={() => onNavigate("Account", undefined, undefined, undefined, "kyc")} />
      </div>
    </section>
  );
}

function ServiceCard({ icon, title, text, onClick }: { icon: IconName; title: string; text: string; onClick: () => void }) {
  const content = <><span><Icon name={icon} /></span><div><strong>{title}</strong><small>{text}</small></div><Icon name="arrow" size={17} /></>;
  return <button className="action-card" onClick={onClick} type="button">{content}</button>;
}

function RecentActivityCard({ onNavigate }: { onNavigate: Navigate }) {
  const { t } = useLanguage();
  return (
    <article className="panel transactions-panel">
      <div className="panel-head">
        <div><p className="eyebrow">{t("PASSBOOK")}</p><h2>{t("Recent activity")}</h2></div>
        <button onClick={() => onNavigate("Passbook")}>{t("View all transactions")} <Icon name="arrow" size={15} /></button>
      </div>
      <Transaction icon="building" title={t("August contribution")} detail="Infosys Limited · 18 Aug 2026" amount="+ ₹8,430" />
      <Transaction icon="building" title={t("July contribution")} detail="Infosys Limited · 18 Jul 2026" amount="+ ₹8,430" />
      <Transaction icon="payment" title={t("Annual interest credit")} detail="FY 2025–26 · 31 Mar 2026" amount="+ ₹31,240" />
    </article>
  );
}

function Transaction({ icon, title, detail, amount }: { icon: IconName; title: string; detail: string; amount: string }) {
  const { t } = useLanguage();
  return (
    <div className="transaction-row">
      <span><Icon name={icon} size={17} /></span>
      <div><strong>{title}</strong><small>{detail}</small></div>
      <strong>{amount}</strong>
      <span className="status done">{t("Confirmed")}</span>
    </div>
  );
}

function ClaimStatusCard({ onNavigate }: { onNavigate: Navigate }) {
  const { t } = useLanguage();
  return (
    <article className="panel claim-panel">
      <div className="panel-head">
        <div><p className="eyebrow">{t("CLAIMS")}</p><h2>{t("Medical advance")}</h2></div>
        <span className="status processing">{t("In review")}</span>
      </div>
      <strong className="claim-amount">₹35,000</strong>
      <p className="claim-type">{t("Submitted 12 Aug · HDFC Bank •••• 4821")}</p>
      <div className="progress-steps"><i className="complete" /><i className="complete" /><i className="active" /><i /></div>
      <div className="progress-labels"><span>{t("Submitted")}</span><span>{t("Verified")}</span><span>{t("Review")}</span><span>{t("Paid")}</span></div>
      <div className="claim-note">
        <Icon name="shield" size={18} />
        <span><strong>{t("No action needed.")}</strong> {t("EPFO is reviewing your request. Your employer verification is complete.")}</span>
      </div>
      <button className="text-button" type="button" onClick={() => onNavigate("Claims", "status", "CLM-20260812-035")}>{t("Track claim")} <Icon name="arrow" size={15} /></button>
    </article>
  );
}
