import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
interface FooterNavItem {
  label: string;
  url: string;
}

const SOCIALS = [
  { label: "Instagram", path: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.08a3.18 3.18 0 1 1 0-6.36 3.18 3.18 0 0 1 0 6.36Zm6.24-8.28a1.14 1.14 0 1 1-2.28 0 1.14 1.14 0 0 1 2.28 0Z" },
  { label: "Facebook", path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" },
  { label: "YouTube", path: "M23.5 6.5a3 3 0 0 0-2.11-2.13C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.39.51A3 3 0 0 0 .5 6.5 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.5 3 3 0 0 0 2.11 2.13c1.89.51 9.39.51 9.39.51s7.5 0 9.39-.51a3 3 0 0 0 2.11-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" },
];

export function Footer({ nav }: { nav: FooterNavItem[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-cream-dark bg-cream text-ink-soft">
      <div className="container-x grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-ink-soft">
Tournament-grade pickleball at an honest price. 10% of profits donated to those in need.
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIALS.map((s) => (
              <a key={s.label} href="#" aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-full bg-forest-700 hover:bg-gold-500 hover:text-forest-900 transition">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={s.path} /></svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/products/the-longbow" className="hover:text-white">The Longbow</Link></li>
            <li><Link href="/pages/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/pages/faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Help</h4>
          <ul className="space-y-2.5 text-sm">
            {nav.map((n) => (
              <li key={n.url}><Link href={n.url} className="hover:text-white">{n.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Stay in the loop</h4>
          <p className="mb-3 text-sm text-ink-soft">Be first to hear about restocks and new drops.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-forest-700">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-forest-300 md:flex-row">
          <p>© {year} Robinhood Pickleball. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/pages/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/pages/terms" className="hover:text-white">Terms</Link>
            <span>Secured by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
