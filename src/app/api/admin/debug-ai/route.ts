import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { askSupportAI, aiConfigured } from "@/lib/ai";

export async function GET() {
  await requireAdmin();
  if (!aiConfigured()) return NextResponse.json({ configured: false });
  try {
    const result = await askSupportAI(
      'Reply with JSON like {"reply": "hi", "escalate": false}.',
      [{ role: "user", content: "test" }]
    );
    return NextResponse.json({ configured: true, ok: true, result });
  } catch (err) {
    return NextResponse.json({ configured: true, ok: false, error: String(err) });
  }
}
