import type { Metadata } from "next";

import { AdminCategoryList } from "@/components/admin/AdminCategoryList";

export const metadata: Metadata = {
  title: "Kategoriler",
};

export default function AdminCategoriesPage() {
  return <AdminCategoryList />;
}
