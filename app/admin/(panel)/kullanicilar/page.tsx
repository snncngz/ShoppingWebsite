import type { Metadata } from "next";

import { AdminUserList } from "@/components/admin/AdminUserList";

export const metadata: Metadata = {
  title: "Kullanıcılar",
};

export default function AdminUsersPage() {
  return <AdminUserList />;
}
