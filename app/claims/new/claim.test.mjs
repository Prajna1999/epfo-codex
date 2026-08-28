import assert from "node:assert/strict";
import test from "node:test";
import { canContinue, hasValidBankDetails, initialClaim, legacyForm } from "./claim.ts";

test("validates every claim branch and final OTP", () => {
  const base = { ...initialClaim, detailsConfirmed: true };
  const advance = { ...base, type: "advance", purpose: "Illness", amount: "5000", purposeDetail: "Self" };
  const settlement = { ...base, type: "settlement", taxDeclaration: "Not applicable" };
  const pension = { ...base, type: "pension", pensionChoice: "Scheme certificate" };

  assert.equal(canContinue(3, advance), true);
  assert.equal(canContinue(3, settlement), true);
  assert.equal(canContinue(3, pension), true);
  const verifiedBank = { ...advance, bankAccount: "50200076543210", ifsc: "HDFC0001234", bankVerified: true, otp: "123456" };
  assert.equal(hasValidBankDetails(verifiedBank), true);
  assert.equal(canContinue(4, verifiedBank, true), true);
  assert.equal(canContinue(4, { ...verifiedBank, bankVerified: false }, true), false);
  assert.equal(canContinue(4, { ...verifiedBank, ifsc: "HDFC123" }, true), false);
  assert.equal(canContinue(4, { ...verifiedBank, otp: "12345" }, true), false);
  assert.deepEqual([legacyForm("advance"), legacyForm("settlement"), legacyForm("pension")], ["Form 31", "Form 19", "Form 10C"]);
});
