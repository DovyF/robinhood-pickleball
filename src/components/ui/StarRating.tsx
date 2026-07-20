import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = 14,
  showCount = true,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex" aria-label={`Rated ${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute text-gold-500/30" fill="currentColor" strokeWidth={0} />
              <span className="absolute overflow-hidden" style={{ width: `${fill * 100}%`, height: size }}>
                <Star size={size} className="text-gold-500" fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      {showCount && count != null && <span className="text-xs text-ink-soft">({count})</span>}
    </span>
  );
}
