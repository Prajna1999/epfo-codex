export type ServiceRecord = { id: string; employer: string; initials: string; joined: string; exited: string; status: "Active" | "Transferred" | "Eligible"; transfer: string; reason: string; epfJoining: string; epsJoining: string; epfExit: string; epsExit: string };

export const serviceRecords: ServiceRecord[] = [
  { id: "MPIND2742177000010037", employer: "Techcore Systems", initials: "TC", joined: "1 Nov 2022", exited: "7 Aug 2023", status: "Transferred", transfer: "Transferred to MHBAN1318576000010404", reason: "Cessation of short service", epfJoining: "01 Nov 2022", epsJoining: "01 Nov 2022", epfExit: "07 Aug 2023", epsExit: "07 Aug 2023" },
  { id: "MHBAN1318576000010832", employer: "Civic Data Labs", initials: "CD", joined: "12 Aug 2024", exited: "18 Oct 2025", status: "Eligible", transfer: "Eligible to transfer to current Member ID", reason: "Resignation", epfJoining: "12 Aug 2024", epsJoining: "12 Aug 2024", epfExit: "18 Oct 2025", epsExit: "18 Oct 2025" },
  { id: "MHBAN1318576000010404", employer: "Infosys Limited", initials: "IN", joined: "3 Nov 2025", exited: "Current employment", status: "Active", transfer: "Primary member ID", reason: "—", epfJoining: "03 Nov 2025", epsJoining: "03 Nov 2025", epfExit: "—", epsExit: "—" },
];
