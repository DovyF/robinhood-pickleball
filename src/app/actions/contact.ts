"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(5),
});

export async function submitContactAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please complete all fields." };
  await sendContactMessage(parsed.data.email, parsed.data.name, parsed.data.message);
  return { ok: true };
}
