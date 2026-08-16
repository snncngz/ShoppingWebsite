import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutResultView } from "@/components/checkout/CheckoutResultView";
import { CartSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Ödeme sonucu",
};

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CheckoutResultView />
    </Suspense>
  );
}
