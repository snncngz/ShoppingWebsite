import type { Metadata } from "next";

import { FaqPage } from "@/components/content/FaqPage";

export const metadata: Metadata = {
  title: "SSS",
  description: "VELORA kargo, iade, beden değişimi ve parfüm koşulları.",
};

export default function SssRoute() {
  return <FaqPage />;
}
