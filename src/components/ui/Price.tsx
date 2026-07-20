import { formatMoney, cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  className,
  size = "md",
}: {
  amount: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const onSale = compareAt != null && compareAt > amount;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" };
  return (
    <span className={cn("inline-flex items-baseline gap-2", sizes[size], className)}>
      <span className={cn("font-semibold", onSale && "text-forest-700")}>{formatMoney(amount)}</span>
      {onSale && (
        <span className="text-ink-soft/70 line-through text-[0.85em] font-normal">{formatMoney(compareAt!)}</span>
      )}
    </span>
  );
}
