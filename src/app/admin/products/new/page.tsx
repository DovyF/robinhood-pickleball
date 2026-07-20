import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-forest-700"><ArrowLeft size={15} /> Products</Link>
      <h1 className="mb-6 text-2xl font-extrabold">Add product</h1>
      <ProductEditor />
    </div>
  );
}
