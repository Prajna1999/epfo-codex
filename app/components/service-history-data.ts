export type ServiceRecord = { id: string; employer: string; initials: string; joined: string; exited: string; status: "Active" | "Transferred" | "Eligible"; transfer: string; reason: string; epfJoining: string; epsJoining: string; epfExit: string; epsExit: string };

export const serviceRecords: ServiceRecord[] = [
  { id: "MPIND2742177000010037", employer: "Techcore Systems", initials: "TC", joined: "1 Jul 2017", exited: "7 Aug 2023", status: "Transferred", transfer: "₹4,99,574 transferred to current Member ID on 18 Jan 2026", reason: "Resignation", epfJoining: "01 Jul 2017", epsJoining: "01 Jul 2017", epfExit: "07 Aug 2023", epsExit: "07 Aug 2023" },
  { id: "MHBAN1318576000010832", employer: "Civic Data Labs", initials: "CD", joined: "12 Aug 2023", exited: "18 Oct 2025", status: "Eligible", transfer: "₹2,85,000 available to transfer to current Member ID", reason: "Resignation", epfJoining: "12 Aug 2023", epsJoining: "12 Aug 2023", epfExit: "18 Oct 2025", epsExit: "18 Oct 2025" },
  { id: "MHBAN1318576000010404", employer: "Infosys Limited", initials: "IN", joined: "3 Nov 2025", exited: "Current employment", status: "Active", transfer: "Primary member ID", reason: "—", epfJoining: "03 Nov 2025", epsJoining: "03 Nov 2025", epfExit: "—", epsExit: "—" },
];
