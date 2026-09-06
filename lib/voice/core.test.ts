import assert from "node:assert/strict";
import test from "node:test";
import {
  createSession,
  handoffTwiml,
  sipInteractionId,
  transition,
  validTwilioSignature,
  welcomeTwiml,
} from "./core";
test("voice flow keeps one interaction and emits safe TwiML", () => {
  const session = createSession("CA-test", "+919999999999");
  assert.match(welcomeTwiml(session.interactionId), /<Gather/);
  transition(session, "HANDOFF_REQUESTED");
  assert.equal(session.version, 2);
  assert.match(handoffTwiml(session.interactionId), /Response/);
  assert.equal(
    validTwilioSignature("https://example.test", {}, null),
    process.env.NODE_ENV !== "production",
  );
});

test("reads the interaction ID from OpenAI SIP headers", () => {
  assert.equal(
    sipInteractionId({
      sip_headers: [{ name: "X-Interaction-Id", value: "interaction-123" }],
    }),
    "interaction-123",
  );
});
