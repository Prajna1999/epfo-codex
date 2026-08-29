"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { buildGenericSeries, checkAdvanceEligibility, checkClaimReadiness, checkContributionHealth, contributionHistory, findEligibleTransfer, pensionAtAge, projectPension, projectRetirementCorpus, projectRetirementSeries, projectWithdrawalImpact, serviceTimeline, UNRATED_PURPOSES, type ContributionCheck, type CorpusPoint, type DataPoint, type EligibilityResult, type ReadinessItem, type RetirementProjection, type TimelineSegment, type YearContribution } from "./agent-data";
import { Icon, type IconName } from "./Icon";

const MIN_WIDTH = 320;
const MAX_WIDTH = 640;

type Insight = { id: "contribution" | "eligibility" | "readiness" | "retirement" | "pension"; title: string; description: string; icon: IconName };
const insights: Insight[] = [
  { id: "contribution", title: "Check my latest contribution", description: "Compares your latest deposit against the passbook.", icon: "book" },
  { id: "eligibility", title: "Check advance eligibility", description: "Checks EPFO's service-duration rules against your join date.", icon: "shield" },
  { id: "readiness", title: "Check claim readiness", description: "Checks Aadhaar, PAN, bank and nomination status.", icon: "user" },
  { id: "retirement", title: "Project my retirement corpus", description: "Compounds your balance and contributions to age 58 at today's declared EPF rate.", icon: "payment" },
  { id: "pension", title: "Estimate my monthly pension", description: "Applies EPFO's EPS formula to your projected service at retirement.", icon: "briefcase" },
];

type AgentAction = { id: string; title: string; detail: string; impact: "Reversible" | "Irreversible"; icon: IconName; destination: "Claims" | "Account"; tab?: "start" | "status"; section?: string };

type Selection = { kind: "insight"; item: Insight } | { kind: "action"; item: AgentAction };

