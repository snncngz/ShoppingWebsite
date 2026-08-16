import type { Metadata } from "next";

import { AdminProductTable } from "@/components/admin/AdminProductTable";

export const metadata: Metadata = {
  title: "Ürünler",
};

export default function AdminProductsPage() {
  return <AdminProductTable />;
}
