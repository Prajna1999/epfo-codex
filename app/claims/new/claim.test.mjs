import assert from "node:assert/strict";
import test from "node:test";
import { canContinue, initialClaim, legacyForm } from "./claim.ts";

test("validates every claim branch and final OTP", () => {
  const base = { ...initialClaim, detailsConfirmed: true };
  const advance = { ...base, type: "advance", purpose: "Illness", amount: "5000", purposeDetail: "Self" };
  const settlement = { ...base, type: "settlement", taxDeclaration: "Not applicable" };
  const pension = { ...base, type: "pension", pensionChoice: "Scheme certificate" };

  assert.equal(canContinue(3, advance), true);
  assert.equal(canContinue(3, settlement), true);
  assert.equal(canContinue(3, pension), true);
  assert.equal(canContinue(4, { ...advance, bankConfirmed: true, otp: "123456" }, true), true);
  assert.equal(canContinue(4, { ...advance, bankConfirmed: true, otp: "12345" }, true), false);
  assert.deepEqual([legacyForm("advance"), legacyForm("settlement"), legacyForm("pension")], ["Form 31", "Form 19", "Form 10C"]);
});
