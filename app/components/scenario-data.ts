import { checkAdvanceEligibility, projectRetirementCorpus, projectRetirementCorpusWithPause, projectRetirementSeries, projectRetirementSeriesWithPause, projectWithdrawalImpact, type CorpusPoint } from "./agent-data";
import { providerAccounts, rahulProfile, type ProviderConnections } from "./finance-profile-data";

function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export type ScenarioId = "job_loss" | "medical_emergency" | "market_drawdown";

export type ScenarioStat = { label: string; value: string };

export type ScenarioResult = {
  title: string;
  summary: string;
  series: CorpusPoint[] | null;
  compareSeries: CorpusPoint[] | null;
  stats: ScenarioStat[];
  reassurance: string;
};

export function simulateJobLoss(months: number): ScenarioResult {
  const monthlyOutgo = rahulProfile.monthlyPlan.essentialSpend + rahulProfile.monthlyPlan.discretionarySpend;
  const liquidSavings = rahulProfile.monthlyPlan.liquidSavings;
  const totalOutgo = monthlyOutgo * months;
  const shortfall = Math.max(0, totalOutgo - liquidSavings);
  const runwayMonths = Math.round((liquidSavings / monthlyOutgo) * 10) / 10;
  const baseline = projectRetirementCorpus();
  const withPause = projectRetirementCorpusWithPause(months);
  const corpusImpact = baseline.projectedCorpus - withPause.projectedCorpus;
  return {
    title: `${months}-month job loss`,
    summary: shortfall > 0
      ? `Your liquid savings cover ${runwayMonths} of the ${months} months at your regular ${formatRupees(monthlyOutgo)}/month outgo. The remaining ${formatRupees(shortfall)} would need to come from elsewhere. Pausing EPF contributions for ${months} months also lowers your projected retirement corpus by ${formatRupees(corpusImpact)}.`
      : `Your liquid savings alone cover all ${months} months at your regular outgo, with ${formatRupees(liquidSavings - totalOutgo)} left over. Pausing EPF contributions for ${months} months still lowers your projected retirement corpus by ${formatRupees(corpusImpact)}.`,
    series: projectRetirementSeries(),
    compareSeries: projectRetirementSeriesWithPause(months),
    stats: [
      { label: "Savings runway", value: `${runwayMonths} months` },
      { label: "Shortfall beyond savings", value: shortfall > 0 ? formatRupees(shortfall) : "None" },
      { label: "Retirement corpus impact", value: `-${formatRupees(corpusImpact)}` },
    ],
    reassurance: "This models a full pause in EPF contributions only — it doesn't touch your existing balance, which keeps earning interest the whole time.",
  };
}

export function simulateMedicalEmergency(cost: number): ScenarioResult {
  const liquidSavings = rahulProfile.monthlyPlan.liquidSavings;
  const shortfall = Math.max(0, cost - liquidSavings);
  const illnessRule = checkAdvanceEligibility().find((rule) => rule.purpose === "Illness")!;
  const impact = shortfall > 0 ? projectWithdrawalImpact(shortfall) : null;
  return {
    title: `${formatRupees(cost)} medical emergency`,
    summary: shortfall <= 0
      ? `Your liquid savings of ${formatRupees(liquidSavings)} fully cover a ${formatRupees(cost)} medical cost, with ${formatRupees(liquidSavings - cost)} left over. No PF withdrawal needed.`
      : `Your liquid savings cover ${formatRupees(liquidSavings)} of this cost; the remaining ${formatRupees(shortfall)} would need an EPF illness advance. You're eligible now (${illnessRule.capNote}), and withdrawing it would reduce your projected retirement corpus by ${formatRupees(impact!.lostGrowth)}.`,
    series: projectRetirementSeries(),
    compareSeries: impact ? projectRetirementSeries(shortfall) : null,
    stats: [
      { label: "Covered by savings", value: formatRupees(Math.min(cost, liquidSavings)) },
      { label: "EPF advance needed", value: shortfall > 0 ? formatRupees(shortfall) : "None" },
      { label: "Retirement corpus impact", value: impact ? `-${formatRupees(impact.lostGrowth)}` : "None" },
    ],
    reassurance: "Illness advances have no minimum-service requirement under EPFO rules, so this stays available regardless of how long you've been contributing.",
  };
}

export function simulateMarketDrawdown(dropPct: number, connections: ProviderConnections): ScenarioResult | "no_data" {
  const exposed = providerAccounts.filter((account) => connections[account.name]?.value);
  if (exposed.length === 0) return "no_data";
  const before = exposed.reduce((sum, account) => sum + account.value, 0);
  const after = Math.round(before * (1 - dropPct));
  const loss = before - after;
  const pct = Math.round(dropPct * 100);
  return {
    title: `${pct}% market drawdown`,
    summary: `A ${pct}% drop across your connected investments (${exposed.map((account) => account.name).join(", ")}) would take them from ${formatRupees(before)} to ${formatRupees(after)} — a paper loss of ${formatRupees(loss)}.`,
    series: null,
    compareSeries: null,
    stats: [
      { label: "Connected value before", value: formatRupees(before) },
      { label: "Connected value after", value: formatRupees(after) },
      { label: "Paper loss", value: `-${formatRupees(loss)}` },
    ],
    reassurance: "Your EPF is untouched by this — it earns a declared annual rate, not a market-linked return, so a market drawdown has zero direct effect on your retirement corpus.",
  };
}
