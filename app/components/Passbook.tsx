"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import { Icon } from "./Icon";
import { members, passbookTotals } from "./passbook-data";
import styles from "./passbook.module.css";

const formatAmount = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function Passbook({ initialMemberId }: { initialMemberId?: string }) {
  const { t } = useLanguage();
  const [memberId, setMemberId] = useState<string>(members.some((member) => member.id === initialMemberId) ? initialMemberId! : members[0].id);
  const member = members.find((item) => item.id === memberId) ?? members[0];
  const [year, setYear] = useState(member.passbooks.at(-1)?.year ?? "");
  const passbook = member.passbooks.find((item) => item.year === year) ?? member.passbooks[0];
  const totals = passbookTotals(passbook.openingBalance, passbook.entries);
  const selectMember = (id: string) => { const next = members.find((item) => item.id === id) ?? members[0]; setMemberId(id); setYear(next.passbooks.at(-1)?.year ?? ""); };

  return (
    <section className={styles.page} aria-labelledby="passbook-title">
      <div className={styles.heading}>
        <div><p className="eyebrow">{t("PASSBOOK")}</p><h1 id="passbook-title">{t("Passbook")}</h1><p>{t("Your PF credits and debits in one place.")}</p></div>
        <div className={styles.controls}><a className={styles.download} href="/pf-statement.pdf" download={`EPFO-Passbook-${memberId}-${year}.pdf`}><Icon name="download" size={16} />Download passbook PDF</a><div className={styles.filters}>
          <label><span>{t("Member ID")}</span><select value={memberId} onChange={(event) => selectMember(event.target.value)}>{members.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.label}</option>)}</select></label>
          <label><span>{t("Financial year")}</span><select value={year} onChange={(event) => setYear(event.target.value)}>{member.passbooks.map((item) => <option key={item.year}>{item.year}</option>)}</select></label>
        </div></div>
      </div>

      <article className={styles.card}>
        <div className={styles.member}><span>{t("Member ID")}</span><strong>{memberId}</strong><span>{member.label}</span></div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>{t("Date")}</th><th>{t("Particulars")}</th><th>{t("Credit")}</th><th>{t("Debit")}</th></tr></thead>
            <tbody>
              {passbook.entries.map((entry) => <tr key={`${entry.date}-${entry.particulars}`}><td>{entry.date}</td><td>{entry.particulars}</td><td className={styles.credit}>{entry.type === "credit" ? formatAmount(entry.amount) : "—"}</td><td className={styles.debit}>{entry.type === "debit" ? formatAmount(entry.amount) : "—"}</td></tr>)}
            </tbody>
          </table>
        </div>
        <dl className={styles.totals}>
          <div><dt>{t("Opening balance")}</dt><dd>{formatAmount(passbook.openingBalance)}</dd></div>
          <div><dt>{t("Total credits")}</dt><dd>{formatAmount(totals.credits)}</dd></div>
          <div><dt>{t("Total debits")}</dt><dd>{formatAmount(totals.debits)}</dd></div>
          <div><dt>{t("Closing balance")}</dt><dd>{formatAmount(totals.closingBalance)}</dd></div>
        </dl>
      </article>
    </section>
  );
}
