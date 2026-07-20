import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-forest-700">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page went off court</h1>
      <p className="mt-2 max-w-sm text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-primary">Back home</Link>
        <Link href="/products" className="btn btn-outline">Shop products</Link>
      </div>
    </div>
  );
}
