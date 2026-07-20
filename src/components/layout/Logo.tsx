import Link from "next/link";
import { cn } from "@/lib/utils";

/** Robinhood Pickleball wordmark (real brand logo, green-on-transparent). */
export function Logo({ className }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Robinhood Pickleball home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/robinhood-logo.png" alt="Robinhood Pickleball" className="h-8 w-auto" />
    </Link>
  );
}
