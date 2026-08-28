"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../language";
import { Icon } from "./Icon";
import { isMockOtp } from "./mock-login-data";
import styles from "./employment-history.module.css";

type ServiceRecord = { id: string; employer: string; initials: string; joined: string; exited: string; status: "Active" | "Transferred" | "Eligible"; transfer: string; reason: string; epfJoining: string; epsJoining: string; epfExit: string; epsExit: string };

const serviceRecords: ServiceRecord[] = [
  { id: "MPIND2742177000010037", employer: "Techcore Systems", initials: "TC", joined: "1 Nov 2022", exited: "7 Aug 2023", status: "Transferred", transfer: "Transferred to MHBAN1318576000010404", reason: "Cessation of short service", epfJoining: "01 Nov 2022", epsJoining: "01 Nov 2022", epfExit: "07 Aug 2023", epsExit: "07 Aug 2023" },
  { id: "MHBAN1318576000010832", employer: "Civic Data Labs", initials: "CD", joined: "12 Aug 2024", exited: "18 Oct 2025", status: "Eligible", transfer: "Eligible to transfer to current Member ID", reason: "Resignation", epfJoining: "12 Aug 2024", epsJoining: "12 Aug 2024", epfExit: "18 Oct 2025", epsExit: "18 Oct 2025" },
  { id: "MHBAN1318576000010404", employer: "Infosys Limited", initials: "IN", joined: "3 Nov 2025", exited: "Current employment", status: "Active", transfer: "Primary member ID", reason: "—", epfJoining: "03 Nov 2025", epsJoining: "03 Nov 2025", epfExit: "—", epsExit: "—" },
];

export function EmploymentHistory({ onOpenPassbook, onStartTransfer }: { onOpenPassbook: (memberId: string) => void; onStartTransfer: () => void }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<ServiceRecord | null>(null);
  return <section className={styles.history} aria-label={t("Service history")}>
    <div className={styles.heading}><div><p className="eyebrow">{t("SERVICE HISTORY")}</p><h2>{t("Connected employment accounts")}</h2><p>{t("Select a member ID to view its service and transfer details.")}</p></div><span>{t("Aadhaar linked")}</span></div>
    <div className={styles.timeline}>{serviceRecords.map((record, index) => <article key={record.id} className={styles.record}>
      <div className={styles.marker} aria-hidden="true"><span>{record.initials}</span>{index < serviceRecords.length - 1 && <i />}</div>
      <div className={styles.recordBody}><div><p>{index === serviceRecords.length - 1 ? t("Primary member ID") : t("Previous employment")}</p><h3>{record.employer}</h3><code>{record.id}</code><small>{record.joined} · {record.exited}</small></div><div className={styles.recordMeta}><span className={`status ${record.status === "Active" ? "active" : "done"}`}>{t(record.status)}</span><small>{record.transfer}</small></div><button type="button" onClick={() => setSelected(record)}>{t("View details")} <Icon name="arrow" size={15} /></button></div>
    </article>)}</div>
    {selected && <ServiceDrawer record={selected} onClose={() => setSelected(null)} onOpenPassbook={onOpenPassbook} onStartTransfer={onStartTransfer} />}
  </section>;
}

function ServiceDrawer({ record, onClose, onOpenPassbook, onStartTransfer }: { record: ServiceRecord; onClose: () => void; onOpenPassbook: (memberId: string) => void; onStartTransfer: () => void }) {
  const { t } = useLanguage();
  const [markingExit, setMarkingExit] = useState(false);
  return <div className={styles.drawerLayer}><button className={styles.scrim} type="button" aria-label={t("Close service details")} onClick={onClose} /><aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="service-detail-title"><header><div><p className="eyebrow">{t("MEMBER SERVICE DETAILS")}</p><h2 id="service-detail-title">{record.employer}</h2><code>{record.id}</code></div><button type="button" aria-label={t("Close service details")} onClick={onClose}><Icon name="close" /></button></header>{markingExit ? <MarkExitFlow record={record} onCancel={() => setMarkingExit(false)} /> : <><dl><Detail label={t("UAN")} value="101727439258" /><Detail label={t("Date of joining · EPF")} value={record.epfJoining} /><Detail label={t("Date of joining · EPS")} value={record.epsJoining} /><Detail label={t("Date of exit · EPF")} value={record.epfExit} /><Detail label={t("Date of exit · EPS")} value={record.epsExit} /><Detail label={t("Reason for leaving")} value={record.reason} /></dl><section className={styles.transfer}><span className={`status ${record.status === "Active" ? "active" : "done"}`}>{t(record.status)}</span><div><strong>{t("PF transfer status")}</strong><p>{record.transfer}</p></div></section>{record.status === "Active" && <button className={styles.markExit} type="button" onClick={() => setMarkingExit(true)}>Mark exit <Icon name="arrow" size={16} /></button>}{record.status === "Eligible" && <button className={styles.markExit} type="button" onClick={onStartTransfer}>Start transfer <Icon name="arrow" size={16} /></button>}<button className={styles.passbookLink} type="button" onClick={() => onOpenPassbook(record.id)}><Icon name="book" size={17} />{t("View this member's passbook")}</button></>}</aside></div>;
}

