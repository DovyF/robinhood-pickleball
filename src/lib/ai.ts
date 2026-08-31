// Thin wrapper around the Gemini API (Google AI Studio) — chosen because it has a
// genuinely free tier (no credit card required) that's generous enough for a
// small store's support chat volume. Swap GEMINI_MODEL if the key's tier changes.

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface SupportAiResult {
  reply: string;
  escalate: boolean;
  reason?: string;
}

export function aiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export async function askSupportAI(systemPrompt: string, history: ChatTurn[]): Promise<SupportAiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const contents = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reply: { type: "STRING" },
            escalate: { type: "BOOLEAN" },
            reason: { type: "STRING" },
          },
          required: ["reply", "escalate"],
        },
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from AI");

  const parsed = JSON.parse(text) as SupportAiResult;
  return { reply: parsed.reply, escalate: !!parsed.escalate, reason: parsed.reason };
}
