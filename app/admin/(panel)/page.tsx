import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
};

export default function AdminHomePage() {
  return <AdminDashboard />;
}
