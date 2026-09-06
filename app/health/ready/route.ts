export function GET() {
  const ready = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_WEBHOOK_SECRET &&
    process.env.OPENAI_SIP_URI,
  );
  return Response.json({ ok: ready }, { status: ready ? 200 : 503 });
}
