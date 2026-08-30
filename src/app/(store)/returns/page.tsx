import type { Metadata } from "next";
import { ReturnRequestForm } from "@/components/returns/ReturnRequestForm";

export const metadata: Metadata = { title: "Start a Return", robots: { index: false } };

export default function ReturnsPage() {
  return (
    <div className="container-x max-w-2xl py-14">
      <h1 className="text-center text-4xl font-extrabold">Start a Return</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-ink-soft">
        Enter your order number and the email you used at checkout to get started.
      </p>
      <div className="mt-8">
        <ReturnRequestForm />
      </div>
    </div>
  );
}
