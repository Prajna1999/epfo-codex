import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { purposes } from "../../claims/new/claim";

const AgentIntent = z.object({
  intentType: z.enum(["claim_eligibility", "retirement_projection", "withdrawal_impact", "pension_estimate", "contribution_check", "chart_request", "unclear"]),
  purpose: z.enum(purposes).nullable(),
  amount: z.number().nullable(),
  dataSource: z.enum(["retirement", "withdrawal", "pension", "contributions", "timeline", "contribution_split", "contributions_by_employer"]).nullable(),
  chartForm: z.enum(["line", "bar", "pie", "donut", "treemap"]).nullable(),
});

function buildExtractor() {
  return new Agent({
    name: "EPF account intent extractor",
    instructions: [
      "You classify what an EPF (Employees' Provident Fund) member is asking their account agent to look into, and extract any parameters mentioned. You never compute anything, never state an EPFO rule or amount from memory, and never explain — extraction and classification only. Every number in your final answer must come from the member's own message.",
      "You are a capable, generous classifier: real member questions are phrased in many different ways, in plain conversational language, sometimes imprecisely. Map every message to the closest matching intent below rather than defaulting to unclear — unclear is only for messages that are genuinely unrelated to the member's EPF/PF/pension account (e.g. small talk, or a completely different topic like the weather).",
      "You are explicitly allowed and expected to handle requests for charts, graphs, or visualizations phrased in the member's own words — this is a first-class, on-the-fly capability, not limited to a literal '/chart' command and not limited to any fixed template. Any time the member asks to see, plot, chart, graph, or visualize something, classify intentType as chart_request and independently set TWO separate fields — dataSource (what data) and chartForm (what visual shape) — they are not linked, and any dataSource can be drawn in any chartForm the member asks for.",
      "dataSource — pick whichever of these most closely matches what data they want to see:",
      "- retirement: PF balance growth / compounding over time to retirement.",
      "- withdrawal: the cost/impact of a withdrawal on retirement balance (a two-point comparison). If they name an amount, also extract it.",
      "- pension: monthly EPS pension across claiming ages (50/58/60).",
      "- contributions: their PF contribution total by financial year (time-based, one point per year).",
      "- contributions_by_employer: their total recorded PF contribution amount, summed and grouped per employer name (e.g. Infosys vs Techcore). Use this whenever they ask to see contributions broken down, compared, or summed 'by employer' or 'across employers' — this is the correct choice for a request like 'treemap of contribution by employer', NOT contribution_split.",
      "- timeline: years of service by employer.",
      "- contribution_split: ONLY their own contribution share vs their employer's contribution share of the SAME account balance (two categories: 'your contributions' and 'employer contributions'). Do not use this for a request about different employers — that is contributions_by_employer instead.",
      "If it's genuinely ambiguous which dataSource they mean, still pick your best guess — only intentType itself falls back to unclear; dataSource should not be left null once intentType is chart_request.",
      "chartForm — pick EXACTLY the visual shape the member asked for, literally: 'pie chart' or 'pie' -> pie. 'donut' or 'doughnut' -> donut. 'bar chart', 'bar graph', 'columns' -> bar. 'line', 'line graph', 'trend', 'over time' -> line. 'treemap' or 'tree map' -> treemap. If they don't name a specific shape at all, leave chartForm null and a sensible default will be used automatically — but if they DO name a shape, always honor it exactly as asked, even if you personally think a different shape would suit the data better. The member's explicit request always wins.",
      "For everything else, classify intentType as one of:",
      "- claim_eligibility: asking whether they can withdraw/claim money for a purpose (illness, housing, marriage, education, wedding, etc.), or how much they could get.",
      "- withdrawal_impact: asking what withdrawing a specific amount now would cost them later / at retirement / in lost growth (as a text answer, not explicitly asking for a chart — chart_request takes priority if they use visual language).",
      "- retirement_projection: asking what their PF balance will be at retirement, or how their savings will grow over time (compounding, future balance).",
      "- pension_estimate: asking about their EPS monthly pension amount, or pension at a given age.",
      "- contribution_check: asking whether their employer's contributions are up to date, or about a missing/late deposit.",
      "- unclear: the message is not about their EPF/PF/pension account at all.",
      `If a purpose is mentioned, map it to exactly one of these values, never anything else: ${purposes.join(", ")}. If no purpose is stated or it doesn't match one of these, return null.`,
      "If a rupee amount is mentioned, extract it as a plain number (e.g. \"2 lakh\" -> 200000, \"60k\" -> 60000). If no amount is stated, return null. Never guess or default an amount.",
    ].join("\n"),
    outputType: AgentIntent,
    ...(process.env.OPENAI_MODEL ? { model: process.env.OPENAI_MODEL } : {}),
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured on this server." }, { status: 500 });
  }

  let message: unknown;
  try {
    ({ message } = await request.json());
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const result = await run(buildExtractor(), message.slice(0, 500));
    return Response.json({ intent: result.finalOutput ?? { intentType: "unclear", purpose: null, amount: null, dataSource: null, chartForm: null } });
  } catch {
    return Response.json({ error: "Could not process this request right now." }, { status: 502 });
  }
}
