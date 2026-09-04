import type { Metadata } from "next";

import { BrandStory } from "@/components/home/BrandStory";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { Hero } from "@/components/home/Hero";
import { HomeNotes } from "@/components/home/HomeNotes";
import { HomeProductFeed } from "@/components/home/HomeProductFeed";
import { HomeShopPaths } from "@/components/home/HomeShopPaths";
import { Newsletter } from "@/components/home/Newsletter";
import { Reveal } from "@/components/home/Reveal";
import { BRAND_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME} — Extrait de Parfum` },
  description:
    "Özenle harmanlanmış extrait’ler. Lucien Perrin ile cilde yakın, sakin bir lüks.",
  openGraph: {
    title: `${BRAND_NAME} — Extrait de Parfum`,
    description:
      "Özenle harmanlanmış extrait’ler. Lucien Perrin ile cilde yakın, sakin bir lüks.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function Home() {
  return (
    <div className="bg-ivory">
      <Hero />
      <Reveal>
        <HomeShopPaths />
      </Reveal>
      <Reveal>
        <HomeNotes />
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
