import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";

export const metadata: Metadata = {
  title: "Create a payment split — SplitUPI",
  description:
    "Enter your merchant UPI ID and preview a transparent payment split.",
};

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="loading-screen" aria-busy="true">
          <p>Getting your payment setup ready…</p>
        </div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
