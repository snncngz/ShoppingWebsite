import type { Metadata } from "next";

import { OrderList } from "@/components/orders/OrderList";

export const metadata: Metadata = {
  title: "Siparişlerim",
  description: "VELORA demo sipariş geçmişinizi görüntüleyin.",
};

export default function OrdersPage() {
  return <OrderList />;
}
