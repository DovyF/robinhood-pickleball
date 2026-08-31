"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Mail } from "lucide-react";
import { sendChatMessageAction, submitSupportTicketAction } from "@/app/actions/chat";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "Hey! I'm the Robinhood Pickleball assistant. Ask me about shipping, returns, the paddle, or anything else — I'll connect you with our team if I can't help.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState<string | null>(null); // holds escalation reason
  const [email, setEmail] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, awaitingEmail, ticketSent]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    const res = await sendChatMessageAction({ messages: next });
    setPending(false);
    if (!res.ok) return;
    setMessages([...next, { role: "assistant", content: res.reply }]);
    if (res.escalate) setAwaitingEmail(res.reason ?? "Support request");
  }

  async function sendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    const res = await submitSupportTicketAction({ email: email.trim(), messages, reason: awaitingEmail ?? undefined });
    setPending(false);
    if (res.ok) {
      setTicketSent(true);
      setAwaitingEmail(null);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-2xl border border-cream-dark bg-panel shadow-lift">
          <div className="flex items-center justify-between border-b border-cream-dark bg-forest-700 px-4 py-3">
            <p className="font-bold text-black">Robinhood Support</p>
            <button onClick={() => setOpen(false)} className="text-black/70 hover:text-black"><X size={18} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-forest-700 text-black" : "bg-cream-dark text-ink")}>
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 rounded-2xl bg-cream-dark px-3 py-2 text-sm text-ink-soft w-fit">
                <Loader2 className="animate-spin" size={14} /> Thinking…
              </div>
            )}

            {awaitingEmail && !ticketSent && (
              <form onSubmit={sendTicket} className="rounded-2xl border border-forest-700/40 bg-forest-700/10 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-forest-700"><Mail size={13} /> Share your email so our team can follow up</p>
                <div className="flex gap-1.5">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input !py-1.5 text-sm" />
                  <button type="submit" disabled={pending} className="btn btn-primary !px-3 !py-1.5 text-sm">{pending ? <Loader2 className="animate-spin" size={14} /> : "Send"}</button>
                </div>
              </form>
            )}
            {ticketSent && (
              <div className="rounded-2xl bg-forest-700/10 px-3 py-2 text-sm text-forest-700">
                Done — you'll hear from us by email soon.
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-cream-dark p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="input !py-2 text-sm"
              disabled={pending}
            />
            <button type="submit" disabled={pending || !input.trim()} className="btn btn-primary !px-3 disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-full bg-forest-700 text-black shadow-lift transition hover:bg-lime hover:scale-105"
        aria-label="Open support chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
