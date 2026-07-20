"use client";

import { useState } from "react";
import { Star, BadgeCheck, Loader2 } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { submitReviewAction } from "@/app/actions/reviews";
import { formatDate, cn } from "@/lib/utils";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string | Date;
}

export function Reviews({ productId, slug, rating, reviews }: { productId: string; slug: string; rating: number; reviews: Review[] }) {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState(reviews);

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: items.filter((r) => Math.round(r.rating) === star).length,
  }));
  const total = items.length || 1;

  return (
    <section id="reviews" className="border-t border-cream-dark py-16">
      <div className="container-x">
        <h2 className="text-2xl font-extrabold">Customer Reviews</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
          {/* Summary */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold">{rating.toFixed(1)}</span>
              <div>
                <StarRating rating={rating} showCount={false} size={16} />
                <p className="text-sm text-ink-soft">{items.length} reviews</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {dist.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-sm">
                  <span className="flex w-8 items-center gap-0.5">
                    {d.star}
                    <Star size={12} className="text-gold-500" fill="currentColor" strokeWidth={0} />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${(d.count / total) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-ink-soft">{d.count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowForm((v) => !v)} className="btn btn-outline mt-5 w-full">
              Write a review
            </button>
          </div>

          {/* List + form */}
          <div>
            {showForm && <ReviewForm productId={productId} slug={slug} onDone={(r) => { setItems((x) => [r, ...x]); setShowForm(false); }} />}
            <ul className="divide-y divide-cream-dark">
              {items.length === 0 && <p className="py-8 text-ink-soft">No reviews yet. Be the first!</p>}
              {items.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex items-center justify-between">
                    <StarRating rating={r.rating} showCount={false} size={14} />
                    <span className="text-xs text-ink-soft">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <h4 className="mt-2 font-semibold">{r.title}</h4>}
                  <p className="mt-1 text-ink-soft">{r.body}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                    {r.authorName}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-forest-600">
                        <BadgeCheck size={14} /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ productId, slug, onDone }: { productId: string; slug: string; onDone: (r: Review) => void }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const input = {
      productId,
      slug,
      rating,
      title: String(fd.get("title") || ""),
      body: String(fd.get("body") || ""),
      authorName: String(fd.get("authorName") || ""),
      authorEmail: String(fd.get("authorEmail") || "") || undefined,
    };
    const res = await submitReviewAction(input);
    setPending(false);
    if (!res.ok) return setError(res.error ?? "Something went wrong.");
    onDone({
      id: Math.random().toString(36),
      authorName: input.authorName,
      rating,
      title: input.title || null,
      body: input.body,
      verified: false,
      createdAt: new Date(),
    });
  }

  return (
    <form onSubmit={submit} className="mb-8 card p-5">
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={26} className={cn("transition", (hover || rating) >= n ? "text-gold-500" : "text-cream-dark")} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="authorName" required placeholder="Your name" className="rounded-lg border border-cream-dark bg-panel px-3 py-2 outline-none focus:border-forest-500" />
        <input name="authorEmail" type="email" placeholder="Email (optional)" className="rounded-lg border border-cream-dark bg-panel px-3 py-2 outline-none focus:border-forest-500" />
      </div>
      <input name="title" placeholder="Review title" className="mt-3 w-full rounded-lg border border-cream-dark bg-panel px-3 py-2 outline-none focus:border-forest-500" />
      <textarea name="body" required rows={4} placeholder="Tell us what you think…" className="mt-3 w-full rounded-lg border border-cream-dark bg-panel px-3 py-2 outline-none focus:border-forest-500" />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary mt-3">
        {pending ? <Loader2 className="animate-spin" size={16} /> : "Submit review"}
      </button>
    </form>
  );
}
