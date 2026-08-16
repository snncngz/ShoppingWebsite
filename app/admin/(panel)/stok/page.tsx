import type { Metadata } from "next";

import { AdminInventoryList } from "@/components/admin/AdminInventoryList";

export const metadata: Metadata = {
  title: "Stok",
};

export default function AdminInventoryPage() {
  return <AdminInventoryList />;
}
