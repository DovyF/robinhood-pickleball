"use client";

import { usePathname } from "next/navigation";

/**
 * Renders the store chrome (announcement, header, footer, cart drawer) on every
 * page EXCEPT checkout, which stays distraction-free to minimize exit points —
 * a well-established conversion best practice. Server components are passed in
 * pre-rendered so they keep their server behavior.
 */
export function ChromeGate({
  top,
  footer,
  cartProvider,
  children,
}: {
  top: React.ReactNode;
  footer: React.ReactNode;
  cartProvider: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Checkout stays distraction-free. Everything else keeps the store chrome.
  const bare = pathname?.startsWith("/checkout");

  return (
    <>
      {!bare && top}
      <main className="flex-1">{children}</main>
      {!bare && footer}
      {!bare && cartProvider}
    </>
  );
}
