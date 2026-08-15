import type { Metadata } from "next";

import { ContactPage } from "@/components/content/ContactPage";

export const metadata: Metadata = {
  title: "İletişim",
  description: "VELORA Nişantaşı atölyesi — yazın, arayın, ziyaret edin.",
};

export default function IletisimRoute() {
  return <ContactPage />;
}
