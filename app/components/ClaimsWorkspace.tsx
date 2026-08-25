"use client";

import { useState } from "react";
import { ClaimFlow } from "../claims/new/ClaimFlow";
import type { ClaimDraft } from "../claims/new/claim";
import { useLanguage } from "../language";
import { Icon } from "./Icon";
import { pastClaims, submittedClaim, type ClaimRecord } from "./claims-data";
import styles from "./claims-workspace.module.css";

type ClaimsTab = "start" | "status";

export function ClaimsWorkspace({ initialTab = "status", initialClaimId }: { initialTab?: ClaimsTab; initialClaimId?: string }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ClaimsTab>(initialTab);
  const [claims, setClaims] = useState(pastClaims);
  const [selectedId, setSelectedId] = useState(initialClaimId && pastClaims.some((claim) => claim.id === initialClaimId) ? initialClaimId : pastClaims[0].id);
  const selected = claims.find((claim) => claim.id === selectedId) ?? claims[0];

  const handleSubmitted = (draft: ClaimDraft) => {
    const claim = submittedClaim(draft);
    setClaims((current) => [claim, ...current.filter((item) => item.id !== claim.id)]);
    setSelectedId(claim.id);
    setTab("status");
  };

  return (
    <section className={styles.workspace} aria-label={t("Claims")}>
      <div className={styles.tabs} role="tablist" aria-label={t("Claims")}>
        <button id="start-claim-tab" type="button" role="tab" aria-controls="start-claim-panel" aria-selected={tab === "start"} onClick={() => setTab("start")}>{t("Start a claim")}</button>
        <button id="claim-status-tab" type="button" role="tab" aria-controls="claim-status-panel" aria-selected={tab === "status"} onClick={() => setTab("status")}>{t("Claim status")}</button>
      </div>
      {tab === "start" ? <div id="start-claim-panel" role="tabpanel" aria-labelledby="start-claim-tab"><ClaimFlow onSubmitted={handleSubmitted} /></div> : <div id="claim-status-panel" role="tabpanel" aria-labelledby="claim-status-tab"><ClaimStatus claims={claims} selected={selected} onSelect={setSelectedId} /></div>}
    </section>
  );
}

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
