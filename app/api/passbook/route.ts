import { members } from "../../components/passbook-data";

export async function GET() {
  // ponytail: prototype latency makes the server round-trip visible; remove when EPFO supplies it.
  await new Promise((resolve) => setTimeout(resolve, 650));
  return Response.json(
    { members, syncedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