export function EpfAgent({ onClose, onNavigate, width, onResize }: { onClose: () => void; onNavigate: (item: string, tab?: "start" | "status", claimId?: string, memberId?: string, section?: string) => void; width: number; onResize: (width: number) => void }) {
  const [stage, setStage] = useState<"scanning" | "ready">("scanning");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [resizing, setResizing] = useState(false);
  const [embedded, setEmbedded] = useState(true);
  const dragStart = useRef({ x: 0, width });

  useEffect(() => {
    const timer = window.setTimeout(() => setStage("ready"), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 781px)");
    const update = () => setEmbedded(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const contribution = useMemo(() => checkContributionHealth(), []);
  const eligibility = useMemo(() => checkAdvanceEligibility(), []);
  const readiness = useMemo(() => checkClaimReadiness(), []);
  const transferLead = useMemo(() => findEligibleTransfer(), []);

  const actions = useMemo<AgentAction[]>(() => {
    const list: AgentAction[] = [];
    if (transferLead) list.push({ id: "transfer", title: `Prepare a PF transfer — ${transferLead.employer}`, detail: `${transferLead.employer} (${transferLead.id}) is eligible to merge into your current Member ID. This opens Form 13 in Claims; nothing is submitted until you confirm there with Aadhaar authentication.`, impact: "Reversible", icon: "briefcase", destination: "Claims", tab: "start" });
    list.push({ id: "nomination", title: "Review my nomination", detail: "Priya Patil is currently registered as your 100% nominee. This opens Profile so you can review or change it with Aadhaar e-Sign.", impact: "Irreversible", icon: "user", destination: "Account", section: "nomination" });
    return list;
  }, [transferLead]);

  const briefText = transferLead
    ? `Your ${transferLead.employer} PF account is eligible to transfer into your current Member ID.`
    : contribution.ok
      ? "Your account looks healthy — no gaps or pending actions found."
      : contribution.message;

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
    const { item } = selected;
    onNavigate(item.destination, item.tab, undefined, undefined, item.section);
    onClose();
  };

  return <div className="agent-layer">
    {!embedded && <button className="agent-scrim" type="button" aria-label="Close EPF guide" onClick={onClose} />}
    <aside className="agent-drawer page-enter" role="dialog" aria-modal={embedded ? undefined : true} aria-labelledby="epf-agent-title" style={{ "--agent-width": `${width}px` } as React.CSSProperties}>
      {embedded && <div className={`agent-resize-handle${resizing ? " is-active" : ""}`} onPointerDown={startResize} onKeyDown={nudgeWidth} role="separator" aria-orientation="vertical" aria-label="Resize EPF guide panel" aria-valuenow={width} aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} tabIndex={0} />}
      <header className="agent-head"><div><span className="agent-mark"><Icon name="spark" size={18} /></span><p className="eyebrow">EPF GUIDE · PREVIEW</p><h2 id="epf-agent-title">Your account agent</h2><p>It reads your account, computes real answers from EPFO&apos;s own rules, and prepares a request. It never submits, changes or shares anything without your approval.</p></div><button type="button" onClick={onClose} aria-label="Close EPF guide"><Icon name="close" /></button></header>
      {stage === "scanning" ? <div className="agent-scanning" role="status" aria-live="polite"><span /><strong>Scanning your account</strong><p>Checking contributions, service records and claim readiness…</p></div> : selected?.kind === "action" ? <section className="agent-confirm">
        <button className="agent-back" type="button" onClick={() => setSelected(null)}>← Back to tasks</button>
        <p className="eyebrow">CONFIRM BEFORE CONTINUING</p><span className={`agent-impact ${selected.item.impact.toLowerCase().replace("-", "")}`}>{selected.item.impact}</span>
        <h3>{selected.item.title}</h3><p>{selected.item.detail}</p>
        <dl><div><dt>What will happen</dt><dd>Open the relevant EPFO workspace. Nothing will be submitted.</dd></div><div><dt>Your control</dt><dd>You review each detail and approve the final request separately.</dd></div></dl>
        <button className="primary-button" type="button" onClick={continueAction}>I understand — continue</button>
        <button className="agent-cancel" type="button" onClick={() => setSelected(null)}>Cancel</button>
      </section> : selected?.kind === "insight" ? <section className="agent-confirm">
        <button className="agent-back" type="button" onClick={() => setSelected(null)}>← Back to tasks</button>
        <p className="eyebrow">ACCOUNT INSIGHT</p>
        <h3>{selected.item.title}</h3>
        {selected.item.id === "contribution" && <ContributionInsight result={contribution} />}
        {selected.item.id === "eligibility" && <EligibilityInsight results={eligibility} />}
        {selected.item.id === "readiness" && <ReadinessInsight items={readiness} />}
        {selected.item.id === "retirement" && <RetirementInsight />}
        {selected.item.id === "pension" && <PensionInsight />}
        <button className="agent-cancel" type="button" onClick={() => setSelected(null)}>Back to tasks</button>
      </section> : <>
        <AskInWords eligibility={eligibility} />
        <section className="agent-brief"><span><Icon name={transferLead ? "briefcase" : "shield"} size={18} /></span><div><strong>{transferLead ? "One item needs attention" : "Nothing needs attention"}</strong><p>{briefText}</p></div></section>
        <section className="agent-tasks"><div className="agent-section-head"><div><p className="eyebrow">ACCOUNT INSIGHTS</p><h3>Or choose a question</h3></div><small>Read-only, no approval needed</small></div>{insights.map((insight) => <button key={insight.id} type="button" onClick={() => setSelected({ kind: "insight", item: insight })}><span><Icon name={insight.icon} size={18} /></span><div><strong>{insight.title}</strong><small>{insight.description}</small></div><i className="agent-impact">Read-only</i><Icon name="arrow" size={16} /></button>)}</section>
        <section className="agent-tasks"><div className="agent-section-head"><div><p className="eyebrow">ACCOUNT ACTIONS</p><h3>Prepare a request</h3></div><small>Every action pauses for approval</small></div>{actions.map((action) => <button key={action.id} type="button" onClick={() => setSelected({ kind: "action", item: action })}><span><Icon name={action.icon} size={18} /></span><div><strong>{action.title}</strong><small>{action.detail}</small></div><i className={`agent-impact ${action.impact.toLowerCase().replace("-", "")}`}>{action.impact}</i><Icon name="arrow" size={16} /></button>)}</section>
      </>}
      <footer className="agent-footer"><Icon name="shield" size={15} /> This agent gives guidance, not a decision. EPFO rules and verification still apply.</footer>
    </aside>
  </div>;
}

function trendWord(values: number[]): "up" | "down" | "flat" {
  if (values.length < 2 || values[0] === 0) return "flat";
  const delta = values[values.length - 1] - values[0];
  if (Math.abs(delta) < Math.abs(values[0]) * 0.02) return "flat";
  return delta > 0 ? "up" : "down";
}

function SparklineProse({ years }: { years: YearContribution[] }) {
  const totals = years.map((year) => year.total);
  const word = trendWord(totals);
  const average = totals.reduce((sum, value) => sum + value, 0) / totals.length;
  return <p className="agent-sparkline-prose">
    Averaging {formatRupees(average)}/year across {years.length} years, trending <strong className={`trend-${word}`}>{word === "flat" ? "flat" : word === "up" ? "up ↗" : "down ↘"}</strong>
    <Sparkline values={totals} width={56} height={16} />
  </p>;
}

function ContributionInsight({ result }: { result: ContributionCheck }) {
  const years = useMemo(() => contributionHistory(), []);
  return <section className="agent-insight-result">
    <div className={`agent-insight-status ${result.ok ? "ok" : "warn"}`}><Icon name={result.ok ? "shield" : "bell"} size={16} />{result.ok ? "No gaps found" : "Needs a look"}</div>
    <p>{result.message}</p>
    <SparklineProse years={years} />
    <ChartCard title="Contribution history by financial year" expandLabel="contribution history" renderLarge={() => <SparklineTable years={years} />}>
      <SparklineTable years={years} />
    </ChartCard>
  </section>;
}

function EligibilityInsight({ results }: { results: EligibilityResult[] }) {
  return <>
    <dl className="agent-insight-list">
      {results.map((result) => <div key={result.purpose}>
        <dt>{result.purpose}<i className={`agent-impact ${result.eligible ? "ok" : ""}`}>{result.eligible ? "Eligible now" : `From ${result.eligibleFrom}`}</i></dt>
        <dd>Advance cap: {result.capNote}.</dd>
      </div>)}
    </dl>
    <p className="agent-insight-footnote">{UNRATED_PURPOSES.join(", ")} advances don&apos;t have a published minimum-service rule in this preview — check with EPFO directly.</p>
  </>;
}

function ReadinessInsight({ items }: { items: ReadinessItem[] }) {
  return <dl className="agent-insight-list">
    {items.map((item) => <div key={item.label}>
      <dt>{item.label}<i className={`agent-impact ${item.ready ? "ok" : ""}`}>{item.ready ? "Ready" : "Action needed"}</i></dt>
      <dd>{item.detail}</dd>
    </div>)}
  </dl>;
}

function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatCompactRupees(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1e7) return `₹${+(amount / 1e7).toFixed(abs >= 1e8 ? 1 : 2)}Cr`;
  if (abs >= 1e5) return `₹${+(amount / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`;
  if (abs >= 1e3) return `₹${+(amount / 1e3).toFixed(1)}k`;
  return `₹${Math.round(amount)}`;
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (max <= min) return [min];
  const span = max - min;
  const rawStep = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const step = (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) if (value >= min) ticks.push(value);
  return ticks.length ? ticks : [min, max];
}


