import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Lucien Perrin demo ödeme adımı — teslimat ve ödeme bilgilerinizi girin.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
