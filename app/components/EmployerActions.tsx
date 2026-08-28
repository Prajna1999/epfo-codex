"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { readBrowserStore, writeBrowserStore } from "./browser-store";
import styles from "./employer-actions.module.css";

type Role = "establishment" | "principal";
type Action = { title: string; detail: string; icon: IconName; fields: string[]; note: string };
type Tracker = { id: string; title: string; view: string; status: string; submitted: string };

const establishment: Record<string, Action[]> = {
  "Employees": [{ title: "Register employee", detail: "Create a UAN-linked member record before the next ECR.", icon: "users", fields: ["Employee name", "Aadhaar / UAN", "Date of joining"], note: "The member receives a UAN activation prompt after validation." }, { title: "Approve profile update", detail: "Review a member’s pending KYC or profile correction.", icon: "shield", fields: ["UAN", "Request reference"], note: "Only authorised establishment users can approve this request." }],
  "ECR & contributions": [{ title: "Upload ECR", detail: "Submit the monthly Electronic Challan-cum-Return file.", icon: "file", fields: ["Wage month", "Salary disbursal date", "ECR file"], note: "ECR is UAN-based. The preview creates a mock TRRN only." }, { title: "Generate challan", detail: "Prepare payment for a submitted ECR or arrear return.", icon: "payment", fields: ["TRRN", "Payment mode"], note: "A challan is generated after ECR validation." }],
  "Payments": [{ title: "Pay actionable challan", detail: "Complete a payment against an approved TRRN.", icon: "payment", fields: ["TRRN", "Banking channel"], note: "This prototype never opens a bank payment page." }],
  "Compliance": [{ title: "Submit compliance response", detail: "Attach a reply to a compliance item for the establishment.", icon: "shield", fields: ["Reference number", "Response document"], note: "The response remains a local prototype record." }],
  "Reports": [{ title: "Request establishment e-report card", detail: "Prepare a compliance and contribution summary.", icon: "book", fields: ["Reporting period"], note: "The generated report is a preview only." }, { title: "Find TRRN", detail: "Look up a challan or ECR by its transaction reference.", icon: "search", fields: ["TRRN"], note: "Use the reference issued after ECR submission." }],
  "Users & access": [{ title: "Add authorised user", detail: "Invite an establishment user with a defined operational role.", icon: "user", fields: ["User name", "Registered mobile", "Role"], note: "Authorisation is simulated; no user is invited outside this browser." }],
};

const principal: Record<string, Action[]> = {
  "Contract employers": [{ title: "Link contract employer", detail: "Associate a contract employer with this principal employer.", icon: "building", fields: ["Contract employer name", "EPFO establishment code", "Contract period"], note: "EPFO’s principal-employer facility uses these links for compliance oversight." }],
  "Work orders": [{ title: "Add work order", detail: "Record an outsourced job contract for a linked employer.", icon: "file", fields: ["Work order number", "Contract employer", "Start and end dates"], note: "Upload supporting documents only in the prototype browser session." }],
  "Contract workers": [{ title: "Declare contract workers", detail: "Record contract-worker information against a work order.", icon: "users", fields: ["Work order number", "Worker count", "Wage month"], note: "This supports coverage and contribution compliance monitoring." }],
  "Compliance": [{ title: "Review contractor compliance", detail: "Record a compliance follow-up for a linked contract employer.", icon: "shield", fields: ["Contract employer", "Wage month", "Observation"], note: "The review is recorded locally in this prototype." }],
  "Reports": [{ title: "Request contractor summary", detail: "Prepare a work-order and contractor compliance view.", icon: "book", fields: ["Reporting period"], note: "The report is a prototype preview." }],
};

