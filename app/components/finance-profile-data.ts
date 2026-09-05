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

export type ProviderTrade = { date: string; action: "Buy" | "Sell"; instrument: string; amount: number };

export type Holding = { instrument: string; category: "Equity" | "Mutual Fund" | "Gold ETF"; value: number };

export type ProviderAccount = {
  name: "Zerodha" | "Upstox" | "Groww";
  value: number;
  invested: number;
  holdings: number;
  mix: string;
  account: string;
  holdingsList: Holding[];
  recentTrades: ProviderTrade[];
};

// Every account's holdingsList sums exactly to its value, and every trade references an instrument actually held — kept internally consistent so the agent never has to reconcile mismatched numbers.
export const providerAccounts: ProviderAccount[] = [
  { name: "Zerodha", value: 761450, invested: 642550, holdings: 6, mix: "₹3.43L equity · ₹4.19L mutual funds", account: "Kite ••K218",
    holdingsList: [
      { instrument: "Reliance Industries", category: "Equity", value: 120000 },
      { instrument: "HDFC Bank", category: "Equity", value: 85000 },
      { instrument: "Tata Consultancy Services", category: "Equity", value: 70000 },
      { instrument: "Infosys", category: "Equity", value: 67450 },
      { instrument: "Parag Parikh Flexi Cap Fund", category: "Mutual Fund", value: 239000 },
      { instrument: "Nifty 50 Index Fund", category: "Mutual Fund", value: 180000 },
    ],
    recentTrades: [
      { date: "22 Aug 2026", action: "Buy", instrument: "Nifty 50 Index Fund", amount: 15000 },
      { date: "5 Aug 2026", action: "Sell", instrument: "HDFC Bank", amount: 8200 },
      { date: "28 Jul 2026", action: "Buy", instrument: "Parag Parikh Flexi Cap Fund", amount: 12000 },
      { date: "10 Jul 2026", action: "Buy", instrument: "Reliance Industries", amount: 20000 },
    ] },
  { name: "Upstox", value: 228740, invested: 207410, holdings: 4, mix: "₹96k equity · ₹1.33L mutual funds", account: "UCC ••7741",
    holdingsList: [
      { instrument: "ICICI Bank", category: "Equity", value: 51000 },
      { instrument: "State Bank of India", category: "Equity", value: 44740 },
      { instrument: "ICICI Prudential Bluechip Fund", category: "Mutual Fund", value: 70000 },
      { instrument: "Mirae Asset Large Cap Fund", category: "Mutual Fund", value: 63000 },
    ],
    recentTrades: [
      { date: "18 Aug 2026", action: "Buy", instrument: "ICICI Prudential Bluechip Fund", amount: 6000 },
      { date: "2 Aug 2026", action: "Buy", instrument: "State Bank of India", amount: 12000 },
      { date: "25 Jul 2026", action: "Buy", instrument: "Mirae Asset Large Cap Fund", amount: 8000 },
    ] },
  { name: "Groww", value: 537460, invested: 469240, holdings: 4, mix: "₹5.03L mutual funds · ₹35k gold ETF", account: "Demat ••9046",
    holdingsList: [
      { instrument: "Quant Small Cap Fund", category: "Mutual Fund", value: 210000 },
      { instrument: "SBI Bluechip Fund", category: "Mutual Fund", value: 189460 },
      { instrument: "Mirae Asset Emerging Bluechip Fund", category: "Mutual Fund", value: 103000 },
      { instrument: "Nippon India Gold ETF", category: "Gold ETF", value: 35000 },
    ],
    recentTrades: [
      { date: "20 Aug 2026", action: "Buy", instrument: "Nippon India Gold ETF", amount: 5000 },
      { date: "1 Aug 2026", action: "Buy", instrument: "SBI Bluechip Fund", amount: 10000 },
      { date: "15 Jul 2026", action: "Buy", instrument: "Quant Small Cap Fund", amount: 15000 },
      { date: "28 Jun 2026", action: "Buy", instrument: "Mirae Asset Emerging Bluechip Fund", amount: 8000 },
    ] },
];

export type ProviderScopeId = "value" | "holdings" | "transactions";

export const PROVIDER_SCOPES: { id: ProviderScopeId; label: string; detail: string }[] = [
  { id: "value", label: "Portfolio value", detail: "Total value and overall gain" },
  { id: "holdings", label: "Holdings & allocation", detail: "Instrument mix across equity, funds and gold" },
  { id: "transactions", label: "Recent transactions", detail: "Your last few buy/sell trades" },
];

export type ProviderScopes = Record<ProviderScopeId, boolean>;

// New connections start with only the minimum scope granted — everything else is an explicit, separate opt-in.
export const DEFAULT_PROVIDER_SCOPES: ProviderScopes = { value: true, holdings: false, transactions: false };

export type ProviderConnections = Partial<Record<string, ProviderScopes>>;
