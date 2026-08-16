import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/giris");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
