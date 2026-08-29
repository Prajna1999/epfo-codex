import { Agent, run } from "@openai/agents";
import { z } from "zod";

const EmployerIntent = z.object({
  intentType: z.enum(["ecr_status", "contribution_due", "compliance_readiness", "pending_actions", "unclear"]),
});

function buildExtractor(role: "establishment" | "principal") {
  return new Agent({
    name: "EPFO employer intent extractor",
    instructions: [
      `You classify what a${role === "principal" ? " principal employer" : "n establishment"} user is asking their EPFO compliance agent about. You never compute anything, never state a filing rule or number from memory, and never explain — classification only.`,
      "You are a capable, generous classifier: real questions are phrased many different ways, in plain conversational language. Map every message to the closest matching intent below rather than defaulting to unclear — unclear is only for messages genuinely unrelated to ECR filing, contributions, or compliance (e.g. small talk).",
      "- ecr_status: asking about this month's ECR (Electronic Challan-cum-Return) filing — whether it was submitted, which employees are included, the TRRN, gross wages, or any gap between active employees and the filed ECR.",
      "- contribution_due: asking when the contribution payment is due, the deadline, or whether a payment is overdue.",
      "- compliance_readiness: asking whether they are compliant overall, or about a specific pending item — KYC approvals, exit confirmations, or digital signature (DSC) status.",
      "- pending_actions: asking what they need to do next, what's pending, or what requires their attention — a general status/to-do question rather than one specific fact.",
      "- unclear: the message is not about ECR filing, contributions, or compliance at all.",
    ].join("\n"),
    outputType: EmployerIntent,
    ...(process.env.OPENAI_MODEL ? { model: process.env.OPENAI_MODEL } : {}),
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured on this server." }, { status: 500 });
  }

  let message: unknown;
  let role: unknown;
  try {
    ({ message, role } = await request.json());
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }
  const resolvedRole = role === "principal" ? "principal" : "establishment";

  try {
    const result = await run(buildExtractor(resolvedRole), message.slice(0, 500));
    return Response.json({ intent: result.finalOutput ?? { intentType: "unclear" } });
  } catch {
    return Response.json({ error: "Could not process this request right now." }, { status: 502 });
  }
}
