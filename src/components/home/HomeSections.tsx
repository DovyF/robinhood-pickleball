import Image from "next/image";
import Link from "next/link";
import { ProductCard, type CardProduct } from "@/components/product/ProductCard";
import { StarRating } from "@/components/ui/StarRating";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { getActiveProducts, getCollectionBySlug, getCollectionProducts } from "@/lib/repo";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Award } from "lucide-react";

interface Section {
  id: string;
  type: string;
  title: string | null;
  settings: Record<string, unknown>;
}

export async function HomeSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} />
      ))}
    </>
  );
}

async function SectionRenderer({ section }: { section: Section }) {
  const s = section.settings;
  switch (section.type) {
    case "hero":
      return <Hero title={section.title ?? ""} s={s} />;
    case "logo_list":
      return <LogoList items={(s.items as string[]) ?? []} />;
    case "featured_collection":
      return <FeaturedCollection title={section.title ?? ""} s={s} />;
    case "image_banner":
      return <ImageBanner title={section.title ?? ""} s={s} />;
    case "product_grid":
      return <ProductGridSection title={section.title ?? ""} s={s} />;
    case "testimonials":
      return <Testimonials title={section.title ?? ""} items={(s.items as Testimonial[]) ?? []} />;
    case "newsletter":
      return <NewsletterSection title={section.title ?? ""} s={s} />;
    default:
      return null;
  }
}

function Hero({ title, s }: { title: string; s: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden bg-forest-800 text-white">
      <div className="absolute inset-0">
        {s.image ? <Image src={s.image as string} alt="" fill priority className="object-cover opacity-30" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-900/95 via-forest-800/80 to-forest-800/40" />
      </div>
      <div className="container-x relative grid min-h-[560px] items-center py-20">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-panel/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-300 backdrop-blur">
            <Award size={14} /> USAPA Approved Gear
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{title}</h1>
          {s.subtitle ? <p className="mt-5 max-w-xl text-lg text-ink-soft">{s.subtitle as string}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {s.ctaUrl ? (
              <Link href={s.ctaUrl as string} className="btn btn-gold text-base">
                {(s.ctaLabel as string) ?? "Shop now"} <ArrowRight size={18} />
              </Link>
            ) : null}
            {s.secondaryUrl ? (
              <Link href={s.secondaryUrl as string} className="btn btn-outline !text-white !shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.6)] hover:!bg-panel hover:!text-forest-800 text-base">
                {(s.secondaryLabel as string) ?? "Shop all"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoList({ items }: { items: string[] }) {
  const icons = [Truck, ShieldCheck, RotateCcw, Award];
  return (
    <section className="border-b border-cream-dark bg-panel">
      <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={i} className="flex items-center justify-center gap-2.5 text-center">
              <Icon size={22} className="shrink-0 text-forest-600" />
              <span className="text-sm font-semibold text-ink">{item}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function FeaturedCollection({ title, s }: { title: string; s: Record<string, unknown> }) {
  const limit = (s.limit as number) ?? 4;
  const products =
    s.source === "featured"
      ? await getActiveProducts({ featured: true, take: limit })
      : s.collectionSlug
        ? await (async () => {
            const col = await getCollectionBySlug(s.collectionSlug as string);
            return col ? (await getCollectionProducts(col.id)).slice(0, limit) : [];
          })()
        : await getActiveProducts({ take: limit, sort: "best-selling" });

  return (
    <section className="container-x py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold">{title}</h2>
          <div className="mt-2 h-1 w-16 rounded-full bg-gold-500" />
        </div>
        <Link href="/products" className="hidden items-center gap-1 text-sm font-semibold text-forest-700 hover:gap-2 transition-all sm:inline-flex">
          View all <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p as unknown as CardProduct} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}

function ImageBanner({ title, s }: { title: string; s: Record<string, unknown> }) {
  return (
    <section className="container-x py-10">
      <div className="relative overflow-hidden rounded-3xl border border-cream-dark bg-panel-2">
        <div className="absolute inset-0">
          {s.image ? <Image src={s.image as string} alt="" fill className="object-cover opacity-40" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 to-transparent" />
        </div>
        <div className="relative flex min-h-[320px] flex-col items-start justify-end p-8 text-white sm:p-12">
          <h2 className="max-w-md text-3xl font-extrabold sm:text-4xl">{title}</h2>
          {s.text ? <p className="mt-2 max-w-md text-ink-soft">{s.text as string}</p> : null}
          {s.ctaUrl ? (
            <Link href={s.ctaUrl as string} className="btn btn-gold mt-6">
              {(s.ctaLabel as string) ?? "Shop now"} <ArrowRight size={18} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function ProductGridSection({ title, s }: { title: string; s: Record<string, unknown> }) {
  const products = await getActiveProducts({ take: (s.limit as number) ?? 8, sort: (s.source as string) ?? "best-selling" });
  return (
    <section className="container-x py-16">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <div className="mt-2 h-1 w-16 rounded-full bg-gold-500" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p as unknown as CardProduct} />
        ))}
      </div>
    </section>
  );
}

interface Testimonial {
  name: string;
  quote: string;
  rating: number;
}
function Testimonials({ title, items }: { title: string; items: Testimonial[] }) {
  return (
    <section className="bg-panel py-16">
      <div className="container-x">
        <h2 className="mb-10 text-center text-3xl font-extrabold">{title}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure key={i} className="card p-6">
              <StarRating rating={t.rating} showCount={false} size={16} />
              <blockquote className="mt-3 text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-ink-soft">— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ title, s }: { title: string; s: Record<string, unknown> }) {
  return (
    <section className="container-x py-16">
      <div className="relative overflow-hidden rounded-3xl bg-forest-800 px-6 py-14 text-center text-white">
        <div className="relative mx-auto max-w-xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
          {s.subtitle ? <p className="mt-3 text-ink-soft">{s.subtitle as string}</p> : null}
          <div className="mx-auto mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