function ChartCard({ title, expandLabel, children, renderLarge }: { title: string; expandLabel: string; children: ReactNode; renderLarge: () => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <div className="agent-chart-card">
    <button type="button" className="agent-chart-expand" onClick={() => setExpanded(true)} aria-label={`Expand ${expandLabel}`} title="View full screen"><Icon name="expand" size={13} /></button>
    {children}
    {expanded && <ChartModal title={title} onClose={() => setExpanded(false)}>{renderLarge()}</ChartModal>}
  </div>;
}

function ChartModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="agent-chart-modal-layer">
      <button className="agent-chart-modal-scrim" type="button" aria-label="Close chart" onClick={onClose} />
      <div className="agent-chart-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header><h3>{title}</h3><button type="button" onClick={onClose} aria-label="Close chart"><Icon name="close" size={18} /></button></header>
        <div className="agent-chart-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

type ChartSize = { width: number; height: number; padLeft: number; padRight: number; padTop: number; padBottom: number };
const LINE_SMALL: ChartSize = { width: 300, height: 132, padLeft: 40, padRight: 44, padTop: 10, padBottom: 20 };
const LINE_LARGE: ChartSize = { width: 640, height: 340, padLeft: 64, padRight: 108, padTop: 20, padBottom: 34 };

function RetirementInsight() {
  const projection = useMemo<RetirementProjection>(() => projectRetirementCorpus(), []);
  const series = useMemo(() => projectRetirementSeries(), []);
  return <section className="agent-insight-result">
    <div className="agent-insight-status ok"><Icon name="shield" size={16} />{projection.retirementYear}</div>
    <p>At today&apos;s declared EPF rate of {(projection.rate * 100).toFixed(2)}%, continuing your current ₹{projection.monthlyContribution.toLocaleString("en-IN")}/month contribution to age 58 in {projection.retirementYear} ({projection.yearsRemaining} years away) projects to <strong>{formatRupees(projection.projectedCorpus)}</strong>.</p>
    <ChartCard title="Projected PF balance to retirement" expandLabel="retirement chart" renderLarge={() => <LineChart series={series} size={LINE_LARGE} />}>
      <LineChart series={series} size={LINE_SMALL} />
    </ChartCard>
    <p className="agent-insight-footnote">EPFO resets this rate every year — this is not a guaranteed figure, only a projection at the currently declared rate.</p>
  </section>;
}

function PensionInsight() {
  const projection = useMemo(() => projectPension(), []);
  const { current, ifTransferCompleted } = projection;
  const bars = useMemo(() => [
    { label: "At 50", value: pensionAtAge(50, current.monthlyPension) },
    { label: "At 58", value: current.monthlyPension, highlight: true },
    { label: "At 60", value: pensionAtAge(60, current.monthlyPension) },
  ], [current.monthlyPension]);
  return <section className="agent-insight-result">
    <div className={`agent-insight-status ${current.meetsMinimumService ? "ok" : "warn"}`}><Icon name={current.meetsMinimumService ? "shield" : "bell"} size={16} />{current.meetsMinimumService ? "On track" : "Below 10-year minimum"}</div>
    <p>Projected to age 58 with {current.pensionableServiceYears} years of pensionable service, EPFO&apos;s formula (pensionable salary × service ÷ 70, capped at ₹{current.pensionableSalary.toLocaleString("en-IN")}) estimates <strong>{formatRupees(current.monthlyPension)}/month</strong>.</p>
    {ifTransferCompleted && ifTransferCompleted.monthlyPension !== current.monthlyPension && <p>Completing your pending PF transfer would add that service to your pension record — {formatRupees(ifTransferCompleted.monthlyPension)}/month instead.</p>}
    <ChartCard title="Monthly pension by claiming age" expandLabel="pension chart" renderLarge={() => <SlopeChart points={bars} height={240} />}>
      <SlopeChart points={bars} />
    </ChartCard>
    <p className="agent-insight-footnote">Assumes continuous contribution until retirement and no higher-wage EPS election on record.</p>
  </section>;
}

function LineChart({ series, compareSeries, size = LINE_SMALL }: { series: CorpusPoint[]; compareSeries?: CorpusPoint[]; size?: ChartSize }) {
  const { width, height, padLeft, padRight, padTop, padBottom } = size;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const all = compareSeries ? [...series, ...compareSeries] : series;
  const maxValue = Math.max(...all.map((point) => point.balance));
  const ticks = useMemo(() => niceTicks(0, maxValue, 4), [maxValue]);
  const topValue = ticks[ticks.length - 1] || maxValue || 1;

  const xFor = useCallback((index: number, len: number) => padLeft + (index / Math.max(1, len - 1)) * plotWidth, [padLeft, plotWidth]);
  const yFor = useCallback((value: number) => padTop + plotHeight - (value / topValue) * plotHeight, [padTop, plotHeight, topValue]);
  const pointsFor = useCallback((points: CorpusPoint[]) => points.map((point, index) => `${xFor(index, points.length).toFixed(1)},${yFor(point.balance).toFixed(1)}`).join(" "), [xFor, yFor]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const handleMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (series.length - 1)));
  };

  const xTickCount = Math.min(series.length, width >= 500 ? 8 : 5);
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) => Math.round((i / Math.max(1, xTickCount - 1)) * (series.length - 1)));
  const hovered = hoverIndex !== null ? series[hoverIndex] : null;
  const hoveredCompare = hoverIndex !== null && compareSeries ? compareSeries[hoverIndex] : null;
  const lastIndex = series.length - 1;

  return <div className="agent-chart-svg-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Projected PF balance over time">
      {ticks.map((tick) => <g key={tick} className="agent-chart-tick">
        <line x1={padLeft} x2={width - padRight} y1={yFor(tick)} y2={yFor(tick)} className="agent-chart-grid" />
        <text x={padLeft - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle" className="agent-chart-axis-label">{formatCompactRupees(tick)}</text>
      </g>)}
      <line x1={padLeft} x2={width - padRight} y1={height - padBottom} y2={height - padBottom} className="agent-chart-axis-line" />
      {xTickIndices.map((index) => <text key={index} x={xFor(index, series.length)} y={height - padBottom + 16} textAnchor="middle" className="agent-chart-axis-label">{series[index].year}</text>)}
      {compareSeries && <polyline points={pointsFor(compareSeries)} fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" className="agent-chart-compare-line" />}
      <polyline points={pointsFor(series)} fill="none" stroke="var(--blue)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="agent-chart-line-draw" />
      <text x={xFor(lastIndex, series.length) + 6} y={yFor(series[lastIndex].balance) - 4} className="agent-chart-end-label primary">{formatRupees(series[lastIndex].balance)}</text>
      {compareSeries && <text x={xFor(lastIndex, series.length) + 6} y={yFor(compareSeries[lastIndex].balance) + 12} className="agent-chart-end-label compare">{formatRupees(compareSeries[lastIndex].balance)}</text>}
      {hovered && <g aria-hidden="true">
        <line x1={xFor(hoverIndex!, series.length)} x2={xFor(hoverIndex!, series.length)} y1={padTop} y2={height - padBottom} className="agent-chart-hover-line" />
        <circle cx={xFor(hoverIndex!, series.length)} cy={yFor(hovered.balance)} r="3.5" className="agent-chart-hover-dot primary" />
        {hoveredCompare && <circle cx={xFor(hoverIndex!, series.length)} cy={yFor(hoveredCompare.balance)} r="3.5" className="agent-chart-hover-dot compare" />}
      </g>}
      <rect x={padLeft} y={padTop} width={plotWidth} height={plotHeight} fill="transparent" onPointerMove={handleMove} onPointerLeave={() => setHoverIndex(null)} />
    </svg>
    {hovered && <div className="agent-chart-tooltip" style={{ left: `${(xFor(hoverIndex!, series.length) / width) * 100}%` }}>
      <strong>{hovered.year}</strong>
      <span className="agent-chart-tooltip-primary">{formatRupees(hovered.balance)}</span>
      {hoveredCompare && <span className="agent-chart-tooltip-compare">{formatRupees(hoveredCompare.balance)}</span>}
    </div>}
    {compareSeries && <div className="agent-chart-legend"><span className="a">Without withdrawal</span><span className="b">With withdrawal</span></div>}
  </div>;
}

type SlopePoint = { label: string; value: number; highlight?: boolean };

function SlopeChart({ points, height = 140, formatValue = formatRupees }: { points: SlopePoint[]; height?: number; formatValue?: (value: number) => string }) {
  const width = 300;
  const padTop = 26;
  const padBottom = 22;
  const padSide = 30;
  const plotHeight = height - padTop - padBottom;
  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const xFor = (index: number) => padSide + (index / Math.max(1, points.length - 1)) * (width - padSide * 2);
  const yFor = (value: number) => padTop + plotHeight - ((value - min) / range) * plotHeight;
  const linePoints = points.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`).join(" ");

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return <div className="agent-chart-svg-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Comparison across stages">
      <polyline points={linePoints} fill="none" stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="agent-chart-line-draw" />
      {points.map((point, index) => <g key={point.label} onPointerEnter={() => setHoverIndex(index)} onPointerLeave={() => setHoverIndex(null)} onFocus={() => setHoverIndex(index)} onBlur={() => setHoverIndex(null)} tabIndex={0} className="agent-slope-point">
        <circle cx={xFor(index)} cy={yFor(point.value)} r={point.highlight ? 5 : hoverIndex === index ? 4.5 : 3.5} className={`agent-slope-dot${point.highlight ? " is-highlight" : ""}`} />
        <text x={xFor(index)} y={yFor(point.value) - 12} textAnchor="middle" className="agent-slope-value">{formatValue(point.value)}</text>
        <text x={xFor(index)} y={height - 5} textAnchor="middle" className="agent-chart-axis-label">{point.label}</text>
      </g>)}
    </svg>
  </div>;
}

const CHART_PALETTE = ["#145ea8", "#e97824", "#167a53", "#8891c9", "#3735ad", "#bf3150"];

function formatByUnit(value: number, unit: "currency" | "years"): string {
  return unit === "currency" ? formatRupees(value) : `${value} yr${value === 1 ? "" : "s"}`;
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number, innerR: number): string {
  const point = (angle: number, radius: number): [number, number] => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const [x1, y1] = point(startAngle, r);
  const [x2, y2] = point(endAngle, r);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  if (innerR <= 0) return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  const [ix2, iy2] = point(endAngle, innerR);
  const [ix1, iy1] = point(startAngle, innerR);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
}

type IndexedPoint = DataPoint & { index: number };
type TreemapRect = IndexedPoint & { x: number; y: number; w: number; h: number };

function binaryTreemap(points: IndexedPoint[], x: number, y: number, w: number, h: number, vertical: boolean): TreemapRect[] {
  if (points.length <= 1) return points.map((point) => ({ ...point, x, y, w, h }));
  const total = points.reduce((sum, point) => sum + point.value, 0);
  let running = 0;
  let splitAt = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < points.length; i++) {
    running += points[i - 1].value;
    const diff = Math.abs(running - total / 2);
    if (diff < bestDiff) { bestDiff = diff; splitAt = i; }
  }
  const left = points.slice(0, splitAt);
  const right = points.slice(splitAt);
  const leftFraction = total > 0 ? left.reduce((sum, point) => sum + point.value, 0) / total : 0.5;
  if (vertical) {
    const leftWidth = w * leftFraction;
    return [...binaryTreemap(left, x, y, leftWidth, h, !vertical), ...binaryTreemap(right, x + leftWidth, y, w - leftWidth, h, !vertical)];
  }
  const leftHeight = h * leftFraction;
  return [...binaryTreemap(left, x, y, w, leftHeight, !vertical), ...binaryTreemap(right, x, y + leftHeight, w, h - leftHeight, !vertical)];
}

function GenericChart({ form, points, unit, height = 220 }: { form: ChartForm; points: DataPoint[]; unit: "currency" | "years"; height?: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (form === "treemap") {
    const width = 300;
    const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
    const indexed = points.map((point, index) => ({ ...point, index }));
    const sorted = [...indexed].sort((a, b) => b.value - a.value);
    const rects = binaryTreemap(sorted, 0, 0, width, height, width >= height);
    return <div className="agent-chart-svg-wrap agent-chart-fade-in">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Treemap of ${points.map((point) => point.label).join(", ")}`}>
        {rects.map((rect) => {
          const showLabel = rect.w > 48 && rect.h > 26;
          return <g key={rect.label} className="agent-treemap-cell" tabIndex={0} onPointerEnter={() => setHoverIndex(rect.index)} onPointerLeave={() => setHoverIndex(null)} onFocus={() => setHoverIndex(rect.index)} onBlur={() => setHoverIndex(null)}>
            <rect x={rect.x} y={rect.y} width={Math.max(0, rect.w - 2)} height={Math.max(0, rect.h - 2)} fill={CHART_PALETTE[rect.index % CHART_PALETTE.length]} opacity={hoverIndex === null || hoverIndex === rect.index ? 1 : 0.55} className="agent-treemap-rect" />
            {showLabel && <text x={rect.x + 8} y={rect.y + 16} className="agent-treemap-label">{rect.label}</text>}
            {showLabel && <text x={rect.x + 8} y={rect.y + 30} className="agent-treemap-value">{formatByUnit(rect.value, unit)} · {Math.round((rect.value / total) * 100)}%</text>}
          </g>;
        })}
      </svg>
      <ul className="agent-pie-legend">{indexed.map((point) => <li key={point.label} className={hoverIndex === point.index ? "is-hover" : ""}><i style={{ background: CHART_PALETTE[point.index % CHART_PALETTE.length] }} />{point.label} — {formatByUnit(point.value, unit)} ({Math.round((point.value / total) * 100)}%)</li>)}</ul>
    </div>;
  }

  if (form === "pie" || form === "donut") {
    const width = 300;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - 30;
    const innerR = form === "donut" ? r * 0.55 : 0;
    const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
    const slices = points.reduce<Array<DataPoint & { start: number; end: number; index: number }>>((acc, point, index) => {
      const start = index === 0 ? 0 : acc[index - 1].end;
      const end = start + (point.value / total) * Math.PI * 2;
      return [...acc, { ...point, start, end, index }];
    }, []);
    return <div className="agent-chart-svg-wrap agent-chart-fade-in">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${form === "donut" ? "Donut" : "Pie"} chart of ${points.map((p) => p.label).join(", ")}`}>
        {slices.map((slice) => <path key={slice.label} d={arcPath(cx, cy, hoverIndex === slice.index ? r + 4 : r, slice.start, slice.end, innerR)} fill={CHART_PALETTE[slice.index % CHART_PALETTE.length]} stroke="#fff" strokeWidth="2" className="agent-pie-slice" onPointerEnter={() => setHoverIndex(slice.index)} onPointerLeave={() => setHoverIndex(null)} tabIndex={0} onFocus={() => setHoverIndex(slice.index)} onBlur={() => setHoverIndex(null)} />)}
        {form === "donut" && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="agent-pie-center">{hoverIndex !== null ? formatByUnit(points[hoverIndex].value, unit) : formatByUnit(total, unit)}</text>}
      </svg>
      <ul className="agent-pie-legend">{points.map((point, index) => <li key={point.label} className={hoverIndex === index ? "is-hover" : ""}><i style={{ background: CHART_PALETTE[index % CHART_PALETTE.length] }} />{point.label} — {formatByUnit(point.value, unit)} ({Math.round((point.value / total) * 100)}%)</li>)}</ul>
    </div>;
  }

  if (form === "bar") {
    const max = Math.max(...points.map((point) => point.value), 1);
    return <div className="agent-generic-bars agent-chart-fade-in" style={{ height }}>
      {points.map((point, index) => <div key={point.label} className="agent-bar" onPointerEnter={() => setHoverIndex(index)} onPointerLeave={() => setHoverIndex(null)} tabIndex={0} onFocus={() => setHoverIndex(index)} onBlur={() => setHoverIndex(null)}>
        <span className="agent-bar-value">{formatByUnit(point.value, unit)}</span>
        <div className="agent-bar-track"><div className={`agent-bar-fill${hoverIndex === index ? " is-hover" : ""}`} style={{ height: `${Math.max(4, (point.value / max) * 100)}%`, background: CHART_PALETTE[index % CHART_PALETTE.length] }} /></div>
        <small>{point.label}</small>
      </div>)}
    </div>;
  }

  return <SlopeChart points={points} height={height} formatValue={(value) => formatByUnit(value, unit)} />;
}

function Sparkline({ values, width = 64, height = 18 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} className="agent-sparkline" aria-hidden="true" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - 4) + 2;
    const y = height - 3 - ((value - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const maxIndex = values.indexOf(max);
  const [maxX, maxY] = points.split(" ")[maxIndex].split(",").map(Number);
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="agent-sparkline" role="img" aria-label={`Trend from ${formatRupees(values[0])} to ${formatRupees(values[values.length - 1])}`}>
    <polyline points={points} fill="none" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={maxX} cy={maxY} r="1.8" fill="var(--orange)" />
  </svg>;
}

function SparklineTable({ years }: { years: YearContribution[] }) {
  return <table className="agent-sparkline-table">
    <thead><tr><th>Year</th><th>Trend</th><th>Total</th><th>Avg. YoY</th></tr></thead>
    <tbody>
      {years.map((year) => <tr key={year.year}>
        <td>{year.year}</td>
        <td><Sparkline values={year.monthlyAmounts} /></td>
        <td>{formatRupees(year.total)}</td>
        <td className={year.yoyDeltaPct === null ? "" : year.yoyDeltaPct > 0 ? "up" : year.yoyDeltaPct < 0 ? "down" : ""}>{year.yoyDeltaPct === null ? "—" : `${year.yoyDeltaPct > 0 ? "+" : ""}${year.yoyDeltaPct}%`}</td>
      </tr>)}
    </tbody>
  </table>;
}

function TimelineChart({ segments }: { segments: TimelineSegment[] }) {
  const minYear = Math.min(...segments.map((segment) => segment.startYear));
  const maxYear = Math.max(...segments.map((segment) => segment.endYear));
  const span = Math.max(1, maxYear - minYear);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scrubYear, setScrubYear] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const yearAt = useCallback((clientX: number) => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return minYear + ratio * span;
  }, [minYear, span]);

  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
    setScrubYear(yearAt(event.clientX));
    const onMove = (moveEvent: PointerEvent) => setScrubYear(yearAt(moveEvent.clientX));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [yearAt]);

  const nudge = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") setScrubYear((prev) => Math.max(minYear, (prev ?? minYear) - 1));
    if (event.key === "ArrowRight") setScrubYear((prev) => Math.min(maxYear, (prev ?? minYear) + 1));
  };

  const activeAt = scrubYear !== null ? segments.find((segment) => scrubYear >= segment.startYear && scrubYear <= segment.endYear) : null;
  const scrubLeft = scrubYear !== null ? ((scrubYear - minYear) / span) * 100 : null;

  return <div className="agent-timeline">
    <small className="agent-timeline-hint">Drag the track to see who was active in a given year</small>
    {segments.map((segment) => {
      const left = ((segment.startYear - minYear) / span) * 100;
      const width = Math.max(6, ((segment.endYear - segment.startYear) / span) * 100);
      const isScrubbed = activeAt?.employer === segment.employer;
      return <div key={segment.employer} className="agent-timeline-row">
        <span className="agent-timeline-label">{segment.employer}</span>
        <div className="agent-timeline-track">
          <div className={`agent-timeline-bar status-${segment.status.toLowerCase()}${isScrubbed ? " is-scrubbed" : ""}`} style={{ left: `${left}%`, width: `${width}%` }}>
            <small>{segment.startYear}–{segment.status === "Active" ? "present" : segment.endYear}</small>
          </div>
        </div>
      </div>;
    })}
    <div ref={overlayRef} className="agent-timeline-scrub-overlay" onPointerDown={startDrag} onKeyDown={nudge} role="slider" tabIndex={0} aria-label="Scrub employment timeline by year" aria-valuemin={minYear} aria-valuemax={maxYear} aria-valuenow={scrubYear !== null ? Math.round(scrubYear) : minYear}>
      {scrubLeft !== null && <div className={`agent-timeline-scrubber${dragging ? " is-dragging" : ""}`} style={{ left: `${scrubLeft}%` }}>
        <span>{Math.round(scrubYear!)} · {activeAt ? activeAt.employer : "no employer on record"}</span>
      </div>}
    </div>
    <div className="agent-timeline-axis"><span>{minYear}</span><span>{maxYear}</span></div>
  </div>;
}

type DataSource = "retirement" | "withdrawal" | "pension" | "contributions" | "timeline" | "contribution_split" | "contributions_by_employer";
type ChartForm = "line" | "bar" | "pie" | "donut" | "treemap";
type AgentIntent = { intentType: "claim_eligibility" | "retirement_projection" | "withdrawal_impact" | "pension_estimate" | "contribution_check" | "chart_request" | "unclear"; purpose: string | null; amount: number | null; dataSource: DataSource | null; chartForm: ChartForm | null };
type AskChart =
  | { kind: "line"; series: CorpusPoint[]; compareSeries?: CorpusPoint[] }
  | { kind: "slope"; points: SlopePoint[] }
  | { kind: "sparkline"; years: YearContribution[] }
  | { kind: "timeline"; segments: TimelineSegment[] }
  | { kind: "generic"; form: ChartForm; title: string; points: DataPoint[]; unit: "currency" | "years" };
type AskAnswer = { text: string; chart?: AskChart };

function defaultFormFor(source: DataSource): ChartForm {
  if (source === "retirement") return "line";
  if (source === "contribution_split") return "donut";
  if (source === "contributions_by_employer") return "treemap";
  return "bar";
}

function answerClaimEligibility(eligibility: EligibilityResult[], purpose: string | null, amount: number | null): AskAnswer {
  if (!purpose) return { text: "I couldn't tell which advance purpose you mean — try naming one, like illness, housing, marriage or education." };
  const match = eligibility.find((result) => result.purpose === purpose);
  if (!match) return { text: `${purpose} advances don't have a published minimum-service rule in this preview — check with EPFO directly.` };
  if (!match.eligible) return { text: `${purpose}: not yet — you're eligible from ${match.eligibleFrom}. Cap when eligible: ${match.capNote}.` };
  if (amount && amount > 0) {
    const impact = projectWithdrawalImpact(amount);
    return { text: `${purpose}: you're eligible now (cap: ${match.capNote}). Withdrawing ${formatRupees(amount)} today would reduce your projected retirement corpus by ${formatRupees(impact.lostGrowth)}, from ${formatRupees(impact.corpusWithoutWithdrawal)} to ${formatRupees(impact.corpusWithWithdrawal)}.`, chart: { kind: "line", series: projectRetirementSeries(), compareSeries: projectRetirementSeries(amount) } };
  }
  return { text: `${purpose}: you're eligible now. Cap: ${match.capNote}.` };
}

