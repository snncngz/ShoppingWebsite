import type { Metadata } from "next";

import { AdminOrderList } from "@/components/admin/AdminOrderList";

export const metadata: Metadata = {
  title: "Siparişler",
};

export default function AdminOrdersPage() {
  return <AdminOrderList />;
}
