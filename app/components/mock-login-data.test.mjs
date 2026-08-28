import assert from "node:assert/strict";
import test from "node:test";
import { isMockOtp, mockPassword, mockRoles } from "./mock-login-data.ts";

test("gives each mock role its correct sign-in identifier", () => {
  assert.equal(mockRoles.member.identifier, "UAN");
  assert.match(mockRoles.establishment.identifier, /PF Code/);
  assert.match(mockRoles.principal.identifier, /PF Code/);
  assert.equal(mockRoles.member.loginId, "1009 2000 0123");
  assert.equal(mockPassword, "EPFO@123");
});

test("accepts only the displayed mock OTP", () => {
  assert.equal(isMockOtp("123456"), true);
  assert.equal(isMockOtp("000000"), false);
});