function MarkExitFlow({ record, onCancel }: { record: ServiceRecord; onCancel: () => void }) {
  const [stage, setStage] = useState<"details" | "otp" | "employer" | "epfo" | "done">("details");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  useEffect(() => {
    if (stage === "employer") { const timer = window.setTimeout(() => setStage("epfo"), 950); return () => window.clearTimeout(timer); }
    if (stage === "epfo") { const timer = window.setTimeout(() => setStage("done"), 950); return () => window.clearTimeout(timer); }
  }, [stage]);
  if (stage === "details") return <form key="exit-details" className={styles.exitForm} onSubmit={(event) => { event.preventDefault(); setStage("otp"); }}><p className="eyebrow">JOINT DECLARATION · MARK EXIT</p><section className={styles.exitRecord}><strong>{record.employer}</strong><span>{record.id}</span><small>Joined {record.epfJoining} · Employer&apos;s last contribution: Aug 2026</small></section><label>Date of exit · EPF<input required type="date" min="2025-11-03" max="2026-08-31" /></label><label>Re-enter date of exit · EPF<input required type="date" min="2025-11-03" max="2026-08-31" /></label><label>Reason for exit<select required defaultValue=""><option value="" disabled>Select a reason</option><option>Cessation of short service</option><option>Resignation</option><option>Termination</option><option>Superannuation</option></select></label><label className={styles.check}><input required type="checkbox" /><span>I understand this date is shared with my employer and corrections follow the Joint Declaration process.</span></label><section className={styles.exitNotice}><strong>Please note</strong><p>The exit date should not be later than the last contribution month. It cannot be changed after settlement.</p></section><button className="primary-button" type="submit">Continue to Aadhaar authentication</button><button className={styles.cancel} type="button" onClick={onCancel}>Cancel</button></form>;
  if (stage === "otp") return <form key="exit-otp" className={styles.exitForm} onSubmit={(event) => { event.preventDefault(); if (!isMockOtp(otp)) return setOtpError(true); setStage("employer"); }}><p className="eyebrow">AADHAAR AUTHENTICATION</p><section className={styles.exitNotice}><strong>Consent recorded</strong><p>Enter the OTP sent to your Aadhaar-linked mobile number to submit this Joint Declaration.</p></section><label>6-digit Aadhaar OTP<input required autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value); setOtpError(false); }} placeholder="123456" /></label><small className={styles.mockOtp}>Mock OTP: 123456</small>{otpError && <small className={styles.otpError}>Enter the mock OTP shown above.</small>}<button className="primary-button" type="submit">Submit Joint Declaration</button><button className={styles.cancel} type="button" onClick={onCancel}>Cancel</button></form>;
  if (stage === "done") return <section className={styles.exitComplete}><span><Icon name="shield" size={22} /></span><h3>Exit request submitted</h3><p>Your Joint Declaration has completed the simulated employer and EPFO review.</p><ol><li>Submitted</li><li>Employer review</li><li>EPFO decision</li></ol><button className="primary-button" type="button" onClick={onCancel}>Done</button></section>;
  const title = stage === "employer" ? "Employer review" : "EPFO decision";
  return <section className={styles.exitLoading} role="status"><span /><strong>{title}</strong><p>{stage === "employer" ? "Your employer is reviewing the exit date and reason." : "Employer review is complete. EPFO is recording the declaration."}</p><ol><li className={styles.complete}>Submitted</li><li className={styles.complete}>Employer review</li><li className={stage === "epfo" ? styles.complete : ""}>EPFO decision</li></ol></section>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