function answerWithdrawalImpact(amount: number | null): AskAnswer {
  if (!amount || amount <= 0) return { text: "Tell me an amount and I'll show what withdrawing it now costs you at retirement — e.g. \"what does taking out ₹50,000 cost me?\"" };
  const impact = projectWithdrawalImpact(amount);
  return { text: `Withdrawing ${formatRupees(amount)} today would reduce your projected retirement corpus by ${formatRupees(impact.lostGrowth)} — from ${formatRupees(impact.corpusWithoutWithdrawal)} to ${formatRupees(impact.corpusWithWithdrawal)} by ${projectRetirementCorpus().retirementYear}.`, chart: { kind: "line", series: projectRetirementSeries(), compareSeries: projectRetirementSeries(amount) } };
}

function answerRetirementProjection(): AskAnswer {
  const projection = projectRetirementCorpus();
  return { text: `At today's declared EPF rate of ${(projection.rate * 100).toFixed(2)}%, your projected corpus at retirement in ${projection.retirementYear} (${projection.yearsRemaining} years away) is ${formatRupees(projection.projectedCorpus)}. This isn't guaranteed — EPFO resets the rate every year.`, chart: { kind: "line", series: projectRetirementSeries() } };
}

function answerPensionEstimate(): AskAnswer {
  const { current, ifTransferCompleted } = projectPension();
  const base = `Projected monthly EPS pension at 58, with ${current.pensionableServiceYears} years of pensionable service: ${formatRupees(current.monthlyPension)}/month.`;
  const text = ifTransferCompleted && ifTransferCompleted.monthlyPension !== current.monthlyPension
    ? `${base} Completing your pending PF transfer would raise this to ${formatRupees(ifTransferCompleted.monthlyPension)}/month.`
    : base;
  const points: SlopePoint[] = [
    { label: "At 50", value: pensionAtAge(50, current.monthlyPension) },
    { label: "At 58", value: current.monthlyPension, highlight: true },
    { label: "At 60", value: pensionAtAge(60, current.monthlyPension) },
  ];
  return { text, chart: { kind: "slope", points } };
}

