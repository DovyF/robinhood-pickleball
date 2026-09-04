import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/analytics/Analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

// Body / UI — matches the live theme
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Display — condensed headlines (THE LONGBOW, prices, section titles)
const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Robinhood Pickleball — Best Budget Foam Pickleball Paddle",
    template: "%s | Robinhood Pickleball",
  },
  description:
    "The Longbow is a carbon-fiber and foam-core pickleball paddle built to tournament spec for $99.99 — the best budget pickleball paddle without the $250 markup. 10% of every sale donated to those in need.",
  keywords: [
    "pickleball paddle",
    "best pickleball paddle",
    "best budget pickleball paddle",
    "cheapest pickleball paddle",
    "affordable pickleball paddle",
    "foam pickleball paddle",
    "foam core pickleball paddle",
    "pickleball paddle under $100",
    "carbon fiber pickleball paddle",
    "the longbow",
    "robinhood pickleball",
  ],
  openGraph: {
    type: "website",
    siteName: "Robinhood Pickleball",
    title: "Robinhood Pickleball — Best Budget Foam Pickleball Paddle",
    description: "The Longbow: carbon-fiber and foam-core pickleball paddle, tournament-spec construction, $99.99. The best budget pickleball paddle without the $250 markup.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

// Tells Google (Knowledge Panel / brand search, sitelinks searchbox, etc.)
// which image is the brand logo — needs to be square/near-square, which the
// wide wordmark in /brand isn't, hence the dedicated square crop.
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Robinhood Pickleball",
  url: siteUrl,
  logo: `${siteUrl}/brand/logo-square.png`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
        {children}
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
