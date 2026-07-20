import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header, type NavItem } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { ChromeGate } from "@/components/layout/ChromeGate";
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
          <AnnouncementBar text={settings.announcement ?? ""} />
          <Header nav={nav} />
        </>
      }
      footer={<Footer nav={footerNav.map((n) => ({ label: n.label, url: n.url }))} />}
      cartProvider={<CartProvider initialCart={cart} />}
    >
      {children}
    </ChromeGate>
  );
}
