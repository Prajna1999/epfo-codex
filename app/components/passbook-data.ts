export type PassbookEntry = {
  date: string;
  particulars: string;
  category: "contribution" | "interest" | "transfer" | "claim";
  type: "credit" | "debit";
  amount: number;
  employeeShare?: number;
  employerShare?: number;
  pensionShare?: number;
  reference?: string;
};

export type PassbookMember = {
  id: string;
  label: string;
  status: "active" | "transferable" | "transferred";
  passbooks: { year: string; openingBalance: number; entries: PassbookEntry[] }[];
};

function contributions(months: readonly string[], employeeShare: number, employerShare: number, pensionShare = 1250): PassbookEntry[] {
  return months.map((month) => ({
    date: `18 ${month}`,
    particulars: `Contribution for ${month}`,
    category: "contribution",
    type: "credit",
    amount: employeeShare + employerShare,
    employeeShare,
    employerShare,
    pensionShare,
    reference: `ECR-${month.replace(" ", "-").toUpperCase()}`,
  }));
}

export const members: PassbookMember[] = [
  {
    id: "MHBAN1318576000010404",
    label: "Infosys Limited · Current",
    status: "active",
    passbooks: [
      { year: "2025–26", openingBalance: 0, entries: [
        ...contributions(["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"], 8430, 7180),
        { date: "18 Jan 2026", particulars: "Transfer-in from Techcore Systems", category: "transfer", type: "credit", amount: 499574, reference: "TRF-20260110-001" },
        { date: "31 Mar 2026", particulars: "Annual interest at 8.25%", category: "interest", type: "credit", amount: 20600, reference: "INT-2025-26" },
      ] },
      { year: "2026–27", openingBalance: 598224, entries: contributions(["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"], 8430, 7180) },
    ],
  },
  {
    id: "MHBAN1318576000010832",
    label: "Civic Data Labs · Transfer available",
    status: "transferable",
    passbooks: [
      { year: "2023–24", openingBalance: 0, entries: [
        ...contributions(["Aug 2023", "Sep 2023", "Oct 2023", "Nov 2023", "Dec 2023", "Jan 2024", "Feb 2024", "Mar 2024"], 6480, 5230),
        { date: "31 Mar 2024", particulars: "Annual interest at 8.25%", category: "interest", type: "credit", amount: 2900, reference: "INT-2023-24" },
      ] },
      { year: "2024–25", openingBalance: 96580, entries: [
        ...contributions(["Apr 2024", "May 2024", "Jun 2024", "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025"], 6480, 5230),
        { date: "21 Feb 2025", particulars: "Education advance paid", category: "claim", type: "debit", amount: 60000, reference: "CLM-20250214-118" },
        { date: "31 Mar 2025", particulars: "Annual interest at 8.25%", category: "interest", type: "credit", amount: 10900, reference: "INT-2024-25" },
      ] },
      { year: "2025–26", openingBalance: 188000, entries: [
        ...contributions(["Apr 2025", "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025"], 6480, 5230),
        { date: "31 Mar 2026", particulars: "Annual interest at 8.25%", category: "interest", type: "credit", amount: 15030, reference: "INT-2025-26" },
      ] },
    ],
  },
  {
    id: "MPIND2742177000010037",
    label: "Techcore Systems · Transferred",
    status: "transferred",
    passbooks: [
      { year: "2022–23", openingBalance: 285000, entries: [
        ...contributions(["Apr 2022", "May 2022", "Jun 2022", "Jul 2022", "Aug 2022", "Sep 2022", "Oct 2022", "Nov 2022", "Dec 2022", "Jan 2023", "Feb 2023", "Mar 2023"], 5400, 4150),
        { date: "31 Mar 2023", particulars: "Annual interest at 8.10%", category: "interest", type: "credit", amount: 25500, reference: "INT-2022-23" },
      ] },
      { year: "2023–24", openingBalance: 425100, entries: [
        ...contributions(["Apr 2023", "May 2023", "Jun 2023", "Jul 2023"], 5400, 4150),
        { date: "31 Mar 2024", particulars: "Annual interest at 8.25%", category: "interest", type: "credit", amount: 36074, reference: "INT-2023-24" },
      ] },
      { year: "2025–26", openingBalance: 499574, entries: [
        { date: "18 Jan 2026", particulars: "Transfer to Infosys Limited", category: "transfer", type: "debit", amount: 499574, reference: "TRF-20260110-001" },
      ] },
    ],
  },
];

export function passbookTotals(openingBalance: number, entries: readonly PassbookEntry[]) {
  const credits = entries.filter((entry) => entry.type === "credit").reduce((total, entry) => total + entry.amount, 0);
  const debits = entries.filter((entry) => entry.type === "debit").reduce((total, entry) => total + entry.amount, 0);
  return { credits, debits, closingBalance: openingBalance + credits - debits };
}

export function memberBalance(member: PassbookMember) {
  const latest = member.passbooks.at(-1);
  return latest ? passbookTotals(latest.openingBalance, latest.entries).closingBalance : 0;
}

export function totalEpfBalance() {
  return members.filter((member) => member.status !== "transferred").reduce((total, member) => total + memberBalance(member), 0);
}
