"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { buildGenericSeries, checkAdvanceEligibility, checkContributionHealth, contributionHistory, findEligibleTransfer, pensionAtAge, projectPension, projectRetirementCorpus, projectRetirementSeries, projectWithdrawalImpact, serviceTimeline, UNRATED_PURPOSES, type CorpusPoint, type DataPoint, type EligibilityResult, type TimelineSegment, type YearContribution } from "./agent-data";
import { cohortBenchmark, DEFAULT_PROVIDER_SCOPES, percentileForBalance, PROVIDER_SCOPES, providerAccounts, rahulProfile, type ProviderConnections, type ProviderScopeId, type ProviderScopes } from "./finance-profile-data";
import { Icon, type IconName } from "./Icon";
import { totalEpfBalance } from "./passbook-data";
import { simulateJobLoss, simulateMarketDrawdown, simulateMedicalEmergency, type ScenarioId, type ScenarioResult } from "./scenario-data";

type AgentAction = { id: string; title: string; detail: string; impact: "Reversible" | "Irreversible"; icon: IconName; destination: "Claims" | "Account"; tab?: "start" | "status"; section?: string };

type Selection = { kind: "action"; item: AgentAction };
type BackendActivity = { state: "working" | "success" | "error"; message: string };
type ChatTurn = { id: string; question: string; status: "loading" | "done" | "error"; answer: AskAnswer | null };

