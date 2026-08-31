"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { askSupportAI, aiConfigured, type ChatTurn } from "@/lib/ai";
import { sendSupportTicketAlert, sendSupportTicketConfirmation } from "@/lib/email";
import { TicketStatus } from "@/lib/enums";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function buildSystemPrompt(): Promise<string> {
  const [products, pages] = await Promise.all([
    prisma.product.findMany({ where: { status: "active" }, select: { title: true, price: true, description: true } }),
    prisma.page.findMany({ where: { status: "published" }, select: { title: true, bodyHtml: true } }),
  ]);

  const productText = products
    .map((p) => `### ${p.title} — $${p.price.toFixed(2)}\n${p.description}`)
    .join("\n\n");

  const pagesText = pages.map((p) => `### ${p.title}\n${stripHtml(p.bodyHtml)}`).join("\n\n");

  return `You are the customer support assistant for Robinhood Pickleball, an online store selling one product: The Longbow pickleball paddle. Speak in a friendly, concise, helpful tone. Never make up information that isn't given to you below — if you don't know something, say so and escalate.

KEY FACTS:
- Sales tax is only charged to customers in New York state. All other states pay $0 tax.
- Shipping is flat-rate USPS: Ground Advantage ($6.95, 2-5 business days) or Priority Mail ($11.95, 1-3 business days), calculated at checkout.
- 10% of every sale is donated to those in need.
- Support/business email for escalations: ${process.env.ADMIN_EMAIL || "admin@robinhoodpickleball.com"}

PRODUCT CATALOG:
${productText}

STORE POLICIES (from official pages):
${pagesText}

WHEN TO ESCALATE (set escalate: true):
- The customer needs something order-specific requiring account/order lookup (order status, tracking, refund status, payment issue, wrong/damaged item, changing an order).
- The customer explicitly asks for a human / says the bot isn't helping.
- The customer is upset, filing a complaint, or the situation could be reputation-sensitive.
- You genuinely don't know the answer and it's not covered above.
- Anything involving money you can't resolve yourself (refund requests, price disputes, billing errors).

WHEN NOT TO ESCALATE (answer directly instead):
- General questions about the paddle's specs, shipping cost/time, return policy, warranty, tax, sizing, whether it's USAPA-approved, general "how do I..." questions.
- Reminder: for returns, always point them to robinhoodpickleball.com/returns to start a formal return request — don't try to process a return yourself in chat.

Respond with a JSON object: {"reply": "<your message to the customer>", "escalate": <true|false>, "reason": "<short internal note on why, only if escalate is true>"}.
When escalate is true, your "reply" should tell the customer you're connecting them with the team and someone will follow up by email — don't ask them to repeat themselves.`;
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});
const sendSchema = z.object({ messages: z.array(messageSchema).min(1).max(30) });

export async function sendChatMessageAction(raw: unknown) {
  if (!aiConfigured()) {
    return {
      ok: true as const,
      reply: "Our chat assistant is temporarily offline. Please email us directly and we'll get right back to you.",
      escalate: false,
    };
  }
  const parsed = sendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid message." };

  try {
    const system = await buildSystemPrompt();
    const result = await askSupportAI(system, parsed.data.messages as ChatTurn[]);
    return { ok: true as const, ...result };
  } catch {
    return {
      ok: true as const,
      reply: "Sorry, I'm having trouble responding right now. Please email us and we'll help directly.",
      escalate: false,
    };
  }
}

const ticketSchema = z.object({
  email: z.string().email(),
  messages: z.array(messageSchema).min(1).max(30),
  reason: z.string().max(500).optional(),
});

export async function submitSupportTicketAction(raw: unknown) {
  const parsed = ticketSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please enter a valid email." };
  const { email, messages, reason } = parsed.data;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "Support request";
  const subject = reason || lastUserMessage.slice(0, 80);

  const ticket = await prisma.supportTicket.create({
    data: { email, subject, transcript: JSON.stringify(messages), status: TicketStatus.OPEN },
  });

  sendSupportTicketAlert(ticket.id, email, subject, messages).catch(() => {});
  sendSupportTicketConfirmation(email).catch(() => {});

  return { ok: true as const };
}
