import OpenAI from "openai";
import { acceptCall } from "@/lib/voice/agent";
import { getSession, recordEvent, sipInteractionId } from "@/lib/voice/core";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.OPENAI_WEBHOOK_SECRET)
    return new Response("OpenAI webhook secret is not configured", {
      status: 503,
    });
  try {
    const event = (await new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }).webhooks.unwrap(
      await request.text(),
      request.headers,
      process.env.OPENAI_WEBHOOK_SECRET,
    )) as {
      id: string;
      type: string;
      data: {
        call_id?: string;
        id?: string;
        sip_headers?: Record<string, string>;
      };
    };
    if (!recordEvent(event.id))
      return Response.json({ ok: true, duplicate: true });
    if (event.type !== "realtime.call.incoming")
      return Response.json({ ok: true });
    const callId = event.data.call_id || event.data.id;
    const interactionId = sipInteractionId(event.data);
    const session = callId && interactionId && getSession(interactionId);
    if (!session || !callId)
      return new Response("Unmatched SIP call", { status: 404 });
    void acceptCall(session, callId).catch(() => undefined);
    return Response.json({ ok: true });
  } catch {
    return new Response("Invalid webhook", { status: 401 });
  }
}
