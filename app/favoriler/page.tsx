import type { Metadata } from "next";

import { FavoritesView } from "@/components/cart/FavoritesView";

export const metadata: Metadata = {
  title: "Favoriler",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