function answerContributionHistory(): AskAnswer {
  return { text: "Your recorded monthly PF contribution by financial year, compared as an average-per-month rate so partial years aren't misread as a raise or a cut.", chart: { kind: "sparkline", years: contributionHistory() } };
}

function answerServiceTimeline(): AskAnswer {
  return { text: "Your connected employment record — Techcore transferred, Civic Data Labs still eligible to transfer, Infosys active.", chart: { kind: "timeline", segments: serviceTimeline() } };
}

function answerContributionByEmployer(): AskAnswer {
  const series = buildGenericSeries("contributions_by_employer", null);
  const text = series.note ? `${series.title}. ${series.note}` : `${series.title}.`;
  return { text, chart: { kind: "generic", form: "treemap", title: series.title, points: series.points, unit: series.unit } };
}

type ChartOption = { id: string; label: string; description: string; build: () => AskAnswer };

const CHART_OPTIONS: ChartOption[] = [
  { id: "retirement", label: "Retirement balance projection", description: "Real compounding to age 58 at today's EPF rate.", build: answerRetirementProjection },
  { id: "withdrawal", label: "Withdrawal cost comparison", description: "Illustrative ₹50,000 example — ask with a real amount for your own figure.", build: () => ({ text: "Illustrative example: comparing your projected balance with and without a ₹50,000 withdrawal today. Ask in your own words with a real amount for your own figure.", chart: { kind: "line", series: projectRetirementSeries(), compareSeries: projectRetirementSeries(50000) } }) },
  { id: "pension", label: "Pension by claiming age", description: "Slopegraph across 50, 58 and 60.", build: answerPensionEstimate },
  { id: "contributions", label: "Contribution history", description: "Sparkline table across financial years.", build: answerContributionHistory },
  { id: "timeline", label: "Employment timeline", description: "Connected service record across employers.", build: answerServiceTimeline },
  { id: "contributions_by_employer", label: "Contribution total by employer", description: "Treemap of your recorded PF contribution, summed per employer.", build: answerContributionByEmployer },
];

