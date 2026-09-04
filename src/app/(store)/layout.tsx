import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { ShabbosBanner } from "@/components/layout/ShabbosBanner";
import { Header, type NavItem } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getNavigation, getSettings } from "@/lib/repo";
import { getCartView } from "@/lib/cart";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [mainNav, footerNav, settings, cart] = await Promise.all([
    getNavigation("main"),
    getNavigation("footer"),
    getSettings(),
    getCartView(),
  ]);

  const nav: NavItem[] = mainNav.map((n) => ({
    label: n.label,
    url: n.url,
    children: n.children?.map((c) => ({ label: c.label, url: c.url })),
  }));

  return (
    <ChromeGate
      top={
        <>
          <ShabbosBanner />
          <AnnouncementBar text={settings.announcement ?? ""} />
          <Header nav={nav} />
        </>
      }
      footer={<Footer nav={footerNav.map((n) => ({ label: n.label, url: n.url }))} />}
      cartProvider={<CartProvider initialCart={cart} />}
    >
      {children}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </ChromeGate>
  );
}
