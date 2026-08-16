import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Lucien Perrin sepetinizdeki parçaları görüntüleyin ve siparişi tamamlayın.",
};

export default function CartPage() {
  return <CartView />;
}