function answerChartRequest(dataSource: DataSource | null, chartForm: ChartForm | null, amount: number | null): AskAnswer {
  if (!dataSource) return { text: "I can chart your retirement projection, pension by claiming age, contribution history, contribution total by employer, employment timeline, contribution split, or a withdrawal comparison — as a line, bar, pie, donut or treemap. Try naming a data set (and a shape, if you want one), or type /chart to pick from a list." };
  const series = buildGenericSeries(dataSource, amount);
  const form = chartForm ?? defaultFormFor(dataSource);
  const text = series.note ? `${series.title}. ${series.note}` : `${series.title}.`;
  return { text, chart: { kind: "generic", form, title: series.title, points: series.points, unit: series.unit } };
}

function ChartPicker({ onPick }: { onPick: (answer: AskAnswer) => void }) {
  return <div className="agent-chart-picker" aria-label="Chart options">
    <p className="agent-chart-picker-title">Generate a chart</p>
    {CHART_OPTIONS.map((option) => <button key={option.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(option.build())}>
      <strong>{option.label}</strong><small>{option.description}</small>
    </button>)}
  </div>;
}

const SLASH_COMMANDS = [{ command: "/chart", label: "/chart", description: "Generate a specific chart" }];

function SlashCommandMenu({ onPick }: { onPick: (command: string) => void }) {
  return <div className="agent-chart-picker" aria-label="Slash commands">
    <p className="agent-chart-picker-title">Commands</p>
    {SLASH_COMMANDS.map((command) => <button key={command.command} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(command.command)}>
      <strong>{command.label}</strong><small>{command.description}</small>
    </button>)}
  </div>;
}

