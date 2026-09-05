import { z } from "zod";

const FinanceAction = z.object({
  action: z.enum(["permission", "connect", "disconnect", "scope"]),
  target: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const parsed = FinanceAction.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid finance action." }, { status: 400 });

  // ponytail: prototype latency makes the server round-trip visible; remove when a real provider supplies it.
  await new Promise((resolve) => setTimeout(resolve, 650));
  return Response.json({ ok: true, processedAt: new Date().toISOString() });
}
