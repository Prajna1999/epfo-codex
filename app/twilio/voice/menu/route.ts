import {
  absolute,
  getSession,
  handoffTwiml,
  menuResultTwiml,
  transition,
  validTwilioSignature,
  welcomeTwiml,
} from "@/lib/voice/core";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const form = Object.fromEntries(
    (await request.formData()).entries().map(([k, v]) => [k, String(v)]),
  );
  const url = new URL(request.url);
  if (
    !validTwilioSignature(
      absolute(url.pathname + url.search),
      form,
      request.headers.get("x-twilio-signature"),
    )
  )
    return new Response("Unauthorized", { status: 401 });
  const session = getSession(url.searchParams.get("interaction_id") || "");
  if (!session) return new Response("Unknown interaction", { status: 404 });
  const digit = form.Digits;
  if (digit === "0") {
    transition(session, "HANDOFF_REQUESTED", { ivrSelection: digit });
    return xml(handoffTwiml(session.interactionId));
  }
  if (["1", "2", "3", "4"].includes(digit)) {
    transition(session, "IVR", { ivrSelection: digit });
    return xml(menuResultTwiml(digit));
  }
  if (digit === "9") return xml(welcomeTwiml(session.interactionId));
  if (session.retries >= 2) return xml(menuResultTwiml(""));
  session.retries += 1;
  return xml(welcomeTwiml(session.interactionId, session.retries));
}
function xml(body: string) {
  return new Response(body, { headers: { "content-type": "text/xml" } });
}