function AskChartView({ chart }: { chart: AskChart }) {
  if (chart.kind === "line") {
    const { series, compareSeries } = chart;
    return <ChartCard title="Projected PF balance" expandLabel="projection chart" renderLarge={() => <LineChart series={series} compareSeries={compareSeries} size={LINE_LARGE} />}>
      <LineChart series={series} compareSeries={compareSeries} />
    </ChartCard>;
  }
  if (chart.kind === "slope") {
    const { points } = chart;
    return <ChartCard title="Monthly pension by claiming age" expandLabel="pension chart" renderLarge={() => <SlopeChart points={points} height={240} />}>
      <SlopeChart points={points} />
    </ChartCard>;
  }
  if (chart.kind === "sparkline") {
    const { years } = chart;
    return <>
      <SparklineProse years={years} />
      <ChartCard title="Contribution history by financial year" expandLabel="contribution history" renderLarge={() => <SparklineTable years={years} />}>
        <SparklineTable years={years} />
      </ChartCard>
    </>;
  }
  if (chart.kind === "timeline") {
    const { segments } = chart;
    return <ChartCard title="Employment timeline" expandLabel="employment timeline" renderLarge={() => <TimelineChart segments={segments} />}>
      <TimelineChart segments={segments} />
    </ChartCard>;
  }
  const { form, title, points, unit } = chart;
  return <GenericChartCard title={title} points={points} unit={unit} initialForm={form} />;
}

