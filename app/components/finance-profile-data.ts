export const rahulProfile = {
  asOf: "28 Aug 2026",
  person: {
    name: "Rahul Patil",
    dateOfBirth: "14 May 1992",
    age: 34,
    city: "Bengaluru",
    occupation: "Senior Product Manager",
    household: "Married · one dependent",
  },
  employment: {
    employer: "Infosys Limited",
    joined: "3 Nov 2025",
    annualGrossPay: 2480000,
    monthlyTakeHome: 152000,
    monthlyBasicPay: 70250,
  },
  monthlyPlan: {
    essentialSpend: 72000,
    discretionarySpend: 17000,
    investibleSurplus: 63000,
    liquidSavings: 420000,
    emergencyFundMonths: 4.7,
  },
  epf: {
    employeeContribution: 8430,
    employerEpfContribution: 7180,
    employerEpsContribution: 1250,
    annualContributionGrowth: 0.06,
    interestRate: 0.0825,
  },
  retirement: {
    age: 58,
    year: 2050,
    targetCorpus: 50000000,
  },
} as const;

export const cohortBenchmark = {
  label: "Matched synthetic cohort",
  methodology: "Age 32–36 · salaried technology roles · 7–10 years of EPF-linked service",
  sampleSize: 3842,
  balancePercentiles: [
    { percentile: 25, value: 320000 },
    { percentile: 50, value: 610000 },
    { percentile: 75, value: 920000 },
    { percentile: 90, value: 1480000 },
  ],
  medianMonthlyEpfCredit: 11400,
  medianContributionContinuity: 91,
  medianServiceYears: 7.4,
} as const;

export function percentileForBalance(balance: number) {
  const points = [{ percentile: 0, value: 0 }, ...cohortBenchmark.balancePercentiles, { percentile: 100, value: 2300000 }];
  const upperIndex = points.findIndex((point) => balance <= point.value);
  if (upperIndex <= 0) return balance > points.at(-1)!.value ? 100 : 0;
  const lower = points[upperIndex - 1];
  const upper = points[upperIndex];
  return Math.round(lower.percentile + ((balance - lower.value) / (upper.value - lower.value)) * (upper.percentile - lower.percentile));
}

export type ProviderAccount = {
  name: "Zerodha" | "Upstox" | "Groww";
  value: number;
  invested: number;
  holdings: number;
  mix: string;
  account: string;
};

export const providerAccounts: ProviderAccount[] = [
  { name: "Zerodha", value: 761450, invested: 642550, holdings: 14, mix: "₹3.43L equity · ₹4.19L mutual funds", account: "Kite ••K218" },
  { name: "Upstox", value: 228740, invested: 207410, holdings: 7, mix: "₹96k equity · ₹1.33L mutual funds", account: "UCC ••7741" },
  { name: "Groww", value: 537460, invested: 469240, holdings: 9, mix: "₹5.03L mutual funds · ₹35k gold ETF", account: "Demat ••9046" },
];
