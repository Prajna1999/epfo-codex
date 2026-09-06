import {
  absolute,
  createSession,
  validTwilioSignature,
  welcomeTwiml,
} from "@/lib/voice/core";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const form = Object.fromEntries(
    (await request.formData()).entries().map(([k, v]) => [k, String(v)]),
  );
  const url = new URL(request.url);
  const valid = validTwilioSignature(
    absolute(url.pathname + url.search),
    form,
    request.headers.get("x-twilio-signature"),
  );
  if (!valid || !form.CallSid)
    return new Response("Unauthorized", { status: 401 });
  const session = createSession(form.CallSid, form.From);
  return new Response(welcomeTwiml(session.interactionId), {
    headers: { "content-type": "text/xml" },
  });
}
