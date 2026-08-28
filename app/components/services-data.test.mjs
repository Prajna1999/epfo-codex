import assert from "node:assert/strict";
import test from "node:test";
import { createUpdateRequest, updateServices } from "./services-data.ts";

test("creates a self-service request using the correct validation flow", () => {
  const request = createUpdateRequest(updateServices[0], 1);
  assert.equal(request.id, "SRV-20260825-001");
  assert.equal(request.status, "Bank validation in progress");
  assert.deepEqual(request.steps, ["Submitted", "Bank validation", "Verified"]);
  assert.deepEqual(updateServices[3].steps, ["Submitted", "Aadhaar verification", "Updated"]);
  assert.deepEqual(updateServices[3].reviewSteps, ["Needs review", "Employer review", "EPFO decision"]);
});
