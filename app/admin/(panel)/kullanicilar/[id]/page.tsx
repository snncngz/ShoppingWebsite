import type { Metadata } from "next";

import { AdminUserDetail } from "@/components/admin/AdminUserDetail";

export const metadata: Metadata = {
  title: "Kullanıcı",
};

export default function AdminUserDetailPage() {
  return <AdminUserDetail />;
}
