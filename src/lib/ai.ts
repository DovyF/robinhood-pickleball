// Thin wrapper around the Groq API — free tier, OpenAI-compatible, same
// provider already used for the Synked support agent.

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
  return !!process.env.GROQ_API_KEY;
}

export async function askSupportAI(systemPrompt: string, history: ChatTurn[]): Promise<SupportAiResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from AI");

  const parsed = JSON.parse(text) as SupportAiResult;
  return { reply: parsed.reply, escalate: !!parsed.escalate, reason: parsed.reason };
}
