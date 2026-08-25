"use client";

import { useLanguage } from "../language";

export function EmploymentHistory() {
  const { t } = useLanguage();
  return (
    <section className="panel employment-history">
      <div className="panel-head">
        <div><p className="eyebrow">{t("EMPLOYMENT")}</p><h2>{t("Connected employment accounts")}</h2></div>
        <span className="status done">{t("PF transferred")}</span>
      </div>
      <div className="employment-flow">
        <div><span className="company-logo amber">TC</span><span><strong>Techcore Systems</strong><small>Apr 2021 – Jun 2023</small></span><span className="status done">{t("PF transferred")}</span></div>
        <i aria-hidden="true" />
        <div><span className="company-logo blue">IN</span><span><strong>Infosys Limited</strong><small>{t("Current · Contributions arriving normally")}</small></span><span className="status done">{t("Active")}</span></div>
      </div>
    </section>
  );
}
