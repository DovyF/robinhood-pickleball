import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-forest-100 text-forest-700",
  fulfilled: "bg-blue-100 text-blue-700",
  partially_fulfilled: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-200 text-gray-600",
  refunded: "bg-red-100 text-red-700",
  unfulfilled: "bg-amber-100 text-amber-800",
  active: "bg-forest-100 text-forest-700",
  draft: "bg-gray-200 text-gray-600",
  archived: "bg-gray-200 text-gray-600",
  disabled: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", STYLES[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
