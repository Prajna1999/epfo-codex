"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../language";
import { checkComplianceReadiness, checkContributionDue, checkEcrFiling, complianceReadinessSummary, establishmentActions, pendingActionsSummary, principalActions, type DueCheck, type EcrCheck, type EmployerAction, type ReadinessItem } from "./employer-agent-data";
import { Icon, type IconName } from "./Icon";

type EmployerIntentType = "ecr_status" | "contribution_due" | "compliance_readiness" | "pending_actions" | "unclear";

const ESTABLISHMENT_PRESETS = [
  "Did I file this month's ECR for everyone?",
  "When is my contribution payment due?",
  "How many employees still need KYC approval?",
  "What's pending before I'm fully compliant?",
];

const PRINCIPAL_PRESETS = [
  "What's pending before I'm fully compliant?",
  "Is my digital signature still valid?",
];

const MIN_WIDTH = 320;
const MAX_WIDTH = 560;

type Insight = { id: "ecr" | "contribution" | "compliance"; title: string; icon: IconName };
const INSIGHTS: Insight[] = [
  { id: "ecr", title: "Check this month's ECR filing", icon: "file" },
  { id: "contribution", title: "Check the contribution due date", icon: "payment" },
  { id: "compliance", title: "Check compliance readiness", icon: "shield" },
];

type Selection = { kind: "insight"; item: Insight } | { kind: "action"; item: EmployerAction };

