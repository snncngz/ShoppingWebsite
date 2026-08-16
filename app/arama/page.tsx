import type { Metadata } from "next";

import { SearchPage } from "@/components/search/SearchPage";
import { firstSearchParam, normalizeSearchQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arama",
  description:
    "Lucien Perrin koleksiyonunda ürün, kategori veya parfüm arayın.",
};

export default async function SearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = normalizeSearchQuery(firstSearchParam(params.q));

  return <SearchPage initialQuery={initialQuery} />;
}
