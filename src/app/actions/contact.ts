"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  message: z.string().trim().min(5, "Please write a bit more in your message (at least 5 characters)."),
});

export async function submitContactAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please complete all fields." };
  await sendContactMessage(parsed.data.email, parsed.data.name, parsed.data.message);
  return { ok: true };
}