export function EmployerAgent({ role, onClose, onNavigate, width, onResize }: { role: "establishment" | "principal"; onClose: () => void; onNavigate: (view: string) => void; width: number; onResize: (width: number) => void }) {
  const { t, tpl } = useLanguage();
  const [stage, setStage] = useState<"scanning" | "ready">("scanning");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [resizing, setResizing] = useState(false);
  const [embedded, setEmbedded] = useState(true);
  const dragStart = useRef({ x: 0, width });

  useEffect(() => {
    const timer = window.setTimeout(() => setStage("ready"), 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 781px)");
    const update = () => setEmbedded(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const ecr = useMemo(() => checkEcrFiling(), []);
  const contribution = useMemo(() => checkContributionDue(), []);
  const readiness = useMemo(() => checkComplianceReadiness(), []);
  const actions = useMemo(() => (role === "principal" ? principalActions() : establishmentActions()), [role]);

  const briefOk = ecr.ok && contribution.ok && readiness.every((item) => item.ready);
  const briefText = !ecr.ok ? ecr.title : !contribution.ok ? contribution.title : (readiness.find((item) => !item.ready)?.detail ?? "ECR, contributions and compliance all look current.");

  const startResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStart.current = { x: event.clientX, width };
    setResizing(true);
    const onMove = (moveEvent: PointerEvent) => {
      const delta = dragStart.current.x - moveEvent.clientX;
      onResize(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStart.current.width + delta)));
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [width, onResize]);

  const nudgeWidth = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") onResize(Math.min(MAX_WIDTH, width + 16));
    if (event.key === "ArrowRight") onResize(Math.max(MIN_WIDTH, width - 16));
  };

  const continueAction = () => {
    if (!selected || selected.kind !== "action") return;
    onNavigate(selected.item.view);
    onClose();
  };

  const roleLabel = t(role === "principal" ? "Principal employer" : "Establishment");

  return <div className="agent-layer">
    {!embedded && <button className="agent-scrim" type="button" aria-label={t("Close compliance guide")} onClick={onClose} />}
    <aside className="agent-drawer page-enter" role="dialog" aria-modal={embedded ? undefined : true} aria-labelledby="employer-agent-title" style={{ "--agent-width": `${width}px` } as React.CSSProperties}>
      {embedded && <div className={`agent-resize-handle${resizing ? " is-active" : ""}`} onPointerDown={startResize} onKeyDown={nudgeWidth} role="separator" aria-orientation="vertical" aria-label={t("Resize compliance guide panel")} aria-valuenow={width} aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} tabIndex={0} />}
      <header className="agent-head"><div><span className="agent-mark"><Icon name="spark" size={18} /></span><p className="eyebrow">{tpl("{role} GUIDE · PREVIEW", { role: roleLabel.toUpperCase() })}</p><h2 id="employer-agent-title">{t("Your compliance agent")}</h2><p>{t("It reads this account and checks it against EPFO's own filing and compliance norms. It never files, confirms or submits anything without your approval.")}</p></div><button type="button" onClick={onClose} aria-label={t("Close compliance guide")}><Icon name="close" /></button></header>
      {stage === "scanning" ? <div className="agent-scanning" role="status" aria-live="polite"><span /><strong>{t("Scanning this account")}</strong><p>{t("Checking ECR filing, contribution due dates and compliance tasks…")}</p></div> : selected?.kind === "action" ? <section className="agent-confirm">
        <button className="agent-back" type="button" onClick={() => setSelected(null)}>{t("← Back to tasks")}</button>
        <p className="eyebrow">{t("CONFIRM BEFORE CONTINUING")}</p><span className={`agent-impact ${selected.item.impact.toLowerCase().replace("-", "")}`}>{t(selected.item.impact)}</span>
        <h3>{t(selected.item.title)}</h3><p>{t(selected.item.detail)}</p>
        <dl><div><dt>{t("What will happen")}</dt><dd>{t("Open the relevant workspace. Nothing is filed or confirmed here.")}</dd></div><div><dt>{t("Your control")}</dt><dd>{t("You review each record and submit the actual request separately.")}</dd></div></dl>
        <button className="primary-button" type="button" onClick={continueAction}>{t("I understand — continue")}</button>
        <button className="agent-cancel" type="button" onClick={() => setSelected(null)}>{t("Cancel")}</button>
      </section> : selected?.kind === "insight" ? <section className="agent-confirm">
        <button className="agent-back" type="button" onClick={() => setSelected(null)}>{t("← Back to tasks")}</button>
        <p className="eyebrow">{t("ACCOUNT INSIGHT")}</p>
        <h3>{t(selected.item.title)}</h3>
        {selected.item.id === "ecr" && <EcrInsight result={ecr} />}
        {selected.item.id === "contribution" && <ContributionDueInsight result={contribution} />}
        {selected.item.id === "compliance" && <ComplianceInsight items={readiness} />}
        <button className="agent-cancel" type="button" onClick={() => setSelected(null)}>{t("Back to tasks")}</button>
      </section> : <>
        <EmployerAskInWords role={role} ecr={ecr} contribution={contribution} />
        <section className="agent-brief"><span><Icon name={briefOk ? "shield" : "bell"} size={18} /></span><div><strong>{t(briefOk ? "Nothing needs attention" : "One or more items need attention")}</strong><p>{briefText}</p></div></section>
        <section className="agent-tasks"><div className="agent-section-head"><div><p className="eyebrow">{t("ACCOUNT INSIGHTS")}</p><h3>{t("Or choose a question")}</h3></div><small>{t("Read-only, no approval needed")}</small></div>{INSIGHTS.map((insight) => <button key={insight.id} type="button" onClick={() => setSelected({ kind: "insight", item: insight })}><span><Icon name={insight.icon} size={18} /></span><div><strong>{t(insight.title)}</strong></div><i className="agent-impact">{t("Read-only")}</i><Icon name="arrow" size={16} /></button>)}</section>
        {actions.length > 0 && <section className="agent-tasks"><div className="agent-section-head"><div><p className="eyebrow">{t("ACCOUNT ACTIONS")}</p><h3>{t("Prepare a request")}</h3></div><small>{t("Every action pauses for approval")}</small></div>{actions.map((action) => <button key={action.id} type="button" onClick={() => setSelected({ kind: "action", item: action })}><span><Icon name={action.icon} size={18} /></span><div><strong>{t(action.title)}</strong><small>{t(action.detail)}</small></div><i className={`agent-impact ${action.impact.toLowerCase().replace("-", "")}`}>{t(action.impact)}</i><Icon name="arrow" size={16} /></button>)}</section>}
      </>}
      <footer className="agent-footer"><Icon name="shield" size={15} /> {t("This agent gives guidance, not a decision. EPFO filing rules and verification still apply.")}</footer>
    </aside>
  </div>;
}

