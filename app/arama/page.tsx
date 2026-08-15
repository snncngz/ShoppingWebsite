import type { Metadata } from "next";

import { SearchPage } from "@/components/search/SearchPage";
import { BRAND_NAME } from "@/lib/constants";
import { firstSearchParam, normalizeSearchQuery } from "@/lib/search";

export const metadata: Metadata = {
  title: "Arama",
  description: `${BRAND_NAME} koleksiyonunda arayın.`,
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
