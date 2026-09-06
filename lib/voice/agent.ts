import OpenAI from "openai";
import WebSocket from "ws";
import { z } from "zod";
import {
  attachOpenAiCall,
  config,
  getOpenAiSession,
  transition,
  type CallSession,
} from "./core";

const toolNames = [
  "verify_member_identity",
  "get_claim_status",
  "get_passbook_summary",
  "get_pension_status",
  "get_grievance_status",
  "create_grievance",
  "transfer_to_human",
] as const;
const tools = toolNames.map((name) => ({
  type: "function" as const,
  name,
  description: `EPFO ${name.replaceAll("_", " ")}`,
  parameters: {
    type: "object",
    properties:
      name === "verify_member_identity"
        ? {
            verificationMethod: {
              type: "string",
              enum: ["mobile_otp", "uan_plus_secret", "member_details"],
            },
            answer: { type: "string" },
          }
        : name === "transfer_to_human"
          ? { reasonCode: { type: "string" }, summary: { type: "string" } }
          : name === "create_grievance"
            ? { subject: { type: "string" }, confirmed: { type: "boolean" } }
            : {},
    required:
      name === "verify_member_identity" ? ["verificationMethod", "answer"] : [],
  },
}));

export const instructions =
  "You are an automated EPFO customer-care assistant. Speak concise English, Hindi, or Hinglish. Never guess account information. Ask for verification before protected lookups, never reveal full identifiers, and confirm immediately before creating a grievance. Escalate on request, uncertainty, distress, verification failure, or backend failure.";
export const openingGreeting =
  "Greet the caller now: Hello, you have reached the automated EPFO customer-care assistant. How may I help you today?";
const verify = z.object({
  verificationMethod: z.enum([
    "mobile_otp",
    "uan_plus_secret",
    "member_details",
  ]),
  answer: z.string().min(1).max(100),
});
const grievance = z.object({
  subject: z.string().min(3).max(300),
  confirmed: z.literal(true),
});
const transfer = z.object({
  reasonCode: z.enum([
    "caller_requested",
    "verification_failed",
    "sensitive_case",
    "backend_unavailable",
    "agent_uncertain",
    "distress",
  ]),
  summary: z.string().min(1).max(500),
});

function protectedResult(session: CallSession, result: object) {
  return session.verificationLevel === "member" ||
    session.verificationLevel === "strong"
    ? result
    : { error: "Member verification is required before this lookup." };
}
async function executeTool(session: CallSession, name: string, args: unknown) {
  if (name === "verify_member_identity") {
    const parsed = verify.safeParse(args);
    if (!parsed.success || parsed.data.answer !== "123456")
      return {
        verified: false,
        message:
          "Verification failed. Please try again or ask for a representative.",
      };
    transition(session, "AI_ACTIVE", {
      verificationLevel: "member",
      contextId: "mock-member-100920000123",
    });
    return {
      verified: true,
      member_reference: "member-verified",
      message: "Identity verified.",
    };
  }
  if (name === "get_claim_status")
    return protectedResult(session, {
      claim_status: "In review",
      claim_reference: "CLM-20260812-035",
      update: "Employer verification is complete.",
    });
  if (name === "get_passbook_summary")
    return protectedResult(session, {
      balance_summary:
        "PF balance is 2,84,500 rupees. Latest contribution recorded in August 2026.",
    });
  if (name === "get_pension_status")
    return protectedResult(session, {
      pension_status:
        "No active pension claim is recorded in this mock account.",
    });
  if (name === "get_grievance_status")
    return protectedResult(session, {
      grievance_status: "No open grievance is recorded in this mock account.",
    });
  if (name === "create_grievance") {
    const parsed = grievance.safeParse(args);
    if (!parsed.success)
      return {
        error: "Explicit confirmation and a short subject are required.",
      };
    if (session.verificationLevel !== "strong")
      return {
        error: "Strong verification is required before creating a grievance.",
      };
    return {
      created: true,
      grievance_reference: `MOCK-${session.interactionId.slice(0, 8)}`,
    };
  }
  if (name === "transfer_to_human") {
    const parsed = transfer.safeParse(args);
    if (!parsed.success)
      return { error: "A valid reason and concise summary are required." };
    if (!session.openaiCallId || !config.humanQueue)
      return {
        error:
          "A representative is unavailable. Offer a callback or grievance route.",
      };
    transition(session, "HUMAN_TRANSFER_REQUESTED");
    await client().realtime.calls.refer(session.openaiCallId, {
      target_uri: `tel:${config.humanQueue}`,
    });
    transition(session, "HUMAN_ACTIVE");
    return { transferred: true };
  }
  return { error: "Unknown tool." };
}
function client() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
const workers = new Map<string, WebSocket>();
export async function acceptCall(session: CallSession, callId: string) {
  attachOpenAiCall(session, callId);
  await client().realtime.calls.accept(callId, {
    type: "realtime",
    model: config.model,
    audio: { output: { voice: config.voice } },
    instructions,
    tools,
  });
  startWorker(callId);
}
export function startWorker(callId: string, attempt = 0) {
  if (workers.has(callId) || !process.env.OPENAI_API_KEY) return;
  const socket = new WebSocket(
    `wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`,
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      handshakeTimeout: 5_000,
    },
  );
  workers.set(callId, socket);
  socket.on("open", () => {
    const session = getOpenAiSession(callId);
    if (session) transition(session, "AI_ACTIVE");
    socket.send(
      JSON.stringify({
        type: "response.create",
        response: { instructions: openingGreeting },
      }),
    );
  });
  socket.on("message", async (raw) => {
    try {
      const event = JSON.parse(raw.toString()) as {
        type?: string;
        name?: string;
        call_id?: string;
        arguments?: string;
      };
      if (
        event.type !== "response.function_call_arguments.done" ||
        !event.name ||
        !event.call_id
      )
        return;
      const session = getOpenAiSession(callId);
      const output = session
        ? await executeTool(
            session,
            event.name,
            JSON.parse(event.arguments || "{}"),
          )
        : { error: "Call session not found." };
      socket.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify(output),
          },
        }),
      );
      socket.send(JSON.stringify({ type: "response.create" }));
    } catch {
      socket.send(
        JSON.stringify({
          type: "response.create",
          response: {
            instructions:
              "Please say that the requested service is temporarily unavailable.",
          },
        }),
      );
    }
  });
  socket.on("close", () => {
    workers.delete(callId);
    const session = getOpenAiSession(callId);
    if (
      session &&
      !["COMPLETED", "FAILED", "HUMAN_ACTIVE"].includes(session.phase) &&
      attempt < 2
    )
      setTimeout(() => startWorker(callId, attempt + 1), 500 * 2 ** attempt);
  });
  socket.on("error", () => undefined);
}
