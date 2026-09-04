import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { askSupportAI, aiConfigured } from "@/lib/ai";

export async function GET() {
  await requireAdmin();
  if (!aiConfigured()) return NextResponse.json({ configured: false });

  let models: unknown = null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    models = await res.json();
  } catch (err) {
    models = { fetchError: String(err) };
  }

  try {
    const result = await askSupportAI(
      'Reply with JSON like {"reply": "hi", "escalate": false}.',
      [{ role: "user", content: "test" }]
    );
    return NextResponse.json({ configured: true, ok: true, result, models });
  } catch (err) {
    return NextResponse.json({ configured: true, ok: false, error: String(err), models });
  }
}
