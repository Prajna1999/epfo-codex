"use client";

import { useEffect, useState } from "react";
import { ClaimFlow } from "../claims/new/ClaimFlow";
import type { ClaimDraft } from "../claims/new/claim";
import { useLanguage } from "../language";
import { Icon } from "./Icon";
import { pastClaims, submittedClaim, submittedTransfer, type ClaimRecord } from "./claims-data";
import { readBrowserStore, writeBrowserStore } from "./browser-store";
import styles from "./claims-workspace.module.css";

type ClaimsTab = "start" | "status";

export function ClaimsWorkspace({ initialTab = "status", initialClaimId }: { initialTab?: ClaimsTab; initialClaimId?: string }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ClaimsTab>(initialTab);
  const [claims, setClaims] = useState(() => { const records = [...readBrowserStore<ClaimRecord[]>("epfo.service-requests", []), ...readBrowserStore<ClaimRecord[]>("epfo.claims", pastClaims).filter((claim) => !claim.id.startsWith("SRV-"))]; return records.filter((claim, index) => records.findIndex((item) => item.id === claim.id) === index); });
  const [selectedId, setSelectedId] = useState(initialClaimId ?? pastClaims[0].id);
  const [startType, setStartType] = useState<"claim" | "transfer" | null>(null);
  const selected = claims.find((claim) => claim.id === selectedId) ?? claims[0];
  useEffect(() => writeBrowserStore("epfo.claims", claims.filter((claim) => !claim.id.startsWith("SRV-"))), [claims]);

  const handleSubmitted = (draft: ClaimDraft) => {
    const claim = submittedClaim(draft);
    setClaims((current) => [claim, ...current.filter((item) => item.id !== claim.id)]);
    setSelectedId(claim.id);
    setTab("status");
  };
  const handleTransfer = () => { const claim = submittedTransfer(); setClaims((current) => [claim, ...current.filter((item) => item.id !== claim.id)]); setSelectedId(claim.id); setTab("status"); };

  return (
    <section className={styles.workspace} aria-label={t("Claims")}>
      <div className={styles.tabs} role="tablist" aria-label={t("Claims")}>
        <button id="start-claim-tab" type="button" role="tab" aria-controls="start-claim-panel" aria-selected={tab === "start"} onClick={() => setTab("start")}>{t("Start a claim")}</button>
        <button id="claim-status-tab" type="button" role="tab" aria-controls="claim-status-panel" aria-selected={tab === "status"} onClick={() => setTab("status")}>{t("Claim status")}</button>
      </div>
      {tab === "start" ? <div key={`start-${startType ?? "choice"}`} className="slide-in" id="start-claim-panel" role="tabpanel" aria-labelledby="start-claim-tab">{startType === null ? <StartChoice onChoose={setStartType} /> : startType === "claim" ? <ClaimFlow onSubmitted={handleSubmitted} /> : <TransferFlow onSubmitted={handleTransfer} />}</div> : <div key="status" className="slide-in" id="claim-status-panel" role="tabpanel" aria-labelledby="claim-status-tab"><ClaimStatus claims={claims} selected={selected} onSelect={setSelectedId} /></div>}
    </section>
  );
}

function StartChoice({ onChoose }: { onChoose: (type: "claim" | "transfer") => void }) { return <section className={styles.startChoice}><p className="eyebrow">START A REQUEST</p><h2>What would you like to do?</h2><div><button type="button" onClick={() => onChoose("claim")}><Icon name="claim" size={20} /><span><strong>PF claim</strong><small>Advance, settlement or pension benefit</small></span><Icon name="arrow" size={16} /></button><button type="button" onClick={() => onChoose("transfer")}><Icon name="briefcase" size={20} /><span><strong>Transfer previous PF</strong><small>Move a previous account into your current Member ID</small></span><Icon name="arrow" size={16} /></button></div></section>; }

function TransferFlow({ onSubmitted }: { onSubmitted: () => void }) { const [stage, setStage] = useState<"review" | "otp" | "loading">("review"); const [otp, setOtp] = useState(""); const [error, setError] = useState(false); if (stage === "loading") return <section className={styles.transferLoading}><span /><strong>Submitting Form 13</strong><p>Checking your verified KYC, prior exit record, and current Member ID.</p></section>; return <section className={styles.transferFlow}><p className="eyebrow">PF TRANSFER · FORM 13</p><h2>{stage === "review" ? "Review transfer details" : "Aadhaar authentication"}</h2>{stage === "review" ? <form onSubmit={(event) => { event.preventDefault(); setStage("otp"); }}><dl><div><dt>Transfer from</dt><dd>Civic Data Labs · MHBAN1318576000010832</dd></div><div><dt>Transfer to</dt><dd>Infosys Limited · MHBAN1318576000010404</dd></div><div><dt>Eligibility</dt><dd>Exit recorded · Aadhaar, KYC and bank verified</dd></div></dl><p>Your request will be submitted as Form 13. Employer attestation is applied only where required.</p><button className="primary-button">Continue to Aadhaar authentication</button></form> : <form key="transfer-otp" onSubmit={(event) => { event.preventDefault(); if (otp !== "123456") return setError(true); setStage("loading"); window.setTimeout(onSubmitted, 900); }}><p>An OTP was sent to your Aadhaar-linked mobile number.</p><label>6-digit Aadhaar OTP<input required autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value); setError(false); }} placeholder="123456" /></label><small>Mock OTP: 123456</small>{error && <small className={styles.transferError}>Enter the mock OTP shown above.</small>}<button className="primary-button">Submit transfer request</button></form>}</section>; }

function ClaimStatus({ claims, selected, onSelect }: { claims: ClaimRecord[]; selected: ClaimRecord; onSelect: (id: string) => void }) {
  const { t } = useLanguage();
  return (
    <div className={styles.statusLayout}>
      <section className={styles.list} aria-label={t("Past claims")}>
        <div className={styles.sectionHead}><div><p className="eyebrow">{t("CLAIMS")}</p><h2>{t("Your requests")}</h2></div><span>{claims.length}</span></div>
        {claims.map((claim) => <button key={claim.id} type="button" className={claim.id === selected.id ? styles.selected : ""} onClick={() => onSelect(claim.id)}>
          <span><strong>{t(claim.type)}</strong><small>{t(claim.status === "Transferred" ? "Requested" : "Submitted")} {claim.submitted}</small></span><b>{claim.amount}</b><i className={claim.status === "Paid" || claim.status === "Transferred" ? styles.paid : ""}>{t(claim.status)}</i>
        </button>)}
      </section>
      <section className={styles.detail} aria-live="polite">
        <p className="eyebrow">{t("CLAIM DETAILS")}</p>
        <div className={styles.detailHead}><div><h2>{t(selected.type)}</h2><span>{selected.id} · {selected.form}</span></div><strong>{selected.amount}</strong></div>
        <ol className={styles.progress}>{selected.steps.map((step, index) => <li key={step} className={index <= selected.currentStep ? styles.complete : ""}><i>{index < selected.currentStep ? "✓" : index + 1}</i><span>{t(step)}</span></li>)}</ol>
        <div className={styles.note}><Icon name="shield" size={18} /><p>{t(selected.message)}</p></div>
      </section>
    </div>
  );
}
