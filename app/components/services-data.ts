import type { IconName } from "./Icon";

export type UpdateServiceId = "kyc" | "contact" | "nomination" | "profile";

export type UpdateService = {
  id: UpdateServiceId;
  icon: IconName;
  title: string;
  detail: string;
  currentStatus: string;
  action: string;
  fields: { label: string; type?: "email" | "tel" }[];
  steps: string[];
  submittedStatus: string;
  reviewSteps?: string[];
};

export type UpdateRequest = {
  id: string;
  title: string;
  submitted: string;
  status: string;
  steps: string[];
  currentStep: number;
};

export const updateServices: UpdateService[] = [
  { id: "kyc", icon: "shield", title: "KYC and bank details", detail: "Aadhaar, PAN and HDFC Bank •••• 4821 are verified.", currentStatus: "Verified", action: "Update KYC or bank", fields: [{ label: "Bank account number" }, { label: "IFSC code" }], steps: ["Submitted", "Bank validation", "Verified"], submittedStatus: "Bank validation in progress" },
  { id: "contact", icon: "user", title: "Contact details", detail: "Your mobile number and email are verified.", currentStatus: "Verified", action: "Update contact details", fields: [{ label: "Mobile number", type: "tel" }, { label: "Email address", type: "email" }], steps: ["Submitted", "OTP verification", "Updated"], submittedStatus: "Verification pending" },
  { id: "nomination", icon: "user", title: "Nomination", detail: "One nominee is registered.", currentStatus: "Registered", action: "Change nomination", fields: [{ label: "Nominee name" }, { label: "Relationship" }], steps: ["Submitted", "e-Sign", "Registered"], submittedStatus: "Ready for e-Sign" },
  { id: "profile", icon: "file", title: "Update profile", detail: "Most profile details can be updated with Aadhaar verification.", currentStatus: "Aadhaar verified", action: "Update profile", fields: [{ label: "Detail to correct" }, { label: "Correct value" }], steps: ["Submitted", "Aadhaar verification", "Updated"], submittedStatus: "Aadhaar validation in progress", reviewSteps: ["Needs review", "Employer review", "EPFO decision"] },
];

export function createUpdateRequest(service: UpdateService, sequence: number): UpdateRequest {
  return { id: `SRV-20260825-${String(sequence).padStart(3, "0")}`, title: service.title, submitted: "25 Aug 2026", status: service.submittedStatus, steps: service.steps, currentStep: 0 };
}
