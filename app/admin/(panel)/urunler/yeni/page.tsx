import type { Metadata } from "next";

import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata: Metadata = {
  title: "Yeni ürün",
};

export default function AdminNewProductPage() {
  return <AdminProductForm />;
}
