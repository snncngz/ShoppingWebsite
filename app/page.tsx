import type { Metadata } from "next";

import { BrandStory } from "@/components/home/BrandStory";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { Hero } from "@/components/home/Hero";
import { HomeProductFeed } from "@/components/home/HomeProductFeed";
import { Newsletter } from "@/components/home/Newsletter";
import { Reveal } from "@/components/home/Reveal";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME} — Sakin Lüks Butik` },
  description:
    "Özenle seçilmiş siluetler, parfüm ve aksesuar. VELORA ile her günün sakin lüksü.",
  openGraph: {
    title: `${BRAND_NAME} — Sakin Lüks Butik`,
    description:
      "Özenle seçilmiş siluetler, parfüm ve aksesuar. VELORA ile her günün sakin lüksü.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function Home() {
  return (
    <div className="bg-ivory">
      <Hero />
      <Reveal>
        <CategoryGrid />
      </Reveal>
      <HomeProductFeed />
      <Reveal>
        <EditorialBanner />
      </Reveal>
      <Reveal>
        <BrandStory />
      </Reveal>
      <Reveal>
        <Newsletter />
      </Reveal>
    </div>
  );
}
