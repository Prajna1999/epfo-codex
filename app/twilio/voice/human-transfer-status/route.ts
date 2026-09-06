import {
  absolute,
  getSession,
  transition,
  validTwilioSignature,
} from "@/lib/voice/core";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = Object.fromEntries(
    (await request.formData())
      .entries()
      .map(([key, value]) => [key, String(value)]),
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
  if (session)
    transition(
      session,
      (form.DialCallStatus || "").toLowerCase() === "completed"
        ? "COMPLETED"
        : "FAILED",
    );
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    headers: { "content-type": "text/xml" },
  });
}
