import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { purposes } from "../../claims/new/claim";

const AgentOperation = z.object({
  intentType: z.enum(["claim_eligibility", "retirement_projection", "portfolio_projection", "withdrawal_impact", "pension_estimate", "contribution_check", "chart_request", "portfolio_snapshot", "scenario_simulation", "cohort_comparison", "cohort_insight", "unclear"]),
  purpose: z.enum(purposes).nullable(),
  amount: z.number().nullable(),
  dataSource: z.enum(["retirement", "withdrawal", "pension", "contributions", "timeline", "contribution_split", "contributions_by_employer", "account_values", "cohort_standing", "cohort_metric"]).nullable(),
  chartForm: z.enum(["line", "bar", "pie", "donut", "treemap"]).nullable(),
  provider: z.enum(["Zerodha", "Upstox", "Groww"]).nullable(),
  scenario: z.enum(["job_loss", "medical_emergency", "market_drawdown"]).nullable(),
  cohortMetric: z.enum(["monthly_contribution", "contribution_continuity", "service_tenure", "emergency_fund", "investible_surplus", "transfer_completion"]).nullable(),
  months: z.number().nullable(),
  dropPct: z.number().nullable(),
  includeEpf: z.boolean(),
  includePortfolio: z.boolean(),
  includeCohort: z.boolean(),
});

const AgentPlan = z.object({ operations: z.array(AgentOperation).min(1).max(4) });

const IntentRequest = z.object({
  message: z.string().trim().min(1),
  history: z.array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1), chart: AgentOperation.optional() })).default([]),
});

