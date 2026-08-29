import { members, passbookTotals } from "./passbook-data";
import { serviceRecords } from "./service-history-data";

const TODAY = new Date("2026-08-28");
const DOB = new Date(1992, 4, 14);
const RETIREMENT_AGE = 58;
const EPF_RATE = 0.0825;
const EPS_DIVISOR = 70;
const PENSIONABLE_SALARY_CAP = 15000;
const MIN_PENSION = 1000;
const SERVICE_BONUS_THRESHOLD_YEARS = 20;
const SERVICE_BONUS_YEARS = 2;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseServiceDate(value: string): Date {
  const [day, month, year] = value.split(" ");
  return new Date(Number(year), MONTHS.indexOf(month), Number(day));
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function retirementDate(): Date {
  const date = new Date(DOB);
  date.setFullYear(date.getFullYear() + RETIREMENT_AGE);
  return date;
}

function currentBalance(): number {
  const account = members.find((member) => member.label.includes("Current"));
  const book = account?.passbooks[account.passbooks.length - 1];
  if (!account || !book) return 0;
  return passbookTotals(book.openingBalance, book.entries).closingBalance;
}

function serviceMonths(record: { joined: string; exited: string; status: string }, upTo: Date): number {
  const from = parseServiceDate(record.joined);
  const to = record.status === "Active" ? upTo : parseServiceDate(record.exited);
  return Math.max(0, monthsBetween(from, to));
}

export type ContributionCheck = { ok: boolean; message: string };

export function checkContributionHealth(): ContributionCheck {
  const account = members.find((member) => member.label.includes("Current"));
  const latestBook = account?.passbooks[account.passbooks.length - 1];
  const credits = latestBook?.entries.filter((entry) => entry.particulars === "PF contribution") ?? [];
  if (!account || !latestBook || credits.length === 0) {
    return { ok: false, message: "No contribution credits are recorded yet for the current financial year." };
  }
  const latest = credits[credits.length - 1];
  return { ok: true, message: `${latest.date} · ₹${latest.amount.toLocaleString("en-IN")} from ${account.label.split(" · ")[0]} is your latest recorded contribution. No missing months in ${latestBook.year}.` };
}

export type EligibilityResult = { purpose: string; eligible: boolean; capNote: string; eligibleFrom?: string };

const ADVANCE_RULES: { purpose: string; minYears: number; capNote: string }[] = [
  { purpose: "Illness", minYears: 0, capNote: "up to 6 months' wages and DA, or your own PF share, whichever is lower" },
  { purpose: "Housing", minYears: 5, capNote: "up to 36 months' wages and DA, or your PF balance, whichever is lower" },
  { purpose: "Marriage", minYears: 7, capNote: "up to 50% of your own PF share, with interest" },
  { purpose: "Education", minYears: 7, capNote: "up to 50% of your own PF share, with interest" },
];

export const UNRATED_PURPOSES = ["Natural calamity", "Electricity cut", "Assistive equipment"];

export function checkAdvanceEligibility(): EligibilityResult[] {
  const active = serviceRecords.find((record) => record.status === "Active");
  const joined = active ? parseServiceDate(active.joined) : TODAY;
  const served = monthsBetween(joined, TODAY);
  return ADVANCE_RULES.map((rule) => {
    const eligible = served >= rule.minYears * 12;
    return { purpose: rule.purpose, eligible, capNote: rule.capNote, eligibleFrom: eligible ? undefined : formatMonthYear(addYears(joined, rule.minYears)) };
  });
}

export type ReadinessItem = { label: string; ready: boolean; detail: string };

export function checkClaimReadiness(): ReadinessItem[] {
  return [
    { label: "Aadhaar", ready: true, detail: "Verified by UIDAI" },
    { label: "PAN", ready: true, detail: "Digitally approved" },
    { label: "Bank account", ready: true, detail: "HDFC Bank •••• 4821 · Verified" },
    { label: "e-Nomination", ready: true, detail: "Registered · Priya Patil, 100%" },
  ];
}

export type TransferLead = { employer: string; id: string } | null;

export function findEligibleTransfer(): TransferLead {
  const record = serviceRecords.find((entry) => entry.status === "Eligible");
  return record ? { employer: record.employer, id: record.id } : null;
}

export type RetirementProjection = { retirementYear: number; yearsRemaining: number; projectedCorpus: number; monthlyContribution: number; rate: number };
export type CorpusPoint = { year: number; balance: number };

function compoundSeries(startBalance: number, monthlyContribution: number, monthsRemaining: number, startYear: number): { points: CorpusPoint[]; final: number } {
  let balance = startBalance;
  const points: CorpusPoint[] = [{ year: startYear, balance: Math.round(balance) }];
  const fullYears = Math.floor(monthsRemaining / 12);
  const remainderMonths = monthsRemaining % 12;
  for (let year = 0; year < fullYears; year += 1) {
    balance = (balance + monthlyContribution * 12) * (1 + EPF_RATE);
    points.push({ year: startYear + year + 1, balance: Math.round(balance) });
  }
  balance += monthlyContribution * remainderMonths;
  if (remainderMonths > 0) points.push({ year: startYear + fullYears + 1, balance: Math.round(balance) });
  return { points, final: balance };
}

function compound(startBalance: number, monthlyContribution: number, monthsRemaining: number): number {
  return compoundSeries(startBalance, monthlyContribution, monthsRemaining, 0).final;
}

export function projectRetirementCorpus(oneTimeWithdrawal = 0): RetirementProjection {
  const retireDate = retirementDate();
  const monthsRemaining = Math.max(0, monthsBetween(TODAY, retireDate));
  const monthlyContribution = 8430;
  const startBalance = Math.max(0, currentBalance() - oneTimeWithdrawal);
  return { retirementYear: retireDate.getFullYear(), yearsRemaining: Math.round((monthsRemaining / 12) * 10) / 10, projectedCorpus: Math.round(compound(startBalance, monthlyContribution, monthsRemaining)), monthlyContribution, rate: EPF_RATE };
}

export function projectRetirementSeries(oneTimeWithdrawal = 0): CorpusPoint[] {
  const retireDate = retirementDate();
  const monthsRemaining = Math.max(0, monthsBetween(TODAY, retireDate));
  const monthlyContribution = 8430;
  const startBalance = Math.max(0, currentBalance() - oneTimeWithdrawal);
  return compoundSeries(startBalance, monthlyContribution, monthsRemaining, TODAY.getFullYear()).points;
}

export type WithdrawalImpact = { withdrawalAmount: number; corpusWithoutWithdrawal: number; corpusWithWithdrawal: number; lostGrowth: number };

export function projectWithdrawalImpact(amount: number): WithdrawalImpact {
  const without = projectRetirementCorpus(0).projectedCorpus;
  const withWithdrawal = projectRetirementCorpus(amount).projectedCorpus;
  return { withdrawalAmount: amount, corpusWithoutWithdrawal: without, corpusWithWithdrawal: withWithdrawal, lostGrowth: without - withWithdrawal };
}

function pensionFromServiceMonths(months: number): number {
  const years = months / 12;
  const bonused = years >= SERVICE_BONUS_THRESHOLD_YEARS ? years + SERVICE_BONUS_YEARS : years;
  return Math.max(MIN_PENSION, Math.round((PENSIONABLE_SALARY_CAP * bonused) / EPS_DIVISOR));
}

export type PensionProjection = { pensionableServiceYears: number; monthlyPension: number; pensionableSalary: number; meetsMinimumService: boolean };

export function projectPension(): { current: PensionProjection; ifTransferCompleted: PensionProjection | null } {
  const retireDate = retirementDate();
  const remainingMonths = Math.max(0, monthsBetween(TODAY, retireDate));
  const transferable = serviceRecords.find((record) => record.status === "Eligible");

  const countedMonths = serviceRecords.filter((record) => record.status !== "Eligible").reduce((total, record) => total + serviceMonths(record, TODAY), 0) + remainingMonths;
  const current: PensionProjection = { pensionableServiceYears: Math.round((countedMonths / 12) * 10) / 10, monthlyPension: pensionFromServiceMonths(countedMonths), pensionableSalary: PENSIONABLE_SALARY_CAP, meetsMinimumService: countedMonths / 12 >= 10 };

  if (!transferable) return { current, ifTransferCompleted: null };
  const transferMonths = serviceMonths(transferable, TODAY);
  const withTransferMonths = countedMonths + transferMonths;
  const ifTransferCompleted: PensionProjection = { pensionableServiceYears: Math.round((withTransferMonths / 12) * 10) / 10, monthlyPension: pensionFromServiceMonths(withTransferMonths), pensionableSalary: PENSIONABLE_SALARY_CAP, meetsMinimumService: withTransferMonths / 12 >= 10 };
  return { current, ifTransferCompleted };
}

export function pensionAtAge(age: number, baseMonthlyPension: number): number {
  if (age === RETIREMENT_AGE) return baseMonthlyPension;
  const yearsOff = Math.abs(RETIREMENT_AGE - age);
  const factor = age < RETIREMENT_AGE ? 1 - 0.04 * yearsOff : 1 + 0.04 * yearsOff;
  return Math.round(baseMonthlyPension * factor);
}

export type YearContribution = { year: string; monthlyAmounts: number[]; total: number; average: number; latest: number; yoyDeltaPct: number | null };

export function contributionHistory(): YearContribution[] {
  const account = members.find((member) => member.label.includes("Current"));
  if (!account) return [];
  const summaries = account.passbooks.map((book) => {
    const monthlyAmounts = book.entries.filter((entry) => entry.particulars === "PF contribution").map((entry) => entry.amount);
    const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    const average = monthlyAmounts.length ? total / monthlyAmounts.length : 0;
    return { year: book.year, monthlyAmounts, total, average, latest: monthlyAmounts[monthlyAmounts.length - 1] ?? 0 };
  });
  // Compares average monthly contribution, not year totals — fiscal years have different counts of recorded months, so a total-vs-total delta would read as a raise/cut that never happened.
  return summaries.map((summary, index) => {
    const prior = summaries[index - 1];
    const yoyDeltaPct = prior && prior.average > 0 ? Math.round(((summary.average - prior.average) / prior.average) * 1000) / 10 : null;
    return { ...summary, yoyDeltaPct };
  });
}

export type TimelineSegment = { employer: string; status: string; startYear: number; endYear: number; durationYears: number };

export function serviceTimeline(): TimelineSegment[] {
  return serviceRecords.map((record) => {
    const start = parseServiceDate(record.joined);
    const end = record.status === "Active" ? TODAY : parseServiceDate(record.exited);
    const durationYears = Math.round((monthsBetween(start, end) / 12) * 10) / 10;
    return { employer: record.employer, status: record.status, startYear: start.getFullYear(), endYear: end.getFullYear(), durationYears };
  });
}

export type DataPoint = { label: string; value: number };

// Matches the split already shown on the member's Home balance card — not a new figure invented for this chart.
export function contributionSplit(): DataPoint[] {
  return [
    { label: "Your contributions", value: 325685 },
    { label: "Employer contributions", value: 126655 },
  ];
}

// Sum of recorded PF contribution credits per employer — distinct from contributionSplit (own vs employer share).
export function contributionByEmployer(): DataPoint[] {
  return members.map((account) => {
    const employer = serviceRecords.find((record) => record.id === account.id)?.employer ?? account.label.split(" · ")[0];
    const total = account.passbooks.reduce((sum, book) => sum + book.entries.filter((entry) => entry.particulars === "PF contribution").reduce((entrySum, entry) => entrySum + entry.amount, 0), 0);
    return { label: employer, value: total };
  });
}

export function employersMissingLedger(): string[] {
  return serviceRecords.filter((record) => !members.some((account) => account.id === record.id)).map((record) => record.employer);
}

function downsample(points: DataPoint[], maxCount: number): DataPoint[] {
  if (points.length <= maxCount) return points;
  const step = (points.length - 1) / (maxCount - 1);
  return Array.from({ length: maxCount }, (_, i) => points[Math.round(i * step)]);
}

export type DataSource = "retirement" | "withdrawal" | "pension" | "contributions" | "timeline" | "contribution_split" | "contributions_by_employer";

export type GenericSeries = { title: string; unit: "currency" | "years"; points: DataPoint[]; note?: string };

export function buildGenericSeries(source: DataSource, amount: number | null, maxPoints = 8): GenericSeries {
  if (source === "retirement") {
    const points = projectRetirementSeries().map((point) => ({ label: String(point.year), value: point.balance }));
    return { title: "Projected PF balance by year", unit: "currency", points: downsample(points, maxPoints) };
  }
  if (source === "withdrawal") {
    const useAmount = amount && amount > 0 ? amount : 50000;
    const impact = projectWithdrawalImpact(useAmount);
    return { title: `Retirement corpus with vs without withdrawing ${useAmount.toLocaleString("en-IN")}`, unit: "currency", points: [{ label: "Without withdrawal", value: impact.corpusWithoutWithdrawal }, { label: "With withdrawal", value: impact.corpusWithWithdrawal }], note: amount && amount > 0 ? undefined : "Illustrative ₹50,000 example — ask with a real amount for your own figure." };
  }
  if (source === "pension") {
    const { current } = projectPension();
    return { title: "Monthly pension by claiming age", unit: "currency", points: [{ label: "At 50", value: pensionAtAge(50, current.monthlyPension) }, { label: "At 58", value: current.monthlyPension }, { label: "At 60", value: pensionAtAge(60, current.monthlyPension) }] };
  }
  if (source === "contributions") {
    const points = contributionHistory().map((year) => ({ label: year.year, value: year.total }));
    return { title: "Total PF contribution by financial year", unit: "currency", points };
  }
  if (source === "timeline") {
    const points = serviceTimeline().map((segment) => ({ label: segment.employer, value: segment.durationYears }));
    return { title: "Years of service by employer", unit: "years", points };
  }
  if (source === "contributions_by_employer") {
    const points = contributionByEmployer();
    const missing = employersMissingLedger();
    return { title: "Total PF contribution by employer", unit: "currency", points, note: missing.length ? `No recorded PF ledger for ${missing.join(", ")} in this preview, so ${missing.length > 1 ? "they aren't" : "it isn't"} included.` : undefined };
  }
  return { title: "PF balance by contributor", unit: "currency", points: contributionSplit() };
}
