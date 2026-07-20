"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { submitContactAction } from "@/app/actions/contact";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await submitContactAction({
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      message: String(fd.get("message")),
    });
    setLoading(false);
    if (!res.ok) return setError(res.error ?? "Something went wrong.");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <Send size={36} className="mx-auto text-forest-600" />
        <h3 className="mt-3 font-bold">Message sent!</h3>
        <p className="mt-1 text-sm text-ink-soft">Thanks for reaching out. We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="name" required placeholder="Your name" className="input" />
      <input name="email" type="email" required placeholder="Email" className="input" />
      <textarea name="message" required rows={5} placeholder="How can we help?" className="input" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
        {loading ? <Loader2 className="animate-spin" size={18} /> : "Send message"}
      </button>
    </form>
  );
}
