import assert from "node:assert/strict";
import test from "node:test";
import { members, passbookTotals } from "./passbook-data.ts";

test("each member ID has credit and debit ledger totals", () => {
  assert.deepEqual(members[0].passbooks.map((passbook) => passbookTotals(passbook.openingBalance, passbook.entries).closingBalance), [355190, 410190, 452340]);
  assert.equal(passbookTotals(members[1].passbooks[1].openingBalance, members[1].passbooks[1].entries).debits, 228020);
});