function buildExtractor() {
  return new Agent({
    name: "EPF account intent extractor",
    instructions: [
      "You classify what an EPF (Employees' Provident Fund) member is asking their account agent to look into, and extract any parameters mentioned. You receive a prior conversation followed by the newest member message. Prior turns may include structured chart context; use it to resolve references such as 'that', 'it', 'the same chart', or 'the above info' and retain its dataSource, amount, provider, horizon, scenario, and cohortMetric. Return an operations array: one operation for each distinct request, in the member's requested order (up to four), rather than discarding secondary requests. You never compute anything, never state an EPFO rule or amount from memory, and never explain — extraction and classification only. Every number in your final answer must come from the member's own message.",
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
      "- account_values: the current value of each permitted connected brokerage and active PF account. Use this for net-worth, portfolio-allocation, account-breakdown, or brokerage-plus-PF charts; also use it when a follow-up asks to chart a prior brokerage/PF account summary.",
      "- cohort_standing: the member's EPF balance against the matched-cohort percentile benchmarks. Use this for a chart of cohort standing, percentile, ranking, or peer comparison.",
      "- cohort_metric: the member versus the cohort median for a specific cohortMetric. Use this for a chart of service tenure, monthly contribution, contribution continuity, emergency-fund months, investible surplus, or transfer completion. For 'show me a chart of the above/that' after a cohort_insight answer, retain that answer's cohortMetric and use cohort_metric — do not fall back to cohort_standing.",
      "If it's genuinely ambiguous which dataSource they mean, still pick your best guess — only intentType itself falls back to unclear; dataSource should not be left null once intentType is chart_request.",
      "chartForm — pick EXACTLY the visual shape the member asked for, literally: 'pie chart' or 'pie' -> pie. 'donut' or 'doughnut' -> donut. 'bar chart', 'bar graph', 'columns' -> bar. 'line', 'line graph', 'trend', 'over time' -> line. 'treemap' or 'tree map' -> treemap. If they don't name a specific shape at all, leave chartForm null and a sensible default will be used automatically — but if they DO name a shape, always honor it exactly as asked, even if you personally think a different shape would suit the data better. The member's explicit request always wins.",
      "For a chart follow-up such as 'show that as a donut', 'make the previous chart a line graph', or 'show me a chart of the above info', use the prior conversation to retain the previous dataSource and any cohortMetric, then set chartForm to the newly requested shape.",
      "For everything else, classify intentType as one of:",
      "- claim_eligibility: asking whether they can withdraw/claim money for a purpose (illness, housing, marriage, education, wedding, etc.), or how much they could get.",
      "- withdrawal_impact: asking what withdrawing a specific amount now would cost them later / at retirement / in lost growth (as a text answer, not explicitly asking for a chart — chart_request takes priority if they use visual language).",
      "- retirement_projection: asking what their PF balance will be at retirement, or how their savings will grow over time (compounding, future balance).",
      "- portfolio_projection: asking to project future growth/value of stocks, mutual funds, investments, a brokerage account, or a portfolio across providers. This is not an EPF retirement projection. Set provider only when one brokerage is named in isolation; otherwise leave it null to include all permitted brokerages. Extract the requested horizon into months (e.g. 5 years -> 60, 18 months -> 18); leave it null when no horizon is stated.",
      "- pension_estimate: asking about their EPS monthly pension amount, or pension at a given age.",
      "- contribution_check: asking whether their employer's contributions are up to date, or about a missing/late deposit.",
      "- portfolio_snapshot: asking about their connected brokerage or investment accounts — portfolio value, holdings, mutual funds, gain/loss, or recent trades on Zerodha, Upstox or Groww. Set provider to one of the three ONLY when they ask about that ONE broker specifically, in isolation. Leave provider null whenever they ask about their investments generally, ask across multiple brokers, or explicitly compare/combine a broker with their EPF/PF balance (e.g. \"between my EPF and my Zerodha, where's most of my money\") — in these cases a broker name appears in the message but the question is not about that one broker alone, so provider must stay null so the agent can summarize across everything connected.",
      "- scenario_simulation: asking 'what if' about a life event — losing their job or income for a period, a medical emergency/large medical cost, or a market drop/crash affecting their investments. Set scenario to job_loss, medical_emergency, or market_drawdown accordingly. For job_loss, extract the number of months mentioned into months (e.g. \"6 months\", \"half a year\" -> 6); if none is stated, leave months null. For medical_emergency, extract any cost mentioned into amount; if none is stated, leave amount null. For market_drawdown, extract the percentage drop mentioned into dropPct as a fraction (e.g. \"30% crash\" -> 0.3, \"drops in half\" -> 0.5); if none is stated, leave dropPct null.",
      "- cohort_comparison: asking how they compare to other/similar EPFO members, their percentile, ranking, or standing relative to peers of a similar age/role/tenure. This cohort benchmark is EPF-balance-only in this preview, so use this intent even if the member also mentions net worth or brokerage accounts alongside the comparison — the answer will make clear it only covers EPF.",
      "- cohort_insight: asking about a specific peer benchmark other than PF-balance standing: monthly contribution, contribution continuity/on-time deposits, service tenure, emergency-fund months, investible surplus, or previous-PF-account transfer completion. Set cohortMetric to the matching value. If they ask what peer insights are available, use cohort_insight with cohortMetric null.",
      "- unclear: the message is not about their EPF/PF/pension account, or their connected investments, at all.",
      `If a purpose is mentioned, map it to exactly one of these values, never anything else: ${purposes.join(", ")}. If no purpose is stated or it doesn't match one of these, return null.`,
      "If a rupee amount is mentioned, extract it as a plain number (e.g. \"2 lakh\" -> 200000, \"60k\" -> 60000). If no amount is stated, return null. Never guess or default an amount.",
      "The provider field only matters for portfolio_snapshot and portfolio_projection. For every other intentType, always leave provider null, even if a broker name happens to appear in the message — do not let a mentioned broker name change dataSource, purpose, or any other field either.",
      "Member questions are often complicated and touch more than one topic in a single message — e.g. a life-event scenario that also asks about brokerage impact, or a withdrawal question that also asks how it compares to peers. Emit a separate operation for each requested result; each operation's intentType names just that one result. Independently flag every topic that operation touches using three booleans:",
      "- includeEpf: true if the message touches their EPF/PF balance, contributions, claims, or pension in any way (including as one of several things compared/combined) — this is very often true since the whole conversation is about their EPF account.",
      "- includePortfolio: true if the message mentions their brokerage/investment accounts (Zerodha, Upstox, Groww) or investments/stocks/mutual funds generally, even just in passing alongside another topic.",
      "- includeCohort: true if the message asks, anywhere in it, how they compare to other members/peers/cohort — even if that is only part of a longer combined question.",
      "Set a flag to true whenever that topic is genuinely part of what they're asking, even if it is not the primary intentType — for example \"what if I lost my job, how would that hit my Zerodha holdings and where would I stand vs my peers\" should have intentType scenario_simulation, includeEpf true, includePortfolio true, and includeCohort true, all at once. Only set a flag true when the topic is actually present in the message — do not default everything to true.",
    ].join("\n"),
    outputType: AgentPlan,
    ...(process.env.OPENAI_MODEL ? { model: process.env.OPENAI_MODEL } : {}),
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured on this server." }, { status: 500 });
  }


  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = IntentRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const { message, history } = parsed.data;
    const transcript = history.map((turn) => `Member: ${turn.question}\nAgent: ${turn.answer}${turn.chart ? `\nChart context: ${JSON.stringify(turn.chart)}` : ""}`).join("\n\n");
    const result = await run(buildExtractor(), `${transcript ? `Prior conversation:\n${transcript}\n\n` : ""}Newest member message:\n${message}`);
    return Response.json({ plan: result.finalOutput ?? { operations: [{ intentType: "unclear", purpose: null, amount: null, dataSource: null, chartForm: null, provider: null, scenario: null, cohortMetric: null, months: null, dropPct: null, includeEpf: false, includePortfolio: false, includeCohort: false }] } });
  } catch {
    return Response.json({ error: "Could not process this request right now." }, { status: 502 });
  }
}