function EcrInsight({ result }: { result: EcrCheck }) {
  return <section className="agent-insight-result">
    <div className={`agent-insight-status ${result.ok ? "ok" : "warn"}`}><Icon name={result.ok ? "shield" : "bell"} size={16} />{result.title}</div>
    <p>{result.message}</p>
  </section>;
}

function ContributionDueInsight({ result }: { result: DueCheck }) {
  return <section className="agent-insight-result">
    <div className={`agent-insight-status ${result.ok ? "ok" : "warn"}`}><Icon name={result.ok ? "shield" : "bell"} size={16} />{result.title}</div>
    <p>{result.message}</p>
  </section>;
}

function ComplianceInsight({ items }: { items: ReadinessItem[] }) {
  const { t } = useLanguage();
  return <dl className="agent-insight-list">
    {items.map((item) => <div key={item.label}>
      <dt>{t(item.label)}<i className={`agent-impact ${item.ready ? "ok" : ""}`}>{item.ready ? t("Ready") : t("Action needed")}</i></dt>
      <dd>{item.detail}</dd>
    </div>)}
  </dl>;
}

function EmployerAskInWords({ role, ecr, contribution }: { role: "establishment" | "principal"; ecr: EcrCheck; contribution: DueCheck }) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const presets = role === "principal" ? PRINCIPAL_PRESETS : ESTABLISHMENT_PRESETS;

  const runQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStatus("loading");
    setAnswer(null);
    try {
      const response = await fetch("/api/employer-agent-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: query, role }) });
      const body = await response.json();
      if (!response.ok || !body.intent) throw new Error(body.error ?? "failed");
      const { intentType } = body.intent as { intentType: EmployerIntentType };
      const result =
        intentType === "ecr_status" ? ecr.message
        : intentType === "contribution_due" ? contribution.message
        : intentType === "compliance_readiness" ? complianceReadinessSummary()
        : intentType === "pending_actions" ? pendingActionsSummary(role)
        : t("I couldn't tell what you're asking — try asking about this month's ECR, the contribution due date, or what's pending for compliance.");
      setAnswer(result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [role, ecr, contribution, t]);

  const ask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runQuery(text);
  };

  const pickPreset = (question: string) => {
    setText(question);
    setFocused(false);
    runQuery(question);
  };

  const showSuggestions = focused && status !== "loading" && text.trim().length === 0;

  return <section className="agent-ask">
    <label htmlFor="employer-agent-ask-input"><Icon name="spark" size={14} />{t("Ask in your own words")}</label>
    <form onSubmit={ask}>
      <div className={`agent-ask-field${status === "loading" ? " is-loading" : ""}`}>
        <input id="employer-agent-ask-input" type="text" value={text} onChange={(event) => setText(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={t("Ask about ECR, contributions, or compliance…")} disabled={status === "loading"} autoComplete="off" />
        <button type="submit" className="agent-ask-send" aria-label={t("Ask")} disabled={status === "loading" || !text.trim()}>{status === "loading" ? <span className="agent-ask-spinner" aria-hidden="true" /> : <Icon name="arrow" size={15} />}</button>
      </div>
      {showSuggestions && <div className="agent-suggestions" aria-label={t("Example questions")}>
        <p className="agent-suggestions-title">{t("Try asking")}</p>
        {presets.map((question) => <button key={question} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickPreset(question)}>{t(question)}</button>)}
      </div>}
      {status === "error" && <small className="agent-ask-error">{t("Couldn't reach the intent service. Confirm OPENAI_API_KEY is set and try again.")}</small>}
      {answer && <div className="agent-ask-answer"><Icon name="spark" size={15} /><div><p>{answer}</p></div></div>}
      <small>{t("Understands your question with AI, then answers only from this account's real filing status and EPFO's own rules.")}</small>
    </form>
  </section>;
}
