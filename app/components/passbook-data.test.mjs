import assert from "node:assert/strict";
import test from "node:test";
import { pastClaims } from "./claims-data.ts";
import { percentileForBalance, providerAccounts, rahulProfile } from "./finance-profile-data.ts";
import { memberBalance, members, totalEpfBalance } from "./passbook-data.ts";
import { serviceRecords } from "./service-history-data.ts";

test("Rahul's financial mock data reconciles across the workspace", () => {
  assert.deepEqual(members.map(memberBalance), [676274, 285000, 0]);
  assert.equal(totalEpfBalance(), 961274);
  assert.equal(percentileForBalance(totalEpfBalance()), 76);
  assert.equal(rahulProfile.monthlyPlan.essentialSpend + rahulProfile.monthlyPlan.discretionarySpend + rahulProfile.monthlyPlan.investibleSurplus, rahulProfile.employment.monthlyTakeHome);
  assert.deepEqual(serviceRecords.map(({ id }) => id).sort(), members.map(({ id }) => id).sort());

  const entries = members.flatMap((member) => member.passbooks.flatMap((passbook) => passbook.entries));
  const educationClaim = pastClaims.find((claim) => claim.id === "CLM-20250214-118");
  const completedTransfer = pastClaims.find((claim) => claim.id === "TRF-20260110-001");
  assert.equal(entries.find((entry) => entry.reference === educationClaim?.id)?.amount, 60000);
  assert.equal(entries.filter((entry) => entry.reference === completedTransfer?.id).length, 2);
  assert.equal(providerAccounts.every((provider) => provider.value >= provider.invested && provider.holdings > 0), true);
});
