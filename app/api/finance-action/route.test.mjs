import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route.ts";

test("rejects malformed finance actions", async () => {
  const response = await POST(new Request("http://localhost/api/finance-action", { method: "POST", body: JSON.stringify({ action: "trade", target: "Zerodha" }) }));
  assert.equal(response.status, 400);
});
