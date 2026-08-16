import type { Metadata } from "next";

import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata: Metadata = {
  title: "Ürün düzenle",
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProductForm productId={id} />;
}
