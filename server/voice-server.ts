import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URLSearchParams } from "node:url";
import OpenAI from "openai";
import { acceptCall } from "../lib/voice/agent";
import {
  absolute,
  createSession,
  getSession,
  handoffTwiml,
  humanFallbackTwiml,
  menuResultTwiml,
  recordEvent,
  sipInteractionId,
  transition,
  validTwilioSignature,
  welcomeTwiml,
} from "../lib/voice/core";

const port = Number(process.env.PORT || 8003);

function send(
  response: ServerResponse,
  status: number,
  body: string,
  contentType = "text/plain",
) {
  response.writeHead(status, { "content-type": contentType });
  response.end(body);
}

async function form(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Object.fromEntries(
    new URLSearchParams(Buffer.concat(chunks).toString()).entries(),
  );
}

async function body(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString();
}

function isValidTwilio(
  request: IncomingMessage,
  path: string,
  values: Record<string, string>,
) {
  const signature = request.headers["x-twilio-signature"];
  return validTwilioSignature(
    absolute(path),
    values,
    typeof signature === "string" ? signature : null,
  );
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/health/live")
    return send(
      response,
      200,
      JSON.stringify({ ok: true }),
      "application/json",
    );
  if (request.method !== "POST") return send(response, 404, "Not found");

  if (url.pathname === "/openai/webhooks") {
    if (!process.env.OPENAI_WEBHOOK_SECRET)
      return send(response, 503, "OpenAI webhook secret is not configured");
    try {
      const event = (await new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }).webhooks.unwrap(
        await body(request),
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
        return send(
          response,
          200,
          JSON.stringify({ ok: true, duplicate: true }),
          "application/json",
        );
      if (event.type !== "realtime.call.incoming")
        return send(
          response,
          200,
          JSON.stringify({ ok: true }),
          "application/json",
        );

      const callId = event.data.call_id || event.data.id;
      const interactionId = sipInteractionId(event.data);
      const session = callId && interactionId && getSession(interactionId);
      if (!session || !callId) return send(response, 404, "Unmatched SIP call");

      void acceptCall(session, callId).catch(() => undefined);
      return send(
        response,
        200,
        JSON.stringify({ ok: true }),
        "application/json",
      );
    } catch {
      return send(response, 401, "Invalid webhook");
    }
  }

  const values = await form(request);
  if (!isValidTwilio(request, url.pathname + url.search, values))
    return send(response, 401, "Unauthorized");

  if (url.pathname === "/" || url.pathname === "/twilio/voice/incoming") {
    if (!values.CallSid) return send(response, 400, "Missing CallSid");
    const session = createSession(values.CallSid, values.From);
    return send(response, 200, welcomeTwiml(session.interactionId), "text/xml");
  }

  const session = getSession(url.searchParams.get("interaction_id") || "");
  if (!session) {
    if (!values.CallSid) return send(response, 404, "Unknown interaction");
    const fallbackSession = createSession(values.CallSid, values.From);
    return send(
      response,
      200,
      welcomeTwiml(fallbackSession.interactionId),
      "text/xml",
    );
  }

  if (url.pathname === "/twilio/voice/menu") {
    const digit = values.Digits;
    if (digit === "0") {
      transition(session, "HANDOFF_REQUESTED", { ivrSelection: digit });
      return send(
        response,
        200,
        handoffTwiml(session.interactionId),
        "text/xml",
      );
    }
    if (["1", "2", "3", "4"].includes(digit)) {
      transition(session, "IVR", { ivrSelection: digit });
      return send(response, 200, menuResultTwiml(digit), "text/xml");
    }
    if (digit === "9")
      return send(
        response,
        200,
        welcomeTwiml(session.interactionId),
        "text/xml",
      );
    if (session.retries >= 2)
      return send(response, 200, menuResultTwiml(""), "text/xml");
    session.retries += 1;
    return send(
      response,
      200,
      welcomeTwiml(session.interactionId, session.retries),
      "text/xml",
    );
  }

  if (url.pathname === "/twilio/voice/ai-dial-status") {
    if (
      !["completed", "answered"].includes(
        (values.DialCallStatus || "").toLowerCase(),
      )
    )
      transition(session, "FAILED");
    return send(response, 200, humanFallbackTwiml(), "text/xml");
  }

  if (url.pathname === "/twilio/voice/human-transfer-status") {
    transition(
      session,
      (values.DialCallStatus || "").toLowerCase() === "completed"
        ? "COMPLETED"
        : "FAILED",
    );
    return send(
      response,
      200,
      '<?xml version="1.0" encoding="UTF-8"?><Response/>',
      "text/xml",
    );
  }

  return send(response, 404, "Not found");
});

server.listen(port, () =>
  console.log(`EPFO voice server listening on http://localhost:${port}`),
);
