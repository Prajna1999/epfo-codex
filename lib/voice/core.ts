import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type CallPhase =
  | "IVR"
  | "HANDOFF_REQUESTED"
  | "AI_CONNECTING"
  | "AI_ACTIVE"
  | "VERIFICATION_REQUIRED"
  | "HUMAN_TRANSFER_REQUESTED"
  | "HUMAN_ACTIVE"
  | "COMPLETED"
  | "FAILED";
export type VerificationLevel = "none" | "phone" | "member" | "strong";

export type CallSession = {
  interactionId: string;
  twilioCallSid: string;
  openaiCallId?: string;
  callerPhoneHash?: string;
  ivrSelection?: string;
  phase: CallPhase;
  verificationLevel: VerificationLevel;
  contextId?: string;
  startedAt: string;
  lastEventAt: string;
  endedAt?: string;
  version: number;
  retries: number;
};

const sessions = new Map<string, CallSession>();
const byOpenAiCall = new Map<string, string>();
const events = new Set<string>();
const now = () => new Date().toISOString();

export const config = {
  baseUrl: (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  sipUri: process.env.OPENAI_SIP_URI || "",
  humanQueue: process.env.TWILIO_HUMAN_QUEUE_NUMBER || "",
  model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
  voice: process.env.OPENAI_REALTIME_VOICE || "cedar",
};

export function xml(value: string) {
  return value.replace(
    /[<>&'\"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!,
  );
}
export function twiml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}
export function absolute(path: string) {
  return `${config.baseUrl}${path}`;
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function welcomeTwiml(interactionId: string, retry = 0) {
  const prefix = retry ? "Sorry, I did not understand that. " : "";
  return twiml(
    `<Gather input="dtmf" numDigits="1" timeout="5" action="${xml(absolute(`/twilio/voice/menu?interaction_id=${encodeURIComponent(interactionId)}`))}" method="POST"><Say language="en-IN">${prefix}Welcome to EPFO customer care. Press 1 for claim status. Press 2 for passbook information. Press 3 for pension information. Press 4 for grievance status. Press 0 to speak with our customer-care assistant. Press 9 to repeat this menu.</Say></Gather><Redirect method="POST">${xml(absolute(`/twilio/voice/menu?interaction_id=${encodeURIComponent(interactionId)}`))}</Redirect>`,
  );
}

export function handoffTwiml(interactionId: string) {
  if (!config.sipUri) return humanFallbackTwiml();
  const sip = `${config.sipUri}${config.sipUri.includes("?") ? "&" : "?"}X-Interaction-Id=${encodeURIComponent(interactionId)}`;
  return twiml(
    `<Say language="en-IN">Please hold while we connect you to our customer-care assistant.</Say><Dial answerOnBridge="true" timeout="30" action="${xml(absolute(`/twilio/voice/ai-dial-status?interaction_id=${encodeURIComponent(interactionId)}`))}" method="POST"><Sip>${xml(sip)}</Sip></Dial>`,
  );
}
export function humanFallbackTwiml() {
  return config.humanQueue
    ? twiml(
        `<Say>Our assistant is unavailable. Please hold while we connect you to an EPFO representative.</Say><Dial>${xml(config.humanQueue)}</Dial>`,
      )
    : twiml("<Say>Our assistant is unavailable. Please try again later.</Say>");
}
export function menuResultTwiml(selection: string) {
  return twiml(
    `<Say language="en-IN">For ${xml({ "1": "claim status", "2": "passbook information", "3": "pension information", "4": "grievance status" }[selection] || "this service")}, please verify your identity with our customer-care assistant by pressing 0 from the main menu.</Say><Redirect method="POST">${xml(absolute("/twilio/voice/incoming"))}</Redirect>`,
  );
}

export function createSession(callSid: string, from?: string) {
  const existing = sessions.get(callSid);
  if (existing) return existing;
  const time = now();
  const session: CallSession = {
    interactionId: crypto.randomUUID(),
    twilioCallSid: callSid,
    callerPhoneHash: from ? hash(from) : undefined,
    phase: "IVR",
    verificationLevel: "none",
    startedAt: time,
    lastEventAt: time,
    version: 1,
    retries: 0,
  };
  sessions.set(callSid, session);
  return session;
}
export function getSession(interactionId: string) {
  return [...sessions.values()].find(
    (session) => session.interactionId === interactionId,
  );
}
export function getOpenAiSession(callId: string) {
  const id = byOpenAiCall.get(callId);
  return id ? getSession(id) : undefined;
}
export function transition(
  session: CallSession,
  phase: CallPhase,
  patch: Partial<CallSession> = {},
) {
  Object.assign(session, patch, {
    phase,
    version: session.version + 1,
    lastEventAt: now(),
  });
  return session;
}
export function recordEvent(id: string) {
  if (events.has(id)) return false;
  events.add(id);
  return true;
}
export function attachOpenAiCall(session: CallSession, callId: string) {
  byOpenAiCall.set(callId, session.interactionId);
  return transition(session, "AI_CONNECTING", { openaiCallId: callId });
}
export function validTwilioSignature(
  url: string,
  values: Record<string, string>,
  signature: string | null,
) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const payload =
    url +
    Object.keys(values)
      .sort()
      .map((key) => key + values[key])
      .join("");
  const expected = createHmac("sha1", token).update(payload).digest("base64");
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
export function sipInteractionId(data: unknown) {
  const headers = (
    data as {
      sip_headers?:
        Array<{ name: string; value: string }> | Record<string, string>;
      headers?: Record<string, string>;
    }
  )?.sip_headers;

  if (Array.isArray(headers)) {
    return headers.find(
      (header) => header.name.toLowerCase() === "x-interaction-id",
    )?.value;
  }

  return Object.entries(
    headers || (data as { headers?: Record<string, string> })?.headers || {},
  ).find(([key]) => key.toLowerCase() === "x-interaction-id")?.[1];
}
