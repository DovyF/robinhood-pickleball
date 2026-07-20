import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about your order or our gear? Get in touch with the Robinhood Pickleball team.",
};

export default function ContactPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold">Get in touch</h1>
        <p className="mt-3 text-ink-soft">Questions about your order, our gear, or bulk/team pricing? We usually reply within one business day.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-10 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          {[
            { icon: Mail, title: "Email", value: "hello@robinhoodpickleball.com" },
            { icon: Clock, title: "Hours", value: "Mon–Fri, 9am–5pm ET" },
            { icon: MapPin, title: "Ships from", value: "United States" },
          ].map((c) => (
            <div key={c.title} className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                <c.icon size={18} />
              </div>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-ink-soft">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-panel p-6 shadow-card">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
