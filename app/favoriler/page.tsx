import type { Metadata } from "next";

import { FavoritesView } from "@/components/cart/FavoritesView";

export const metadata: Metadata = {
  title: "Favoriler",
  description: "VELORA favorilerinize eklediğiniz parçalar.",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
