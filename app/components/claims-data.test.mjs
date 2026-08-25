import assert from "node:assert/strict";
import test from "node:test";
import { initialClaim } from "../claims/new/claim.ts";
import { submittedClaim } from "./claims-data.ts";

test("creates a submitted advance claim with the entered amount", () => {
  const claim = submittedClaim({ ...initialClaim, type: "advance", amount: "35000" });
  assert.equal(claim.amount, "₹35,000");
  assert.equal(claim.status, "Submitted");
  assert.equal(claim.form, "Form 31");
});
