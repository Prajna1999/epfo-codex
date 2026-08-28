"use client";

import { useLanguage } from "../language";
import { Icon, type IconName } from "./Icon";

export function EmployerDashboard({ contextName }: { contextName: string }) {
  const { t } = useLanguage();

  return (
    <>
      <section className="stat-grid">
        <StatCard label={t("Active employees")} value="4,823" note={t("+42 this month")} tone="blue" icon="users" />
        <StatCard label={t("ECR status")} value={t("Submitted")} note="August 2026" tone="green" icon="file" />
        <StatCard label={t("Contribution")} value="₹2.4 Cr" note={t("Payment due 15 Sep")} tone="amber" icon="payment" />
        <StatCard label={t("Compliance")} value={t("Good")} note={t("No action required")} tone="green" icon="shield" />
      </section>
      <section className="dashboard-grid employer-grid">
        <ContributionFilingCard />
        <TasksCard />
      </section>
      <EmployerActivityCard contextName={contextName} />
    </>
  );
}

function StatCard({ label, value, note, tone, icon }: { label: string; value: string; note: string; tone: string; icon: IconName }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} /></div>
      <p>{label}</p>
      <h2>{value}</h2>
      <span className={tone}>{note}</span>
    </article>
  );
}

function ContributionFilingCard() {
  const { t } = useLanguage();
  return (
    <article className="panel">
      <div className="panel-head">
        <div><p className="eyebrow">AUGUST ECR</p><h2>{t("Contribution filing")}</h2></div>
        <span className="status active">{t("Submitted")}</span>
      </div>
      <div className="filing-row">
        <div><span>{t("Employees included")}</span><strong>4,801</strong></div>
        <div><span>{t("Gross wages")}</span><strong>₹18.6 Cr</strong></div>
        <div><span>TRRN</span><strong>1252608001842</strong></div>
      </div>
      <div className="claim-note">
        <Icon name="shield" size={18} />
        <span>{t("Submission signed by the Authorized Signatory on 18 August.")}</span>
      </div>
    </article>
  );
}

function TasksCard() {
  const { t } = useLanguage();
  return (
    <article className="panel">
      <div className="panel-head">
        <div><p className="eyebrow">{t("ATTENTION")}</p><h2>{t("Tasks to complete")}</h2></div>
        <button>{t("View all")} <Icon name="arrow" size={15} /></button>
      </div>
      <Task tone="amber" title="22 KYC requests" text={t("Awaiting employer approval")} />
      <Task tone="blue" title="7 employee exits" text={t("Last working day to confirm")} />
    </article>
  );
}

function Task({ tone, title, text }: { tone: string; title: string; text: string }) {
  return (
    <div className="task-row">
      <span className={`task-dot ${tone}`} />
      <div><strong>{title}</strong><p>{text}</p></div>
      <Icon name="arrow" size={17} />
    </div>
  );
}

function EmployerActivityCard({ contextName }: { contextName: string }) {
  const { t } = useLanguage();
  return (
    <section className="panel activity-panel">
      <div className="panel-head">
        <div><p className="eyebrow">{t("RECENT ACTIVITY")}</p><h2>{t(contextName)}</h2></div>
        <button>{t("Download report")} <Icon name="arrow" size={15} /></button>
      </div>
      <div className="activity-table">
        <ActivityRow icon="file" title={t("August ECR submitted")} date="18 Aug 2026" person="Rahul Patil" status={t("Complete")} />
        <ActivityRow icon="payment" title={t("July payment reconciled")} date="14 Aug 2026" person="System" status={t("Matched")} />
      </div>
    </section>
  );
}

function ActivityRow({ icon, title, date, person, status }: { icon: IconName; title: string; date: string; person: string; status: string }) {
  return (
    <div>
      <span><i className="activity-icon green"><Icon name={icon} size={16} /></i><b>{title}</b></span>
      <span>{date}</span>
      <span>{person}</span>
      <span className="status done">{status}</span>
    </div>
  );
}
