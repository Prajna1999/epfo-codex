import type { IconName } from "./Icon";

// Mirrors the figures already shown in EmployerDashboard.tsx and EmployerActions.tsx — no new numbers invented for this agent.
const ACTIVE_EMPLOYEES = 4823;
const ECR_INCLUDED = 4801;
const ECR_MONTH = "August 2026";
const ECR_SIGNED = "18 Aug 2026";
const TRRN = "1252608001842";
const GROSS_WAGES = "₹18.6 Cr";
const CONTRIBUTION_DUE = new Date(2026, 8, 15);
const KYC_PENDING: number = 22;
const EXITS_PENDING: number = 7;
const TODAY = new Date(2026, 7, 29);
const MS_PER_DAY = 86400000;

export type EcrCheck = { ok: boolean; title: string; message: string };

export function checkEcrFiling(): EcrCheck {
  const gap = ACTIVE_EMPLOYEES - ECR_INCLUDED;
  return {
    ok: gap === 0,
    title: gap === 0 ? "ECR filed for every active employee" : `${gap} active employees are missing from this month's ECR`,
    message: `${ECR_MONTH} ECR included ${ECR_INCLUDED} of ${ACTIVE_EMPLOYEES} active employees, TRRN ${TRRN}, signed ${ECR_SIGNED}.${gap > 0 ? ` That gap matches your ${KYC_PENDING} pending KYC approvals — an employee without an approved UAN can't be included in the ECR until approved.` : ""}`,
  };
}

export type DueCheck = { ok: boolean; title: string; message: string; daysRemaining: number };

export function checkContributionDue(): DueCheck {
  const daysRemaining = Math.round((CONTRIBUTION_DUE.getTime() - TODAY.getTime()) / MS_PER_DAY);
  return {
    ok: daysRemaining > 3,
    daysRemaining,
    title: daysRemaining > 0 ? `Contribution payment due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}` : "Contribution payment is overdue",
    message: `${GROSS_WAGES} in declared wages for ${ECR_MONTH} carries a contribution payment due 15 Sep 2026 — EPFO's standard 15th-of-next-month deadline for the wage month it follows.`,
  };
}

export type ReadinessItem = { label: string; ready: boolean; detail: string };

export function checkComplianceReadiness(): ReadinessItem[] {
  return [
    { label: "KYC approvals", ready: KYC_PENDING === 0, detail: `${KYC_PENDING} employee KYC updates are awaiting establishment approval.` },
    { label: "Exit confirmations", ready: EXITS_PENDING === 0, detail: `${EXITS_PENDING} employee exits need a confirmed last working day before next month's ECR.` },
    { label: "Digital signature", ready: true, detail: "DSC is valid and was used to sign the August ECR." },
  ];
}

export type EmployerAction = { id: string; title: string; detail: string; impact: "Reversible" | "Irreversible"; icon: IconName; view: string };

export function establishmentActions(): EmployerAction[] {
  const list: EmployerAction[] = [];
  if (KYC_PENDING > 0) list.push({ id: "kyc", title: `Review ${KYC_PENDING} pending KYC approvals`, detail: "These employees stay missing from the ECR until their KYC is approved. This opens Employees so you can review each request.", impact: "Reversible", icon: "shield", view: "Employees" });
  if (EXITS_PENDING > 0) list.push({ id: "exits", title: `Confirm ${EXITS_PENDING} employee exits`, detail: "Confirming a last working day sets the member's PF and EPS exit date on record — once EPFO processes it, this isn't a routine undo. This opens Employees so you can confirm each one.", impact: "Irreversible", icon: "users", view: "Employees" });
  return list;
}

export function principalActions(): EmployerAction[] {
  return [
    { id: "contractor-review", title: "Review linked contract-employer compliance", detail: "Opens Compliance so you can record a follow-up against a linked contract employer.", impact: "Reversible", icon: "shield", view: "Compliance" },
  ];
}

export function pendingActionsSummary(role: "establishment" | "principal"): string {
  const actions = role === "principal" ? principalActions() : establishmentActions();
  if (actions.length === 0) return "Nothing is pending right now — ECR, contributions and compliance all look current.";
  return `${actions.map((action) => action.title).join("; ")}.`;
}

export function complianceReadinessSummary(): string {
  const notReady = checkComplianceReadiness().filter((item) => !item.ready);
  if (notReady.length === 0) return "All compliance checks are ready — KYC approvals, exit confirmations and DSC status are current.";
  return notReady.map((item) => item.detail).join(" ");
}
