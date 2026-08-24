export type PassbookEntry = { date: string; particulars: string; type: "credit" | "debit"; amount: number };

export const members = [
  {
    id: "MHBAN1318576000010404",
    label: "Infosys Limited · Current",
    passbooks: [
      { year: "2024–25", openingBalance: 320000, entries: [
        { date: "18 Apr 2024", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 May 2024", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Jun 2024", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Jul 2024", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Aug 2024", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "31 Mar 2025", particulars: "Annual interest", type: "credit", amount: 28040 }, { date: "12 Aug 2025", particulars: "PF advance paid", type: "debit", amount: 35000 },
      ] },
      { year: "2025–26", openingBalance: 355190, entries: [
        { date: "18 Jun 2025", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Jul 2025", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Aug 2025", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "31 Mar 2026", particulars: "Annual interest", type: "credit", amount: 29710 },
      ] },
      { year: "2026–27", openingBalance: 410190, entries: [
        { date: "18 Apr 2026", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 May 2026", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Jun 2026", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Jul 2026", particulars: "PF contribution", type: "credit", amount: 8430 }, { date: "18 Aug 2026", particulars: "PF contribution", type: "credit", amount: 8430 },
      ] },
    ],
  },
  {
    id: "MPIND2742177000010037",
    label: "Techcore Systems · Past",
    passbooks: [
      { year: "2022–23", openingBalance: 184600, entries: [
        { date: "18 Apr 2022", particulars: "PF contribution", type: "credit", amount: 6720 }, { date: "18 May 2022", particulars: "PF contribution", type: "credit", amount: 6720 }, { date: "31 Mar 2023", particulars: "Annual interest", type: "credit", amount: 16540 },
      ] },
      { year: "2023–24", openingBalance: 214580, entries: [
        { date: "18 Apr 2023", particulars: "PF contribution", type: "credit", amount: 6720 }, { date: "18 May 2023", particulars: "PF contribution", type: "credit", amount: 6720 }, { date: "30 Jun 2023", particulars: "PF transfer to current account", type: "debit", amount: 228020 },
      ] },
    ],
  },
] as const;

export function passbookTotals(openingBalance: number, entries: readonly PassbookEntry[]) {
  const credits = entries.filter((entry) => entry.type === "credit").reduce((total, entry) => total + entry.amount, 0);
  const debits = entries.filter((entry) => entry.type === "debit").reduce((total, entry) => total + entry.amount, 0);
  return { credits, debits, closingBalance: openingBalance + credits - debits };
}