export function EmployerActions({ role, view }: { role: Role; view: string }) {
  const actions = (role === "principal" ? principal : establishment)[view] ?? [];
  const [active, setActive] = useState<Action | null>(null);
  const storeKey = `epfo.${role}-requests`; const [trackers, setTrackers] = useState<Tracker[]>(() => readBrowserStore<Tracker[]>(storeKey, []));
  useEffect(() => writeBrowserStore(storeKey, trackers), [storeKey, trackers]);
  const submitted = (action: Action) => setTrackers((current) => [{ id: `${role === "principal" ? "PE" : "EST"}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title: action.title, view, status: role === "principal" ? "Compliance review in progress" : "Employer validation in progress", submitted: "28 Aug 2026" }, ...current]);
  const visibleTrackers = trackers.filter((tracker) => tracker.view === view);
  return <section className={styles.page}>{actions.length ? <><p className="eyebrow">{role === "principal" ? "PRINCIPAL EMPLOYER SERVICES" : "ESTABLISHMENT SERVICES"}</p><div className={styles.grid}>{actions.map((action) => <button className={styles.card} type="button" key={action.title} onClick={() => setActive(action)}><span><Icon name={action.icon} size={20} /></span><div><strong>{action.title}</strong><p>{action.detail}</p></div><Icon name="arrow" size={16} /></button>)}</div></> : <section className={styles.empty}><Icon name="file" size={22} /><strong>No action is available here yet.</strong></section>}{visibleTrackers.length > 0 && <section className={styles.trackers}><div><p className="eyebrow">REQUEST TRACKER</p><h2>Requests in this service</h2></div>{visibleTrackers.map((tracker) => <article key={tracker.id}><span><Icon name="file" size={17} /></span><div><strong>{tracker.title}</strong><small>{tracker.id} · Submitted {tracker.submitted}</small><p>{tracker.status}</p></div></article>)}</section>}{active && <ActionDrawer action={active} onSubmitted={() => submitted(active)} onClose={() => setActive(null)} />}</section>;
}

function ActionDrawer({ action, onClose, onSubmitted }: { action: Action; onClose: () => void; onSubmitted: () => void }) {
  const [stage, setStage] = useState<"details" | "preview" | "submitting" | "done">("details");
  useEffect(() => { if (stage === "submitting") { const timer = window.setTimeout(() => { onSubmitted(); setStage("done"); }, 850); return () => window.clearTimeout(timer); } }, [stage, onSubmitted]);
  return <div className={styles.layer}><button className={styles.scrim} type="button" aria-label="Close service request" onClick={onClose} /><aside className={styles.drawer} role="dialog" aria-modal="true"><header><div><p className="eyebrow">EMPLOYER SERVICE</p><h2>{action.title}</h2><p>Prototype only. Nothing is sent to EPFO or a third party.</p></div><button type="button" onClick={onClose}><Icon name="close" /></button></header>{stage === "details" ? <form onSubmit={(event) => { event.preventDefault(); setStage("preview"); }}>{action.fields.map((field) => <label key={field}>{field}<input required placeholder={field === "ECR file" || field.includes("document") ? "Choose file in a live service" : `Enter ${field.toLowerCase()}`} /></label>)}<p className={styles.note}>{action.note}</p><button className="primary-button">Preview request</button></form> : stage === "preview" ? <section className={styles.preview}><p className="eyebrow">REQUEST PREVIEW</p><h3>{action.title}</h3><p>{action.detail}</p><dl>{action.fields.map((field) => <div key={field}><dt>{field}</dt><dd>Provided for review</dd></div>)}</dl><button className="primary-button" type="button" onClick={() => setStage("submitting")}>Submit request</button><button className={styles.cancel} type="button" onClick={() => setStage("details")}>Back to edit</button></section> : stage === "submitting" ? <section className={styles.loading}><span /><strong>Submitting your request</strong><p>Validating the details and preparing the employer record.</p></section> : <section className={styles.done}><span><Icon name="shield" size={22} /></span><h3>Request submitted</h3><p>Your prototype request is ready for the relevant EPFO workflow.</p><button className="primary-button" type="button" onClick={onClose}>Done</button></section>}</aside></div>;
}