const CHART_FORMS: { id: ChartForm; label: string }[] = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
  { id: "treemap", label: "Treemap" },
];

function GenericChartCard({ title, points, unit, initialForm }: { title: string; points: DataPoint[]; unit: "currency" | "years"; initialForm: ChartForm }) {
  const [form, setForm] = useState(initialForm);
  return <div>
    <div className="agent-chart-toggle" role="tablist" aria-label="Chart shape">
      {CHART_FORMS.map((option) => <button key={option.id} type="button" role="tab" aria-selected={form === option.id} className={form === option.id ? "is-active" : ""} onClick={() => setForm(option.id)}>{option.label}</button>)}
    </div>
    <ChartCard title={title} expandLabel={`${title} chart`} renderLarge={() => <GenericChart key={`${form}-large`} form={form} points={points} unit={unit} height={320} />}>
      <GenericChart key={form} form={form} points={points} unit={unit} />
    </ChartCard>
  </div>;
}

const PRESET_QUESTIONS = [
  "What does withdrawing ₹75,000 for my daughter's wedding cost me at retirement?",
  "Show me a chart of my contribution history.",
  "Will completing my Civic Data Labs transfer change my pension?",
  "Did Infosys pay this month's contribution on time?",
  "Am I eligible for a housing advance yet?",
];

function AskInWords({ eligibility }: { eligibility: EligibilityResult[] }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [focused, setFocused] = useState(false);

  const trimmedLower = text.trim().toLowerCase();
  const isSlash = trimmedLower.startsWith("/");
  const isChartMode = trimmedLower.startsWith("/chart");
  const chartQuery = isChartMode ? text.trim().slice("/chart".length).trim() : "";

  const runQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStatus("loading");
    setAnswer(null);
    try {
      const response = await fetch("/api/agent-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: query }) });
      const body = await response.json();
      if (!response.ok || !body.intent) throw new Error(body.error ?? "failed");
      const { intentType, purpose, amount, dataSource, chartForm } = body.intent as AgentIntent;
      const result: AskAnswer =
        intentType === "claim_eligibility" ? answerClaimEligibility(eligibility, purpose, amount)
        : intentType === "withdrawal_impact" ? answerWithdrawalImpact(amount)
        : intentType === "retirement_projection" ? answerRetirementProjection()
        : intentType === "pension_estimate" ? answerPensionEstimate()
        : intentType === "contribution_check" ? { text: checkContributionHealth().message }
        : intentType === "chart_request" ? answerChartRequest(dataSource, chartForm, amount)
        : { text: "I couldn't tell what you're asking — try asking about a claim purpose, a chart, your retirement projection, your pension estimate, or a contribution." };
      setAnswer(result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [eligibility]);

  const ask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChartMode) {
      if (chartQuery) runQuery(`Generate a chart: ${chartQuery}`);
      return;
    }
    if (isSlash) return;
    runQuery(text);
  };

  const pickPreset = (question: string) => {
    setText(question);
    setFocused(false);
    runQuery(question);
  };

  const pickChart = (built: AskAnswer) => {
    setAnswer(built);
    setText("");
    setStatus("idle");
  };

  const showSuggestions = focused && status !== "loading" && (text.trim().length === 0 || isSlash);

  return <section className="agent-ask">
    <label htmlFor="agent-ask-input"><Icon name="spark" size={14} />Ask in your own words</label>
    <form onSubmit={ask}>
      <div className={`agent-ask-field${status === "loading" ? " is-loading" : ""}`}>
        <input id="agent-ask-input" type="text" value={text} onChange={(event) => setText(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Ask anything, or say 'show me a chart of...'" disabled={status === "loading"} autoFocus autoComplete="off" />
        <button type="submit" className="agent-ask-send" aria-label="Ask" disabled={status === "loading" || !text.trim() || (isSlash && !chartQuery)}>{status === "loading" ? <span className="agent-ask-spinner" aria-hidden="true" /> : <Icon name="arrow" size={15} />}</button>
      </div>
      {showSuggestions && (isChartMode ? <>
        {chartQuery && <p className="agent-chart-picker-hint">Press Enter for a custom chart of &ldquo;{chartQuery}&rdquo;, or pick one below:</p>}
        <ChartPicker onPick={pickChart} />
      </> : isSlash ? <SlashCommandMenu onPick={(command) => setText(`${command} `)} /> : <div className="agent-suggestions" aria-label="Example questions">
        <p className="agent-suggestions-title">Try asking</p>
        {PRESET_QUESTIONS.map((question) => <button key={question} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickPreset(question)}>{question}</button>)}
        <button type="button" className="agent-suggestions-chart" onMouseDown={(event) => event.preventDefault()} onClick={() => setText("/")}><Icon name="spark" size={12} />Type / to see commands</button>
      </div>)}
      {status === "error" && <small className="agent-ask-error">Couldn&apos;t reach the intent service. Confirm OPENAI_API_KEY is set and try again.</small>}
      {answer && <div className="agent-ask-answer">
        <Icon name="spark" size={15} />
        <div>
          <p>{answer.text}</p>
          {answer.chart && <AskChartView chart={answer.chart} />}
        </div>
      </div>}
      <small>Understands requests, custom charts included, with AI — then answers only from EPFO&apos;s rules and your real account data, never the other way around. Type /chart to pick from a list instead.</small>
    </form>
  </section>;
}
