export type ClaimType = "advance" | "settlement" | "pension";

export type ClaimDraft = {
  type: ClaimType | "";
  detailsConfirmed: boolean;
  purpose: string;
  amount: string;
  purposeDetail: string;
  taxDeclaration: string;
  pensionChoice: string;
  bankAccount: string;
  ifsc: string;
  bankVerified: boolean;
  otp: string;
};

export const initialClaim: ClaimDraft = {
  type: "",
  detailsConfirmed: false,
  purpose: "",
  amount: "",
  purposeDetail: "",
  taxDeclaration: "",
  pensionChoice: "",
  bankAccount: "50200076543210",
  ifsc: "HDFC0001234",
  bankVerified: false,
  otp: "",
};

export const claimTypes = [
  { value: "advance", label: "PF advance", description: "Claim part of your PF for an eligible need", form: "Form 31" },
  { value: "settlement", label: "Final PF settlement", description: "Settle your PF after leaving employment", form: "Form 19" },
  { value: "pension", label: "Pension benefit", description: "Request an EPS benefit or scheme certificate", form: "Form 10C" },
] as const;

export const purposes = ["Illness", "Housing", "Marriage", "Education", "Natural calamity", "Electricity cut", "Assistive equipment"] as const;

export const purposeQuestions: Record<string, string> = {
  Illness: "Patient and relationship",
  Housing: "Housing requirement",
  Marriage: "Beneficiary and relationship",
  Education: "Student and course",
  "Natural calamity": "Date and place affected",
  "Electricity cut": "Outage period",
  "Assistive equipment": "Equipment required",
};

export function memberDetails(type: ClaimType | "") {
  return type === "advance"
    ? { employer: "Infosys Limited", joined: "1 Jul 2023", left: "Currently employed" }
    : { employer: "Techcore Systems", joined: "1 Apr 2021", left: "30 Jun 2023" };
}

export function legacyForm(type: ClaimType | "") {
  return claimTypes.find((claim) => claim.value === type)?.form ?? "";
}

export function hasValidBankDetails(claim: ClaimDraft) {
  return /^\d{9,18}$/.test(claim.bankAccount.replace(/\s/g, "")) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(claim.ifsc);
}

export function canContinue(step: number, claim: ClaimDraft, otpSent = false) {
  if (step === 1) return Boolean(claim.type);
  if (step === 2) return claim.detailsConfirmed;
  if (step === 3) {
    if (claim.type === "advance") return Boolean(claim.purpose && Number(claim.amount) > 0 && claim.purposeDetail.trim());
    if (claim.type === "settlement") return Boolean(claim.taxDeclaration);
    return Boolean(claim.pensionChoice);
  }
  return hasValidBankDetails(claim) && claim.bankVerified && otpSent && /^\d{6}$/.test(claim.otp);
}
