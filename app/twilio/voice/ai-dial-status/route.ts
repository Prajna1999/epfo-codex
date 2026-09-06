import {
  absolute,
  getSession,
  humanFallbackTwiml,
  transition,
  validTwilioSignature,
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
  if (
    session &&
    !["completed", "answered"].includes(
      (form.DialCallStatus || "").toLowerCase(),
    )
  )
    transition(session, "FAILED");
  return new Response(humanFallbackTwiml(), {
    headers: { "content-type": "text/xml" },
  });
}