export function EpfAgent({ onClose, onNavigate }: { onClose: () => void; onNavigate: (item: string, tab?: "start" | "status", claimId?: string, memberId?: string, section?: string) => void }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [permissions, setPermissions] = useState({ epfo: true, cohort: true });
  const [connections, setConnections] = useState<ProviderConnections>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [activity, setActivity] = useState<BackendActivity | null>(null);

  const eligibility = useMemo(() => checkAdvanceEligibility(), []);
  const transferLead = useMemo(() => findEligibleTransfer(), []);

  const actions = useMemo<AgentAction[]>(() => {
    const list: AgentAction[] = [];
    if (transferLead) list.push({ id: "transfer", title: `Prepare a PF transfer — ${transferLead.employer}`, detail: `${transferLead.employer} (${transferLead.id}) is eligible to merge into your current Member ID. This opens Form 13 in Claims; nothing is submitted until you confirm there with Aadhaar authentication.`, impact: "Reversible", icon: "briefcase", destination: "Claims", tab: "start" });
    list.push({ id: "nomination", title: "Review my nomination", detail: "Priya Patil is currently registered as your 100% nominee. This opens Profile so you can review or change it with Aadhaar e-Sign.", impact: "Irreversible", icon: "user", destination: "Account", section: "nomination" });
    return list;
  }, [transferLead]);

  const continueAction = () => {
    if (!selected || selected.kind !== "action") return;
    const { item } = selected;
    onNavigate(item.destination, item.tab, undefined, undefined, item.section);
    onClose();
  };

  const runBackendAction = async (action: "permission" | "connect" | "disconnect" | "scope", target: string, working: string, success: string) => {
    setPendingAction(`${action}:${target}`);
    setActivity({ state: "working", message: working });
    try {
      const response = await fetch("/api/finance-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, target }) });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true) throw new Error("Finance action failed");
      setActivity({ state: "success", message: success });
      return true;
    } catch {
      setActivity({ state: "error", message: "The server couldn’t complete that action. Try again." });
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const updatePermission = async (key: "epfo" | "cohort") => {
    const title = key === "epfo" ? "EPFO access" : "Cohort access";
    const next = !permissions[key];
    if (await runBackendAction("permission", key, `Saving ${title.toLowerCase()}…`, `${title} ${next ? "enabled" : "paused"}.`)) setPermissions((value) => ({ ...value, [key]: next }));
  };

  const toggleProvider = async (provider: string) => {
    const isConnected = provider in connections;
    const action = isConnected ? "disconnect" : "connect";
    if (await runBackendAction(action, provider, `${isConnected ? "Revoking" : "Requesting"} ${provider} access…`, `${provider} ${isConnected ? "disconnected" : "connected — sharing portfolio value only"}.`)) {
      setConnections((current) => {
        if (!isConnected) return { ...current, [provider]: { ...DEFAULT_PROVIDER_SCOPES } };
        const next = { ...current };
        delete next[provider];
        return next;
      });
    }
  };

  const toggleScope = async (provider: string, scope: ProviderScopeId) => {
    const current = connections[provider];
    if (!current) return;
    const next = !current[scope];
    const label = PROVIDER_SCOPES.find((item) => item.id === scope)?.label ?? scope;
    if (await runBackendAction("scope", `${provider}:${scope}`, `${next ? "Sharing" : "Hiding"} ${label.toLowerCase()} with the agent…`, `${provider}: ${label.toLowerCase()} ${next ? "shared" : "hidden"}.`)) {
      setConnections((value) => ({ ...value, [provider]: { ...value[provider]!, [scope]: next } }));
    }
  };

  return <div className="finance-workspace">
    <h1 className="finance-workspace-title">Finance</h1>
    <button type="button" className="finance-account-toggle" onClick={() => setSourcesOpen(true)} aria-label="Account access and eligibility" title="Account access and eligibility"><Icon name="settings" size={16} /></button>
    <div className="finance-workbench">
      <main className="finance-main">
      {selected?.kind === "action" ? <section className="agent-confirm finance-focus-panel">
        <button className="agent-back" type="button" onClick={() => setSelected(null)}>← Back to chat</button>
        <p className="eyebrow">CONFIRM BEFORE CONTINUING</p><span className={`agent-impact ${selected.item.impact.toLowerCase().replace("-", "")}`}>{selected.item.impact}</span>
        <h3>{selected.item.title}</h3><p>{selected.item.detail}</p>
        <dl><div><dt>What will happen</dt><dd>Open the relevant EPFO workspace. Nothing will be submitted.</dd></div><div><dt>Your control</dt><dd>You review each detail and approve the final request separately.</dd></div></dl>
        <button className="primary-button" type="button" onClick={continueAction}>I understand — continue</button>
        <button className="agent-cancel" type="button" onClick={() => setSelected(null)}>Cancel</button>
      </section> : <section className="finance-chat-view">
        <AskInWords eligibility={eligibility} connections={connections} actions={actions} turns={turns} setTurns={setTurns} pendingAction={pendingAction} epfoConnected={permissions.epfo} onToggleEpfo={() => updatePermission("epfo")} cohortEnabled={permissions.cohort} onToggleProvider={toggleProvider} onToggleScope={toggleScope} onOpenAction={(action) => setSelected({ kind: "action", item: action })} />
      </section>}
      </main>
      {sourcesOpen && <><button type="button" className="finance-source-scrim" aria-label="Close account settings" onClick={() => setSourcesOpen(false)} /><aside className="finance-access" role="dialog" aria-modal="true" aria-label="Account access and eligibility">
        <div className="finance-access-head"><div><strong>Account access</strong><small>What the agent can use, and where you stand.</small></div><button type="button" onClick={() => setSourcesOpen(false)} aria-label="Close account settings"><Icon name="close" size={17} /></button></div>
        {activity && <div className={`finance-backend-status is-${activity.state}`} role="status" aria-live="polite"><span aria-hidden="true">{activity.state === "working" ? "" : activity.state === "success" ? "✓" : "!"}</span><div><strong>{activity.state === "working" ? "Working…" : activity.state === "success" ? "Updated" : "Couldn't complete"}</strong><small>{activity.message}</small></div></div>}
        <div className="finance-passbook-sync is-success"><span><Icon name="book" size={17} /></span><div><strong>EPFO passbook</strong><small>{permissions.epfo ? "Connected · last synced 28 Aug 2026" : "Paused — connect it next to the message box"}</small></div></div>
        {permissions.epfo && <section className="finance-eligibility" aria-label="Advance and withdrawal eligibility">
          <h3>Advance &amp; withdrawal eligibility</h3>
          <dl>
            {eligibility.map((result) => <div key={result.purpose}>
              <dt>{result.purpose}<i className={`agent-impact ${result.eligible ? "ok" : ""}`}>{result.eligible ? "Eligible now" : `From ${result.eligibleFrom}`}</i></dt>
              <dd>Advance cap: {result.capNote}.</dd>
            </div>)}
          </dl>
          <p>{UNRATED_PURPOSES.join(", ")} advances don&apos;t have a published minimum-service rule in this preview — check with EPFO directly.</p>
        </section>}
        <PermissionRow title="Anonymous cohort data" detail={pendingAction === "permission:cohort" ? "Saving access preference…" : "Age 32–36 · technology · 7–10 years' service"} checked={permissions.cohort} pending={pendingAction === "permission:cohort"} disabled={pendingAction !== null} onChange={() => updatePermission("cohort")} />
        <p className="finance-access-note">Permissions apply to this workspace only. No provider can see another provider&apos;s data. Connected brokerages and your EPFO passbook live next to the message box, not here.</p>
      </aside></>}
    </div>
    <footer className="finance-footer"><span>Guidance, not financial advice</span><span>Illustrative cohort · EPFO rules apply · Last data sync 28 Aug 2026</span></footer>
  </div>;
}

function PermissionRow({ title, detail, checked, pending, disabled, onChange }: { title: string; detail: string; checked: boolean; pending: boolean; disabled: boolean; onChange: () => void }) {
  return <label className={`finance-permission${pending ? " is-pending" : ""}`} aria-busy={pending}><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} /><i aria-hidden="true">{pending && <span className="finance-button-spinner" />}</i></label>;
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
type AgentIntent = { intentType: "claim_eligibility" | "retirement_projection" | "withdrawal_impact" | "pension_estimate" | "contribution_check" | "chart_request" | "portfolio_snapshot" | "scenario_simulation" | "cohort_comparison" | "unclear"; purpose: string | null; amount: number | null; dataSource: DataSource | null; chartForm: ChartForm | null; provider: "Zerodha" | "Upstox" | "Groww" | null; scenario: ScenarioId | null; months: number | null; dropPct: number | null; includeEpf: boolean; includePortfolio: boolean; includeCohort: boolean };

const EPF_PRIMARY_INTENTS = new Set(["claim_eligibility", "retirement_projection", "withdrawal_impact", "pension_estimate", "contribution_check"]);

function epfContextLine(epfoConnected: boolean): string {
  if (!epfoConnected) return "Your EPFO passbook is paused, so EPF balance isn't available right now.";
  return `Your EPF balance is ${formatRupees(totalEpfBalance())}.`;
}

function portfolioContextLine(connections: ProviderConnections): string | null {
  const connectedNames = PROVIDER_NAMES.filter((name) => connections[name]);
  if (connectedNames.length === 0) return "You haven't connected any brokerage accounts yet.";
  const withValue = connectedNames.filter((name) => connections[name]?.value);
  if (withValue.length === 0) return `You've connected ${connectedNames.join(", ")}, but haven't shared portfolio value with the agent yet.`;
  const total = withValue.reduce((sum, name) => sum + providerAccounts.find((account) => account.name === name)!.value, 0);
  return `Across ${withValue.join(", ")}, your connected investments are worth ${formatRupees(total)}.`;
}

function cohortContextLine(cohortEnabled: boolean): string {
  if (!cohortEnabled) return "Cohort comparison is paused, so peer standing isn't available right now.";
  const percentile = percentileForBalance(totalEpfBalance());
  return `On EPF balance alone, you're ahead of ${percentile}% of a matched cohort.`;
}

function applyCrossDomainContext(answer: AskAnswer, intentType: AgentIntent["intentType"], flags: { includeEpf: boolean; includePortfolio: boolean; includeCohort: boolean }, connections: ProviderConnections, epfoConnected: boolean, cohortEnabled: boolean): AskAnswer {
  const extra: string[] = [];
  if (flags.includeEpf && !EPF_PRIMARY_INTENTS.has(intentType)) extra.push(epfContextLine(epfoConnected));
  if (flags.includePortfolio && intentType !== "portfolio_snapshot") {
    const line = portfolioContextLine(connections);
    if (line) extra.push(line);
  }
  if (flags.includeCohort && intentType !== "cohort_comparison") extra.push(cohortContextLine(cohortEnabled));
  if (extra.length === 0) return answer;
  return { ...answer, text: `${answer.text} ${extra.join(" ")}` };
}

function answerPortfolioSnapshot(provider: "Zerodha" | "Upstox" | "Groww" | null, connections: ProviderConnections): AskAnswer {
  if (provider) return answerMention(provider, connections);
  const epfLine = `Your EPF balance is ${formatRupees(totalEpfBalance())}.`;
  const connectedNames = PROVIDER_NAMES.filter((name) => connections[name]);
  if (connectedNames.length === 0) return { text: `${epfLine} You haven't connected any brokerage accounts yet — use the broker panel next to the message box to link one and compare.` };
  const withValue = connectedNames.filter((name) => connections[name]?.value);
  if (withValue.length === 0) return { text: `${epfLine} You've connected ${connectedNames.join(", ")}, but haven't shared portfolio value with the agent yet. Open the broker panel to choose what it can see.` };
  const total = withValue.reduce((sum, name) => sum + providerAccounts.find((account) => account.name === name)!.value, 0);
  const parts = [epfLine, `Across ${withValue.join(", ")}, your connected investments are worth ${formatRupees(total)}.`];
  const withHoldings = connectedNames.filter((name) => connections[name]?.holdings);
  if (withHoldings.length > 0) {
    const holdingsText = withHoldings.map((name) => {
      const account = providerAccounts.find((item) => item.name === name)!;
      return `${name} holds ${account.holdingsList.map((holding) => holding.instrument).join(", ")}`;
    }).join("; ");
    parts.push(holdingsText + ".");
  }
  const withTransactions = connectedNames.filter((name) => connections[name]?.transactions);
  if (withTransactions.length > 0) {
    const tradesText = withTransactions.map((name) => {
      const account = providerAccounts.find((item) => item.name === name)!;
      const trades = account.recentTrades.map((trade) => `${trade.date}: ${trade.action.toLowerCase()} ${trade.instrument} for ${formatRupees(trade.amount)}`).join("; ");
      return `${name} — ${trades}`;
    }).join(" | ");
    parts.push(`Recent trades: ${tradesText}.`);
  }
  return { text: parts.join(" ") };
}

function scenarioAnswer(result: ScenarioResult): AskAnswer {
  const statsText = result.stats.map((stat) => `${stat.label}: ${stat.value}`).join(" · ");
  return { text: `${result.summary} ${statsText}. ${result.reassurance}`, chart: result.series ? { kind: "line", series: result.series, compareSeries: result.compareSeries ?? undefined } : undefined };
}

function answerCohortComparison(cohortEnabled: boolean): AskAnswer {
  if (!cohortEnabled) return { text: "Cohort comparison is paused. Re-enable anonymous cohort data in Account access to see how you compare to similar EPFO members." };
  const balance = totalEpfBalance();
  const percentile = percentileForBalance(balance);
  const monthlyCredit = rahulProfile.epf.employeeContribution + rahulProfile.epf.employerEpfContribution;
  const contributionLead = Math.round((monthlyCredit / cohortBenchmark.medianMonthlyEpfCredit - 1) * 100);
  return { text: `Your PF balance of ${formatRupees(balance)} is ahead of ${percentile}% of a matched cohort (${cohortBenchmark.methodology}, ${cohortBenchmark.sampleSize.toLocaleString("en-IN")} profiles). Your monthly EPF credit of ${formatRupees(monthlyCredit)} is ${contributionLead >= 0 ? `${contributionLead}% above` : `${Math.abs(contributionLead)}% below`} the cohort median. This benchmark compares EPF balance only — connected brokerage investments aren't included. Illustrative, not EPFO-published data.` };
}

function answerScenarioSimulation(scenario: ScenarioId | null, months: number | null, amount: number | null, dropPct: number | null, connections: ProviderConnections): AskAnswer {
  if (!scenario) return { text: "Tell me which scenario to model — a job loss, a medical emergency, or a market drawdown on your connected investments." };
  if (scenario === "job_loss") return scenarioAnswer(simulateJobLoss(months && months > 0 ? Math.round(months) : 6));
  if (scenario === "medical_emergency") return scenarioAnswer(simulateMedicalEmergency(amount && amount > 0 ? amount : 600000));
  const result = simulateMarketDrawdown(dropPct && dropPct > 0 ? dropPct : 0.3, connections);
  if (result === "no_data") return { text: "You haven't connected any brokerage accounts with shared portfolio value yet — connect one via the broker panel next to the message box to model a market drawdown." };
  return scenarioAnswer(result);
}
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

type ChartOption = { id: string; label: string; description: string; query: string; build: () => AskAnswer };

const CHART_OPTIONS: ChartOption[] = [
  { id: "retirement", label: "Retirement balance projection", description: "Real compounding to age 58 at today's EPF rate.", query: "Show me a line chart of my projected PF balance to retirement.", build: answerRetirementProjection },
  { id: "withdrawal", label: "Withdrawal cost comparison", description: "Illustrative ₹50,000 example — ask with a real amount for your own figure.", query: "Show me a chart comparing my retirement corpus with and without withdrawing ₹50,000 today.", build: () => ({ text: "Illustrative example: comparing your projected balance with and without a ₹50,000 withdrawal today. Ask in your own words with a real amount for your own figure.", chart: { kind: "line", series: projectRetirementSeries(), compareSeries: projectRetirementSeries(50000) } }) },
  { id: "pension", label: "Pension by claiming age", description: "Slopegraph across 50, 58 and 60.", query: "Show me a chart of my monthly pension by claiming age.", build: answerPensionEstimate },
  { id: "contributions", label: "Contribution history", description: "Sparkline table across financial years.", query: "Show me my contribution history by financial year.", build: answerContributionHistory },
  { id: "timeline", label: "Employment timeline", description: "Connected service record across employers.", query: "Show me my employment timeline across employers.", build: answerServiceTimeline },
  { id: "contributions_by_employer", label: "Contribution total by employer", description: "Treemap of your recorded PF contribution, summed per employer.", query: "Show me a treemap of my total PF contribution by employer.", build: answerContributionByEmployer },
];

function answerChartRequest(dataSource: DataSource | null, chartForm: ChartForm | null, amount: number | null): AskAnswer {
  if (!dataSource) return { text: "I can chart your retirement projection, pension by claiming age, contribution history, contribution total by employer, employment timeline, contribution split, or a withdrawal comparison — as a line, bar, pie, donut or treemap. Try naming a data set (and a shape, if you want one), or type /chart to pick from a list." };
  const series = buildGenericSeries(dataSource, amount);
  const form = chartForm ?? defaultFormFor(dataSource);
  const text = series.note ? `${series.title}. ${series.note}` : `${series.title}.`;
  return { text, chart: { kind: "generic", form, title: series.title, points: series.points, unit: series.unit } };
}

function ChartPicker({ onPick }: { onPick: (query: string) => void }) {
  return <div className="agent-chart-picker" aria-label="Chart options">
    <p className="agent-chart-picker-title">Generate a chart</p>
    {CHART_OPTIONS.map((option) => <button key={option.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(option.query)}>
      <strong>{option.label}</strong><small>{option.description}</small>
    </button>)}
  </div>;
}

const SLASH_COMMANDS = [
  { command: "/chart", label: "/chart", description: "Generate a specific chart" },
];

function SlashCommandMenu({ onPick }: { onPick: (command: string) => void }) {
  return <div className="agent-chart-picker" aria-label="Slash commands">
    <p className="agent-chart-picker-title">Commands</p>
    {SLASH_COMMANDS.map((command) => <button key={command.command} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(command.command)}>
      <strong>{command.label}</strong><small>{command.description}</small>
    </button>)}
  </div>;
}

const PROVIDER_NAMES = providerAccounts.map((provider) => provider.name);

function ConnectorDock({ connections, pendingAction, onToggleProvider, onToggleScope, epfoConnected, onToggleEpfo, open, onToggleOpen, onClose }: { connections: ProviderConnections; pendingAction: string | null; onToggleProvider: (provider: string) => void; onToggleScope: (provider: string, scope: ProviderScopeId) => void; epfoConnected: boolean; onToggleEpfo: () => void; open: boolean; onToggleOpen: () => void; onClose: () => void }) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const connectedCount = PROVIDER_NAMES.filter((name) => connections[name]).length + (epfoConnected ? 1 : 0);
  return <div className="connector-dock-wrap">
    <button type="button" className={`connector-toggle${connectedCount ? " is-connected" : ""}`} aria-expanded={open} aria-label="Connected finance accounts" title="Connected finance accounts" onClick={onToggleOpen}>
      <Icon name="building" size={16} />
      {connectedCount > 0 && <span className="connector-toggle-badge">{connectedCount}</span>}
    </button>
    {open && <div className="connector-popover">
      <div className="connector-popover-head">
        <p className="connector-popover-title">Broker panel</p>
        <button type="button" className="connector-popover-close" aria-label="Close" onClick={onClose}><Icon name="close" size={13} /></button>
      </div>
      <label className={`finance-scope connector-epfo-toggle${pendingAction === "permission:epfo" ? " is-pending" : ""}`}>
        <span><strong>EPFO Passbook</strong><small>{epfoConnected ? "Connected · balance, claims, service history" : "Paused — chat answers are limited"}</small></span>
        <input type="checkbox" checked={epfoConnected} disabled={pendingAction !== null} onChange={onToggleEpfo} />
        <i aria-hidden="true">{pendingAction === "permission:epfo" && <span className="finance-button-spinner" />}</i>
      </label>
      {PROVIDER_NAMES.map((name) => {
        const isExpanded = expandedProvider === name;
        return <div key={name} className="connector-provider-row">
          <button type="button" className="connector-provider-toggle" aria-expanded={isExpanded} onClick={() => setExpandedProvider((current) => (current === name ? null : name))}>
            <span className={`connector-dot${connections[name] ? " is-connected" : ""}`} aria-hidden="true">{name[0]}</span>
            <span className="connector-provider-name">{name}</span>
            <Icon name="chevron" size={13} />
          </button>
          <div className={`connector-provider-detail${isExpanded ? " is-open" : ""}`}>
            <div><ProviderConnector provider={name} scopes={connections[name]} pendingAction={pendingAction} onToggleProvider={onToggleProvider} onToggleScope={onToggleScope} /></div>
          </div>
        </div>;
      })}
    </div>}
  </div>;
}

function ProviderConnector({ provider, scopes, pendingAction, onToggleProvider, onToggleScope }: { provider: string; scopes: ProviderScopes | undefined; pendingAction: string | null; onToggleProvider: (provider: string) => void; onToggleScope: (provider: string, scope: ProviderScopeId) => void }) {
  const account = providerAccounts.find((item) => item.name === provider)!;
  const isConnected = !!scopes;
  const isProviderPending = pendingAction === `connect:${provider}` || pendingAction === `disconnect:${provider}`;
  const grantedLabels = scopes ? PROVIDER_SCOPES.filter((scope) => scopes[scope.id]).map((scope) => scope.label.toLowerCase()) : [];
  return <div className={`finance-provider${isConnected ? " is-connected" : ""}`}>
    <div className="finance-provider-row">
      <div><small>{isProviderPending ? (isConnected ? "Disconnecting…" : "Requesting authorization…") : isConnected ? account.account : "Stocks & mutual funds · read-only"}</small></div>
      <button type="button" className={isConnected ? "is-connected" : ""} onClick={() => onToggleProvider(provider)} disabled={pendingAction !== null}>{isProviderPending ? <><span className="finance-button-spinner" aria-hidden="true" />{isConnected ? "Disconnecting…" : "Connecting…"}</> : isConnected ? "Disconnect" : "Connect"}</button>
    </div>
    {scopes && <div className="finance-provider-scopes">
      <p className="finance-provider-seen">{grantedLabels.length ? `Agent can currently see: ${grantedLabels.join(", ")}` : "Agent can't see any data from this connector yet"}</p>
      {PROVIDER_SCOPES.map((scope) => {
        const isScopePending = pendingAction === `scope:${provider}:${scope.id}`;
        return <label key={scope.id} className={`finance-scope${isScopePending ? " is-pending" : ""}`}>
          <span><strong>{scope.label}</strong><small>{scope.detail}</small></span>
          <input type="checkbox" checked={scopes[scope.id]} disabled={pendingAction !== null} onChange={() => onToggleScope(provider, scope.id)} />
          <i aria-hidden="true">{isScopePending && <span className="finance-button-spinner" />}</i>
        </label>;
      })}
      {scopes.holdings && <>
        <small className="finance-provider-mix">{account.mix} · gain {formatCompactRupees(account.value - account.invested)}</small>
        <ul className="finance-provider-holdings">{account.holdingsList.map((holding) => <li key={holding.instrument}><span>{holding.instrument}</span><b>{formatCompactRupees(holding.value)}</b></li>)}</ul>
      </>}
      {scopes.transactions && <ul className="finance-provider-trades">{account.recentTrades.map((trade) => <li key={`${trade.date}-${trade.instrument}`}><span>{trade.date}</span><span>{trade.action} {trade.instrument}</span><b>{formatCompactRupees(trade.amount)}</b></li>)}</ul>}
    </div>}
  </div>;
}

type MentionSource = "epfo" | "Zerodha" | "Upstox" | "Groww";

const MENTIONABLE: { id: MentionSource; label: string; hint: string }[] = [
  { id: "epfo", label: "@epfo", hint: "Your EPF balance and latest contribution" },
  { id: "Zerodha", label: "@zerodha", hint: "What you've shared with the agent" },
  { id: "Upstox", label: "@upstox", hint: "What you've shared with the agent" },
  { id: "Groww", label: "@groww", hint: "What you've shared with the agent" },
];

function MentionMenu({ connections, onPick }: { connections: ProviderConnections; onPick: (source: MentionSource) => void }) {
  return <div className="agent-chart-picker" aria-label="Ask about a connected source">
    <p className="agent-chart-picker-title">Ask about a source</p>
    {MENTIONABLE.map((item) => {
      const isAvailable = item.id === "epfo" || !!connections[item.id];
      return <button key={item.id} type="button" disabled={!isAvailable} onMouseDown={(event) => event.preventDefault()} onClick={() => isAvailable && onPick(item.id)}>
        <strong>{item.label}</strong><small>{isAvailable ? item.hint : "Not connected — open the broker panel to connect"}</small>
      </button>;
    })}
  </div>;
}

function answerMention(source: MentionSource, connections: ProviderConnections): AskAnswer {
  if (source === "epfo") return { text: checkContributionHealth().message };
  const scopes = connections[source];
  if (!scopes) return { text: `${source} isn't connected yet. Open the broker panel next to the message box to connect it.` };
  const account = providerAccounts.find((provider) => provider.name === source)!;
  const parts: string[] = [];
  if (scopes.value) parts.push(`total value ${formatRupees(account.value)}`);
  if (scopes.holdings) parts.push(`holds ${account.holdingsList.map((holding) => holding.instrument).join(", ")} (${account.mix})`);
  if (parts.length === 0) return { text: `${source} is connected, but you haven't shared any data with the agent yet. Open the broker panel next to the message box to choose what it can see.` };
  const text = `${source}: ${parts.join(" · ")}.`;
  if (!scopes.transactions) return { text };
  const tradesText = account.recentTrades.map((trade) => `${trade.date}: ${trade.action.toLowerCase()} ${trade.instrument} for ${formatRupees(trade.amount)}`).join("; ");
  return { text: `${text} Recent trades — ${tradesText}.` };
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
  "What if I lost my job for 6 months?",
  "How do I compare to similar EPFO members?",
];

const PROVIDER_PRESET_QUESTIONS: Record<string, string> = {
  Zerodha: "What's my Zerodha portfolio worth?",
  Upstox: "What mutual funds do I hold on Upstox?",
  Groww: "What was my last trade on Groww?",
};

function AskInWords({ eligibility, connections, actions, turns, setTurns, pendingAction, epfoConnected, onToggleEpfo, cohortEnabled, onToggleProvider, onToggleScope, onOpenAction }: { eligibility: EligibilityResult[]; connections: ProviderConnections; actions: AgentAction[]; turns: ChatTurn[]; setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>; pendingAction: string | null; epfoConnected: boolean; onToggleEpfo: () => void; cohortEnabled: boolean; onToggleProvider: (provider: string) => void; onToggleScope: (provider: string, scope: ProviderScopeId) => void; onOpenAction: (action: AgentAction) => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [focused, setFocused] = useState(false);
  const [connectorOpen, setConnectorOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const trimmedLower = text.trim().toLowerCase();
  const isSlash = trimmedLower.startsWith("/");
  const isChartMode = trimmedLower.startsWith("/chart");
  const isMention = trimmedLower.startsWith("@");
  const chartQuery = isChartMode ? text.trim().slice("/chart".length).trim() : "";
  const mentionMatch = isMention ? MENTIONABLE.find((item) => trimmedLower === item.label || trimmedLower.startsWith(`${item.label} `)) : undefined;

  const pushInstant = useCallback((question: string, answer: AskAnswer) => {
    setTurns((current) => [...current, { id: crypto.randomUUID(), question, status: "done", answer }]);
  }, [setTurns]);

  const askAndPush = useCallback(async (question: string, compute: () => Promise<AskAnswer>) => {
    const id = crypto.randomUUID();
    setStatus("loading");
    setTurns((current) => [...current, { id, question, status: "loading", answer: null }]);
    try {
      const answer = await compute();
      setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, status: "done", answer } : turn)));
      setStatus("idle");
    } catch {
      setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, status: "error", answer: null } : turn)));
      setStatus("error");
    }
  }, [setTurns]);

  const runQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    askAndPush(query, async () => {
      const response = await fetch("/api/agent-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: query }) });
      const body = await response.json();
      if (!response.ok || !body.intent) throw new Error(body.error ?? "failed");
      const { intentType, purpose, amount, dataSource, chartForm, provider, scenario, months, dropPct, includeEpf, includePortfolio, includeCohort } = body.intent as AgentIntent;
      const primary = intentType === "claim_eligibility" ? answerClaimEligibility(eligibility, purpose, amount)
        : intentType === "withdrawal_impact" ? answerWithdrawalImpact(amount)
        : intentType === "retirement_projection" ? answerRetirementProjection()
        : intentType === "pension_estimate" ? answerPensionEstimate()
        : intentType === "contribution_check" ? { text: checkContributionHealth().message }
        : intentType === "chart_request" ? answerChartRequest(dataSource, chartForm, amount)
        : intentType === "portfolio_snapshot" ? answerPortfolioSnapshot(provider, connections)
        : intentType === "scenario_simulation" ? answerScenarioSimulation(scenario, months, amount, dropPct, connections)
        : intentType === "cohort_comparison" ? answerCohortComparison(cohortEnabled)
        : { text: "I couldn't tell what you're asking — try asking about a claim purpose, a chart, your retirement projection, your pension estimate, a contribution, a life-event scenario, how you compare to your cohort, or a connected investment." };
      return applyCrossDomainContext(primary, intentType, { includeEpf, includePortfolio, includeCohort }, connections, epfoConnected, cohortEnabled);
    });
  }, [eligibility, connections, cohortEnabled, epfoConnected, askAndPush]);

  const pickMention = useCallback((source: MentionSource) => {
    const label = MENTIONABLE.find((item) => item.id === source)?.label ?? `@${source}`;
    setText("");
    setFocused(false);
    pushInstant(label, answerMention(source, connections));
  }, [connections, pushInstant]);

  const ask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChartMode) {
      if (chartQuery) { runQuery(`Generate a chart: ${chartQuery}`); setText(""); }
      return;
    }
    if (isMention) {
      if (mentionMatch) pickMention(mentionMatch.id);
      return;
    }
    if (isSlash) return;
    // An unedited pick from the /chart list answers instantly from real computed data; edit even one word and it falls through to the AI classifier instead.
    const matchedOption = CHART_OPTIONS.find((option) => option.query === text.trim());
    if (matchedOption) {
      pushInstant(text.trim(), matchedOption.build());
      setText("");
      return;
    }
    const question = text;
    setText("");
    runQuery(question);
  };

  const pickPreset = (question: string) => {
    setFocused(false);
    runQuery(question);
  };

  const pickChart = (query: string) => {
    setText(query);
  };

  const presetQuestions = useMemo(() => [...PRESET_QUESTIONS, ...PROVIDER_NAMES.filter((name) => connections[name]).map((name) => PROVIDER_PRESET_QUESTIONS[name])], [connections]);

  const canSubmit = isChartMode ? !!chartQuery
    : isMention ? !!mentionMatch
    : isSlash ? false
    : text.trim().length > 0;

  const showSuggestions = focused && status !== "loading" && (isSlash || isMention);

  return <section className="agent-ask">
    <div className="agent-chat-thread" ref={threadRef}>
      {!epfoConnected && <div className="agent-chat-notice"><Icon name="shield" size={14} />EPFO passbook is paused — reconnect it below to resume account questions.</div>}
      {turns.length === 0 ? <div className="agent-chat-empty">
        <Icon name="spark" size={22} /><p>Ask about your PF balance, a claim, a projection, or a connected investment.</p>
        {actions.length > 0 && <div className="agent-chat-empty-actions">{actions.map((action) => <button key={action.id} type="button" className="agent-suggestions-action" onClick={() => onOpenAction(action)}><Icon name={action.icon} size={13} />{action.title}</button>)}</div>}
        <div className="agent-chat-empty-chips">{presetQuestions.map((question) => <button key={question} type="button" onClick={() => pickPreset(question)}>{question}</button>)}</div>
      </div> : turns.map((turn) => <div key={turn.id} className="agent-chat-turn">
        <div className="agent-chat-question">{turn.question}</div>
        {turn.status === "loading" ? <div className="agent-ask-answer is-loading"><span className="agent-ask-spinner" aria-hidden="true" /><div><p>Thinking…</p></div></div>
        : turn.status === "error" ? <div className="agent-ask-answer is-error"><Icon name="bell" size={15} /><div><p>Couldn&apos;t reach the intent service. Confirm OPENAI_API_KEY is set and try again.</p></div></div>
        : turn.answer && <div className="agent-ask-answer"><Icon name="spark" size={15} /><div><p>{turn.answer.text}</p>{turn.answer.chart && <AskChartView chart={turn.answer.chart} />}</div></div>}
      </div>)}
    </div>
    <form onSubmit={ask}>
      <div className="agent-ask-toolbar">
        <label htmlFor="agent-ask-input"><Icon name="spark" size={14} />Message your finance agent</label>
      </div>
      <div className={`agent-ask-field${status === "loading" ? " is-loading" : ""}`}>
        <input ref={inputRef} id="agent-ask-input" type="text" value={text} onChange={(event) => setText(event.target.value)} onFocus={() => { setFocused(true); setConnectorOpen(false); }} onBlur={() => setFocused(false)} placeholder="Ask anything, or type / or @ for commands" disabled={status === "loading"} autoComplete="off" />
        <button type="submit" className="agent-ask-send" aria-label="Ask" disabled={status === "loading" || !canSubmit}>{status === "loading" ? <span className="agent-ask-spinner" aria-hidden="true" /> : <Icon name="arrow" size={15} />}</button>
      </div>
      <div className="agent-ask-footer">
        <ConnectorDock connections={connections} pendingAction={pendingAction} onToggleProvider={onToggleProvider} onToggleScope={onToggleScope} epfoConnected={epfoConnected} onToggleEpfo={onToggleEpfo} open={connectorOpen} onToggleOpen={() => { setConnectorOpen((value) => !value); setFocused(false); }} onClose={() => setConnectorOpen(false)} />
      </div>
      {showSuggestions && (isChartMode ? <>
        {chartQuery && <p className="agent-chart-picker-hint">Press Enter for a custom chart of &ldquo;{chartQuery}&rdquo;, or pick one below:</p>}
        <ChartPicker onPick={pickChart} />
      </> : isMention ? <MentionMenu connections={connections} onPick={pickMention} />
      : <SlashCommandMenu onPick={(command) => setText(`${command} `)} />)}
      <small>Answers from permitted sources. Type / for commands, @ to ask about a connected source.</small>
    </form>
  </section>;
}
