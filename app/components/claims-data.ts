type ClaimType = "advance" | "settlement" | "pension";
type SubmittedDraft = { type: ClaimType | ""; amount: string };

export type ClaimStatus = "Submitted" | "In review" | "Paid" | "Transferred";

export type ClaimRecord = {
  id: string;
  type: string;
  amount: string;
  submitted: string;
  status: ClaimStatus;
  message: string;
  steps: string[];
  currentStep: number;
  form: string;
};

export const pastClaims: ClaimRecord[] = [
  { id: "CLM-20260812-035", type: "Medical advance", amount: "₹35,000", submitted: "12 Aug 2026", status: "In review", message: "Employer verification is complete. EPFO review is in progress.", steps: ["Submitted", "Verified", "Review", "Paid"], currentStep: 2, form: "Form 31" },
  { id: "CLM-20250214-118", type: "PF advance · Education", amount: "₹60,000", submitted: "14 Feb 2025", status: "Paid", message: "Paid to HDFC Bank •••• 4821 on 21 Feb 2025.", steps: ["Submitted", "Verified", "Review", "Paid"], currentStep: 3, form: "Form 31" },
  { id: "TRF-20260110-001", type: "PF transfer", amount: "₹4,99,574", submitted: "10 Jan 2026", status: "Transferred", message: "Your Techcore PF was credited to the Infosys Member ID on 18 Jan 2026.", steps: ["Requested", "Employer verified", "Transferred"], currentStep: 2, form: "Form 13" },
  { id: "TRF-20260828-002", type: "PF transfer", amount: "₹2,85,000", submitted: "28 Aug 2026", status: "Submitted", message: "Your Civic Data Labs transfer request was submitted. Employer verification is next.", steps: ["Requested", "Employer review", "EPFO review", "Transferred"], currentStep: 0, form: "Form 13" },
];

export function submittedClaim(claim: SubmittedDraft): ClaimRecord {
  const labels: Record<ClaimType, string> = { advance: "PF advance", settlement: "Final PF settlement", pension: "Pension benefit" };
  const forms: Record<ClaimType, string> = { advance: "Form 31", settlement: "Form 19", pension: "Form 10C" };
  const amount = claim.type === "advance" ? `₹${Number(claim.amount).toLocaleString("en-IN")}` : claim.type === "settlement" ? "₹9,61,274" : "₹8,750";
  return { id: "CLM-20260825-001", type: labels[claim.type as ClaimType], amount, submitted: "25 Aug 2026", status: "Submitted", message: "Your claim has been submitted. EPFO will review it next.", steps: ["Submitted", "Verified", "Review", "Paid"], currentStep: 0, form: forms[claim.type as ClaimType] };
}

export function submittedTransfer(): ClaimRecord {
  return { id: "TRF-20260828-002", type: "PF transfer", amount: "₹2,85,000", submitted: "28 Aug 2026", status: "Submitted", message: "Your Civic Data Labs transfer request was submitted. Employer verification is next.", steps: ["Requested", "Employer review", "EPFO review", "Transferred"], currentStep: 0, form: "Form 13" };
}
